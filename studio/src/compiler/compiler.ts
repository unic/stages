import type { CollectionVariantConfig, DataPath, DynamicConfigContext, FieldDefinition, NodeAddress, NodeConfig, NodeResolverContext, StageNodeConfig, StagesSchema } from "@stages/core";
import type { JsonObject, JsonValue, StudioFormDocument, StudioFragmentDefinition, StudioFragmentInstanceNode, StudioLogicRule, StudioNode, StudioValidatorSpec, Uid } from "../document";
import { isSafeObjectKey, isStudioVariantCollection, toUid } from "../document";
import { evaluateStudioExpression } from "../expressions/evaluator";
import { studioExpressionDependencies } from "../expressions/serialization";
import type { StudioExpression } from "../expressions/types";
import {
  STUDIO_RUNTIME_FIELDS,
  type StudioRuntimeFieldDefinition,
  studioBlockDefinition,
  studioFieldDefinition,
  studioPresentationLayout,
  studioTheme,
  validateStudioFieldProps,
} from "../registry";
import { studioRuntimeAddressKey, studioRuntimePathKey } from "./source-map";
import { compileStudioValidators } from "../validation/catalog";
import { compileStudioReducer, compileStudioTransforms } from "../logic/compiler";
import { resolveStudioMessage } from "../localization";
import type {
  CompiledStudioForm,
  StudioDiagnostic,
  StudioFieldRegistry,
  StudioRenderNode,
  StudioSourceMapEntry,
  StudioCompileOptions,
} from "./types";

interface CompileContext {
  readonly form: StudioFormDocument;
  readonly diagnostics: StudioDiagnostic[];
  readonly byUid: Map<Uid, StudioSourceMapEntry>;
  readonly uidByPath: Map<string, Uid>;
  readonly uidByAddress: Map<string, Uid>;
  readonly visited: Set<Uid>;
  readonly visiting: Set<Uid>;
  readonly provenance: ReadonlyMap<Uid, FragmentProvenance>;
  readonly presenceByAddress: Map<string, StudioExpression>;
  readonly variantPresence: Map<string, StudioExpression>;
  readonly serviceBindings: StudioCompileOptions["serviceBindings"];
  readonly localization: StudioCompileOptions["localization"];
  readonly targetPaths: ReadonlyMap<Uid, DataPath>;
  readonly fields: Record<string, StudioRuntimeFieldDefinition>;
}

interface FragmentProvenance {
  readonly fragmentDefinitionUid: Uid;
  readonly fragmentNodeUid?: Uid;
  readonly fragmentInstanceUids: readonly Uid[];
}

interface ExpandedFragments {
  readonly form: StudioFormDocument;
  readonly provenance: ReadonlyMap<Uid, FragmentProvenance>;
  readonly diagnostics: readonly StudioDiagnostic[];
}

function virtualFragmentUid(instanceUids: readonly Uid[], nodeUid: Uid): Uid {
  const source = `${instanceUids.join("_")}__${nodeUid}`;
  if (source.length <= 128) return toUid(source);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) hash = Math.imul(hash ^ source.charCodeAt(index), 16777619);
  return toUid(`${source.slice(0, 118)}_${(hash >>> 0).toString(36)}`.slice(0, 128));
}

function remapNodeChildren(node: StudioNode, uidMap: ReadonlyMap<Uid, Uid>): StudioNode {
  const remap = (uids: readonly Uid[]) => uids.map((uid) => uidMap.get(uid) ?? uid);
  const remapRules = (rules: readonly StudioLogicRule[]): readonly StudioLogicRule[] => rules.map((rule) => ({
    ...rule,
    actions: rule.actions.map((action) => action.target.kind === "node"
      ? { ...action, target: { ...action.target, uid: uidMap.get(action.target.uid) ?? action.target.uid } }
      : action),
  }));
  const common: StudioNode = node.kind === "field" || node.kind === "group" || node.kind === "collection" || node.kind === "wizard" || node.kind === "fragment"
    ? { ...node, ...(node.transforms === undefined ? {} : { transforms: remapRules(node.transforms) }) }
    : node;
  if (common.kind === "field" && common.reducers !== undefined) return { ...common, reducers: remapRules(common.reducers) };
  if (common.kind === "wizard") return { ...common, stageUids: remap(common.stageUids), ...(common.initialStageUid === undefined ? {} : { initialStageUid: uidMap.get(common.initialStageUid) ?? common.initialStageUid }) };
  if (common.kind === "collection") {
    if (common.variantUids !== undefined) return { ...common, variantUids: remap(common.variantUids), ...(common.initialVariantUid === undefined ? {} : { initialVariantUid: uidMap.get(common.initialVariantUid) ?? common.initialVariantUid }) };
    return { ...common, childUids: remap(common.childUids) };
  }
  if (common.kind === "group" || common.kind === "stage" || common.kind === "variant") return { ...common, childUids: remap(common.childUids) };
  return common;
}

