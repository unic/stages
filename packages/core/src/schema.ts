import { getAtPath, isSafePathSegment } from "./path.js";
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
  return typeof resolver === "function" ? resolver(context) : resolver ?? fallback;
}

function hasField(fields: unknown, name: string): boolean {
  return fields !== null && typeof fields === "object" && Object.prototype.hasOwnProperty.call(fields, name);
}

interface WalkContext<TValue, TFields, TContext> {
  readonly value: DeepReadonly<TValue>;
  readonly context: DeepReadonly<TContext>;
  readonly meta: DynamicMetaSnapshot;
  readonly fields: TFields;
  readonly diagnostics: Diagnostic[];
}

function walkNodes<TValue, TFields, TContext>(
  configs: readonly NodeConfig<TValue, TFields, TContext>[],
  parentPath: DataPath,
  parentAddress: NodeAddress,
  parentDisabled: boolean,
  walk: WalkContext<TValue, TFields, TContext>,
): readonly NormalizedNode<TValue, TFields, TContext>[] {
  const siblingIds = new Set<string>();
  const normalized: NormalizedNode<TValue, TFields, TContext>[] = [];

  for (const config of configs) {
    const path = [...parentPath, config.id];
    const address: NodeAddress = [...parentAddress, { kind: "node", id: config.id }];

    if (!isSafePathSegment(config.id)) {
      walk.diagnostics.push(diagnostic("schema.unsafe-id", `Unsafe node id \"${config.id}\".`, path, address));
      continue;
    }
    if (siblingIds.has(config.id)) {
      walk.diagnostics.push(diagnostic("schema.duplicate-id", `Duplicate sibling id \"${config.id}\".`, path, address));
      continue;
    }
    siblingIds.add(config.id);

    const resolverContext = nodeContext(walk.value, walk.context, walk.meta, path, address);
    let visible = true;
    let disabled = parentDisabled;
    let props: Readonly<Record<string, unknown>> = {};

    try {
      visible = resolveBoolean(config.when, resolverContext, true);
      disabled = parentDisabled || resolveBoolean(config.disabled, resolverContext, false);
      if (config.kind === "field") {
        props = { ...(config.props as Readonly<Record<string, unknown>> | undefined) };
        if (config.deriveProps !== undefined) props = { ...props, ...config.deriveProps(resolverContext) };
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      walk.diagnostics.push(diagnostic("schema.resolver-failed", `Resolver for \"${config.id}\" failed: ${detail}`, path, address));
      continue;
    }

    if (!visible) continue;

    let children: readonly NormalizedNode<TValue, TFields, TContext>[] = [];
    if (config.kind === "field") {
      if (!hasField(walk.fields, config.type)) {
        walk.diagnostics.push(diagnostic("schema.unknown-field", `Unknown field type \"${config.type}\".`, path, address));
        continue;
      }
    } else if (config.kind === "group") {
      children = walkNodes(config.nodes, path, address, disabled, walk);
    } else if (config.kind === "collection") {
      const runtimeConfig = config as Readonly<{
        nodes?: readonly NodeConfig<TValue, TFields, TContext>[];
        variants?: Readonly<Record<string, { readonly nodes: readonly NodeConfig<TValue, TFields, TContext>[] }>>;
      }>;
      const hasNodes = Array.isArray(runtimeConfig.nodes);
      const hasVariants = runtimeConfig.variants !== undefined;
      if (hasNodes === hasVariants) {
        walk.diagnostics.push(diagnostic("schema.collection-shape", `Collection \"${config.id}\" must define exactly one of nodes or variants.`, path, address));
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
      if (config.discriminator !== undefined && !isSafePathSegment(config.discriminator)) {
        walk.diagnostics.push(diagnostic("schema.unsafe-discriminator", `Unsafe discriminator \"${config.discriminator}\".`, path, address));
      }
      if (config.variants !== undefined) {
        for (const variantName of Object.keys(config.variants)) {
          if (!isSafePathSegment(variantName)) {
            walk.diagnostics.push(diagnostic("schema.unsafe-variant", `Unsafe variant \"${variantName}\".`, path, address));
          }
        }
      }
      const rows = Array.isArray(collectionValue) ? collectionValue : [];
      const rowKeys = new Set<string>();
      const rowChildren: NormalizedNode<TValue, TFields, TContext>[] = [];
      rows.forEach((row, index) => {
        let rowKey = String(index);
        try {
          rowKey = config.itemKey?.(row, index) ?? rowKey;
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
        rowChildren.push(...walkNodes(rowNodes ?? [], [...path, index], rowAddress, disabled, walk));
      });
      children = rowChildren;
    } else {
      const stageIds = new Set<string>();
      for (const stage of config.stages) {
        const stagePath = [...path, stage.id];
        const stageAddress: NodeAddress = [...address, { kind: "node", id: stage.id }];
        if (!isSafePathSegment(stage.id) || stageIds.has(stage.id)) {
          walk.diagnostics.push(diagnostic("schema.invalid-stage", `Invalid or duplicate stage id \"${stage.id}\".`, stagePath, stageAddress));
        }
        stageIds.add(stage.id);
      }
      if (config.initialStage !== undefined && !stageIds.has(config.initialStage)) {
        walk.diagnostics.push(diagnostic("schema.wizard-target", `Unknown initial stage \"${config.initialStage}\".`, path, address));
      }
      const stageChildren: NormalizedNode<TValue, TFields, TContext>[] = [];
      for (const stage of config.stages) {
        if (!isSafePathSegment(stage.id)) continue;
        const stagePath = [...path, stage.id];
        const stageAddress: NodeAddress = [...address, { kind: "node", id: stage.id }];
        const stageContext = nodeContext(walk.value, walk.context, walk.meta, stagePath, stageAddress);
        try {
          const stageVisible = resolveBoolean(stage.when, stageContext, true);
          if (!stageVisible) continue;
          const stageDisabled = disabled || resolveBoolean(stage.disabled, stageContext, false);
          stageChildren.push(...walkNodes(stage.nodes, stagePath, stageAddress, stageDisabled, walk));
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          walk.diagnostics.push(diagnostic("schema.resolver-failed", `Resolver for stage \"${stage.id}\" failed: ${detail}`, stagePath, stageAddress));
        }
      }
      children = stageChildren;
    }

    normalized.push({ config, path, address, visible, disabled, props, children });
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

  if (!isSafePathSegment(schema.id)) {
    diagnostics.push(diagnostic("schema.unsafe-id", `Unsafe schema id \"${schema.id}\".`));
  }
  if (!Number.isSafeInteger(schema.version) || schema.version < 1) {
    diagnostics.push(diagnostic("schema.invalid-version", "Schema version must be a positive safe integer."));
  }

  const nodes = walkNodes(schema.nodes, [], [], false, {
    value: options.value,
    context: options.context,
    meta: options.meta,
    fields: options.fields,
    diagnostics,
  });

  return { schema, nodes, diagnostics };
}

export function initialFieldValue(definition: FieldDefinition<unknown, unknown, unknown>): unknown {
  return typeof definition.initialValue === "function"
    ? (definition.initialValue as () => unknown)()
    : definition.initialValue;
}
