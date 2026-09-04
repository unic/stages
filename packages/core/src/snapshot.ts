import { addressKey } from "./address.js";
import { deepEqual } from "./equality.js";
import { getFieldDefinition } from "./fields.js";
import { getAtPath, pathsEqual } from "./path.js";
import { initialFieldValue, type NormalizedBranch, type NormalizedNode } from "./schema.js";
import type {
  ContainerSnapshot,
  FieldSnapshot,
  RenderNodeSnapshot,
  ValidationIssue,
  ValidationSnapshot,
} from "./types.js";

export const emptyValidation: ValidationSnapshot = {
  status: "unknown",
  isValid: false,
  issues: [],
  visibleIssues: [],
  pendingCount: 0,
  unknownCount: 1,
};

export interface SnapshotInteractionState {
  readonly focused: Readonly<{ has(value: string): boolean }>;
  readonly touched: Readonly<{ has(value: string): boolean }>;
  readonly visited: Readonly<{ has(value: string): boolean }>;
  readonly activeWizards: ReadonlyMap<string, string>;
}

export interface SnapshotNodeOptions<TValue, TFields, TContext> {
  readonly nodes: readonly NormalizedNode<TValue, TFields, TContext>[];
  readonly value: TValue;
  readonly baseline: TValue;
  readonly fields: TFields;
  readonly interaction: SnapshotInteractionState;
  readonly issues: readonly ValidationIssue[];
  readonly visibleIssues: readonly ValidationIssue[];
  readonly validationByAddress: ReadonlyMap<string, ValidationSnapshot>;
  readonly previousNodes: readonly RenderNodeSnapshot[];
}

function indexSnapshotNodes(
  nodes: readonly RenderNodeSnapshot[],
  index = new Map<string, RenderNodeSnapshot>(),
): ReadonlyMap<string, RenderNodeSnapshot> {
  for (const node of nodes) {
    index.set(addressKey(node.address), node);
    if (node.kind !== "field") indexSnapshotNodes(node.nodes, index);
  }
  return index;
}

function shareSnapshotNode(
  next: RenderNodeSnapshot,
  previous: ReadonlyMap<string, RenderNodeSnapshot>,
): RenderNodeSnapshot {
  const previousNode = previous.get(addressKey(next.address));
  if (next.kind === "field") return previousNode !== undefined && deepEqual(previousNode, next) ? previousNode : next;

  const sharedChildren = next.nodes.map((node) => shareSnapshotNode(node, previous));
  const candidate: ContainerSnapshot = sharedChildren.every((node, index) => node === next.nodes[index])
    ? next
    : { ...next, nodes: sharedChildren };
  return previousNode !== undefined && deepEqual(previousNode, candidate) ? previousNode : candidate;
}