/** Purely expands linked resources to the ordinary node graph consumed by core. */
export function expandStudioFragments(
  form: StudioFormDocument,
  fragments: Readonly<Record<Uid, StudioFragmentDefinition>> = {},
): ExpandedFragments {
  const nodes: Record<Uid, StudioNode> = { ...form.nodes };
  const allocated = new Set<Uid>(Object.keys(nodes) as Uid[]);
  const provenance = new Map<Uid, FragmentProvenance>();
  const diagnostics: StudioDiagnostic[] = [];
  const expandInstance = (instance: StudioFragmentInstanceNode, instanceUids: readonly Uid[], active: readonly Uid[]): StudioNode => {
    const definition = fragments[instance.fragmentUid];
    const baseProvenance = { fragmentDefinitionUid: instance.fragmentUid, fragmentInstanceUids: instanceUids };
    provenance.set(instance.uid, baseProvenance);
    if (!definition || active.includes(instance.fragmentUid)) {
      diagnostics.push({
        code: definition ? "compiler.fragment-cycle" : "compiler.missing-fragment",
        severity: "error",
        source: "compiler",
        formUid: form.uid,
        entityUid: instance.uid,
        fragmentDefinitionUid: instance.fragmentUid,
        fragmentInstanceUids: instanceUids,
        propertyPath: ["nodes", instance.uid, "fragmentUid"],
        message: definition
          ? `Fragment cycle reaches ${instance.fragmentUid} through instance ${instance.uid}.`
          : `Fragment ${instance.fragmentUid} used by ${instance.uid} does not exist.`,
      });
      return { ...instance, kind: "group", childUids: [] };
    }
    const uidMap = new Map<Uid, Uid>();
    for (const sourceUid of Object.keys(definition.nodes) as Uid[]) {
      const base = virtualFragmentUid(instanceUids, sourceUid);
      let uid = base;
      let suffix = 1;
      while (allocated.has(uid)) uid = toUid(`${base.slice(0, 122)}_${++suffix}`);
      allocated.add(uid);
      uidMap.set(sourceUid, uid);
    }
    for (const sourceNode of Object.values(definition.nodes)) {
      const uid = uidMap.get(sourceNode.uid)!;
      const override = instance.overrides?.[sourceNode.uid];
      let cloned = remapNodeChildren({
        ...sourceNode,
        uid,
        ...(override?.runtimeId === undefined || sourceNode.kind === "block" ? {} : { runtimeId: override.runtimeId }),
        ...(override?.props === undefined || (sourceNode.kind !== "field" && sourceNode.kind !== "block") ? {} : { props: { ...sourceNode.props, ...override.props } }),
        ...(override?.presentation === undefined ? {} : { presentation: { ...sourceNode.presentation, ...override.presentation } }),
      }, uidMap);
      const nestedInstances = [...instanceUids, sourceNode.uid];
      provenance.set(uid, { ...baseProvenance, fragmentNodeUid: sourceNode.uid });
      if (cloned.kind === "fragment") cloned = expandInstance(cloned, nestedInstances, [...active, instance.fragmentUid]);
      nodes[uid] = cloned;
    }
    return {
      uid: instance.uid,
      kind: "group",
      runtimeId: instance.runtimeId,
      childUids: definition.rootNodeUids.map((uid) => uidMap.get(uid)!).filter(Boolean),
      ...(instance.presentation === undefined ? {} : { presentation: instance.presentation }),
      ...(instance.behavior === undefined ? {} : { behavior: instance.behavior }),
      ...(instance.validators === undefined ? {} : { validators: instance.validators }),
      ...(instance.transforms === undefined ? {} : { transforms: instance.transforms }),
      ...(instance.legacy === undefined ? {} : { legacy: instance.legacy }),
    };
  };
  for (const node of Object.values(form.nodes)) if (node.kind === "fragment") nodes[node.uid] = expandInstance(node, [node.uid], []);
  return { form: { ...form, nodes }, provenance, diagnostics };
}

interface CompiledNode {
  readonly schema?: NodeConfig<unknown, StudioFieldRegistry, unknown>;
  readonly stage?: StageNodeConfig<unknown, StudioFieldRegistry, unknown>;
  readonly variant?: readonly [string, CollectionVariantConfig<unknown, StudioFieldRegistry, unknown>];
  readonly render: StudioRenderNode;
}

