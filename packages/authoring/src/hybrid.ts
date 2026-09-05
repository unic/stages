import { orderedPortableTransforms } from './compiler/computed.js';
import type { StagesSchemaInput, TransformConfig, ValidatorConfig, DerivedProps, WizardNavigationConfig, NodeConfig, NodePredicate } from '@stages/core';
import type { LoadedPortableForm } from './portable.js';
import type { CompiledStudioForm, StudioFieldRegistry } from './compiler/types.js';

export interface PortableNodeComposition {
  /** Additional display conditions: visibility combines with AND, disabled state with OR. */
  readonly when?: NodePredicate<unknown, unknown>;
  readonly disabled?: NodePredicate<unknown, unknown>;
  readonly validators?: readonly ValidatorConfig<unknown, unknown>[];
  readonly transforms?: readonly TransformConfig<unknown, unknown>[];
  /** Field-only; merged after declarative derived props. */
  readonly deriveProps?: DerivedProps<unknown, unknown>;
  /** Wizard-only. Competing navigation guards are rejected. */
  readonly navigation?: WizardNavigationConfig<unknown>;
}

export interface PortableComposition {
  /** Immutable deployment identity for these host semantics; must differ from the source schema ID. */
  readonly schemaId: string;
  readonly schemaVersion: number;
  /** Appended after portable rules. Validator IDs may not shadow existing rules. Dependencies use core paths. */
  readonly validators?: readonly ValidatorConfig<unknown, unknown>[];
  readonly transforms?: readonly TransformConfig<unknown, unknown>[];
  /** Scoped by document node UID; collection templates apply to every matching occurrence. */
  readonly nodes?: Readonly<Record<string, PortableNodeComposition>>;
}

/** Compose trusted JS rules without mutating the artifact or bypassing dynamic schema factories. */
export function composePortableForm(loaded: LoadedPortableForm, composition: PortableComposition): LoadedPortableForm {
  if (!composition.schemaId.trim() || composition.schemaId === loaded.schema.id || !Number.isSafeInteger(composition.schemaVersion) || composition.schemaVersion < 1) {
    throw new Error('Hybrid composition requires a distinct deployment schema ID and a positive integer version.');
  }
  return extendPortableForm(loaded, composition);
}

export function extendPortableForm<T extends CompiledStudioForm>(loaded: T, composition: PortableComposition): T {
  const append = <T extends { readonly id: string }>(portable: readonly T[] = [], custom: readonly T[] = []): readonly T[] => {
    const ids = new Set<string>();
    return Object.freeze([...portable, ...custom].map(rule => {
      if (ids.has(rule.id)) throw new Error(`Duplicate hybrid rule ID ${rule.id}.`);
      ids.add(rule.id);
      return rule;
    }));
  };
  const validators = append(loaded.schema.validators, composition.validators);
  const transforms = Object.freeze(orderedPortableTransforms([...(loaded.schema.transforms ?? []), ...(composition.transforms ?? [])]));
  const scoped = new Map<string, PortableNodeComposition>();
  for (const [uid, rules] of Object.entries(composition.nodes ?? {})) {
    const entry = [...loaded.sourceMap.byUid.values()].find(item => item.uid === uid);
    const node = loaded.expandedForm.nodes[uid as keyof typeof loaded.expandedForm.nodes];
    if (!entry || !node || node.kind === 'block' || node.kind === 'stage' || node.kind === 'variant') throw new Error(`Unknown or unsupported scoped node ${uid}.`);
    if (rules.deriveProps && node.kind !== 'field') throw new Error(`Derived props require a field: ${uid}.`);
    if (rules.navigation && node.kind !== 'wizard') throw new Error(`Navigation requires a wizard: ${uid}.`);
    scoped.set(JSON.stringify([entry.runtimePath, (entry.variants ?? []).map(item => item.variantId)]), rules);
  }
  const visit = (nodes: readonly NodeConfig<unknown, StudioFieldRegistry>[], parent: readonly string[] = [], variants: readonly string[] = []): readonly NodeConfig<unknown, StudioFieldRegistry>[] => nodes.map(node => {
    const path = [...parent, node.id];
    const rules = scoped.get(JSON.stringify([path, variants]));
    const common = { ...node,
      ...(rules?.when ? { when: (context: Parameters<NonNullable<PortableNodeComposition['when']>>[0]) => (typeof node.when === 'function' ? node.when(context) : node.when !== false) && rules.when!(context) } : {}),
      ...(rules?.disabled ? { disabled: (context: Parameters<NonNullable<PortableNodeComposition['disabled']>>[0]) => (typeof node.disabled === 'function' ? node.disabled(context) : node.disabled === true) || rules.disabled!(context) } : {}),
      ...(rules?.validators ? { validators: append(node.validators, rules.validators) } : {}),
      ...(rules?.transforms ? { transforms: [...(node.transforms ?? []), ...rules.transforms] } : {}),
    };
    if (common.kind === 'field') return rules?.deriveProps ? { ...common, deriveProps: context => ({ ...common.deriveProps?.(context), ...rules.deriveProps!(context) }) } : common;
    if (common.kind === 'group') return { ...common, nodes: visit(common.nodes, path, variants) };
    if (common.kind === 'collection') return common.nodes !== undefined
      ? { ...common, nodes: visit(common.nodes, path, variants) }
      : { ...common, variants: Object.fromEntries(Object.entries(common.variants).map(([id, variant]) => [id, { ...variant, nodes: visit(variant.nodes, path, [...variants, id]) }])) };
    if (rules?.navigation?.guard && common.navigation?.guard) throw new Error(`Conflicting navigation guard at ${path.join('.')}.`);
    return { ...common, ...(rules?.navigation ? { navigation: { ...common.navigation, ...rules.navigation } } : {}), stages: common.stages.map(stage => ({ ...stage, nodes: visit(stage.nodes, [...path, stage.id], variants) })) };
  });
  const extend = (schema: typeof loaded.schema): typeof loaded.schema => ({ ...schema, id: composition.schemaId, version: composition.schemaVersion, validators, transforms, nodes: visit(schema.nodes) });
  const original = loaded.schemaInput;
  const schema = extend(loaded.schema);
  const schemaInput: StagesSchemaInput<unknown, StudioFieldRegistry, unknown> = typeof original === 'function'
    ? context => extend(original(context)) : schema;
  return { ...loaded, schema, schemaInput };
}