function mapSnapshotNode<TValue, TFields, TContext>(
  node: NormalizedNode<TValue, TFields, TContext>,
  value: TValue,
  baseline: TValue,
  fields: TFields,
  interaction: SnapshotInteractionState,
  issues: readonly ValidationIssue[],
  visibleIssues: readonly ValidationIssue[],
  validationByAddress: ReadonlyMap<string, ValidationSnapshot>,
): RenderNodeSnapshot {
  const key = addressKey(node.address);
  const nodeIssues = issues.filter((issue) => pathsEqual(issue.path, node.path));
  const nodeVisibleIssues = visibleIssues.filter((issue) => pathsEqual(issue.path, node.path));
  if (node.config.kind === "field") {
    const definition = getFieldDefinition(fields, node.config.type);
    const currentValue = getAtPath(value, node.path);
    const baselineValue = getAtPath(baseline, node.path);
    const initialValue = baselineValue === undefined && definition !== undefined
      ? initialFieldValue(definition)
      : baselineValue;
    const snapshot: FieldSnapshot = {
      kind: "field",
      id: node.config.id,
      type: node.config.type,
      view: definition?.view,
      path: node.path,
      address: node.address,
      value: currentValue,
      initialValue,
      props: node.props,
      state: {
        disabled: node.disabled,
        visible: node.visible,
        focused: interaction.focused.has(key),
        touched: interaction.touched.has(key),
        dirty: !deepEqual(currentValue, initialValue),
        validating: (validationByAddress.get(key)?.pendingCount ?? 0) > 0,
        issues: nodeIssues,
        visibleIssues: nodeVisibleIssues,
      },
    };
    return snapshot;
  }
  const snapshot: ContainerSnapshot = {
    kind: node.config.kind,
    id: node.config.id,
    path: node.path,
    address: node.address,
    state: { disabled: node.disabled, visible: node.visible },
    nodes: node.branches.length > 0
      ? node.branches
        .filter((branch) => branch.visible)
        .map((branch) => mapSnapshotBranch(
          branch,
          value,
          baseline,
          fields,
          interaction,
          issues,
          visibleIssues,
          validationByAddress,
          node.config.kind === "wizard"
            ? interaction.activeWizards.get(addressKey(node.address)) === branch.id
            : undefined,
        ))
      : node.children
        .filter((child) => child.visible)
        .map((child) => mapSnapshotNode(child, value, baseline, fields, interaction, issues, visibleIssues, validationByAddress)),
    validation: validationByAddress.get(key) ?? emptyValidation,
    ...(node.config.kind === "collection" ? {
      size: Array.isArray(getAtPath(value, node.path)) ? (getAtPath(value, node.path) as readonly unknown[]).length : 0,
      canAdd: !node.disabled && (node.config.max === undefined || node.branches.length < node.config.max),
      canRemove: !node.disabled && (node.config.min === undefined || node.branches.length > node.config.min),
    } : {}),
    ...(node.config.kind === "wizard" ? (() => {
      const visibleStages = node.branches.filter((branch) => branch.visible);
      const activeStage = interaction.activeWizards.get(addressKey(node.address)) ?? visibleStages[0]?.id;
      const activeIndex = visibleStages.findIndex((branch) => branch.id === activeStage);
      return {
        ...(activeStage === undefined ? {} : { activeStage }),
        visibleStageIds: visibleStages.map((branch) => branch.id),
        canPrevious: !node.disabled && activeIndex > 0,
        canNext: !node.disabled && activeIndex >= 0 && activeIndex < visibleStages.length - 1,
        canGo: !node.disabled && node.config.navigation?.nonLinear === true,
      };
    })() : {}),
  };
  return snapshot;
}

function mapSnapshotBranch<TValue, TFields, TContext>(
  branch: NormalizedBranch<TValue, TFields, TContext>,
  value: TValue,
  baseline: TValue,
  fields: TFields,
  interaction: SnapshotInteractionState,
  issues: readonly ValidationIssue[],
  visibleIssues: readonly ValidationIssue[],
  validationByAddress: ReadonlyMap<string, ValidationSnapshot>,
  active: boolean | undefined,
): ContainerSnapshot {
  return {
    kind: branch.kind,
    id: branch.id,
    path: branch.path,
    address: branch.address,
    state: { disabled: branch.disabled, visible: branch.visible },
    nodes: branch.children
      .filter((child) => child.visible)
      .map((child) => mapSnapshotNode(child, value, baseline, fields, interaction, issues, visibleIssues, validationByAddress)),
    validation: validationByAddress.get(addressKey(branch.address)) ?? emptyValidation,
    ...(active === undefined ? {} : { active }),
  };
}

export function buildSnapshotNodes<TValue, TFields, TContext>(
  options: SnapshotNodeOptions<TValue, TFields, TContext>,
): readonly RenderNodeSnapshot[] {
  const previous = indexSnapshotNodes(options.previousNodes);
  return options.nodes
    .filter((node) => node.visible)
    .map((node) => mapSnapshotNode(
      node,
      options.value,
      options.baseline,
      options.fields,
      options.interaction,
      options.issues,
      options.visibleIssues,
      options.validationByAddress,
    ))
    .map((node) => shareSnapshotNode(node, previous));
}