function diagnostic(
  context: CompileContext,
  code: string,
  message: string,
  details: Omit<StudioDiagnostic, "code" | "message" | "severity" | "source" | "formUid"> = {},
): void {
  const provenance = details.entityUid === undefined ? undefined : context.provenance.get(details.entityUid);
  context.diagnostics.push({
    code,
    severity: "error",
    source: "compiler",
    message,
    formUid: context.form.uid,
    ...provenance,
    ...details,
  });
}

function recordSource(
  context: CompileContext,
  uid: Uid,
  runtimePath: DataPath,
  runtimeAddress: NodeAddress,
): void {
  const entry = Object.freeze({ uid, runtimePath, runtimeAddress, ...context.provenance.get(uid) });
  context.byUid.set(uid, entry);
  context.uidByPath.set(studioRuntimePathKey(runtimePath), uid);
  context.uidByAddress.set(studioRuntimeAddressKey(runtimeAddress), uid);
}

function unsupportedBehavior(
  context: CompileContext,
  node: StudioNode,
  runtimePath: DataPath,
  runtimeAddress: NodeAddress,
): void {
  if (node.kind === "field" && node.computed !== undefined) diagnostic(
    context,
    "compiler.unsupported-computed",
    "Computed fields are not supported by the minimal compiler.",
    { entityUid: node.uid, propertyPath: ["nodes", node.uid, "computed"], runtimePath, runtimeAddress },
  );
}

function validatorsForNode(node: StudioNode): readonly StudioValidatorSpec[] | undefined {
  if (node.kind === "field" || node.kind === "group" || node.kind === "collection" || node.kind === "wizard" || node.kind === "fragment") return node.validators;
  return undefined;
}

function indexRuntimePaths(form: StudioFormDocument): ReadonlyMap<Uid, DataPath> {
  const paths = new Map<Uid, DataPath>();
  const visiting = new Set<Uid>();
  const visit = (uid: Uid, parentPath: DataPath) => {
    if (visiting.has(uid)) return;
    const node = form.nodes[uid];
    if (!node) return;
    visiting.add(uid);
    const path = node.kind === "block" || node.kind === "variant" ? parentPath : [...parentPath, node.runtimeId];
    if (node.kind !== "block") paths.set(uid, path);
    for (const childUid of renderChildren(node)) visit(childUid, path);
    visiting.delete(uid);
  };
  for (const uid of form.rootNodeUids) visit(uid, []);
  paths.set(form.uid, []);
  return paths;
}

function compiledTransforms(
  context: CompileContext,
  rules: StudioFormDocument["transforms"],
  owner: { readonly entityUid: Uid; readonly propertyPath: readonly (number | string)[]; readonly runtimePath: DataPath; readonly runtimeAddress: NodeAddress },
) {
  const transforms = compileStudioTransforms(rules, {
    pathsByUid: context.targetPaths,
    onIssue: (entry) => diagnostic(context, entry.code, entry.message, {
      ...owner,
      propertyPath: [...owner.propertyPath, entry.ruleIndex, "actions", entry.actionIndex, "target"],
    }),
  });
  return transforms.length === 0 ? {} : { transforms };
}

function compiledValidators(
  context: CompileContext,
  specs: readonly StudioValidatorSpec[] | undefined,
  owner: { readonly entityUid?: Uid; readonly propertyPath: readonly (number | string)[]; readonly runtimePath: DataPath; readonly runtimeAddress: NodeAddress },
) {
  const result = compileStudioValidators(specs, {
    ...(context.serviceBindings === undefined ? {} : { serviceBindings: context.serviceBindings }),
    ...(context.localization === undefined ? {} : { localization: context.localization }),
  });
  for (const entry of result.diagnostics) diagnostic(context, entry.code, entry.message, {
    ...owner,
    propertyPath: [...owner.propertyPath, entry.index],
  });
  return result.validators.length === 0 ? {} : { validators: result.validators };
}

function isStaticallyHidden(node: StudioNode): boolean {
  return node.behavior?.when?.kind === "literal" && node.behavior.when.value === false;
}

function renderChildren(node: StudioNode): readonly Uid[] {
  if (node.kind === "wizard") return node.stageUids;
  if (node.kind === "collection") return isStudioVariantCollection(node) ? node.variantUids : node.childUids;
  if (node.kind === "group" || node.kind === "stage" || node.kind === "variant") return node.childUids;
  return [];
}

function expressionInput(context: NodeResolverContext<unknown, unknown> | DynamicConfigContext<unknown, unknown>, row?: unknown) {
  return {
    value: context.value,
    row: row ?? ("parentValue" in context ? context.parentValue : undefined),
    context: context.context,
    extensions: context.meta.extensions,
    metadata: context.meta,
  };
}

