import { getAtPath, isSafePathSegment } from "./path.js";
import { addressKey } from "./address.js";
import type {
  DataPath,
  DeepReadonly,
  Diagnostic,
  DynamicMetaSnapshot,
  FieldDefinition,
  NodeAddress,
  NodeConfig,
  NodeResolverContext,
  StagesSchema,
  StagesSchemaInput,
} from "./types.js";

export interface NormalizedNode<TValue, TFields, TContext> {
  readonly config: NodeConfig<TValue, TFields, TContext>;
  readonly path: DataPath;
  readonly address: NodeAddress;
  readonly visible: boolean;
  readonly disabled: boolean;
  readonly props: Readonly<Record<string, unknown>>;
  readonly children: readonly NormalizedNode<TValue, TFields, TContext>[];
  readonly branches: readonly NormalizedBranch<TValue, TFields, TContext>[];
}

export interface NormalizedBranch<TValue, TFields, TContext> {
  readonly kind: "row" | "stage";
  readonly id: string;
  readonly path: DataPath;
  readonly address: NodeAddress;
  readonly visible: boolean;
  readonly disabled: boolean;
  readonly children: readonly NormalizedNode<TValue, TFields, TContext>[];
}

export interface EvaluatedSchema<TValue, TFields, TContext> {
  readonly schema: StagesSchema<TValue, TFields, TContext>;
  readonly nodes: readonly NormalizedNode<TValue, TFields, TContext>[];
  readonly diagnostics: readonly Diagnostic[];
}

export interface EvaluateSchemaOptions<TValue, TFields, TContext> {
  readonly schema: StagesSchemaInput<TValue, TFields, TContext>;
  readonly value: DeepReadonly<TValue>;
  readonly context: DeepReadonly<TContext>;
  readonly meta: DynamicMetaSnapshot;
  readonly fields: TFields;
  readonly collectionKeys?: ReadonlyMap<string, readonly string[]>;
}

function diagnostic(
  code: string,
  message: string,
  path: DataPath = [],
  address: NodeAddress = [],
): Diagnostic {
  return { code, message, severity: "error", path, address };
}

function nodeContext<TValue, TContext>(
  value: DeepReadonly<TValue>,
  context: DeepReadonly<TContext>,
  meta: DynamicMetaSnapshot,
  path: DataPath,
  address: NodeAddress,
): NodeResolverContext<TValue, TContext> {
  return {
    value,
    context,
    meta,
    path,
    address,
    fieldValue: getAtPath(value, path),
    parentValue: getAtPath(value, path.slice(0, -1)),
  };
}

function resolveBoolean<TValue, TContext>(
  resolver: boolean | ((context: NodeResolverContext<TValue, TContext>) => boolean) | undefined,
  context: NodeResolverContext<TValue, TContext>,
  fallback: boolean,
): boolean {
  const resolved = typeof resolver === "function" ? resolver(context) : resolver;
  if (resolved === undefined) return fallback;
  if (typeof resolved !== "boolean") throw new TypeError("Predicate must return a boolean.");
  return resolved;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validEventPolicy(value: unknown): boolean {
  return typeof value === "string"
    ? value.length > 0
    : Array.isArray(value) && value.length > 0 && value.every((name) => typeof name === "string" && name.length > 0);
}

function validTransforms(value: unknown): boolean {
  return value === undefined || Array.isArray(value) && value.every((candidate) => {
    if (!isRecord(candidate) || !validEventPolicy(candidate["on"]) || typeof candidate["apply"] !== "function") return false;
    return candidate["when"] === undefined || typeof candidate["when"] === "function";
  });
}

function validValidators(value: unknown): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value)) return false;
  const ids = new Set<string>();
  return value.every((candidate) => {
    if (!isRecord(candidate)) return false;
    const id = candidate["id"];
    if (typeof id !== "string" || id.length === 0 || ids.has(id)) return false;
    ids.add(id);
    if (!validEventPolicy(candidate["on"]) || typeof candidate["validate"] !== "function") return false;
    if (candidate["revealOn"] !== undefined && !validEventPolicy(candidate["revealOn"])) return false;
    if (candidate["includeDisabled"] !== undefined && typeof candidate["includeDisabled"] !== "boolean") return false;
    if (candidate["when"] !== undefined && typeof candidate["when"] !== "function") return false;
    const dependencies = candidate["dependencies"];
    return dependencies === undefined || Array.isArray(dependencies) && dependencies.every((path) =>
      Array.isArray(path) && path.every((segment) =>
        (typeof segment === "string" || typeof segment === "number") && isSafePathSegment(segment),
      ),
    );
  });
}

