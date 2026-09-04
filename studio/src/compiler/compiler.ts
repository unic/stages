import type { CollectionVariantConfig, DataPath, NodeAddress, NodeConfig, StageNodeConfig } from "@stages/core";
import type { JsonObject, JsonValue, StudioFormDocument, StudioNode, Uid } from "../document";
import { isSafeObjectKey, isStudioVariantCollection } from "../document";
import {
  STUDIO_RUNTIME_FIELDS,
  studioBlockDefinition,
  studioFieldDefinition,
  studioPresentationLayout,
  studioTheme,
  validateStudioFieldProps,
} from "../registry";
import { studioRuntimeAddressKey, studioRuntimePathKey } from "./source-map";
import type {
  CompiledStudioForm,
  StudioDiagnostic,
  StudioFieldRegistry,
  StudioRenderNode,
  StudioSourceMapEntry,
} from "./types";

interface CompileContext {
  readonly form: StudioFormDocument;
  readonly diagnostics: StudioDiagnostic[];
  readonly byUid: Map<Uid, StudioSourceMapEntry>;
  readonly uidByPath: Map<string, Uid>;
  readonly uidByAddress: Map<string, Uid>;
  readonly visited: Set<Uid>;
  readonly visiting: Set<Uid>;
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
  context.diagnostics.push({
    code,
    severity: "error",
    source: "compiler",
    message,
    formUid: context.form.uid,
    ...details,
  });
}

function recordSource(
  context: CompileContext,
  uid: Uid,
  runtimePath: DataPath,
  runtimeAddress: NodeAddress,
): void {
  const entry = Object.freeze({ uid, runtimePath, runtimeAddress });
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
  if (node.behavior?.when !== undefined && !(
    node.behavior.when.kind === "literal" && typeof node.behavior.when.value === "boolean"
  )) diagnostic(
    context,
    "compiler.unsupported-behavior",
    "Conditional visibility is not supported by the minimal compiler.",
    { entityUid: node.uid, propertyPath: ["nodes", node.uid, "behavior", "when"], runtimePath, runtimeAddress },
  );
  if (node.behavior?.disabled !== undefined && typeof node.behavior.disabled !== "boolean") diagnostic(
    context,
    "compiler.unsupported-behavior",
    "Dynamic disabled state is not supported by the minimal compiler.",
    { entityUid: node.uid, propertyPath: ["nodes", node.uid, "behavior", "disabled"], runtimePath, runtimeAddress },
  );
  if (node.kind === "field" && node.computed !== undefined) diagnostic(
    context,
    "compiler.unsupported-computed",
    "Computed fields are not supported by the minimal compiler.",
    { entityUid: node.uid, propertyPath: ["nodes", node.uid, "computed"], runtimePath, runtimeAddress },
  );
  if (node.kind === "field" && node.validators !== undefined && node.validators.length > 0) diagnostic(
    context,
    "compiler.unsupported-validators",
    "Document validators are not supported by the minimal compiler.",
    { entityUid: node.uid, propertyPath: ["nodes", node.uid, "validators"], runtimePath, runtimeAddress },
  );
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

function staticBehavior(node: StudioNode): { readonly when?: boolean; readonly disabled?: boolean } {
  return {
    ...(node.behavior?.when?.kind === "literal" && typeof node.behavior.when.value === "boolean"
      ? { when: node.behavior.when.value }
      : {}),
    ...(typeof node.behavior?.disabled === "boolean" ? { disabled: node.behavior.disabled } : {}),
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
  if (variant) context.byUid.set(node.uid, Object.freeze({ uid: node.uid, runtimePath, runtimeAddress }));
  else recordSource(context, node.uid, runtimePath, runtimeAddress);
  unsupportedBehavior(context, node, runtimePath, runtimeAddress);

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
    return {
      schema: {
        kind: "field",
        id: node.runtimeId,
        type: definition.key,
        props: node.props,
        ...staticBehavior(node),
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
      ...staticBehavior(node),
    },
    render,
  };
  if (node.kind === "group") return {
    schema: {
      kind: "group",
      id: node.runtimeId,
      nodes: children.flatMap((child) => child.schema === undefined ? [] : [child.schema]),
      ...staticBehavior(node),
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
      ...staticBehavior(node),
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
  const initialStageNode = node.initialStageUid === undefined ? undefined : context.form.nodes[node.initialStageUid];
  const initialStage = initialStageNode?.kind === "stage" ? initialStageNode.runtimeId : undefined;
  return {
    schema: {
      kind: "wizard",
      id: node.runtimeId,
      stages: children.flatMap((child) => child.stage === undefined ? [] : [child.stage]),
      ...(initialStage === undefined ? {} : { initialStage }),
      ...(node.navigation === undefined ? {} : { navigation: node.navigation }),
      ...staticBehavior(node),
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
    } else {
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

/** Builds explicit owner-controlled scenario data; it is never installed as a schema default. */
export function createEmptyStudioScenarioValue(form: StudioFormDocument): JsonObject {
  return emptyScope(form, form.rootNodeUids);
}

export function compileStudioForm(form: StudioFormDocument): CompiledStudioForm {
  const context: CompileContext = {
    form,
    diagnostics: [],
    byUid: new Map(),
    uidByPath: new Map(),
    uidByAddress: new Map(),
    visited: new Set(),
    visiting: new Set(),
  };
  const nodes = compileSiblings(context, form.rootNodeUids, [], []);
  for (const uid of Object.keys(form.nodes) as Uid[]) {
    if (!context.visited.has(uid)) diagnostic(
      context,
      "compiler.unreachable-node",
      `Node ${uid} is not reachable from a form root.`,
      { entityUid: uid, propertyPath: ["nodes", uid] },
    );
  }
  return {
    schema: {
      id: form.runtime.schemaId,
      version: form.runtime.schemaVersion,
      nodes: nodes.flatMap((node) => node.schema === undefined ? [] : [node.schema]),
    },
    fields: STUDIO_RUNTIME_FIELDS,
    renderPlan: {
      formUid: form.uid,
      theme: studioTheme(form.settings["theme"]),
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