function expressionValue(expression: StudioExpression, context: NodeResolverContext<unknown, unknown> | DynamicConfigContext<unknown, unknown>, row?: unknown): unknown {
  const result = evaluateStudioExpression(expression, expressionInput(context, row));
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  return result.value;
}

function expressionBoolean(expression: StudioExpression, context: NodeResolverContext<unknown, unknown> | DynamicConfigContext<unknown, unknown>): boolean {
  const value = expressionValue(expression, context);
  if (typeof value !== "boolean") throw new TypeError("Dynamic condition must evaluate to a boolean.");
  return value;
}

function compiledBehavior(node: StudioNode): {
  readonly when?: boolean | ((context: NodeResolverContext<unknown, unknown>) => boolean);
  readonly disabled?: boolean | ((context: NodeResolverContext<unknown, unknown>) => boolean);
} {
  const when = node.behavior?.when;
  const disabled = node.behavior?.disabled;
  return {
    ...(when === undefined ? {} : when.kind === "literal" && typeof when.value === "boolean"
      ? { when: when.value }
      : { when: (context: NodeResolverContext<unknown, unknown>) => expressionBoolean(when, context) }),
    ...(disabled === undefined ? {} : typeof disabled === "boolean"
      ? { disabled }
      : disabled.kind === "literal" && typeof disabled.value === "boolean"
        ? { disabled: disabled.value }
        : { disabled: (context: NodeResolverContext<unknown, unknown>) => expressionBoolean(disabled, context) }),
  };
}

function compileSiblings(
  context: CompileContext,
  uids: readonly Uid[],
  parentPath: DataPath,
  parentAddress: NodeAddress,
): readonly CompiledNode[] {
  const output: CompiledNode[] = [];
  const siblingIds = new Set<string>();
  for (const uid of uids) {
    const node = context.form.nodes[uid];
    if (!node) {
      diagnostic(context, "compiler.missing-node", `Node reference ${uid} does not resolve.`, {
        entityUid: uid,
        runtimePath: parentPath,
        runtimeAddress: parentAddress,
      });
      continue;
    }
    if (node.kind !== "block" && siblingIds.has(node.runtimeId)) {
      diagnostic(context, "compiler.duplicate-sibling-id", `Sibling runtime ID ${node.runtimeId} is duplicated.`, {
        entityUid: uid,
        propertyPath: ["nodes", uid, "runtimeId"],
        runtimePath: [...parentPath, node.runtimeId],
        runtimeAddress: [...parentAddress, { kind: "node", id: node.runtimeId }],
      });
      continue;
    }
    if (node.kind !== "block") siblingIds.add(node.runtimeId);
    const compiled = compileNode(context, node, parentPath, parentAddress);
    if (compiled) output.push(compiled);
  }
  return output;
}