function validateBehavior(
  candidate: Readonly<Record<string, unknown>>,
  diagnostics: Diagnostic[],
  path: DataPath,
  address: NodeAddress,
): boolean {
  let valid = true;
  if (!validTransforms(candidate["transforms"])) {
    diagnostics.push(diagnostic("schema.invalid-transform", "Transforms require valid event policies and apply functions.", path, address));
    valid = false;
  }
  if (!validValidators(candidate["validators"])) {
    diagnostics.push(diagnostic("schema.invalid-validator", "Validators require unique IDs, valid event policies, dependencies, and validate functions.", path, address));
    valid = false;
  }
  return valid;
}

function hasField(fields: unknown, name: string): boolean {
  return fields !== null && typeof fields === "object" && Object.prototype.hasOwnProperty.call(fields, name);
}

function registeredField(fields: unknown, name: string): unknown {
  return fields !== null && typeof fields === "object"
    ? (fields as Readonly<Record<string, unknown>>)[name]
    : undefined;
}

function validFieldDefinition(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value["reduce"] !== undefined && typeof value["reduce"] !== "function") return false;
  const validators = value["validators"];
  if (validators === undefined) return true;
  if (!Array.isArray(validators)) return false;
  const ids = new Set<string>();
  return validators.every((validator) => {
    if (!isRecord(validator)) return false;
    const id = validator["id"];
    if (typeof id !== "string" || id.length === 0 || ids.has(id) || typeof validator["validate"] !== "function") return false;
    ids.add(id);
    return true;
  });
}

interface WalkContext<TValue, TFields, TContext> {
  readonly value: DeepReadonly<TValue>;
  readonly context: DeepReadonly<TContext>;
  readonly meta: DynamicMetaSnapshot;
  readonly fields: TFields;
  readonly diagnostics: Diagnostic[];
  readonly collectionKeys: ReadonlyMap<string, readonly string[]>;
}