function compileNode(
  context: CompileContext,
  node: StudioNode,
  parentPath: DataPath,
  parentAddress: NodeAddress,
): CompiledNode | undefined {
  if (context.visiting.has(node.uid)) {
    diagnostic(context, "compiler.node-cycle", `Node graph contains a cycle at ${node.uid}.`, { entityUid: node.uid });
    return undefined;
  }
  if (context.visited.has(node.uid)) {
    diagnostic(context, "compiler.duplicate-node-reference", `Node ${node.uid} is referenced more than once.`, { entityUid: node.uid });
    return undefined;
  }
  context.visited.add(node.uid);
  context.visiting.add(node.uid);

  const presentation = node.presentation ?? {};
  const layout = studioPresentationLayout(presentation);
  const hidden = isStaticallyHidden(node);

  if (node.kind === "block") {
    const definition = studioBlockDefinition(node.definition);
    unsupportedBehavior(context, node, parentPath, parentAddress);
    context.visiting.delete(node.uid);
    if (!definition) {
      diagnostic(context, "compiler.unsupported-block-definition", `Block definition ${node.definition.key}@${node.definition.version} is not supported.`, {
        entityUid: node.uid,
        propertyPath: ["nodes", node.uid, "definition"],
      });
      return undefined;
    }
    return {
      render: {
        uid: node.uid,
        kind: "block",
        definition: definition.key,
        props: node.props,
        presentation,
        layout,
        hidden,
        children: [],
      },
    };
  }
  if (!isSafeObjectKey(node.runtimeId) || node.runtimeId.length === 0 || node.runtimeId.length > 128) {
    diagnostic(context, "compiler.invalid-runtime-id", `Runtime ID ${JSON.stringify(node.runtimeId)} is invalid.`, {
      entityUid: node.uid,
      propertyPath: ["nodes", node.uid, "runtimeId"],
    });
    context.visiting.delete(node.uid);
    return undefined;
  }

  const variant = node.kind === "variant";
  const runtimePath: DataPath = variant ? parentPath : [...parentPath, node.runtimeId];
  const runtimeAddress: NodeAddress = variant ? parentAddress : [...parentAddress, { kind: "node", id: node.runtimeId }];
  if (variant) context.byUid.set(node.uid, Object.freeze({ uid: node.uid, runtimePath, runtimeAddress, ...context.provenance.get(node.uid) }));
  else recordSource(context, node.uid, runtimePath, runtimeAddress);
  if (node.behavior?.presentWhen !== undefined) {
    if (studioExpressionDependencies(node.behavior.presentWhen).some(({ scope }) => scope === "row" || scope === "item")) diagnostic(
      context,
      "compiler.invalid-factory-expression",
      "Factory-level structure cannot depend on a current row.",
      { entityUid: node.uid, propertyPath: ["nodes", node.uid, "behavior", "presentWhen"], runtimePath, runtimeAddress },
    );
    else if (variant) context.variantPresence.set(variantPresenceKey(parentAddress, node.runtimeId), node.behavior.presentWhen);
    else context.presenceByAddress.set(studioRuntimeAddressKey(runtimeAddress), node.behavior.presentWhen);
  }
  unsupportedBehavior(context, node, runtimePath, runtimeAddress);
  const validation = compiledValidators(context, validatorsForNode(node), {
    entityUid: node.uid,
    propertyPath: ["nodes", node.uid, "validators"],
    runtimePath,
    runtimeAddress,
  });
  const transforms = node.kind === "field" || node.kind === "group" || node.kind === "collection" || node.kind === "wizard" || node.kind === "fragment"
    ? compiledTransforms(context, node.transforms, { entityUid: node.uid, propertyPath: ["nodes", node.uid, "transforms"], runtimePath, runtimeAddress })
    : {};

  if (node.kind === "field") {
    context.visiting.delete(node.uid);
    const definition = studioFieldDefinition(node.definition);
    if (!definition) {
      diagnostic(
        context,
        "compiler.unsupported-field-definition",
        `Field definition ${node.definition.key}@${node.definition.version} is not supported by the minimal compiler.`,
        {
          entityUid: node.uid,
          propertyPath: ["nodes", node.uid, "definition"],
          runtimePath,
          runtimeAddress,
        },
      );
      return undefined;
    }
    for (const issue of validateStudioFieldProps(definition, node.props)) diagnostic(
      context,
      "compiler.invalid-field-prop",
      issue.message,
      {
        entityUid: node.uid,
        propertyPath: ["nodes", node.uid, "props", issue.key],
        runtimePath,
        runtimeAddress,
      },
    );
    if (node.format !== undefined && ((node.format.kind === "number" && definition.value.kind !== "number") || (node.format.kind === "date" && definition.key !== "date"))) diagnostic(
      context,
      "compiler.incompatible-field-format",
      `${node.format.kind} formatting is incompatible with ${definition.key} fields.`,
      { entityUid: node.uid, propertyPath: ["nodes", node.uid, "format"], runtimePath, runtimeAddress },
    );
    let type = definition.key as string;
    if (node.reducers !== undefined && node.reducers.length > 0) {
      type = `${definition.key}__studio__${node.uid}`;
      context.fields[type] = {
        ...definition.runtime,
        reduce: compileStudioReducer(node.reducers, definition.runtime.reduce as FieldDefinition<unknown>["reduce"], {
          pathsByUid: context.targetPaths,
          onIssue: (entry) => diagnostic(context, entry.code, entry.message, {
            entityUid: node.uid,
            propertyPath: ["nodes", node.uid, "reducers", entry.ruleIndex, "actions", entry.actionIndex, "target"],
            runtimePath,
            runtimeAddress,
          }),
        }),
      } as FieldDefinition<unknown, JsonObject, string>;
    }
    const derivedProps = (resolverContext: NodeResolverContext<unknown, unknown>) => ({
      ...Object.fromEntries(Object.entries(node.derivedProps ?? {}).map(([key, expression]) => [key, expressionValue(expression, resolverContext)])),
      ...Object.fromEntries(Object.entries(node.localizedProps ?? {}).flatMap(([key, messageKey]) => {
        if (context.localization === undefined) return [];
        const rawLocale = resolverContext.context !== null && typeof resolverContext.context === "object"
          ? (resolverContext.context as Readonly<Record<string, unknown>>)["locale"]
          : undefined;
        const locale = typeof rawLocale === "string" ? rawLocale : context.localization.defaultLocale;
        const localized = resolveStudioMessage(messageKey, locale, context.localization).value;
        return localized === undefined ? [] : [[key, localized]];
      })),
    });
    return {
      schema: {
        kind: "field",
        id: node.runtimeId,
        type,
        props: node.props,
        ...compiledBehavior(node),
        ...transforms,
        ...validation,
        ...(node.derivedProps === undefined && node.localizedProps === undefined ? {} : { deriveProps: derivedProps }),
      },
      render: {
        uid: node.uid,
        kind: "field",
        runtimePath,
        runtimeAddress,
        presentation,
        layout,
        hidden,
        children: [],
      },
    };
  }

  const children = compileSiblings(context, renderChildren(node), runtimePath, runtimeAddress);
  context.visiting.delete(node.uid);
  if (node.kind === "variant") {
    return {
      variant: [node.runtimeId, {
        nodes: children.flatMap((child) => child.schema === undefined ? [] : [child.schema]),
      }],
      render: {
        uid: node.uid,
        kind: "variant",
        runtimePath,
        runtimeAddress,
        presentation,
        layout,
        hidden,
        children: children.map((child) => child.render),
      },
    };
  }
  const render = {
    uid: node.uid,
    kind: node.kind,
    runtimePath,
    runtimeAddress,
    presentation,
    layout,
    hidden,
    children: children.map((child) => child.render),
  } as StudioRenderNode;
  if (node.kind === "stage") return {
    stage: {
      id: node.runtimeId,
      nodes: children.flatMap((child) => child.schema === undefined ? [] : [child.schema]),
      ...compiledBehavior(node),
    },
    render,
  };
  if (node.kind === "group") return {
    schema: {
      kind: "group",
      id: node.runtimeId,
      nodes: children.flatMap((child) => child.schema === undefined ? [] : [child.schema]),
      ...compiledBehavior(node),
      ...transforms,
      ...validation,
    },
    render,
  };
  if (node.kind === "collection") {
    const keyProperty = node.itemKey?.kind === "property" ? node.itemKey.property : undefined;
    const itemKey = keyProperty === undefined ? undefined : (item: Readonly<unknown>, _index: number): string => {
      if (item !== null && typeof item === "object") {
        const value = (item as Readonly<Record<string, unknown>>)[keyProperty];
        if (typeof value === "string" && value.length > 0) return value;
        if (typeof value === "number" && Number.isFinite(value)) return String(value);
      }
      return "";
    };
    const common = {
      kind: "collection" as const,
      id: node.runtimeId,
      ...(node.min === undefined ? {} : { min: node.min }),
      ...(node.max === undefined ? {} : { max: node.max }),
      ...(itemKey === undefined ? {} : { itemKey }),
      ...compiledBehavior(node),
      ...transforms,
      ...validation,
    };
    const schema: NodeConfig<unknown, StudioFieldRegistry, unknown> = isStudioVariantCollection(node)
      ? {
          ...common,
          discriminator: node.discriminator,
          variants: Object.fromEntries(children.flatMap((child) => child.variant === undefined ? [] : [child.variant])),
        }
      : {
          ...common,
          nodes: children.flatMap((child) => child.schema === undefined ? [] : [child.schema]),
        };
    return { schema, render };
  }
  if (node.kind === "fragment") {
    context.visiting.delete(node.uid);
    diagnostic(context, "compiler.unexpanded-fragment", `Fragment instance ${node.uid} could not be expanded.`, { entityUid: node.uid });
    return undefined;
  }
  const initialStageNode = node.initialStageUid === undefined ? undefined : context.form.nodes[node.initialStageUid];
  const initialStage = initialStageNode?.kind === "stage" ? initialStageNode.runtimeId : undefined;
  const guardExpression = node.navigation?.guard;
  const guardHasUnsupportedScope = guardExpression !== undefined && studioExpressionDependencies(guardExpression)
    .some(({ scope }) => scope !== "value" && scope !== "event");
  if (guardHasUnsupportedScope) diagnostic(
    context,
    "compiler.invalid-guard-expression",
    "Wizard guards can reference only form value and event.from/event.to.",
    { entityUid: node.uid, propertyPath: ["nodes", node.uid, "navigation", "guard"], runtimePath, runtimeAddress },
  );
  const navigation = node.navigation === undefined ? undefined : {
    ...(node.navigation.validateCurrent === undefined ? {} : { validateCurrent: node.navigation.validateCurrent }),
    ...(node.navigation.nonLinear === undefined ? {} : { nonLinear: node.navigation.nonLinear }),
    ...(guardExpression === undefined || guardHasUnsupportedScope ? {} : {
      guard: (value: unknown, from: string, to: string): boolean => {
        const result = evaluateStudioExpression(guardExpression, { value, event: { from, to } });
        if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
        if (typeof result.value !== "boolean") throw new TypeError("Wizard guard must evaluate to a boolean.");
        return result.value;
      },
    }),
  };
  return {
    schema: {
      kind: "wizard",
      id: node.runtimeId,
      stages: children.flatMap((child) => child.stage === undefined ? [] : [child.stage]),
      ...(initialStage === undefined ? {} : { initialStage }),
      ...(navigation === undefined ? {} : { navigation }),
      ...compiledBehavior(node),
      ...transforms,
      ...validation,
    },
    render,
  };
}

function emptyScope(form: StudioFormDocument, uids: readonly Uid[]): JsonObject {
  const value: Record<string, JsonValue> = {};
  for (const uid of uids) {
    const node = form.nodes[uid];
    if (!node || node.kind === "block" || node.kind === "variant") continue;
    if (node.kind === "field") {
      const definition = studioFieldDefinition(node.definition);
      if (definition) value[node.runtimeId] = definition.value.emptyValue as JsonValue;
    } else if (node.kind === "group" || node.kind === "stage") {
      value[node.runtimeId] = emptyScope(form, node.childUids);
    } else if (node.kind === "wizard") {
      value[node.runtimeId] = emptyScope(form, node.stageUids);
    } else if (node.kind === "collection") {
      const rows: JsonObject[] = [];
      for (let index = 0; index < (node.initialRows ?? 0); index += 1) {
        let row: JsonObject;
        if (isStudioVariantCollection(node)) {
          const variantNode = node.initialVariantUid === undefined ? undefined : form.nodes[node.initialVariantUid];
          row = variantNode?.kind === "variant"
            ? { ...emptyScope(form, variantNode.childUids), [node.discriminator]: variantNode.runtimeId }
            : {};
        } else row = emptyScope(form, node.childUids);
        if (node.itemKey?.kind === "property") row = { ...row, [node.itemKey.property]: `row-${index + 1}` };
        rows.push(row);
      }
      value[node.runtimeId] = rows;
    }
  }
  return value;
}