function walkNodes<TValue, TFields, TContext>(
  configs: readonly NodeConfig<TValue, TFields, TContext>[],
  parentPath: DataPath,
  parentAddress: NodeAddress,
  parentDisabled: boolean,
  parentVisible: boolean,
  walk: WalkContext<TValue, TFields, TContext>,
): readonly NormalizedNode<TValue, TFields, TContext>[] {
  const siblingIds = new Set<string>();
  const normalized: NormalizedNode<TValue, TFields, TContext>[] = [];

  for (const config of configs) {
    const candidate = config as unknown;
    if (!isRecord(candidate) || typeof candidate["id"] !== "string") {
      walk.diagnostics.push(diagnostic("schema.invalid-node", "Schema nodes require a string id.", parentPath, parentAddress));
      continue;
    }
    const path = [...parentPath, config.id];
    const address: NodeAddress = [...parentAddress, { kind: "node", id: config.id }];

    if (candidate["kind"] !== "field" && candidate["kind"] !== "group"
      && candidate["kind"] !== "collection" && candidate["kind"] !== "wizard") {
      walk.diagnostics.push(diagnostic("schema.invalid-kind", `Unknown node kind "${String(candidate["kind"])}".`, path, address));
      continue;
    }

    if (!isSafePathSegment(config.id)) {
      walk.diagnostics.push(diagnostic("schema.unsafe-id", `Unsafe node id \"${config.id}\".`, path, address));
      continue;
    }
    if (siblingIds.has(config.id)) {
      walk.diagnostics.push(diagnostic("schema.duplicate-id", `Duplicate sibling id \"${config.id}\".`, path, address));
      continue;
    }
    siblingIds.add(config.id);
    if (!validateBehavior(candidate, walk.diagnostics, path, address)) continue;
    if (config.kind === "field" && config.props !== undefined && !isRecord(config.props)) {
      walk.diagnostics.push(diagnostic("schema.invalid-props", `Props for "${config.id}" must be an object.`, path, address));
      continue;
    }

    const resolverContext = nodeContext(walk.value, walk.context, walk.meta, path, address);
    let visible = true;
    let disabled = parentDisabled;
    let props: Readonly<Record<string, unknown>> = {};

    try {
      visible = parentVisible && resolveBoolean(config.when, resolverContext, true);
      disabled = parentDisabled || resolveBoolean(config.disabled, resolverContext, false);
      if (config.kind === "field") {
        props = { ...(config.props as Readonly<Record<string, unknown>> | undefined) };
        if (config.deriveProps !== undefined) {
          const derived = config.deriveProps(resolverContext);
          if (!isRecord(derived)) throw new TypeError("Derived props must be an object.");
          props = { ...props, ...derived };
        }
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      walk.diagnostics.push(diagnostic("schema.resolver-failed", `Resolver for \"${config.id}\" failed: ${detail}`, path, address));
      continue;
    }

    let children: readonly NormalizedNode<TValue, TFields, TContext>[] = [];
    let branches: readonly NormalizedBranch<TValue, TFields, TContext>[] = [];
    if (config.kind === "field") {
      if (typeof config.type !== "string") {
        walk.diagnostics.push(diagnostic("schema.unknown-field", `Field "${config.id}" requires a string type.`, path, address));
        continue;
      }
      if (!hasField(walk.fields, config.type)) {
        walk.diagnostics.push(diagnostic("schema.unknown-field", `Unknown field type \"${config.type}\".`, path, address));
        continue;
      }
      if (!validFieldDefinition(registeredField(walk.fields, config.type))) {
        walk.diagnostics.push(diagnostic("schema.invalid-field-definition", `Field type "${config.type}" has an invalid definition.`, path, address));
        continue;
      }
    } else if (config.kind === "group") {
      if (!Array.isArray(config.nodes)) {
        walk.diagnostics.push(diagnostic("schema.invalid-nodes", `Group "${config.id}" nodes must be an array.`, path, address));
        continue;
      }
      children = walkNodes(config.nodes, path, address, disabled, visible, walk);
    } else if (config.kind === "collection") {
      const runtimeConfig = config as Readonly<{
        nodes?: readonly NodeConfig<TValue, TFields, TContext>[];
        variants?: Readonly<Record<string, { readonly nodes: readonly NodeConfig<TValue, TFields, TContext>[] }>>;
      }>;
      const definesNodes = candidate["nodes"] !== undefined;
      const definesVariants = candidate["variants"] !== undefined;
      const hasNodes = Array.isArray(runtimeConfig.nodes);
      const hasVariants = isRecord(runtimeConfig.variants);
      if (definesNodes === definesVariants || definesNodes !== hasNodes || definesVariants !== hasVariants) {
        walk.diagnostics.push(diagnostic("schema.collection-shape", `Collection \"${config.id}\" must define exactly one of nodes or variants.`, path, address));
        continue;
      }
      if (config.itemKey !== undefined && typeof config.itemKey !== "function") {
        walk.diagnostics.push(diagnostic("schema.item-key", `Collection "${config.id}" itemKey must be a function.`, path, address));
        continue;
      }
      if (config.min !== undefined && (!Number.isSafeInteger(config.min) || config.min < 0)) {
        walk.diagnostics.push(diagnostic("schema.collection-min", `Collection \"${config.id}\" has an invalid min.`, path, address));
      }
      if (config.max !== undefined && (!Number.isSafeInteger(config.max) || config.max < 0)) {
        walk.diagnostics.push(diagnostic("schema.collection-max", `Collection \"${config.id}\" has an invalid max.`, path, address));
      }
      if (config.min !== undefined && config.max !== undefined && config.min > config.max) {
        walk.diagnostics.push(diagnostic("schema.collection-range", `Collection \"${config.id}\" has min greater than max.`, path, address));
      }
      const collectionValue = getAtPath(walk.value, path);
      if (collectionValue !== undefined && !Array.isArray(collectionValue)) {
        walk.diagnostics.push(diagnostic("schema.collection-value", `Collection \"${config.id}\" requires an array value.`, path, address));
      }
      if (hasVariants) {
        if (typeof config.discriminator !== "string" || !isSafePathSegment(config.discriminator)) {
          walk.diagnostics.push(diagnostic("schema.unsafe-discriminator", `Invalid discriminator \"${String(config.discriminator)}\".`, path, address));
          continue;
        }
        let variantsValid = true;
        const variants = Object.entries(runtimeConfig.variants ?? {});
        if (variants.length === 0) {
          walk.diagnostics.push(diagnostic("schema.invalid-variant", `Collection "${config.id}" must define at least one variant.`, path, address));
          variantsValid = false;
        }
        for (const [variantName, variant] of variants) {
          if (!isSafePathSegment(variantName)) {
            walk.diagnostics.push(diagnostic("schema.unsafe-variant", `Unsafe variant \"${variantName}\".`, path, address));
            variantsValid = false;
          }
          if (!isRecord(variant) || !Array.isArray(variant["nodes"])) {
            walk.diagnostics.push(diagnostic("schema.invalid-variant", `Variant \"${variantName}\" must define a nodes array.`, path, address));
            variantsValid = false;
          }
        }
        if (!variantsValid) continue;
      }
      const rows = Array.isArray(collectionValue) ? collectionValue : [];
      const rowKeys = new Set<string>();
      const storedRowKeys = walk.collectionKeys.get(addressKey(address));
      const rowChildren: NormalizedNode<TValue, TFields, TContext>[] = [];
      const rowBranches: NormalizedBranch<TValue, TFields, TContext>[] = [];
      rows.forEach((row, index) => {
        let rowKey = storedRowKeys?.[index] ?? String(index);
        try {
          rowKey = config.itemKey?.(row, index) ?? rowKey;
          if (typeof rowKey !== "string" || rowKey.length === 0) throw new TypeError("Item keys must be non-empty strings.");
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          walk.diagnostics.push(diagnostic("schema.item-key-failed", `Item key for \"${config.id}\" failed: ${detail}`, [...path, index], address));
          return;
        }
        const rowAddress: NodeAddress = [...address, { kind: "row", id: rowKey }];
        if (rowKeys.has(rowKey)) {
          walk.diagnostics.push(diagnostic("schema.duplicate-row-key", `Duplicate row key \"${rowKey}\".`, [...path, index], rowAddress));
          return;
        }
        rowKeys.add(rowKey);

        let rowNodes: readonly NodeConfig<TValue, TFields, TContext>[] | undefined = config.nodes;
        if (config.variants !== undefined) {
          const variantName = row !== null && typeof row === "object"
            ? (row as Readonly<Record<string, unknown>>)[config.discriminator]
            : undefined;
          rowNodes = typeof variantName === "string" ? config.variants[variantName]?.nodes : undefined;
          if (rowNodes === undefined) {
            walk.diagnostics.push(diagnostic("schema.unknown-variant", `Row ${index} has unknown variant \"${String(variantName)}\".`, [...path, index], rowAddress));
            return;
          }
        }
        const normalizedRowNodes = walkNodes(rowNodes ?? [], [...path, index], rowAddress, disabled, visible, walk);
        rowChildren.push(...normalizedRowNodes);
        rowBranches.push({
          kind: "row",
          id: rowKey,
          path: [...path, index],
          address: rowAddress,
          visible,
          disabled,
          children: normalizedRowNodes,
        });
      });
      children = rowChildren;
      branches = rowBranches;
    } else {
      if (!Array.isArray(config.stages)) {
        walk.diagnostics.push(diagnostic("schema.invalid-wizard", `Wizard "${config.id}" stages must be an array.`, path, address));
        continue;
      }
      const stageIds = new Set<string>();
      const validStages: Array<(typeof config.stages)[number]> = [];
      for (const stage of config.stages) {
        const stageCandidate = stage as unknown;
        if (!isRecord(stageCandidate) || typeof stageCandidate["id"] !== "string" || !Array.isArray(stageCandidate["nodes"])) {
          walk.diagnostics.push(diagnostic("schema.invalid-stage", `Wizard "${config.id}" contains a malformed stage.`, path, address));
          continue;
        }
        const stagePath = [...path, stage.id];
        const stageAddress: NodeAddress = [...address, { kind: "node", id: stage.id }];
        if (!isSafePathSegment(stage.id) || stageIds.has(stage.id)) {
          walk.diagnostics.push(diagnostic("schema.invalid-stage", `Invalid or duplicate stage id \"${stage.id}\".`, stagePath, stageAddress));
          continue;
        }
        stageIds.add(stage.id);
        validStages.push(stage);
      }
      if (config.initialStage !== undefined && !stageIds.has(config.initialStage)) {
        walk.diagnostics.push(diagnostic("schema.wizard-target", `Unknown initial stage \"${config.initialStage}\".`, path, address));
      }
      const stageChildren: NormalizedNode<TValue, TFields, TContext>[] = [];
      const stageBranches: NormalizedBranch<TValue, TFields, TContext>[] = [];
      for (const stage of validStages) {
        const stagePath = [...path, stage.id];
        const stageAddress: NodeAddress = [...address, { kind: "node", id: stage.id }];
        const stageContext = nodeContext(walk.value, walk.context, walk.meta, stagePath, stageAddress);
        try {
          const stageVisible = resolveBoolean(stage.when, stageContext, true);
          if (!stageVisible) continue;
          const stageDisabled = disabled || resolveBoolean(stage.disabled, stageContext, false);
          const normalizedStageNodes = walkNodes(stage.nodes, stagePath, stageAddress, stageDisabled, stageVisible && visible, walk);
          stageChildren.push(...normalizedStageNodes);
          stageBranches.push({
            kind: "stage",
            id: stage.id,
            path: stagePath,
            address: stageAddress,
            visible: stageVisible && visible,
            disabled: stageDisabled,
            children: normalizedStageNodes,
          });
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          walk.diagnostics.push(diagnostic("schema.resolver-failed", `Resolver for stage \"${stage.id}\" failed: ${detail}`, stagePath, stageAddress));
        }
      }
      children = stageChildren;
      branches = stageBranches;
    }

    normalized.push({ config, path, address, visible, disabled, props, children, branches });
  }

  return normalized;
}

export function evaluateSchema<TValue, TFields, TContext>(
  options: EvaluateSchemaOptions<TValue, TFields, TContext>,
): EvaluatedSchema<TValue, TFields, TContext> {
  const diagnostics: Diagnostic[] = [];
  let schema: StagesSchema<TValue, TFields, TContext>;

  try {
    schema = typeof options.schema === "function"
      ? options.schema({ value: options.value, context: options.context, meta: options.meta })
      : options.schema;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new TypeError(`Schema factory failed: ${detail}`);
  }

  if (!isRecord(schema)) throw new TypeError("Schema factory must return an object.");
  if (typeof schema.id !== "string" || !isSafePathSegment(schema.id)) {
    diagnostics.push(diagnostic("schema.unsafe-id", `Unsafe schema id \"${schema.id}\".`));
  }
  if (!Number.isSafeInteger(schema.version) || schema.version < 1) {
    diagnostics.push(diagnostic("schema.invalid-version", "Schema version must be a positive safe integer."));
  }

  const rootBehaviorValid = validateBehavior(schema, diagnostics, [], []);
  const nodes = Array.isArray(schema.nodes) ? walkNodes(schema.nodes, [], [], false, true, {
    value: options.value,
    context: options.context,
    meta: options.meta,
    fields: options.fields,
    diagnostics,
    collectionKeys: options.collectionKeys ?? new Map(),
  }) : [];
  if (!Array.isArray(schema.nodes)) diagnostics.push(diagnostic("schema.invalid-nodes", "Schema nodes must be an array."));

  return {
    schema: rootBehaviorValid ? schema : { ...schema, transforms: [], validators: [] },
    nodes,
    diagnostics,
  };
}

export function initialFieldValue(definition: FieldDefinition<unknown, unknown, unknown>): unknown {
  return typeof definition.initialValue === "function"
    ? (definition.initialValue as () => unknown)()
    : definition.initialValue;
}