function presentAt(
  address: NodeAddress,
  context: DynamicConfigContext<unknown, unknown>,
  presenceByAddress: ReadonlyMap<string, StudioExpression>,
): boolean {
  const expression = presenceByAddress.get(studioRuntimeAddressKey(address));
  return expression === undefined || expressionBoolean(expression, context);
}

function variantPresenceKey(collectionAddress: NodeAddress, variant: string): string {
  return `${studioRuntimeAddressKey(collectionAddress)}\u0000${variant}`;
}

function dynamicNodes(
  nodes: readonly NodeConfig<unknown, StudioFieldRegistry, unknown>[],
  parentAddress: NodeAddress,
  dynamicContext: DynamicConfigContext<unknown, unknown>,
  presenceByAddress: ReadonlyMap<string, StudioExpression>,
  variantPresence: ReadonlyMap<string, StudioExpression>,
): readonly NodeConfig<unknown, StudioFieldRegistry, unknown>[] {
  const output: NodeConfig<unknown, StudioFieldRegistry, unknown>[] = [];
  for (const node of nodes) {
    const address: NodeAddress = [...parentAddress, { kind: "node", id: node.id }];
    if (!presentAt(address, dynamicContext, presenceByAddress)) continue;
    if (node.kind === "group") output.push({ ...node, nodes: dynamicNodes(node.nodes, address, dynamicContext, presenceByAddress, variantPresence) });
    else if (node.kind === "collection" && node.nodes !== undefined) output.push({ ...node, nodes: dynamicNodes(node.nodes, address, dynamicContext, presenceByAddress, variantPresence) });
    else if (node.kind === "collection" && node.variants !== undefined) output.push({
      ...node,
      variants: Object.fromEntries(Object.entries(node.variants).flatMap(([key, variant]) => {
        const expression = variantPresence.get(variantPresenceKey(address, key));
        if (expression !== undefined && !expressionBoolean(expression, dynamicContext)) return [];
        return [[key, { ...variant, nodes: dynamicNodes(variant.nodes, address, dynamicContext, presenceByAddress, variantPresence) }]];
      })),
    });
    else if (node.kind === "wizard") output.push({
      ...node,
      stages: node.stages.flatMap((stage) => {
        const stageAddress: NodeAddress = [...address, { kind: "node", id: stage.id }];
        return presentAt(stageAddress, dynamicContext, presenceByAddress)
          ? [{ ...stage, nodes: dynamicNodes(stage.nodes, stageAddress, dynamicContext, presenceByAddress, variantPresence) }]
          : [];
      }),
    });
    else output.push(node);
  }
  return output;
}

/** Builds explicit owner-controlled scenario data; it is never installed as a schema default. */
export function createEmptyStudioScenarioValue(form: StudioFormDocument, fragments: Readonly<Record<Uid, StudioFragmentDefinition>> = {}): JsonObject {
  const expanded = expandStudioFragments(form, fragments).form;
  return emptyScope(expanded, expanded.rootNodeUids);
}

export function compileStudioForm(
  form: StudioFormDocument,
  fragments: Readonly<Record<Uid, StudioFragmentDefinition>> = {},
  options: StudioCompileOptions = {},
): CompiledStudioForm {
  const expanded = expandStudioFragments(form, fragments);
  const context: CompileContext = {
    form: expanded.form,
    diagnostics: [...expanded.diagnostics],
    byUid: new Map(),
    uidByPath: new Map(),
    uidByAddress: new Map(),
    visited: new Set(),
    visiting: new Set(),
    provenance: expanded.provenance,
    presenceByAddress: new Map(),
    variantPresence: new Map(),
    serviceBindings: options.serviceBindings,
    localization: options.localization,
    targetPaths: indexRuntimePaths(expanded.form),
    fields: { ...STUDIO_RUNTIME_FIELDS },
  };
  recordSource(context, expanded.form.uid, [], []);
  const nodes = compileSiblings(context, expanded.form.rootNodeUids, [], []);
  if (context.localization !== undefined) {
    for (const node of Object.values(expanded.form.nodes)) for (const [property, key] of Object.entries(node.localizedProps ?? {})) {
      const resolved = resolveStudioMessage(key, context.localization.defaultLocale, context.localization);
      if (resolved.value === undefined) diagnostic(context, "compiler.missing-localization-message", resolved.message ?? `Message ${key} is missing.`, {
        entityUid: node.uid,
        propertyPath: ["nodes", node.uid, "localizedProps", property],
      });
    }
    const inspectMessages = (specs: readonly StudioValidatorSpec[] | undefined, entityUid: Uid, path: readonly (number | string)[]) => specs?.forEach((spec, index) => {
      const key = typeof spec.message === "object" ? spec.message.key : undefined;
      if (key === undefined) return;
      const resolved = resolveStudioMessage(key, context.localization!.defaultLocale, context.localization!);
      if (resolved.value === undefined) diagnostic(context, "compiler.missing-localization-message", resolved.message ?? `Message ${key} is missing.`, {
        entityUid,
        propertyPath: [...path, index, "message", "key"],
      });
    });
    inspectMessages(expanded.form.validators, expanded.form.uid, ["validators"]);
    for (const node of Object.values(expanded.form.nodes)) inspectMessages(validatorsForNode(node), node.uid, ["nodes", node.uid, "validators"]);
  }
  for (const uid of Object.keys(expanded.form.nodes) as Uid[]) {
    if (!context.visited.has(uid)) diagnostic(
      context,
      "compiler.unreachable-node",
      `Node ${uid} is not reachable from a form root.`,
      { entityUid: uid, propertyPath: ["nodes", uid] },
    );
  }
  form.events?.forEach((definition, index) => {
    if (definition.target.kind === "node" && !context.targetPaths.has(definition.target.uid)) diagnostic(
      context,
      "compiler.invalid-event-target",
      `Named event target ${definition.target.uid} does not resolve to a runtime node.`,
      { entityUid: form.uid, propertyPath: ["events", index, "target"] },
    );
  });
  const schema: StagesSchema<unknown, StudioFieldRegistry, unknown> = {
    id: form.runtime.schemaId,
    version: form.runtime.schemaVersion,
    nodes: nodes.flatMap((node) => node.schema === undefined ? [] : [node.schema]),
    ...compiledTransforms(context, form.transforms, { entityUid: form.uid, propertyPath: ["transforms"], runtimePath: [], runtimeAddress: [] }),
    ...compiledValidators(context, form.validators, { propertyPath: ["validators"], runtimePath: [], runtimeAddress: [] }),
  };
  const schemaInput = context.presenceByAddress.size === 0 && context.variantPresence.size === 0
    ? schema
    : (dynamicContext: DynamicConfigContext<unknown, unknown>): StagesSchema<unknown, StudioFieldRegistry, unknown> => ({
        ...schema,
        nodes: dynamicNodes(schema.nodes, [], dynamicContext, context.presenceByAddress, context.variantPresence),
      });
  return {
    expandedForm: expanded.form,
    schema,
    schemaInput,
    fields: context.fields as StudioFieldRegistry,
    renderPlan: {
      formUid: expanded.form.uid,
      theme: studioTheme(expanded.form.settings["theme"]),
      nodes: nodes.map((node) => node.render),
    },
    sourceMap: {
      byUid: context.byUid,
      uidByPath: context.uidByPath,
      uidByAddress: context.uidByAddress,
    },
    diagnostics: context.diagnostics,
  };
}
