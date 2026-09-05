import { StudioBulkInspector } from "./StudioBulkInspector";
import { StudioDesignFeatures, StudioDesignLegend } from "./StudioDesignFeatures";
import { StudioHelp } from "./StudioHelp";
import { StudioChoiceOptionsEditor } from "./StudioChoiceOptionsEditor";
import { STUDIO_DEMO_PROJECTS } from "./studioDemoProjects";
import { Monitor, Smartphone, Tablet, ArrowDown, ArrowUp, Copy, FlaskConical, History, RotateCcw, Trash2, TriangleAlert, ArrowDownToLine, ArrowUpFromLine, Braces, Eye, FolderOpen, GitBranch, Languages, Layers, LayoutGrid, LockKeyhole, MousePointer2, Plus, Redo2, Save, ShieldCheck, SlidersHorizontal, Undo2, X } from "lucide-react";
import { Switch as SwitchPrimitive } from "radix-ui";
import { StudioCanvasChrome } from "./StudioCanvasChrome";
import { EditorTooltip, InspectorSection, StudioItemIcon, StudioLayoutControl } from "./StudioInspectorControls";
import { fieldEvent, formEvent, getAtPath, nodeEvent, type ContainerSnapshot, type DataPath, type RenderNodeSnapshot, type StagesChange, type StagesEvent } from "@stages/core";
import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, type MouseEvent, type KeyboardEvent, type ReactNode } from "react";
import { canPlaceStudioNode } from "../../src/commands/engine";
import {
  createStudioHistory,
  dispatchStudioCommand,
  isStudioHistoryDirty,
  markStudioHistorySaved,
  redoStudioHistory,
  undoStudioHistory,
} from "../../src/commands/history";
import type { StudioHistoryState } from "../../src/commands/types";
import { createEmptyStudioScenarioValue } from "../../src/compiler/compiler";
import { createStudioCompilerSession } from "../../src/compiler/session";
import type { CompiledStudioForm, StudioDiagnostic, StudioRenderNode, StudioRuntimeRenderNode } from "../../src/compiler/types";
import { isSafeObjectKey, toUid } from "../../src/document/uid";
import { validateStudioProject } from "../../src/document/validation";
import { isStudioVariantCollection, type JsonObject, type JsonValue, type StudioEventDefinition, type StudioFieldNode, type StudioFormDocument, type StudioFragmentDefinition, type StudioFragmentInstanceNode, type StudioLogicRule, type StudioNode, type StudioProjectDocument, type StudioResourceCatalog, type StudioScenario, type StudioValidatorSpec, type Uid } from "../../src/document/types";
import type { StudioExpression, StudioExpressionContext } from "../../src/expressions/types";
import { evaluateStudioExpression } from "../../src/expressions/evaluator";
import {
  STUDIO_FIELD_DEFINITIONS,
  STUDIO_BLOCK_DEFINITIONS,
  createStudioBlockNode,
  createStudioFieldNode,
  studioBlockDefinition,
  studioFieldDefinition,
  studioLayout,
  studioPresentationLayout,
  type StudioBreakpoint,
  type StudioWidth,
  validateStudioFieldProps,
  type AnyStudioAuthoringFieldDefinition,
  type StudioBlockDefinition,
  type StudioPropControl,
  STUDIO_PREVIEW_ASYNC_SERVICE_BINDINGS,
  STUDIO_PREVIEW_CODEC_BINDINGS,
  STUDIO_PREVIEW_SERVICE_EXTENSION,
  type StudioCodecBindings,
  studioPreviewServiceExtensions,
} from "../../src/registry";
import { createIndexedDbProjectRepository } from "../../src/platform/indexeddb-project-repository";
import { StudioProjectConflictError } from "../../src/projects/types";
import type { StudioProjectRecoverySummary, StudioProjectRepository, StudioProjectSnapshot, StudioProjectSummary } from "../../src/projects/types";
import { generateStudioExportBundle, importStudioProject, type StudioGeneratedArtifact } from "../../src/projects/artifacts";
import { createStudioAutosave } from "../../src/projects/autosave";
import { LEGACY_STUDIO_STORAGE_KEY, previewLegacyStudioStorage, type LegacyStudioStoragePreview } from "../../src/projects/legacy-local-storage";
import { copyStudioProject, projectUidFromRandomId } from "../../src/projects/workflows";
import { serializeStudioProject } from "../../src/document/serialization";
import { createStudioPreviewHost } from "../../src/runtime/preview-host";
import { useStudioPreviewHost } from "../../src/runtime/use-studio-preview-host";
import { createStudioSupportReport, filterAndGroupStudioProblems, inspectStudioRuntime, type StudioProblem, type StudioProblemGroupBy } from "../../src/runtime/observability";
import { focusFirstVisibleValidationError, inspectStudioValidation } from "../../src/validation/inspection";
import { formatStudioFieldValue, resolveStudioMessage, studioScenarioLocale } from "../../src/localization";
import {
  createStudioWorkbenchState,
  clearStudioSelection,
  createStudioOutlineModel,
  reconcileStudioWorkbench,
  revealStudioUid,
  selectStudioUid,
  locateStudioNode,
  type StudioSelectionOptions,
  type StudioDropPosition,
  visibleStudioOutlineUids,
} from "../../src/editor";
import { Button } from "../ui/button";
import { useStudioDocumentStartup } from "./StudioDocumentStartup";
import { importStudioLegacyInput, STUDIO_SUPPORTED_DEFINITIONS } from "./StudioLegacyImport";
import { StudioProjectPanel } from "./StudioProjectPanel";
import { StudioOutline } from "./StudioOutline";
import { StudioInsertContextMenu, StudioNodeContextMenu, type StudioContextMenuPosition, type StudioInsertMenuItem } from "./StudioNodeContextMenu";
import { StudioExpressionEditor, type StudioExpressionReferenceOption } from "./StudioExpressionEditor";
import { StudioValidationEditor } from "./StudioValidationEditor";
import { StudioEventEditor, StudioLogicEditor } from "./StudioLogicEditor";
import {
  createStudioStructuralActions,
  type StudioEditorNavigationState,
} from "./studioStructuralActions";

const PreviewTestDetailsContext = createContext(false);
const DesignNodesContext = createContext<StudioFormDocument["nodes"] | undefined>(undefined);

interface StudioV1EditorProps {
  readonly repository?: StudioProjectRepository;
}

function firstForm(project: StudioHistoryState["present"]): StudioFormDocument | undefined {
  return Object.values(project.forms)[0];
}

function platformErrorMessage(error: unknown, fallback: string): string {
  return typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
    ? error.message
    : fallback;
}

function nextField(form: StudioFormDocument, definition: AnyStudioAuthoringFieldDefinition): StudioFieldNode {
  let suffix = 1;
  let uid = toUid(`field_${definition.key}`);
  let runtimeId: string = definition.key;
  const runtimeIds = new Set(Object.values(form.nodes).flatMap((node) => node.kind === "block" ? [] : [node.runtimeId]));
  while (form.nodes[uid] !== undefined || runtimeIds.has(runtimeId)) {
    suffix += 1;
    uid = toUid(`field_${definition.key}_${suffix}`);
    runtimeId = `${definition.key}${suffix}`;
  }
  const node = createStudioFieldNode(definition, { uid, runtimeId });
  return { ...node, props: { ...node.props, label: definition.displayName } };
}

function nextBlock(form: StudioFormDocument, definition: StudioBlockDefinition) {
  const stem = definition.key.slice("block:".length);
  let suffix = 1;
  let uid = toUid(`block_${stem}`);
  while (form.nodes[uid] !== undefined) {
    suffix += 1;
    uid = toUid(`block_${stem}_${suffix}`);
  }
  return createStudioBlockNode(definition, uid);
}

function nextStructuralIdentity(form: StudioFormDocument, stem: string): { readonly uid: Uid; readonly runtimeId: string } {
  const runtimeIds = new Set(Object.values(form.nodes).flatMap((node) => node.kind === "block" ? [] : [node.runtimeId]));
  let suffix = 1;
  let uid = toUid(stem);
  let runtimeId = stem;
  while (form.nodes[uid] !== undefined || runtimeIds.has(runtimeId)) {
    suffix += 1;
    uid = toUid(`${stem}_${suffix}`);
    runtimeId = `${stem}${suffix}`;
  }
  return { uid, runtimeId };
}

function nextProjectUid(project: StudioProjectDocument, stem: string): Uid {
  const used = new Set<string>([
    project.project.uid,
    ...Object.keys(project.forms),
    ...Object.keys(project.fragments),
    ...Object.values(project.forms).flatMap((form) => Object.keys(form.nodes)),
    ...Object.values(project.forms).flatMap((form) => form.scenarios.map(({ uid }) => uid)),
    ...Object.values(project.fragments).flatMap((fragment) => Object.keys(fragment.nodes)),
  ]);
  const safeStem = stem.replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 118) || "entity";
  let suffix = 1;
  let uid = toUid(safeStem);
  while (used.has(uid)) uid = toUid(`${safeStem}_${++suffix}`);
  return uid;
}

function keyedOccurrences<T>(values: readonly T[], identity: (value: T) => string): readonly { readonly key: string; readonly value: T }[] {
  const counts = new Map<string, number>();
  return values.map((value) => {
    const base = identity(value);
    const occurrence = (counts.get(base) ?? 0) + 1;
    counts.set(base, occurrence);
    return { key: `${base}:${occurrence}`, value };
  });
}

function nodeDisplayLabel(node: StudioNode): string {
  const configured = (node.kind === "field" || node.kind === "block" ? node.props["label"] ?? node.props["text"] : undefined)
    ?? node.presentation?.["label"];
  if (typeof configured === "string" && configured.length > 0) return configured;
  return node.kind === "block" ? node.definition.key : node.runtimeId;
}

function nodeLabel(form: StudioFormDocument, uid: Uid): string {
  const node = form.nodes[uid];
  return node === undefined ? uid : nodeDisplayLabel(node);
}

function expressionReferences(form: StudioFormDocument): readonly StudioExpressionReferenceOption[] {
  const output: StudioExpressionReferenceOption[] = [];
  const seen = new Set<string>();
  const add = (scope: StudioExpressionReferenceOption["scope"], path: readonly string[], label: string) => {
    const key = `${scope}:${path.join(".")}`;
    if (path.length > 0 && !seen.has(key)) {
      seen.add(key);
      output.push({ scope, path, label });
    }
  };
  for (const node of Object.values(form.nodes)) {
    if (node.kind === "field") {
      add("value", [node.runtimeId], nodeDisplayLabel(node));
      add("row", [node.runtimeId], `${nodeDisplayLabel(node)} in current row`);
    }
  }
  const walk = (scope: "context" | "extension", value: unknown, path: readonly string[] = []) => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return;
    for (const [key, child] of Object.entries(value)) {
      if (!isSafeObjectKey(key)) continue;
      const next = [...path, key];
      add(scope, next, next.join("."));
      walk(scope, child, next);
    }
  };
  for (const scenario of form.scenarios) {
    walk("context", scenario.context);
    walk("extension", scenario.extensions);
  }
  for (const key of ["revision", "isDirty", "touched", "visited", "activeWizards"]) add("metadata", [key], key);
  return output;
}

interface AuthoringCanvasBindings {
  readonly breakpoint: StudioBreakpoint;
  readonly sourceNodes: ReadonlyMap<Uid, StudioNode>;
  readonly onWidth: (uid: Uid, width: StudioWidth) => void;
  readonly selectedUids: readonly Uid[];
  readonly selectableUids: ReadonlySet<Uid>;
  readonly onSelect: (uid: Uid, options?: StudioSelectionOptions) => void;
  readonly onDrop: (uid: Uid, targetUid: Uid, position: StudioDropPosition) => void;
  readonly onContextMenu: (uid: Uid, position: StudioContextMenuPosition) => void;
  readonly onInsertContextMenu: (placement: StudioInsertPlacement, position: StudioContextMenuPosition) => void;
  readonly insertBeforeByUid: ReadonlyMap<Uid, StudioInsertPlacement>;
}

interface StudioInsertPlacement {
  readonly parentUid: Uid | null;
  readonly index: number;
  readonly beforeLabel?: string;
}

function writeCanvasDragData(event: DragEvent<HTMLButtonElement>, uid: Uid): void {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("application/x-stages-studio-uid", uid);
  event.stopPropagation();
}

function PreviewLayout({ node, children, authoring }: {
  readonly node: StudioRenderNode;
  readonly children: ReactNode;
  readonly authoring?: AuthoringCanvasBindings;
}) {
  const designNodes = useContext(DesignNodesContext);
  const designNode = authoring?.sourceNodes.get(node.uid) ?? designNodes?.[node.uid];
  const canvasPath = node.kind === "block" ? node.uid : node.runtimePath.map(String).join(".");
  const selectable = authoring?.selectableUids.has(node.uid) === true;
  const selected = selectable && authoring.selectedUids.includes(node.uid);
  const insertBefore = authoring?.insertBeforeByUid.get(node.uid);
  const [dropPosition, setDropPosition] = useState<StudioDropPosition | undefined>();
  const openInsertMenu = (event: MouseEvent<HTMLButtonElement>) => {
    if (insertBefore === undefined || authoring === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    authoring.onInsertContextMenu(insertBefore, {
      x: event.clientX || rect.left + rect.width / 2,
      y: event.clientY || rect.top + rect.height,
    });
  };
  const resolveDropPosition = (event: DragEvent<HTMLDivElement>): StudioDropPosition => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = rect.height === 0 ? 0.5 : (event.clientY - rect.top) / rect.height;
    const acceptsChildren = node.kind === "collection" || node.kind === "group" || node.kind === "stage" || node.kind === "variant" || node.kind === "wizard";
    if (acceptsChildren && offset >= 0.25 && offset <= 0.75) return "inside";
    return offset < 0.5 ? "before" : "after";
  };
  return (
    <div
      className={`studio-v1-preview__layout${designNodes ? " studio-design-node" : ""}${selectable ? " studio-v1-authoring-node" : ""}`}
      data-design-kind={designNodes ? designNode?.kind ?? node.kind : undefined}
      data-authoring-selected={selected || undefined}
      data-drop-position={dropPosition}
      data-canvas-uid={selectable ? node.uid : undefined}
      data-width-mobile={node.layout.width.mobile}
      data-width-tablet={node.layout.width.tablet}
      data-width-desktop={node.layout.width.desktop}
      data-align-mobile={node.layout.align.mobile}
      data-align-tablet={node.layout.align.tablet}
      data-align-desktop={node.layout.align.desktop}
      {...(selectable ? { role: "group", tabIndex: 0, "aria-label": `Select ${node.uid}` } : {})}
      style={{ "--studio-layout-columns-mobile": node.layout.columns.mobile, "--studio-layout-columns-tablet": node.layout.columns.tablet, "--studio-layout-columns-desktop": node.layout.columns.desktop } as CSSProperties}
      onClickCapture={selectable ? (event) => {
        if (!event.shiftKey && !event.metaKey && !event.ctrlKey) return;
        // Nested canvas items own their modifier-click; do not select their container.
        if ((event.target as HTMLElement).closest("[data-canvas-uid]") !== event.currentTarget) return;
        event.preventDefault();
        event.stopPropagation();
        authoring.onSelect(node.uid, { toggle: true });
      } : undefined}
      onClick={selectable ? (event) => {
        event.stopPropagation();
        authoring.onSelect(node.uid, { toggle: event.shiftKey || event.metaKey || event.ctrlKey });
      } : undefined}
      onKeyDown={selectable ? (event) => {
        if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        event.stopPropagation();
        authoring.onSelect(node.uid, { toggle: event.shiftKey || event.metaKey || event.ctrlKey });
      } : undefined}
      onContextMenu={selectable ? (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!selected) authoring.onSelect(node.uid);
        authoring.onContextMenu(node.uid, { x: event.clientX, y: event.clientY });
      } : undefined}
      onDragOver={selectable ? (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "move";
        setDropPosition(resolveDropPosition(event));
      } : undefined}
      onDragLeave={selectable ? (event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropPosition(undefined);
      } : undefined}
      onDrop={selectable ? (event) => {
        event.preventDefault();
        event.stopPropagation();
        const uid = event.dataTransfer.getData("application/x-stages-studio-uid");
        const position = dropPosition ?? resolveDropPosition(event);
        setDropPosition(undefined);
        if (uid && uid !== node.uid) authoring.onDrop(uid as Uid, node.uid, position);
      } : undefined}
    >
      {selectable && insertBefore !== undefined && <button
        type="button"
        className="studio-v1-authoring-insert"
        aria-label={`Insert before ${insertBefore.beforeLabel ?? node.uid}`}
        title="Insert here"
        onClick={openInsertMenu}
        onContextMenu={openInsertMenu}
      ><span aria-hidden="true">+</span></button>}
      {selectable && <button
        type="button"
        className="studio-v1-authoring-node__handle"
        aria-label={`Move ${node.uid}`}
        title="Drag to move"
        draggable
        onClick={(event) => { event.stopPropagation(); authoring.onSelect(node.uid); }}
        onDragStart={(event) => writeCanvasDragData(event, node.uid)}
      >⠿</button>}
      {designNodes && authoring && <StudioCanvasChrome kind={designNode?.kind ?? node.kind} path={canvasPath}
        breakpoint={authoring.breakpoint} width={node.layout.width[authoring.breakpoint]}
        {...(selectable ? { onWidth: (width: StudioWidth) => authoring.onWidth(node.uid, width) } : {})} />}
      {children}
      {designNode && <StudioDesignFeatures node={designNode} />}
    </div>
  );
}

function PreviewBlock({ node, authoring }: { readonly node: Extract<StudioRenderNode, { readonly kind: "block" }>; readonly authoring?: AuthoringCanvasBindings }) {
  const text = String(node.props["text"] ?? node.props["label"] ?? "");
  let content: ReactNode;
  if (node.definition === "block:heading") {
    if (node.props["level"] === "3") content = <h3>{text}</h3>;
    else if (node.props["level"] === "4") content = <h4>{text}</h4>;
    else content = <h2>{text}</h2>;
  } else if (node.definition === "block:message") {
    content = <aside role="note" data-tone={String(node.props["tone"] ?? "info")}>{text}</aside>;
  } else if (node.definition === "block:help") content = <p role="note">{text}</p>;
  else content = <div role="separator">{text}</div>;
  return <PreviewLayout node={node} {...(authoring === undefined ? {} : { authoring })}>{content}</PreviewLayout>;
}

function PreviewDynamicBlock({ form, node, expressionContext, authoring }: {
  readonly form: StudioFormDocument;
  readonly node: Extract<StudioRenderNode, { readonly kind: "block" }>;
  readonly expressionContext: StudioExpressionContext;
  readonly authoring?: AuthoringCanvasBindings;
}) {
  const source = form.nodes[node.uid];
  const present = source?.behavior?.presentWhen === undefined ? undefined : evaluateStudioExpression(source.behavior.presentWhen, expressionContext);
  const visible = source?.behavior?.when === undefined ? undefined : evaluateStudioExpression(source.behavior.when, expressionContext);
  if ((present?.ok && present.value === false) || (visible?.ok && visible.value === false)) return null;
  return <PreviewBlock node={node} {...(authoring === undefined ? {} : { authoring })} />;
}

function PreviewFieldControl({ definition, field, node, currentValue, descriptionId, disabled, invalid, onInput, onBlur, onFocus }: {
  readonly definition: AnyStudioAuthoringFieldDefinition;
  readonly field: StudioFieldNode;
  readonly node: StudioRuntimeRenderNode<"field">;
  readonly currentValue: unknown;
  readonly descriptionId?: string;
  readonly disabled: boolean;
  readonly invalid: boolean;
  readonly onInput: (node: StudioRuntimeRenderNode, value: boolean | number | string) => void;
  readonly onBlur: () => void;
  readonly onFocus: () => void;
}) {
  const common = { className: "ui-input", "aria-describedby": descriptionId, "aria-invalid": invalid || undefined, disabled, onBlur, onFocus };
  if (definition.preview.control === "checkbox") {
    return <input {...common} type="checkbox" checked={Boolean(currentValue)} onChange={(event) => onInput(node, event.currentTarget.checked)} />;
  }
  if (definition.preview.control === "textarea") {
    return <textarea {...common} rows={typeof field.props["rows"] === "number" ? field.props["rows"] : 4} value={String(currentValue)} onChange={(event) => onInput(node, event.currentTarget.value)} />;
  }
  if (definition.preview.control === "select") {
    return <select {...common} value={String(currentValue)} onChange={(event) => onInput(node, event.currentTarget.value)}>
      <option value="">Choose…</option>
      {String(field.props["options"] ?? "").split("\n").map((option) => option.trim()).filter(Boolean).map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>;
  }
  const input = <input
    {...common}
    type={definition.preview.control}
    value={String(currentValue)}
    placeholder={typeof field.props["placeholder"] === "string" ? field.props["placeholder"] : undefined}
    min={typeof field.props["min"] === "number" || typeof field.props["min"] === "string" ? field.props["min"] : undefined}
    max={typeof field.props["max"] === "number" || typeof field.props["max"] === "string" ? field.props["max"] : undefined}
    step={typeof field.props["step"] === "number" ? field.props["step"] : undefined}
    onChange={(event) => onInput(node, definition.value.kind === "number" ? event.currentTarget.valueAsNumber : event.currentTarget.value)}
  />;
  return definition.preview.control === "range" ? <span className="studio-range-control">{input}<output aria-hidden="true">{String(currentValue)}</output></span> : input;
}

function PreviewField({ form, node, snapshot, value, locale, onInput, onBlur, onFocus, authoring }: {
  readonly form: StudioFormDocument;
  readonly node: StudioRuntimeRenderNode<"field">;
  readonly snapshot: Extract<RenderNodeSnapshot, { readonly kind: "field" }>;
  readonly value: unknown;
  readonly locale: string;
  readonly onInput: (node: StudioRuntimeRenderNode, value: boolean | number | string) => void;
  readonly onBlur: () => void;
  readonly onFocus: () => void;
  readonly authoring?: AuthoringCanvasBindings;
}) {
  const field = form.nodes[node.uid];
  if (field?.kind !== "field") return null;
  const definition = studioFieldDefinition(field.definition);
  if (!definition) return null;
  const description = typeof snapshot.props["helpText"] === "string" ? snapshot.props["helpText"] : "";
  const issue = snapshot.state.visibleIssues[0];
  const descriptionId = issue === undefined ? (description.length > 0 ? `${node.uid}-help` : undefined) : `${node.uid}-issue`;
  const currentValue = getAtPath(value, node.runtimePath) ?? definition.value.emptyValue;
  const formatted = field.format === undefined ? undefined : formatStudioFieldValue(currentValue, field.format, locale);
  return <PreviewLayout node={node} {...(authoring === undefined ? {} : { authoring })}><label className={`studio-field${definition.preview.control === "checkbox" ? " studio-field--checkbox" : ""}`}>
    <span>{typeof snapshot.props["label"] === "string" ? snapshot.props["label"] : nodeLabel(form, node.uid)}</span>
    <PreviewFieldControl
      definition={definition}
      field={field}
      node={node}
      currentValue={currentValue}
      disabled={snapshot.state.disabled}
      invalid={issue?.severity === "error"}
      {...(descriptionId === undefined ? {} : { descriptionId })}
      onInput={onInput}
      onBlur={onBlur}
      onFocus={onFocus}
    />
    {issue ? <small id={`${node.uid}-issue`} role="alert">{issue.message ?? issue.code}</small> : descriptionId && <small id={descriptionId}>{description}</small>}
    {formatted !== undefined && <output aria-label={`${nodeLabel(form, node.uid)} localized value`}>{formatted}</output>}
  </label></PreviewLayout>;
}

function previewChildPath(form: StudioFormDocument, parentPath: DataPath, child: StudioRenderNode): DataPath | undefined {
  if (child.kind === "block") return undefined;
  const documentNode = form.nodes[child.uid];
  if (!documentNode || documentNode.kind === "block" || documentNode.kind === "variant") return parentPath;
  return [...parentPath, documentNode.runtimeId];
}

function runtimeIdFor(form: StudioFormDocument, uid: Uid): string | undefined {
  const node = form.nodes[uid];
  return node === undefined || node.kind === "block" ? undefined : node.runtimeId;
}

function findPreviewSnapshot(nodes: readonly RenderNodeSnapshot[], path: DataPath): RenderNodeSnapshot | undefined {
  for (const node of nodes) {
    if (node.path.length === path.length && node.path.every((segment, index) => segment === path[index])) return node;
    if (node.kind !== "field") {
      const nested = findPreviewSnapshot(node.nodes, path);
      if (nested) return nested;
    }
  }
  return undefined;
}

interface PreviewNodeProps {
  readonly form: StudioFormDocument;
  readonly node: StudioRenderNode;
  readonly value: unknown;
  readonly snapshotNodes: readonly RenderNodeSnapshot[];
  readonly runtimePath: DataPath | undefined;
  readonly expressionContext: StudioExpressionContext;
  readonly onInput: (node: StudioRuntimeRenderNode, value: boolean | number | string) => void;
  readonly onStructureEvent: (event: StagesEvent) => void;
  readonly onWizardNavigate: (wizard: ContainerSnapshot, event: StagesEvent, validateCurrent: boolean) => Promise<void>;
  readonly authoring?: AuthoringCanvasBindings;
}

function CollectionRowTestControls({ row, index, size, snapshot, canAdd, canRemove, disabled, onDuplicate, onStructureEvent }: {
  readonly onDuplicate: () => void;
  readonly row: unknown;
  readonly index: number;
  readonly size: number;
  readonly snapshot: ContainerSnapshot;
  readonly canAdd: boolean;
  readonly canRemove: boolean;
  readonly disabled: boolean;
  readonly onStructureEvent: (event: StagesEvent) => void;
}) {
  const showTestDetails = useContext(PreviewTestDetailsContext);
  const [draft, setDraft] = useState(() => JSON.stringify(row, null, 2));
  const [error, setError] = useState("");
  const dispatch = (name: string, payload?: unknown) => onStructureEvent(nodeEvent(name, snapshot.address, payload === undefined ? {} : { payload }));
  const replace = () => {
    try {
      dispatch("collection:replace", { value: JSON.parse(draft) as unknown });
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Replacement must be valid JSON.");
    }
  };
  return <div className="studio-v1-preview__row-tools" aria-label={`Row ${index + 1} test controls`}>
    <div hidden={!showTestDetails}><p><small>Stable row key: <code>{snapshot.id}</code> · current index: {index}</small></p>
    <label className="studio-field"><span>Replacement JSON</span><textarea className="ui-input" rows={3} value={draft} aria-invalid={error.length > 0 || undefined} onChange={(event) => setDraft(event.currentTarget.value)} /></label>
    {error.length > 0 && <small role="alert">{error}</small>}
    <Button variant="outline" size="sm" disabled={disabled} onClick={replace}>Replace row {index + 1}</Button></div>
    <div className="studio-row-actions"><small>Item {index + 1}</small>
    <EditorTooltip label="Duplicate item"><Button variant="ghost" size="icon" aria-label={`Duplicate row ${index + 1}`} disabled={!canAdd} onClick={onDuplicate}><Copy size={14} aria-hidden="true" /></Button></EditorTooltip>
    <EditorTooltip label="Move item up"><Button variant="ghost" size="icon" aria-label={`Move row ${index + 1} up`} disabled={disabled || index === 0} onClick={() => dispatch("collection:move", { to: index - 1 })}><ArrowUp size={14} aria-hidden="true" /></Button></EditorTooltip>
    <EditorTooltip label="Move item down"><Button variant="ghost" size="icon" aria-label={`Move row ${index + 1} down`} disabled={disabled || index === size - 1} onClick={() => dispatch("collection:move", { to: index + 1 })}><ArrowDown size={14} aria-hidden="true" /></Button></EditorTooltip>
    <EditorTooltip label="Remove item"><Button variant="ghost" size="icon" aria-label={`Remove row ${index + 1}`} disabled={!canRemove} onClick={() => dispatch("collection:remove")}><Trash2 size={14} aria-hidden="true" /></Button></EditorTooltip></div>
  </div>;
}

function PreviewCollection(props: PreviewNodeProps & { readonly node: StudioRuntimeRenderNode<"collection">; readonly path: DataPath }) {
  const { form, node, value, snapshotNodes, path, onInput, onStructureEvent, onWizardNavigate } = props;
  const showTestDetails = useContext(PreviewTestDetailsContext);
  const collection = form.nodes[node.uid];
  const snapshot = findPreviewSnapshot(snapshotNodes, path);
  const rows = getAtPath(value, path);
  const values = Array.isArray(rows) ? rows : [];
  const addRow = (variantUid?: Uid) => {
    if (snapshot?.kind !== "collection" || collection?.kind !== "collection") return;
    const variant = variantUid === undefined ? undefined : form.nodes[variantUid];
    const variantId = variant?.kind === "variant" ? variant.runtimeId : undefined;
    if (collection.itemKey?.kind !== "property") {
      onStructureEvent(nodeEvent("collection:add", snapshot.address, variantId === undefined ? {} : { payload: { variant: variantId } }));
      return;
    }
    const childUids = isStudioVariantCollection(collection)
      ? variant?.kind === "variant" ? variant.childUids : []
      : collection.childUids;
    const value = {
      ...createEmptyStudioScenarioValue({ ...form, rootNodeUids: childUids }),
      ...(isStudioVariantCollection(collection) ? { [collection.discriminator]: variantId } : {}),
      [collection.itemKey.property]: crypto.randomUUID(),
    };
    onStructureEvent(nodeEvent("collection:add", snapshot.address, { payload: { value } }));
  };
  const duplicateRow = (row: unknown, index: number, rowSnapshot: ContainerSnapshot) => {
    if (snapshot?.kind !== "collection" || collection?.kind !== "collection") return;
    if (collection.itemKey?.kind === "property" && row !== null && typeof row === "object") {
      const value = { ...structuredClone(row), [collection.itemKey.property]: crypto.randomUUID() };
      onStructureEvent(nodeEvent("collection:add", snapshot.address, { payload: { value, index: index + 1 } }));
    } else onStructureEvent(nodeEvent("collection:duplicate", rowSnapshot.address));
  };
  return <PreviewLayout node={node} {...(props.authoring === undefined ? {} : { authoring: props.authoring })}><div className="studio-v1-preview__collection">
      {!showTestDetails && <p className="studio-collection-label">{nodeLabel(form, node.uid)} <small>{values.length} items</small></p>}
      <p hidden={!showTestDetails}><strong>Collection scope:</strong> {path.join(".")} · size {values.length} · add {snapshot?.kind === "collection" && snapshot.canAdd ? "allowed" : "blocked"} · remove {snapshot?.kind === "collection" && snapshot.canRemove ? "allowed" : "blocked"}</p>
      <div className="studio-v1-preview__collection-actions">
        {collection?.kind === "collection" && isStudioVariantCollection(collection)
          ? collection.variantUids.map((uid) => <button type="button" key={uid} disabled={snapshot?.kind !== "collection" || snapshot.canAdd === false} onClick={() => addRow(uid)}>Add {nodeLabel(form, uid)}</button>)
          : <button type="button" disabled={snapshot?.kind !== "collection" || snapshot.canAdd === false} onClick={() => addRow()}>Add row</button>}
        <button type="button" hidden={!showTestDetails} disabled={snapshot?.kind !== "collection" || snapshot.state.disabled || values.length < 2} onClick={() => snapshot?.kind === "collection" && onStructureEvent(nodeEvent("collection:sort", snapshot.address, { payload: { order: values.map((_, index) => values.length - index - 1) } }))}>Reverse row order</button>
      </div>
      {values.map((row, index) => {
      let children = node.children;
      if (collection?.kind === "collection" && isStudioVariantCollection(collection)) {
        const variantId = row !== null && typeof row === "object" ? (row as Record<string, unknown>)[collection.discriminator] : undefined;
        children = node.children.find((child) => child.kind === "variant" && runtimeIdFor(form, child.uid) === variantId)?.children ?? [];
      }
      const rowPath: DataPath = [...path, index];
      const rowSnapshot = snapshot?.kind === "collection" ? snapshot.nodes.find((candidate) => candidate.kind === "row" && candidate.path.at(-1) === index) : undefined;
      const rowKey = rowSnapshot?.kind === "row" ? rowSnapshot.id : `unavailable-${rowPath.join("\u0000")}`;
      return <div className="studio-v1-preview__row" data-row-index={index} key={rowKey}>{children.map((child) => (
        <PreviewNode key={child.uid} form={form} node={child} value={value} snapshotNodes={snapshotNodes} runtimePath={previewChildPath(form, rowPath, child)} expressionContext={{ ...props.expressionContext, row }} onInput={onInput} onStructureEvent={onStructureEvent} onWizardNavigate={onWizardNavigate} {...(props.authoring === undefined ? {} : { authoring: props.authoring })} />
      ))}{rowSnapshot?.kind === "row" && <CollectionRowTestControls onDuplicate={() => duplicateRow(row, index, rowSnapshot)} row={row} index={index} size={values.length} snapshot={rowSnapshot} canAdd={snapshot?.kind === "collection" && snapshot.canAdd === true} canRemove={snapshot?.kind === "collection" && snapshot.canRemove === true} disabled={snapshot?.kind !== "collection" || snapshot.state.disabled} onStructureEvent={onStructureEvent} />}</div>;
    })}</div></PreviewLayout>;
}

function PreviewWizard(props: PreviewNodeProps & { readonly node: StudioRuntimeRenderNode<"wizard">; readonly path: DataPath }) {
  const showTestDetails = useContext(PreviewTestDetailsContext);
  const { form, node, value, snapshotNodes, path, onInput, onStructureEvent, onWizardNavigate } = props;
  const snapshot = findPreviewSnapshot(snapshotNodes, path);
  const activeStage = snapshot?.kind === "wizard" ? snapshot.activeStage : undefined;
  const stages = activeStage === undefined ? node.children.slice(0, 1) : node.children.filter((child) => runtimeIdFor(form, child.uid) === activeStage);
  const visibleStageIds = snapshot?.kind === "wizard" ? snapshot.visibleStageIds ?? [] : [];
  const visibleStageIdSet = new Set(visibleStageIds);
  const [routeStage, setRouteStage] = useState(activeStage ?? "");
  useEffect(() => { if (activeStage !== undefined) setRouteStage(activeStage); }, [activeStage]);
  const documentWizard = form.nodes[node.uid];
  const navigate = (name: string, target?: string) => snapshot?.kind === "wizard"
    ? void onWizardNavigate(snapshot, nodeEvent(name, snapshot.address, target === undefined ? {} : { payload: target }), documentWizard?.kind === "wizard" && documentWizard.navigation?.validateCurrent === true)
    : undefined;
  return <PreviewLayout node={node} {...(props.authoring === undefined ? {} : { authoring: props.authoring })}><div className="studio-v1-preview__wizard">
      {snapshot?.kind === "wizard" && <nav aria-label={`${nodeLabel(form, node.uid)} stages`}>
        <button type="button" disabled={snapshot.canPrevious !== true} onClick={() => navigate("wizard:previous")}>Previous</button>
        {snapshot.canGo === true && node.children.flatMap((stage) => visibleStageIdSet.has(runtimeIdFor(form, stage.uid) ?? "") ? [<button type="button" key={stage.uid} aria-current={runtimeIdFor(form, stage.uid) === activeStage ? "step" : undefined} onClick={() => navigate("wizard:go", runtimeIdFor(form, stage.uid))}>{nodeLabel(form, stage.uid)}</button>] : [])}
        <button type="button" disabled={snapshot.canNext !== true} onClick={() => navigate("wizard:next")}>Next</button>
      </nav>}
      {snapshot?.kind === "wizard" && <section hidden={!showTestDetails} className="studio-v1-preview__wizard-summary" aria-label={`${nodeLabel(form, node.uid)} scoped summary`}>
        <p><strong>Wizard scope:</strong> {path.join(".")} · active {activeStage ?? "none"} · visible {visibleStageIds.join(", ") || "none"} · validation {snapshot.validation?.status ?? "unknown"}</p>
        <label className="studio-field"><span>Simulated route</span><select value={routeStage} onChange={(event) => setRouteStage(event.currentTarget.value)}>{visibleStageIds.map((stageId) => <option key={stageId} value={stageId}>/{path.map(String).join("/")}/{stageId}</option>)}</select></label>
        <button type="button" disabled={routeStage === activeStage || routeStage === ""} onClick={() => navigate("wizard:go", routeStage)}>Apply simulated route</button>
        <small>Route simulation is adapter-only Test state; it dispatches the same guarded <code>wizard:go</code> command and is not stored in form data.</small>
      </section>}
      {stages.map((child) => (
      <PreviewNode key={child.uid} form={form} node={child} value={value} snapshotNodes={snapshotNodes} runtimePath={previewChildPath(form, path, child)} expressionContext={props.expressionContext} onInput={onInput} onStructureEvent={onStructureEvent} onWizardNavigate={onWizardNavigate} {...(props.authoring === undefined ? {} : { authoring: props.authoring })} />
    ))}</div></PreviewLayout>;
}

function PreviewNode(props: PreviewNodeProps) {
  const { form, node, value, snapshotNodes, runtimePath, expressionContext, onInput, onStructureEvent, onWizardNavigate, authoring } = props;
  if (node.hidden) return null;
  if (node.kind === "block") return <PreviewDynamicBlock form={form} node={node} expressionContext={expressionContext} {...(authoring === undefined ? {} : { authoring })} />;
  const path = runtimePath ?? node.runtimePath;
  const snapshot = findPreviewSnapshot(snapshotNodes, path);
  if (snapshot === undefined || snapshot.state.visible === false) return null;
  if (node.kind === "group") {
    return <PreviewLayout node={node} {...(authoring === undefined ? {} : { authoring })}><fieldset className="studio-v1-preview__group">{node.children.map((child) => (
      <PreviewNode key={child.uid} form={form} node={child} value={value} snapshotNodes={snapshotNodes} runtimePath={previewChildPath(form, path, child)} expressionContext={expressionContext} onInput={onInput} onStructureEvent={onStructureEvent} onWizardNavigate={onWizardNavigate} {...(authoring === undefined ? {} : { authoring })} />
    ))}</fieldset></PreviewLayout>;
  }
  if (node.kind === "collection") return <PreviewCollection {...props} node={node} path={path} />;
  if (node.kind === "wizard") return <PreviewWizard {...props} node={node} path={path} />;
  if (node.kind === "stage" || node.kind === "variant") return <PreviewLayout node={node} {...(authoring === undefined ? {} : { authoring })}><div className={`studio-v1-preview__${node.kind}`}>{node.children.map((child) => (
    <PreviewNode key={child.uid} form={form} node={child} value={value} snapshotNodes={snapshotNodes} runtimePath={previewChildPath(form, path, child)} expressionContext={expressionContext} onInput={onInput} onStructureEvent={onStructureEvent} onWizardNavigate={onWizardNavigate} {...(authoring === undefined ? {} : { authoring })} />
  ))}</div></PreviewLayout>;
  const requestedLocale = expressionContext.context !== null && typeof expressionContext.context === "object"
    ? (expressionContext.context as Readonly<Record<string, unknown>>)["locale"]
    : undefined;
  return snapshot.kind === "field" ? <PreviewField form={form} node={{ ...node, runtimePath: path }} snapshot={snapshot} value={value} locale={typeof requestedLocale === "string" ? requestedLocale : "en"} onInput={onInput} onBlur={() => onStructureEvent(fieldEvent("blur", path, { source: "adapter" }))} onFocus={() => onStructureEvent(fieldEvent("focus", path, { source: "adapter" }))} {...(authoring === undefined ? {} : { authoring })} /> : null;
}

function parseControlDraft(control: StudioPropControl, draft: string | boolean): { readonly ok: true; readonly value: boolean | number | string } | { readonly ok: false; readonly message: string } {
  if (control.control === "checkbox") return typeof draft === "boolean"
    ? { ok: true, value: draft }
    : { ok: false, message: `${control.label} must be true or false.` };
  if (typeof draft !== "string") return { ok: false, message: `${control.label} must be text.` };
  if (control.required && draft.trim().length === 0) return { ok: false, message: `${control.label} is required.` };
  if (control.control !== "number") return { ok: true, value: draft };
  if (draft.trim().length === 0 || !Number.isFinite(Number(draft))) return { ok: false, message: `${control.label} must be a finite number.` };
  const value = Number(draft);
  if (control.min !== undefined && value < control.min) return { ok: false, message: `${control.label} must be at least ${control.min}.` };
  if (control.max !== undefined && value > control.max) return { ok: false, message: `${control.label} must be at most ${control.max}.` };
  return { ok: true, value };
}

function FieldInspector({ node, onUpdate }: {
  readonly node: StudioFieldNode;
  readonly onUpdate: (node: StudioNode, changes: Readonly<Record<string, unknown>>, label: string, coalesceKey?: string) => void;
}) {
  const definition = studioFieldDefinition(node.definition);
  const [drafts, setDrafts] = useState<Readonly<Record<string, string | boolean>>>(() => Object.fromEntries(
    definition?.props.map((control) => [control.key, control.control === "checkbox"
      ? Boolean(node.props[control.key] ?? control.defaultValue)
      : String(node.props[control.key] ?? control.defaultValue ?? "")]) ?? [],
  ));
  const [previousProps, setPreviousProps] = useState(node.props);
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({});
  if (previousProps !== node.props) {
    setPreviousProps(node.props);
    setDrafts(Object.fromEntries(definition?.props.map((control) => [control.key, control.control === "checkbox"
      ? Boolean(node.props[control.key] ?? control.defaultValue)
      : String(node.props[control.key] ?? control.defaultValue ?? "")]) ?? []));
    setErrors({});
  }
  if (!definition) return <p>This field definition is not available.</p>;
  const change = (control: StudioPropControl, draft: string | boolean, coalesce = true) => {
    setDrafts((current) => ({ ...current, [control.key]: draft }));
    const parsed = parseControlDraft(control, draft);
    if (!parsed.ok) {
      setErrors((current) => ({ ...current, [control.key]: parsed.message }));
      return;
    }
    const nextProps = { ...node.props, [control.key]: parsed.value } satisfies JsonObject;
    const issue = validateStudioFieldProps(definition, nextProps)[0];
    if (issue) {
      setErrors((current) => ({ ...current, [control.key]: issue.message }));
      return;
    }
    setErrors((current) => {
      const next = { ...current };
      delete next[control.key];
      return next;
    });
    setPreviousProps(nextProps);
    onUpdate(node, { props: nextProps }, `Edit ${definition.displayName} ${control.label.toLowerCase()}`, coalesce ? `props.${control.key}:${node.uid}` : undefined);
  };
  const localizableControls = definition.props.flatMap((control) => control.key === "label" || control.key === "helpText" ? [control] : []);
  return <fieldset className="studio-v1-field-inspector">
    <legend>{definition.displayName} properties <StudioHelp topic="Fields & content" compact /></legend>
    {definition.props.map((control) => {
      const errorId = errors[control.key] ? `${node.uid}-${control.key}-error` : undefined;
      const draft = drafts[control.key] ?? (control.control === "checkbox" ? false : "");
      if (control.key === "options" && definition.key === "choice") return <StudioChoiceOptionsEditor
        key={control.key} value={String(node.props[control.key] ?? "")} onChange={(value, coalesce) => change(control, value, coalesce)}
      />;
      return <label className="studio-field" key={control.key}>
        <span>{control.label}</span>
        {control.control === "textarea" ? <textarea className="ui-input" value={String(draft)} aria-invalid={Boolean(errorId)} aria-describedby={errorId} onChange={(event) => change(control, event.currentTarget.value)} />
          : control.control === "checkbox" ? <input type="checkbox" checked={Boolean(draft)} aria-invalid={Boolean(errorId)} aria-describedby={errorId} onChange={(event) => change(control, event.currentTarget.checked)} />
            : <input className="ui-input" type={control.control === "number" ? "text" : "text"} inputMode={control.control === "number" ? "decimal" : undefined} value={String(draft)} aria-invalid={Boolean(errorId)} aria-describedby={errorId} onChange={(event) => change(control, event.currentTarget.value)} />}
        {errorId && <small id={errorId} role="alert">{errors[control.key]}</small>}
      </label>;
    })}
    <InspectorSection title="Localization" icon={Languages} defaultOpen={false}>
    {localizableControls.map((control) => <label className="studio-field" key={`localized:${control.key}`}>
      <span>{control.label} locale key</span>
      <input className="ui-input" value={node.localizedProps?.[control.key] ?? ""} placeholder="messages.field.label" onChange={(event) => {
        const key = event.currentTarget.value.trim();
        const localizedProps = { ...node.localizedProps };
        if (key.length === 0) delete localizedProps[control.key];
        else localizedProps[control.key] = key;
        onUpdate(node, { localizedProps: Object.keys(localizedProps).length === 0 ? undefined : localizedProps }, `Localize ${control.label.toLowerCase()}`, `localizedProps.${control.key}:${node.uid}`);
      }} />
    </label>)}
    {(definition.value.kind === "number" || definition.key === "date") && <label className="studio-field"><span>Locale-sensitive display</span><select value={node.format?.kind ?? ""} onChange={(event) => {
      const kind = event.currentTarget.value as "" | "date" | "number";
      onUpdate(node, { format: kind === "" ? undefined : { kind } }, "Edit localized field format", `format:${node.uid}`);
    }}><option value="">Canonical value only</option>{definition.value.kind === "number" && <option value="number">Localized number</option>}{definition.key === "date" && <option value="date">Localized date</option>}</select></label>}
    </InspectorSection>
  </fieldset>;
}

function BlockInspector({ node, onUpdate }: {
  readonly node: Extract<StudioNode, { readonly kind: "block" }>;
  readonly onUpdate: (node: StudioNode, changes: Readonly<Record<string, unknown>>, label: string, coalesceKey?: string) => void;
}) {
  const definition = studioBlockDefinition(node.definition);
  if (!definition) return <p>This content definition is not available.</p>;
  return <fieldset className="studio-v1-block-inspector">
    <legend>{definition.displayName} properties <StudioHelp topic="Fields & content" compact /></legend>
    {definition.props.map((control) => <label className="studio-field" key={control.key}>
      <span>{control.label}</span>
      {control.control === "textarea" ? (
        <textarea className="ui-input" value={String(node.props[control.key] ?? control.defaultValue)} onChange={(event) => onUpdate(node, { props: { ...node.props, [control.key]: event.currentTarget.value } satisfies JsonObject }, `Edit ${definition.displayName}`, `props.${control.key}:${node.uid}`)} />
      ) : control.control === "select" ? (
        <select className="ui-input" value={String(node.props[control.key] ?? control.defaultValue)} onChange={(event) => onUpdate(node, { props: { ...node.props, [control.key]: event.currentTarget.value } satisfies JsonObject }, `Edit ${definition.displayName}`, `props.${control.key}:${node.uid}`)}>
          {control.options?.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
        </select>
      ) : (
        <input className="ui-input" value={String(node.props[control.key] ?? control.defaultValue)} onChange={(event) => onUpdate(node, { props: { ...node.props, [control.key]: event.currentTarget.value } satisfies JsonObject }, `Edit ${definition.displayName}`, `props.${control.key}:${node.uid}`)} />
      )}
    </label>)}
  </fieldset>;
}

function PresentationInspector({ node, onUpdate }: {
  readonly node: StudioNode;
  readonly onUpdate: (node: StudioNode, changes: Readonly<Record<string, unknown>>, label: string, coalesceKey?: string) => void;
}) {
  return <InspectorSection title="Responsive layout" icon={LayoutGrid}>
    <StudioLayoutControl layout={studioLayout(node.presentation?.["layout"])} onChange={(layout, breakpoint, key) => {
      onUpdate(node, { presentation: { ...node.presentation, layout } satisfies JsonObject }, `Edit ${breakpoint} ${key}`, `presentation.layout.${key}.${breakpoint}:${node.uid}`);
    }} />
  </InspectorSection>;
}

function ScenarioObjectEditor({ scenario, property, label, onUpdate }: {
  readonly scenario: StudioScenario;
  readonly property: "context" | "extensions" | "services";
  readonly label: string;
  readonly onUpdate: (scenario: StudioScenario, changes: Partial<Pick<StudioScenario, "context" | "extensions" | "services">>) => void;
}) {
  const [draft, setDraft] = useState(() => JSON.stringify(scenario[property] ?? {}, null, 2));
  const [error, setError] = useState("");
  return <label className="studio-field"><span>{label}</span><textarea className="ui-input" rows={4} value={draft} aria-invalid={error.length > 0} onChange={(event) => {
    const source = event.currentTarget.value;
    setDraft(source);
    try {
      const value = JSON.parse(source) as unknown;
      if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Expected a JSON object.");
      setError("");
      onUpdate(scenario, { [property]: value } as Partial<Pick<StudioScenario, "context" | "extensions" | "services">>);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid JSON object.");
    }
  }} />{error.length > 0 && <small role="alert">{error}</small>}</label>;
}

function ScenarioValueEditor({ scenario, onUpdate }: {
  readonly scenario: StudioScenario;
  readonly onUpdate: (scenario: StudioScenario, changes: Partial<Pick<StudioScenario, "value">>) => void;
}) {
  const [draft, setDraft] = useState(() => JSON.stringify(scenario.value, null, 2));
  const [error, setError] = useState("");
  return <label className="studio-field"><span>Domain value JSON</span><textarea className="ui-input" rows={6} value={draft} aria-invalid={error.length > 0 || undefined} onChange={(event) => {
    const source = event.currentTarget.value;
    setDraft(source);
    try {
      const value = JSON.parse(source) as JsonValue;
      setError("");
      onUpdate(scenario, { value });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid JSON value.");
    }
  }} />{error.length > 0 && <small role="alert">{error}</small>}</label>;
}

function ResourceCatalogEditor({ resources, onUpdate }: {
  readonly resources: StudioResourceCatalog;
  readonly onUpdate: (resources: StudioResourceCatalog) => void;
}) {
  const [draft, setDraft] = useState(() => JSON.stringify(resources, null, 2));
  const [error, setError] = useState("");
  return <section className="studio-v1-palette" aria-labelledby="studio-v1-resources-title">
    <h2 id="studio-v1-resources-title" className="studio-sr-only">Extensions & locales</h2>
    <p><small>Edit extension settings and translation catalogs. Changes apply to this project.</small></p>
    <label className="studio-field"><span>Resource catalog JSON</span><textarea className="ui-input" rows={8} value={draft} aria-invalid={error.length > 0 || undefined} onChange={(event) => {
      const source = event.currentTarget.value;
      setDraft(source);
      try {
        const value = JSON.parse(source) as unknown;
        if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Expected a JSON object.");
        setError("");
        onUpdate(value as StudioResourceCatalog);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Invalid resource catalog.");
      }
    }} />{error.length > 0 && <small role="alert">{error}</small>}</label>
  </section>;
}

function dynamicSnapshotMap(nodes: readonly RenderNodeSnapshot[]): ReadonlyMap<string, RenderNodeSnapshot> {
  const output = new Map<string, RenderNodeSnapshot>();
  const visit = (node: RenderNodeSnapshot) => {
    const key = JSON.stringify(node.address.filter((segment) => segment.kind === "node"));
    if (!output.has(key)) output.set(key, node);
    if (node.kind !== "field") for (const child of node.nodes) visit(child);
  };
  for (const node of nodes) visit(node);
  return output;
}

function DynamicStructurePanel({ form, nodes, snapshots, value, scenario }: { readonly form: StudioFormDocument; readonly nodes: readonly StudioRenderNode[]; readonly snapshots: readonly RenderNodeSnapshot[]; readonly value: unknown; readonly scenario: StudioScenario | undefined }) {
  const byAddress = dynamicSnapshotMap(snapshots);
  const items: Array<{ readonly uid: Uid; readonly label: string; readonly state: string }> = [];
  const resolvesFalse = (expression: StudioExpression | undefined) => {
    if (expression === undefined) return false;
    const result = evaluateStudioExpression(expression, { value, context: scenario?.context, extensions: scenario?.extensions, metadata: {} });
    return result.ok && result.value === false;
  };
  const visit = (node: StudioRenderNode, inheritedState?: string) => {
    let state = inheritedState;
    if (node.kind !== "block") {
      const snapshot = byAddress.get(JSON.stringify(node.runtimeAddress));
      const documentNode = form.nodes[node.uid];
      if (snapshot !== undefined) state = !snapshot.state.visible ? "dormant" : snapshot.state.disabled ? "disabled (possibly inherited)" : "active";
      else if (state === undefined || state === "active") state = resolvesFalse(documentNode?.behavior?.presentWhen)
        ? "structurally absent"
        : resolvesFalse(documentNode?.behavior?.when) && node.kind !== "stage" ? "dormant" : "structurally absent";
      items.push({ uid: node.uid, label: node.runtimePath.join(".") || node.uid, state });
    }
    for (const child of node.children) visit(child, state);
  };
  for (const node of nodes) visit(node);
  return <section className="studio-v1-dynamic-state" aria-labelledby="studio-v1-dynamic-state-title"><h3 id="studio-v1-dynamic-state-title">Dynamic structure</h3><ul>{items.map((item) => <li key={item.uid}><span>{item.label}</span><strong>{item.state}</strong></li>)}</ul></section>;
}

export function ControlledPreview({ form, compiled, onUpdateScenario, onAddScenario, onNavigateProblem, project, resources: resourceCatalog, defaultLocale = "en", codecBindings = STUDIO_PREVIEW_CODEC_BINDINGS, variant = "bench", authoring }: {
  readonly form: StudioFormDocument;
  readonly compiled: CompiledStudioForm;
  readonly project?: StudioProjectDocument["project"];
  readonly resources?: StudioResourceCatalog;
  readonly defaultLocale?: string;
  readonly codecBindings?: StudioCodecBindings;
  readonly onNavigateProblem?: (diagnostic: StudioProblem) => void;
  readonly onUpdateScenario: (scenario: StudioScenario, changes: Partial<Pick<StudioScenario, "title" | "value" | "context" | "extensions" | "services">>) => void;
  readonly onAddScenario: () => StudioScenario | undefined;
  readonly variant?: "bench" | "canvas";
  readonly authoring?: AuthoringCanvasBindings;
}) {
  const previewRef = useRef<HTMLElement>(null);
  const [showTestDetails, setShowTestDetails] = useState(false);
  const initialScenario = form.scenarios[0];
  const [activeScenarioUid, setActiveScenarioUid] = useState<Uid | undefined>(initialScenario?.uid);
  const scenario = form.scenarios.find(({ uid }) => uid === activeScenarioUid) ?? form.scenarios[0];
  const [value, setValue] = useState<unknown>(() => initialScenario?.value ?? createEmptyStudioScenarioValue(form));
  const [proposalPolicy, setProposalPolicy] = useState<"accept" | "reject">("accept");
  const [lastProposal, setLastProposal] = useState<StagesChange<unknown> | undefined>();
  const [eventMessage, setEventMessage] = useState("No named event dispatched.");
  const [activeEventId, setActiveEventId] = useState(form.events?.[0]?.id ?? "");
  const hostRef = useRef<ReturnType<typeof createStudioPreviewHost> | undefined>(undefined);
  const valueCodec = useMemo(() => codecBindings.resolveValue(form.runtime), [codecBindings, form.runtime]);
  const extensionCodecs = useMemo(() => {
    const codecs: Record<string, NonNullable<ReturnType<StudioCodecBindings["resolveExtension"]>>> = {};
    const register = (namespace: string, reference: Readonly<{ key: string; version: number }>) => {
      const codec = codecBindings.resolveExtension(reference);
      if (codec !== undefined) codecs[namespace] = codec;
    };
    register(STUDIO_PREVIEW_SERVICE_EXTENSION, { key: "json", version: 1 });
    for (const [namespace, definition] of Object.entries(resourceCatalog?.extensions ?? {})) register(namespace, definition.codec);
    if (resourceCatalog?.extensions === undefined) for (const item of form.scenarios) {
      for (const namespace of Object.keys(item.extensions ?? {})) register(namespace, { key: "json", version: 1 });
    }
    return codecs;
  }, [codecBindings, form.scenarios, resourceCatalog?.extensions]);
  const durableExtensionNamespaces = useMemo(() => resourceCatalog?.extensions === undefined
    ? [...new Set(form.scenarios.flatMap((item) => Object.keys(item.extensions ?? {})))]
    : Object.keys(resourceCatalog.extensions), [form.scenarios, resourceCatalog?.extensions]);
  const locale = studioScenarioLocale(scenario?.context, defaultLocale);
  const localizedKeys = [
    ...Object.values(form.nodes).flatMap((node) => Object.values(node.localizedProps ?? {})),
    ...(form.validators ?? []).flatMap((validator) => typeof validator.message === "object" && validator.message.key !== undefined ? [validator.message.key] : []),
    ...Object.values(form.nodes).flatMap((node) => (node.kind === "field" || node.kind === "group" || node.kind === "collection" || node.kind === "wizard" || node.kind === "fragment")
      ? (node.validators ?? []).flatMap((validator) => typeof validator.message === "object" && validator.message.key !== undefined ? [validator.message.key] : [])
      : []),
  ];
  const localeDiagnostics = [...new Map(localizedKeys.map((key) => {
    const result = resolveStudioMessage(key, locale, { defaultLocale, resources: resourceCatalog ?? {} });
    return [key, result] as const;
  })).values()].filter(({ code }) => code !== undefined);
  const [host] = useState(() => createStudioPreviewHost({
    compiled,
    value,
    ...(initialScenario?.context === undefined ? {} : { context: initialScenario.context }),
    extensions: studioPreviewServiceExtensions(initialScenario?.extensions, initialScenario?.services),
    ...(valueCodec === undefined ? {} : { codec: valueCodec }),
    extensionCodecs,
    durableExtensionNamespaces,
    onProposal: (proposal) => { setLastProposal(proposal); setValue(proposal.value); },
  }));
  const onProposal = useCallback((proposal: Parameters<NonNullable<Parameters<typeof createStudioPreviewHost>[0]["onProposal"]>>[0]) => {
    setLastProposal(proposal);
    if (proposalPolicy === "accept") setValue(proposal.value);
    else queueMicrotask(() => hostRef.current?.rejectProposal(proposal.transactionId));
  }, [proposalPolicy]);
  useEffect(() => {
    hostRef.current = host;
    return () => { if (hostRef.current === host) hostRef.current = undefined; };
  }, [host]);
  const input = useMemo(() => ({
    compiled,
    value,
    ...(scenario?.context === undefined ? {} : { context: scenario.context }),
    extensions: studioPreviewServiceExtensions(scenario?.extensions, scenario?.services),
    ...(valueCodec === undefined ? {} : { codec: valueCodec }),
    extensionCodecs,
    durableExtensionNamespaces,
    onProposal,
  }), [compiled, durableExtensionNamespaces, extensionCodecs, onProposal, scenario?.context, scenario?.extensions, scenario?.services, value, valueCodec]);
  const preview = useStudioPreviewHost(host, input);
  const [validationScope, setValidationScope] = useState<string>("form");
  const [validationPath, setValidationPath] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [validationMessage, setValidationMessage] = useState("Validation has not run.");
  const [savedRuntime, setSavedRuntime] = useState<ReturnType<typeof host.serialize> | undefined>();
  const [runtimePersistenceMessage, setRuntimePersistenceMessage] = useState("No runtime envelope saved.");
  const validationInspection = inspectStudioValidation(preview.snapshot, compiled.sourceMap);
  const problems: readonly StudioProblem[] = [...compiled.diagnostics, ...preview.diagnostics];
  const runtimeInspection = inspectStudioRuntime(preview.snapshot, preview.host.acceptedRevision, preview.host.pendingProposal);
  const [supportStatus, setSupportStatus] = useState("Support report not copied.");
  const copySupportReport = async () => {
    const report = createStudioSupportReport({
      project: project ?? { uid: form.uid, title: form.title },
      form: { uid: form.uid, title: form.title, schemaId: form.runtime.schemaId, schemaVersion: form.runtime.schemaVersion },
      snapshot: preview.snapshot,
      acceptedRevision: preview.host.acceptedRevision,
      canonicalValue: preview.host.canonicalValue,
      ...(preview.host.pendingProposal === undefined ? {} : { pendingProposal: preview.host.pendingProposal }),
      ...(lastProposal === undefined ? {} : { lastTransaction: lastProposal }),
      problems,
      context: scenario?.context,
      extensions: scenario?.extensions,
    });
    try {
      await navigator.clipboard.writeText(report);
      setSupportStatus("Redacted support report copied.");
    } catch {
      setSupportStatus("Clipboard access was unavailable.");
    }
  };
  const navigateWizard = async (
    wizard: ContainerSnapshot,
    event: StagesEvent,
    validateCurrent: boolean,
  ) => {
    if (validateCurrent) {
      const currentStage = wizard.nodes.find((node) => node.kind === "stage" && node.id === wizard.activeStage);
      if (currentStage === undefined) {
        setValidationMessage("The active wizard stage is unavailable; navigation was not attempted.");
        return;
      }
      const result = await preview.controller.validate({ scope: { address: currentStage.address }, event: "submit", reveal: true });
      setValidationMessage(result.status === "valid"
        ? "Current wizard stage is valid; navigation was attempted."
        : `Current wizard stage is ${result.status}; navigation was blocked.`);
      if (result.status !== "valid") return;
    }
    preview.controller.dispatch(event);
  };
  const dispatchNamedEvent = (definition: StudioEventDefinition, count = 1) => {
    let payload: unknown;
    if (definition.payload !== undefined) {
      const result = evaluateStudioExpression(definition.payload, {
        value: preview.snapshot.value,
        context: scenario?.context,
        extensions: scenario?.extensions,
        metadata: { revision: preview.snapshot.revision },
      });
      if (!result.ok) { setEventMessage(`Payload failed: ${result.message}`); return; }
      payload = result.value;
    }
    const init = { ...(definition.payload === undefined ? {} : { payload }), source: definition.source ?? "user" };
    let stagesEvent: StagesEvent;
    if (definition.target.kind === "form") stagesEvent = formEvent(definition.name, init);
    else {
      const entry = compiled.sourceMap.byUid.get(definition.target.uid);
      const targetNode = form.nodes[definition.target.uid];
      if (entry === undefined || targetNode === undefined) { setEventMessage("Event target is unavailable in the compiled preview."); return; }
      stagesEvent = targetNode.kind === "field"
        ? fieldEvent(definition.name, entry.runtimePath, init)
        : nodeEvent(definition.name, entry.runtimeAddress, init);
    }
    preview.controller.batch(() => {
      for (let index = 0; index < count; index += 1) preview.controller.dispatch(stagesEvent);
    });
    setEventMessage(`${definition.title} dispatched${count > 1 ? ` ${count} times in one batch` : ""}.`);
  };
  const validate = async (scopeKind: "form" | "stage" | "path") => {
    const entry = scopeKind === "stage" ? compiled.sourceMap.byUid.get(toUid(validationScope)) : undefined;
    const path = validationPath.trim() === "" ? [] : validationPath.split(".").map((segment) => /^\d+$/.test(segment) ? Number(segment) : segment);
    const result = await preview.controller.validate({
      scope: scopeKind === "form" ? "form" : scopeKind === "path" ? { path } : entry === undefined ? "form" : { address: entry.runtimeAddress },
      event: "submit",
      reveal: true,
    });
    setValidationMessage(result.isValid ? "Selected scope is valid." : `${result.visibleIssues.length} visible issue${result.visibleIssues.length === 1 ? "" : "s"}.`);
    if (!result.isValid) requestAnimationFrame(() => { if (previewRef.current) focusFirstVisibleValidationError(previewRef.current); });
    return result;
  };
  const submitPreview = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitMessage("Validating…");
    try {
      const result = await validate("form");
      setSubmitMessage(result.status === "valid"
        ? "Form is valid. Preview submission succeeded."
        : result.status === "invalid"
          ? "Please correct the validation errors and submit again."
          : "Validation is incomplete. Please try submitting again.");
    } catch (error) {
      setSubmitMessage(platformErrorMessage(error, "Validation could not finish. Please try again."));
    } finally { setSubmitting(false); }
  };
  const resetPreview = () => {
    setSubmitMessage("");
    const resetValue = scenario?.value ?? createEmptyStudioScenarioValue(form);
    try {
      preview.host.reset({
        value: resetValue,
        ...(scenario?.context === undefined ? {} : { context: scenario.context }),
        extensions: studioPreviewServiceExtensions(scenario?.extensions, scenario?.services),
      });
      setValue(resetValue);
      setLastProposal(undefined);
      setRuntimePersistenceMessage(`Reset to ${scenario?.title ?? "generated empty value"}.`);
    } catch (error) {
      setRuntimePersistenceMessage(error instanceof Error ? error.message : "The scenario could not create a fresh preview.");
    }
  };
  const saveRuntime = () => {
    try {
      const state = preview.host.serialize();
      setSavedRuntime(state);
      setRuntimePersistenceMessage(`Runtime envelope saved at accepted revision ${preview.host.acceptedRevision}.`);
    } catch (error) {
      setRuntimePersistenceMessage(error instanceof Error ? error.message : "Runtime serialization failed.");
    }
  };
  const recreatePreview = () => {
    if (savedRuntime === undefined) return;
    preview.host.recreate(savedRuntime);
    setValue(preview.host.canonicalValue);
    setLastProposal(undefined);
    setRuntimePersistenceMessage("Preview recreated from the saved runtime envelope.");
  };
  const themeStyle = {
    "--studio-preview-background": compiled.renderPlan.theme.background,
    "--studio-preview-foreground": compiled.renderPlan.theme.foreground,
    "--studio-preview-muted": compiled.renderPlan.theme.muted,
    "--studio-preview-border": compiled.renderPlan.theme.border,
    "--studio-preview-accent": compiled.renderPlan.theme.accent,
    "--studio-preview-radius": compiled.renderPlan.theme.radius,
    "--studio-preview-spacing": compiled.renderPlan.theme.spacing,
  } as CSSProperties;

  const Surface = variant === "canvas" ? "div" : "form";
  const formSurface = <DesignNodesContext.Provider value={variant === "canvas" ? form.nodes : undefined}><PreviewTestDetailsContext.Provider value={showTestDetails}><Surface
    className="studio-v1-preview__fields"
    {...(variant === "canvas" ? {} : { noValidate: true, "aria-label": form.title })}
    onSubmit={(event) => { event.preventDefault(); if (variant !== "canvas") void submitPreview(); }}
  >
    {compiled.renderPlan.nodes.map((node) => (
      <PreviewNode
        key={node.uid}
        form={form}
        node={node}
        value={preview.snapshot.value}
        snapshotNodes={preview.snapshot.nodes}
        runtimePath={undefined}
        expressionContext={{ value, context: { locale, ...scenario?.context }, extensions: scenario?.extensions, metadata: { revision: preview.snapshot.revision } }}
        onInput={(renderNode, nextValue) => {
          setSubmitMessage("");
          preview.controller.dispatch(fieldEvent("input", renderNode.runtimePath, { payload: nextValue, source: "adapter" }));
        }}
        onStructureEvent={(event) => preview.controller.dispatch(event)}
        onWizardNavigate={navigateWizard}
        {...(authoring === undefined ? {} : { authoring })}
      />
    ))}
    {variant !== "canvas" && <div className="studio-preview-submit">
      <Button type="submit" disabled={submitting}>{submitting ? "Validating…" : "Submit"}</Button>
      <p role="status" aria-live="polite">{submitMessage}</p>
    </div>}
  </Surface></PreviewTestDetailsContext.Provider></DesignNodesContext.Provider>;

  if (variant === "canvas") return (
    <section ref={previewRef} className="studio-v1-authoring-canvas" style={themeStyle} data-studio-theme="default" aria-label="Interactive form canvas">
      <StudioDesignLegend />
      {formSurface}
    </section>
  );

  return (
    <section ref={previewRef} className="studio-v1-preview" aria-labelledby="studio-v1-preview-title" style={themeStyle} data-studio-theme="default">
      <div className="studio-v1-section-heading">
        <h2 id="studio-v1-preview-title">Preview</h2>
        <div className="studio-preview-actions"><Button variant="ghost" size="sm" onClick={resetPreview}><RotateCcw size={14} aria-hidden="true" />Reset to scenario</Button><Button variant={showTestDetails ? "secondary" : "ghost"} size="sm" aria-pressed={showTestDetails} onClick={() => setShowTestDetails((current) => !current)}><FlaskConical size={14} aria-hidden="true" />Test details</Button></div>
      </div>
      <div className="studio-preview-problems" data-has-problems={problems.length > 0}><InspectorSection title={`Problems (${problems.length})`} icon={TriangleAlert} defaultOpen={false}>
        <ProblemsPanel diagnostics={problems} onNavigate={onNavigateProblem ?? (() => {})} />
      </InspectorSection></div>
      <div className="studio-preview-tools">
      <section className="studio-v1-scenarios" aria-labelledby="studio-v1-scenarios-title">
        <h3 id="studio-v1-scenarios-title">Scenario</h3>
        <label className="studio-field"><span>Named scenario</span><select value={scenario?.uid ?? ""} onChange={(event) => {
          const next = form.scenarios.find(({ uid }) => uid === event.currentTarget.value);
          if (next) {
            setActiveScenarioUid(next.uid);
            setValue(next.value);
            setLastProposal(undefined);
          }
        }}><option value="">Generated empty value</option>{form.scenarios.map((item) => <option key={item.uid} value={item.uid}>{item.title}</option>)}</select></label>
        <Button variant="outline" size="sm" onClick={() => {
          const added = onAddScenario();
          if (added) {
            setActiveScenarioUid(added.uid);
            setValue(added.value);
            setLastProposal(undefined);
          }
        }}>Add scenario</Button>
        <InspectorSection title="Scenario data" icon={Braces} defaultOpen={false}>
        {scenario && <div key={scenario.uid} className="studio-v1-scenarios__objects">
          <label className="studio-field"><span>Scenario name</span><input className="ui-input" value={scenario.title} onChange={(event) => onUpdateScenario(scenario, { title: event.currentTarget.value })} /></label>
          <ScenarioValueEditor scenario={scenario} onUpdate={onUpdateScenario} />
          <label className="studio-field"><span>Locale (context-owned)</span><select value={locale} onChange={(event) => onUpdateScenario(scenario, { context: { ...scenario.context, locale: event.currentTarget.value } })}>
            {Object.entries(resourceCatalog?.locales ?? {}).map(([key, resource]) => <option key={key} value={key}>{resource.label}</option>)}
            {(resourceCatalog?.locales?.[locale] === undefined) && <option value={locale}>{locale}</option>}
          </select></label>
          <ScenarioObjectEditor scenario={scenario} property="context" label="Context JSON" onUpdate={onUpdateScenario} />
          <ScenarioObjectEditor scenario={scenario} property="extensions" label="Registered extension values JSON" onUpdate={onUpdateScenario} />
          <ScenarioObjectEditor scenario={scenario} property="services" label="Async service mocks JSON" onUpdate={onUpdateScenario} />
        </div>}
        <dl><div><dt>Domain value</dt><dd>Submitted business data; controlled by the preview owner.</dd></div><div><dt>Context</dt><dd>Environment inputs such as locale and permissions; replaced, not merged.</dd></div><div><dt>Extensions</dt><dd>Registered engine-adjacent state with durable codec metadata.</dd></div><div><dt>Workbench</dt><dd>Selection, panels, drafts, and route simulation; adapter-only and never serialized by core.</dd></div></dl>
        {localeDiagnostics.length > 0 && <ul aria-label="Localization diagnostics">{localeDiagnostics.map((diagnostic) => <li key={`${diagnostic.code}:${diagnostic.message}`}><strong>{diagnostic.code}</strong> {diagnostic.message}</li>)}</ul>}
        </InspectorSection>
      </section>
      <InspectorSection title="Runtime persistence" icon={History} defaultOpen={false}>
      <section className="studio-v1-runtime-persistence" aria-labelledby="studio-v1-runtime-persistence-title">
        <h3 id="studio-v1-runtime-persistence-title">Runtime persistence</h3>
        <Button type="button" variant="outline" size="sm" onClick={saveRuntime}>Save runtime envelope</Button>
        <Button type="button" variant="outline" size="sm" disabled={savedRuntime === undefined} onClick={recreatePreview}>Recreate preview</Button>
        <p role="status" aria-live="polite">{runtimePersistenceMessage}</p>
        {savedRuntime !== undefined && <label className="studio-field"><span>Serialized runtime envelope</span><textarea className="ui-input" rows={8} readOnly value={JSON.stringify(savedRuntime, null, 2)} /></label>}
        <small>The envelope contains accepted domain state and controller metadata. Context, workbench state, browser state, and service fixtures remain outside it.</small>
      </section>
      </InspectorSection>
      <InspectorSection title="Events & proposals" icon={GitBranch} defaultOpen={false}>
      <section className="studio-v1-event-tools" aria-labelledby="studio-v1-event-tools-title">
        <h3 id="studio-v1-event-tools-title">Events and transaction order</h3>
        <p>Event → field reducer → target-to-root transforms → controlled proposal</p>
        <label className="studio-field"><span>Named event</span><select value={activeEventId} onChange={(event) => setActiveEventId(event.currentTarget.value)}><option value="">Choose an event</option>{(form.events ?? []).map((definition) => <option key={definition.id} value={definition.id}>{definition.title}</option>)}</select></label>
        <label className="studio-field"><span>Proposal owner</span><select value={proposalPolicy} onChange={(event) => setProposalPolicy(event.currentTarget.value as "accept" | "reject")}><option value="accept">Accept proposals</option><option value="reject">Reject proposals</option></select></label>
        <Button type="button" size="sm" disabled={activeEventId === ""} onClick={() => { const definition = form.events?.find(({ id }) => id === activeEventId); if (definition) dispatchNamedEvent(definition); }}>Dispatch</Button>
        <Button type="button" variant="outline" size="sm" disabled={activeEventId === ""} onClick={() => { const definition = form.events?.find(({ id }) => id === activeEventId); if (definition) dispatchNamedEvent(definition, 2); }}>Dispatch twice as batch</Button>
        <p role="status" aria-live="polite">{eventMessage}</p>
        {lastProposal && <div className="studio-v1-transaction">
          <p>Transaction {lastProposal.transactionId}: {lastProposal.events.length} event{lastProposal.events.length === 1 ? "" : "s"}, {lastProposal.patches.length} ordered patch{lastProposal.patches.length === 1 ? "" : "es"}. Owner policy: {proposalPolicy}.</p>
          <ol>{keyedOccurrences(lastProposal.patches, (patch) => `${patch.op}:${JSON.stringify(patch.path)}:${patch.op === "set" ? JSON.stringify(patch.value) : ""}`).map(({ key, value: patch }) => <li key={key}><code>{patch.op} {patch.path.join(".") || "(root)"}{patch.op === "set" ? ` = ${JSON.stringify(patch.value)}` : ""}</code></li>)}</ol>
        </div>}
      </section>
      </InspectorSection>
      <InspectorSection title="Dynamic structure" icon={Layers} defaultOpen={false}>
      <DynamicStructurePanel form={form} nodes={compiled.renderPlan.nodes} snapshots={preview.snapshot.nodes} value={value} scenario={scenario} />
      </InspectorSection>
      <InspectorSection title="Runtime observability" icon={SlidersHorizontal} defaultOpen={false}>
      <section className="studio-v1-runtime-diagnostics" aria-labelledby="studio-v1-runtime-diagnostics-title">
        <h3 id="studio-v1-runtime-diagnostics-title">Runtime observability</h3>
        <dl className="studio-v1-observability-grid">
          <div><dt>Preview state</dt><dd>{runtimeInspection.stale ? "Stale — awaiting or reconciling owner acceptance" : "Current"}</dd></div>
          <div><dt>Revision</dt><dd>{runtimeInspection.revision} (accepted {runtimeInspection.acceptedRevision})</dd></div>
          <div><dt>Validation</dt><dd>{runtimeInspection.validation.status} · {runtimeInspection.validation.issues.length} issues · {runtimeInspection.validation.pendingCount} pending</dd></div>
          <div><dt>Active stages</dt><dd>{runtimeInspection.activeStages.map(({ path, activeStage }) => `${path.join(".") || "form"}: ${activeStage}`).join(", ") || "None"}</dd></div>
          <div><dt>Row keys</dt><dd>{runtimeInspection.rows.map(({ path, rowKey }) => `${path.join(".")}: ${rowKey}`).join(", ") || "None"}</dd></div>
        </dl>
        {lastProposal === undefined ? <p>No runtime transaction has been proposed.</p> : <details className="studio-v1-transaction-observation"><summary>Last transaction {lastProposal.transactionId}</summary>
          <p>{lastProposal.events.length} events · {lastProposal.patches.length} patches · source {lastProposal.source}</p>
          <ol>{keyedOccurrences(lastProposal.events, (event) => `${event.name}:${JSON.stringify(event.target)}:${JSON.stringify(event.payload)}`).map(({ key, value: event }) => <li key={key}><code>{event.name}</code> → <code>{JSON.stringify(event.target)}</code></li>)}</ol>
          <ol>{keyedOccurrences(lastProposal.patches, (patch) => `${patch.op}:${JSON.stringify(patch.path)}:${patch.op === "set" ? JSON.stringify(patch.value) : ""}`).map(({ key, value: patch }) => <li key={key}><code>{patch.op} {patch.path.join(".") || "(root)"}</code></li>)}</ol>
        </details>}
        <small>Key collisions appear as <code>schema.duplicate-row-key</code>; the conflicting row branch is omitted until the canonical value supplies unique keys.</small>
        <div><Button type="button" variant="outline" size="sm" onClick={() => void copySupportReport()}>Copy redacted support report</Button></div>
        <p role="status" aria-live="polite">{supportStatus}</p>
        <small>Optional telemetry is a trusted host port and receives event names, codes, revisions, and counts only—never values or credentials.</small>
      </section>
      </InspectorSection>
      <InspectorSection title="Validation tools" icon={ShieldCheck} defaultOpen={false}>
      <section className="studio-v1-validation-state" aria-labelledby="studio-v1-validation-state-title">
        <h3 id="studio-v1-validation-state-title">Validation state</h3>
        <label className="studio-field"><span>Stage</span><select value={validationScope} onChange={(event) => setValidationScope(event.currentTarget.value)}>
          <option value="form">Choose a stage</option>
          {[...compiled.sourceMap.byUid.values()].filter((entry) => form.nodes[entry.uid]?.kind === "stage").map((entry) => <option key={entry.uid} value={entry.uid}>{nodeLabel(form, entry.uid)}</option>)}
        </select></label>
        <label className="studio-field"><span>Data path</span><input className="ui-input" value={validationPath} placeholder="profile.email" onChange={(event) => setValidationPath(event.currentTarget.value)} /></label>
        <Button type="button" size="sm" onClick={() => void validate("form")}>Validate form</Button>
        <Button type="button" size="sm" disabled={validationScope === "form"} onClick={() => void validate("stage")}>Validate stage</Button>
        <Button type="button" size="sm" disabled={validationPath.trim() === ""} onClick={() => void validate("path")}>Validate path</Button>
        <p role="status" aria-live="polite">{validationMessage} Status: {validationInspection.status}. Pending: {validationInspection.pendingCount}.</p>
        {validationInspection.issues.length > 0 && <ul>{validationInspection.issues.map(({ issue, targetUid, visible }) => <li key={`${targetUid ?? "form"}:${issue.id}:${JSON.stringify(issue.path)}`}>
          <strong>{issue.severity}</strong> {issue.message ?? issue.code} <small>{visible ? "visible" : "hidden"}{targetUid === undefined ? "" : ` · ${nodeLabel(form, targetUid)}`}</small>
        </li>)}</ul>}
      </section>
      </InspectorSection>
      </div>
      {formSurface}
    </section>
  );
}

function StructuralInspector({ node, form, onUpdate }: {
  readonly node: StudioNode;
  readonly form: StudioFormDocument;
  readonly onUpdate: (node: StudioNode, changes: Readonly<Record<string, unknown>>, label: string, coalesceKey?: string) => void;
}) {
  if (node.kind === "collection") {
    const updateNumber = (key: "initialRows" | "max" | "min", draft: string) => {
      const value = draft === "" ? undefined : Number(draft);
      if (value !== undefined && (!Number.isSafeInteger(value) || value < 0)) return;
      onUpdate(node, { [key]: value }, `Edit collection ${key}`, `collection.${key}:${node.uid}`);
    };
    const discriminated = isStudioVariantCollection(node);
    return <fieldset className="studio-v1-structural-inspector">
      <legend>{discriminated ? "Variant collection" : "Collection"} settings <StudioHelp topic="Collections & wizards" compact /></legend>
      {(["min", "max", "initialRows"] as const).map((key) => <label className="studio-field" key={key}>
        <span>{key === "initialRows" ? "Initial scenario rows" : key}</span>
        <input className="ui-input" type="number" min="0" value={node[key] ?? ""} onChange={(event) => updateNumber(key, event.currentTarget.value)} />
      </label>)}
      <label className="studio-field"><span>Item key</span><select
        value={node.itemKey?.kind ?? "index"}
        onChange={(event) => onUpdate(node, { itemKey: event.currentTarget.value === "property" ? { kind: "property", property: "id" } : { kind: "index" } }, "Edit item key strategy")}
      ><option value="index">Row index</option><option value="property">Row property</option></select></label>
      <p><small>{node.itemKey?.kind === "property"
        ? "Use an immutable, non-sensitive property that is present, unique, and stable before every accepted evaluation. Duplicate commands require a fresh domain key."
        : "Engine-owned row keys survive Studio commands and controller serialization, but an unrelated external reorder cannot reveal which records moved."}</small></p>
      {node.itemKey?.kind === "property" && <label className="studio-field"><span>Key property</span><input
        className="ui-input"
        value={node.itemKey.property}
        onChange={(event) => {
          const property = event.currentTarget.value;
          if (property.length > 0 && isSafeObjectKey(property)) onUpdate(node, { itemKey: { kind: "property", property } }, "Edit item key property", `collection.itemKey:${node.uid}`);
        }}
      /></label>}
      {discriminated && <>
        <label className="studio-field"><span>Discriminator</span><input className="ui-input" value={node.discriminator} onChange={(event) => {
          const discriminator = event.currentTarget.value;
          if (discriminator.length > 0 && isSafeObjectKey(discriminator)) onUpdate(node, { discriminator }, "Edit discriminator", `collection.discriminator:${node.uid}`);
        }} /></label>
        <label className="studio-field"><span>Initial row variant</span><select value={node.initialVariantUid ?? ""} onChange={(event) => onUpdate(node, { initialVariantUid: event.currentTarget.value === "" ? undefined : toUid(event.currentTarget.value) }, "Edit initial variant") }>
          <option value="">None</option>
          {node.variantUids.map((uid) => <option key={uid} value={uid}>{nodeLabel(form, uid)}</option>)}
        </select></label>
      </>}
    </fieldset>;
  }
  if (node.kind === "wizard") return <fieldset className="studio-v1-structural-inspector">
    <legend>Wizard settings <StudioHelp topic="Collections & wizards" compact /></legend>
    <label className="studio-field"><span>Initial stage</span><select value={node.initialStageUid ?? ""} onChange={(event) => onUpdate(node, { initialStageUid: event.currentTarget.value === "" ? undefined : toUid(event.currentTarget.value) }, "Edit initial stage") }>
      <option value="">First visible stage</option>
      {node.stageUids.map((uid) => <option key={uid} value={uid}>{nodeLabel(form, uid)}</option>)}
    </select></label>
    <label><input type="checkbox" checked={node.navigation?.nonLinear ?? false} onChange={(event) => onUpdate(node, { navigation: { ...node.navigation, nonLinear: event.currentTarget.checked } }, "Edit nonlinear navigation") } /> Allow nonlinear navigation</label>
    <label><input type="checkbox" checked={node.navigation?.validateCurrent ?? false} onChange={(event) => onUpdate(node, { navigation: { ...node.navigation, validateCurrent: event.currentTarget.checked } }, "Edit validation gating") } /> Validate current stage before navigation</label>
    <label><input type="checkbox" checked={node.navigation?.guard !== undefined} onChange={(event) => onUpdate(node, { navigation: { ...node.navigation, guard: event.currentTarget.checked ? { kind: "literal", value: true } : undefined } }, "Edit wizard guard") } /> Enable synchronous guard</label>
    {node.navigation?.guard !== undefined && <>
      <p><small>The guard must return a boolean. Use event.from and event.to for transition-specific policy; failures are reported without changing the active stage.</small></p>
      <StudioExpressionEditor
        expression={node.navigation.guard}
        label="Wizard transition guard"
        references={[...expressionReferences(form).filter(({ scope }) => scope === "value"), { scope: "event", path: ["from"], label: "Current stage" }, { scope: "event", path: ["to"], label: "Target stage" }]}
        onChange={(guard) => onUpdate(node, { navigation: { ...node.navigation, guard } }, "Edit wizard guard", `wizard.guard:${node.uid}`)}
      />
    </>}
  </fieldset>;
  return null;
}

function FragmentInspector({ instance, fragment, onUpdate, onUpdateFragment, onEditFragment, onDetach }: {
  readonly instance: StudioFragmentInstanceNode;
  readonly fragment: StudioFragmentDefinition | undefined;
  readonly onUpdate: (node: StudioNode, changes: Readonly<Record<string, unknown>>, label: string, coalesceKey?: string) => void;
  readonly onUpdateFragment: (fragment: StudioFragmentDefinition, title: string) => void;
  readonly onEditFragment: (uid: Uid) => void;
  readonly onDetach?: (instance: StudioFragmentInstanceNode, fragment: StudioFragmentDefinition) => void;
}) {
  if (!fragment) return <p role="alert">The linked fragment is missing.</p>;
  return <fieldset className="studio-v1-fragment-inspector">
    <legend>Linked fragment <StudioHelp topic="Layers & fragments" compact /></legend>
    <label className="studio-field"><span>Definition name</span><input className="ui-input" value={fragment.title} onChange={(event) => onUpdateFragment(fragment, event.currentTarget.value)} /></label>
    <Button variant="outline" size="sm" onClick={() => onEditFragment(fragment.uid)}>Edit shared contents</Button>
    <p><small>Version {fragment.version} · label overrides below apply to this instance.</small></p>
    <p id={`${instance.uid}-definition-id-help`}><small>Definition IDs are read-only until reference refactoring and value migration are supported.</small></p>
    {Object.values(fragment.nodes).map((definitionNode) => <div key={definitionNode.uid}>
      {definitionNode.kind !== "block" && <label className="studio-field"><span>{nodeDisplayLabel(definitionNode)} definition ID</span><input className="ui-input" value={definitionNode.runtimeId} readOnly aria-describedby={`${instance.uid}-definition-id-help`} /></label>}
      {definitionNode.kind === "field" && <label className="studio-field"><span>Override {nodeDisplayLabel(definitionNode)} label</span><input className="ui-input" value={String(instance.overrides?.[definitionNode.uid]?.props?.["label"] ?? "")} placeholder="Use definition label" onChange={(event) => {
        const label = event.currentTarget.value;
        const current = instance.overrides?.[definitionNode.uid] ?? {};
        const props = { ...current.props } as Record<string, JsonObject[string]>;
        if (label === "") delete props["label"];
        else props["label"] = label;
        onUpdate(instance, { overrides: { ...instance.overrides, [definitionNode.uid]: { ...current, props } } }, "Override fragment field label", `fragment.override.${definitionNode.uid}:${instance.uid}`);
      }} /></label>}
    </div>)}
    {onDetach && <Button variant="outline" size="sm" onClick={() => onDetach(instance, fragment)}>Detach instance</Button>}
  </fieldset>;
}

function ExpressionInspector({ node, form, onUpdate }: {
  readonly node: StudioNode;
  readonly form: StudioFormDocument;
  readonly onUpdate: (node: StudioNode, changes: Readonly<Record<string, unknown>>, label: string, coalesceKey?: string) => void;
}) {
  const references = expressionReferences(form);
  const when = node.behavior?.when;
  const disabled = node.behavior?.disabled;
  const disabledExpression: StudioExpression | undefined = typeof disabled === "boolean" ? { kind: "literal", value: disabled } : disabled;
  const presentWhen = node.behavior?.presentWhen;
  const computed = node.kind === "field" ? node.computed : undefined;
  const setBehavior = (key: "disabled" | "presentWhen" | "when", expression: StudioExpression | undefined) => {
    const behavior = { ...node.behavior };
    if (expression === undefined) delete behavior[key];
    else behavior[key] = expression;
    onUpdate(node, { behavior: Object.keys(behavior).length === 0 ? undefined : behavior }, `Edit dynamic ${key}`, `logic.${key}:${node.uid}`);
  };
  return <fieldset className="studio-v1-expression-inspector">
    <legend>Logic</legend>
    <label className="studio-inspector-switch"><span>Conditional visibility</span><SwitchPrimitive.Root className="ui-switch" checked={when !== undefined} onCheckedChange={(checked) => setBehavior("when", checked ? { kind: "literal", value: true } : undefined)}><SwitchPrimitive.Thumb className="ui-switch__thumb" /></SwitchPrimitive.Root></label>
    {when !== undefined && <StudioExpressionEditor expression={when} label="Visibility expression" references={references} onChange={(expression) => setBehavior("when", expression)} />}
    <label className="studio-inspector-switch"><span>Dynamic disabled state</span><SwitchPrimitive.Root className="ui-switch" checked={disabled !== undefined} onCheckedChange={(checked) => setBehavior("disabled", checked ? { kind: "literal", value: false } : undefined)}><SwitchPrimitive.Thumb className="ui-switch__thumb" /></SwitchPrimitive.Root></label>
    {disabledExpression !== undefined && <StudioExpressionEditor expression={disabledExpression} label="Disabled expression" references={references} onChange={(expression) => setBehavior("disabled", expression)} />}
    <label className="studio-inspector-switch"><span>Conditional structure</span><SwitchPrimitive.Root className="ui-switch" checked={presentWhen !== undefined} onCheckedChange={(checked) => setBehavior("presentWhen", checked ? { kind: "literal", value: true } : undefined)}><SwitchPrimitive.Thumb className="ui-switch__thumb" /></SwitchPrimitive.Root></label>
    {presentWhen !== undefined && <StudioExpressionEditor expression={presentWhen} label="Structure expression" references={references.filter(({ scope }) => scope !== "row")} onChange={(expression) => setBehavior("presentWhen", expression)} />}
    {node.kind === "field" && <>
      <label className="studio-inspector-switch"><span>Computed value</span><SwitchPrimitive.Root className="ui-switch" checked={computed !== undefined} onCheckedChange={(checked) => onUpdate(node, { computed: checked ? { kind: "reference", scope: "value", path: [] } : undefined }, "Edit computed value", `logic.computed:${node.uid}`)}><SwitchPrimitive.Thumb className="ui-switch__thumb" /></SwitchPrimitive.Root></label>
      {computed !== undefined && <StudioExpressionEditor expression={computed} label="Computed value expression" references={references} onChange={(expression) => onUpdate(node, { computed: expression }, "Edit computed value", `logic.computed:${node.uid}`)} />}
      <label className="studio-inspector-switch"><span>Derived label</span><SwitchPrimitive.Root className="ui-switch" checked={node.derivedProps?.["label"] !== undefined} onCheckedChange={(checked) => onUpdate(node, { derivedProps: checked ? { ...node.derivedProps, label: { kind: "literal", value: String(node.props["label"] ?? "") } } : undefined }, "Edit derived label", `logic.derivedProps.label:${node.uid}`)}><SwitchPrimitive.Thumb className="ui-switch__thumb" /></SwitchPrimitive.Root></label>
      {node.derivedProps?.["label"] !== undefined && <StudioExpressionEditor expression={node.derivedProps["label"]} label="Derived label expression" references={references} onChange={(expression) => onUpdate(node, { derivedProps: { ...node.derivedProps, label: expression } }, "Edit derived label", `logic.derivedProps.label:${node.uid}`)} />}
    </>}
  </fieldset>;
}

function nodeValidators(node: StudioNode): readonly StudioValidatorSpec[] | undefined {
  return node.kind === "field" || node.kind === "group" || node.kind === "collection" || node.kind === "wizard" || node.kind === "fragment"
    ? node.validators
    : undefined;
}

function supportsValidators(node: StudioNode): boolean {
  return node.kind === "field" || node.kind === "group" || node.kind === "collection" || node.kind === "wizard" || node.kind === "fragment";
}

function nodeTransforms(node: StudioNode): readonly StudioLogicRule[] | undefined {
  return node.kind === "field" || node.kind === "group" || node.kind === "collection" || node.kind === "wizard" || node.kind === "fragment"
    ? node.transforms
    : undefined;
}

function SelectionInspector({ nodes, form, fragments, onUpdate, onUpdateFragment, onEditFragment, onDetach, onBulkUpdate }: {
  readonly nodes: readonly StudioNode[];
  readonly form: StudioFormDocument;
  readonly fragments: StudioProjectDocument["fragments"];
  readonly onUpdate: (node: StudioNode, changes: Readonly<Record<string, unknown>>, label: string, coalesceKey?: string) => void;
  readonly onUpdateFragment: (fragment: StudioFragmentDefinition, title: string) => void;
  readonly onEditFragment: (uid: Uid) => void;
  readonly onDetach?: (instance: StudioFragmentInstanceNode, fragment: StudioFragmentDefinition) => void;
  readonly onBulkUpdate: (updates: readonly { readonly node: StudioNode; readonly changes: Readonly<Record<string, unknown>> }[], label: string) => string | undefined;
}) {
  if (nodes.length === 0) return <p>Select an item in the outline or canvas.</p>;
  if (nodes.length > 1) return <StudioBulkInspector nodes={nodes} onApply={onBulkUpdate} />;

  const node = nodes[0]!;
  return (
    <div className="studio-selection-inspector">
      <div className="studio-selection-heading"><span className="studio-selection-heading__icon"><StudioItemIcon kind={node.kind === "field" || node.kind === "block" ? node.definition.key : node.kind} /></span><div><strong>{nodeDisplayLabel(node)}</strong><small>{node.kind}</small></div></div>
      {node.kind !== "block" && (
        <label className="studio-field">
          <span id={`${node.uid}-runtime-id-label`}>Runtime ID <LockKeyhole size={11} aria-hidden="true" /></span>
          <input
            className="ui-input"
            value={node.runtimeId}
            aria-labelledby={`${node.uid}-runtime-id-label`}
            readOnly
            aria-describedby={`${node.uid}-runtime-id-help`}
          />
          <small id={`${node.uid}-runtime-id-help`}>Read-only · Used by data and logic references.</small>
        </label>
      )}
      <PresentationInspector node={node} onUpdate={onUpdate} />
      {node.kind === "field" && (
        <FieldInspector node={node} onUpdate={onUpdate} />
      )}
      {node.kind === "block" && <BlockInspector node={node} onUpdate={onUpdate} />}
      {node.kind === "fragment" && <FragmentInspector instance={node} fragment={fragments[node.fragmentUid]} onUpdate={onUpdate} onUpdateFragment={onUpdateFragment} onEditFragment={onEditFragment} {...(onDetach ? { onDetach } : {})} />}
      <StructuralInspector node={node} form={form} onUpdate={onUpdate} />
      <InspectorSection title="Logic & behavior" icon={GitBranch}>
      <ExpressionInspector node={node} form={form} onUpdate={onUpdate} />
      </InspectorSection>
      {supportsValidators(node) && <InspectorSection title="Value processing" icon={Braces} defaultOpen={Boolean(nodeTransforms(node)?.length || (node.kind === "field" && node.reducers?.length))}>
      {supportsValidators(node) && <StudioLogicEditor
        kind="transform"
        rules={nodeTransforms(node)}
        form={form}
        references={expressionReferences(form)}
        onChange={(transforms, label) => onUpdate(node, { transforms }, label, `transforms:${node.uid}`)}
      />}
      {node.kind === "field" && <StudioLogicEditor
        kind="reducer"
        rules={node.reducers}
        form={form}
        references={expressionReferences(form)}
        onChange={(reducers, label) => onUpdate(node, { reducers }, label, `reducers:${node.uid}`)}
      />}
      </InspectorSection>}
      {supportsValidators(node) && <InspectorSection title="Validation" icon={ShieldCheck}>
      {supportsValidators(node) && <StudioValidationEditor
        target={node.kind === "field" ? node.definition.key : node.kind}
        validators={nodeValidators(node)}
        references={expressionReferences(form)}
        ownerLabel={node.kind === "field" ? "field" : "node"}
        onChange={(validators, label) => onUpdate(node, { validators }, label, `validators:${node.uid}`)}
      />}
      </InspectorSection>}
    </div>
  );
}

function FragmentDefinitionInspector({ fragment, form, fragments, onUpdate, onUpdateFragment, onEditFragment, onClose }: {
  readonly fragment: StudioFragmentDefinition;
  readonly form: StudioFormDocument;
  readonly fragments: StudioProjectDocument["fragments"];
  readonly onUpdate: (node: StudioNode, changes: Readonly<Record<string, unknown>>, label: string, coalesceKey?: string) => void;
  readonly onUpdateFragment: (fragment: StudioFragmentDefinition, title: string) => void;
  readonly onEditFragment: (uid: Uid) => void;
  readonly onClose: () => void;
}) {
  const [selectedUid, setSelectedUid] = useState<Uid | undefined>(fragment.rootNodeUids[0]);
  const node = selectedUid === undefined ? undefined : fragment.nodes[selectedUid];
  const definitionForm = { ...form, rootNodeUids: fragment.rootNodeUids, nodes: fragment.nodes };
  return <section aria-label="Shared fragment editor">
    <Button variant="outline" size="sm" onClick={onClose}>Back to form</Button>
    <h3>{fragment.title}</h3>
    <p>Changes here apply to every linked instance. Each instance keeps its own values and label overrides.</p>
    <label className="studio-field"><span>Definition name</span><input className="ui-input" value={fragment.title} onChange={(event) => onUpdateFragment(fragment, event.currentTarget.value)} /></label>
    <label className="studio-field"><span>Shared item</span><select value={selectedUid ?? ""} onChange={(event) => setSelectedUid(event.currentTarget.value as Uid)}>
      {Object.values(fragment.nodes).map((item) => <option key={item.uid} value={item.uid}>{nodeDisplayLabel(item)} · {item.kind}</option>)}
    </select></label>
    <SelectionInspector key={selectedUid} nodes={node ? [node] : []} form={definitionForm} fragments={fragments}
      onUpdate={onUpdate} onUpdateFragment={onUpdateFragment} onEditFragment={onEditFragment}
      onBulkUpdate={() => "Select one shared item to edit."} />
  </section>;
}

function ProblemsPanel({ diagnostics, onNavigate }: {
  readonly diagnostics: readonly StudioProblem[];
  readonly onNavigate: (diagnostic: StudioProblem) => void;
}) {
  const [source, setSource] = useState<"all" | StudioProblem["source"]>("all");
  const [severity, setSeverity] = useState<"all" | StudioProblem["severity"]>("all");
  const [formUid, setFormUid] = useState<"all" | Uid>("all");
  const [entityUid, setEntityUid] = useState<"all" | Uid>("all");
  const [groupBy, setGroupBy] = useState<StudioProblemGroupBy>("source");
  const groups = filterAndGroupStudioProblems(diagnostics, { source, severity, formUid, entityUid }, groupBy);
  const visibleCount = groups.reduce((count, group) => count + group.problems.length, 0);
  const formUids = [...new Set(diagnostics.flatMap((diagnostic) => diagnostic.formUid === undefined ? [] : [diagnostic.formUid]))];
  const entityUids = [...new Set(diagnostics.flatMap((diagnostic) => diagnostic.entityUid === undefined ? [] : [diagnostic.entityUid]))];
  return (
    <section className="studio-v1-problems" aria-labelledby="studio-v1-problems-title">
      <div className="studio-v1-section-heading">
        <h2 id="studio-v1-problems-title">Problems</h2><span>{visibleCount} of {diagnostics.length}</span>
      </div>
      <div className="studio-v1-problem-filters" aria-label="Problem filters">
        <label>Source<select aria-label="Problem source" value={source} onChange={(event) => setSource(event.currentTarget.value as typeof source)}><option value="all">All</option><option value="compiler">Compiler</option><option value="runtime">Runtime</option></select></label>
        <label>Severity<select aria-label="Problem severity" value={severity} onChange={(event) => setSeverity(event.currentTarget.value as typeof severity)}><option value="all">All</option><option value="error">Error</option><option value="warning">Warning</option><option value="info">Info</option></select></label>
        <label>Form<select aria-label="Problem form" value={formUid} onChange={(event) => setFormUid(event.currentTarget.value as typeof formUid)}><option value="all">All</option>{formUids.map((uid) => <option key={uid} value={uid}>{uid}</option>)}</select></label>
        <label>Entity<select aria-label="Problem entity" value={entityUid} onChange={(event) => setEntityUid(event.currentTarget.value as typeof entityUid)}><option value="all">All</option>{entityUids.map((uid) => <option key={uid} value={uid}>{uid}</option>)}</select></label>
        <label>Group by<select aria-label="Group problems by" value={groupBy} onChange={(event) => setGroupBy(event.currentTarget.value as StudioProblemGroupBy)}><option value="source">Source</option><option value="severity">Severity</option><option value="form">Form</option><option value="entity">Entity</option></select></label>
      </div>
      {visibleCount === 0 ? <p>{diagnostics.length === 0 ? "No problems" : "No matching problems"}</p> : groups.map((group) => <section key={group.key} className="studio-v1-problem-group" aria-label={`${groupBy}: ${group.label}`}>
        <h3>{group.label} <span>{group.problems.length}</span></h3><ul>
          {group.problems.map((diagnostic) => (
            <li key={`${diagnostic.code}:${diagnostic.entityUid ?? "form"}:${JSON.stringify(diagnostic.propertyPath)}:${diagnostic.message}`}>
              <button type="button" onClick={() => onNavigate(diagnostic)}>
                <strong><small>{diagnostic.severity}</small> <code>{diagnostic.code}</code></strong><span>{diagnostic.message}<small>{diagnostic.propertyPath === undefined ? "" : ` · property ${diagnostic.propertyPath.join(".")}`}{diagnostic.runtimePath === undefined ? "" : ` · path ${diagnostic.runtimePath.join(".") || "form"}`}{diagnostic.runtimeAddress === undefined ? "" : ` · address ${JSON.stringify(diagnostic.runtimeAddress)}`}</small></span>
              </button>
            </li>
          ))}
        </ul></section>) }
    </section>
  );
}

export function StudioV1Editor({ repository: repositoryProp }: StudioV1EditorProps) {
  const startup = useStudioDocumentStartup();
  const [compilerSession] = useState(createStudioCompilerSession);
  const repository = useMemo(() => repositoryProp ?? createIndexedDbProjectRepository({
    supportedDefinitions: STUDIO_SUPPORTED_DEFINITIONS,
  }), [repositoryProp]);
  const [history, setHistory] = useState<StudioHistoryState | undefined>(() => (
    startup.project === undefined ? undefined : createStudioHistory(startup.project)
  ));
  const repositoryRevision = useRef<number | null>(null);
  const [navigation, setNavigation] = useState<StudioEditorNavigationState>(() => {
    const activeFormUid = startup.project === undefined ? undefined : firstForm(startup.project)?.uid;
    return {
      workbench: createStudioWorkbenchState(),
      ...(activeFormUid === undefined ? {} : { activeFormUid }),
    };
  });
  const [canvasContextMenu, setCanvasContextMenu] = useState<(StudioContextMenuPosition & { readonly uid: Uid }) | undefined>();
  const [editingFragmentUid, setEditingFragmentUid] = useState<Uid | undefined>();
  const [canvasInsertMenu, setCanvasInsertMenu] = useState<(StudioContextMenuPosition & StudioInsertPlacement) | undefined>();
  const [status, setStatus] = useState("Loading local draft…");
  const [loading, setLoading] = useState(true);
  const [surface, setSurface] = useState<"design" | "preview">("design");
  const [breakpoint, setBreakpoint] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [demoId, setDemoId] = useState<string>(STUDIO_DEMO_PROJECTS[0].id);
  const [drawer, setDrawer] = useState<"insert" | "layers" | "project" | undefined>();
  const [inspectionPropertyPath, setInspectionPropertyPath] = useState<readonly (number | string)[] | undefined>();
  const [projectImportSource, setProjectImportSource] = useState("");
  const [projectTransferReport, setProjectTransferReport] = useState("No project import or export has run.");
  const [exportArtifacts, setExportArtifacts] = useState<readonly StudioGeneratedArtifact[]>([]);
  const [activeExportPath, setActiveExportPath] = useState("");
  const [projects, setProjects] = useState<readonly StudioProjectSummary[]>([]);
  const [recovery, setRecovery] = useState<readonly StudioProjectRecoverySummary[]>([]);
  const [legacyPreview, setLegacyPreview] = useState<LegacyStudioStoragePreview>({ kind: "absent" });
  const historyRef = useRef(history);
  const saveReason = useRef<"autosave" | "lifecycle" | "manual">("autosave");
  const lastSaveFailed = useRef(false);

  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => {
    const clearCanvasSelection = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest(".studio-v1-canvas") || target.closest("[data-canvas-uid]")) return;
      setCanvasContextMenu(undefined);
      setCanvasInsertMenu(undefined);
      setNavigation((current) => ({ ...current, workbench: clearStudioSelection(current.workbench) }));
    };
    document.addEventListener("pointerdown", clearCanvasSelection);
    return () => document.removeEventListener("pointerdown", clearCanvasSelection);
  }, []);
  useEffect(() => {
    const preview = previewLegacyStudioStorage(localStorage);
    setLegacyPreview(preview);
  }, []);

  const refreshRepositoryState = useCallback(async () => {
    const [nextProjects, nextRecovery] = await Promise.all([repository.list(), repository.listRecovery()]);
    setProjects(nextProjects);
    setRecovery(nextRecovery);
  }, [repository]);

  const openSnapshot = useCallback((snapshot: StudioProjectSnapshot) => {
    setEditingFragmentUid(undefined);
    const loadedForm = firstForm(snapshot.project);
    const nextHistory = createStudioHistory(snapshot.project);
    historyRef.current = nextHistory;
    setHistory(nextHistory);
    setNavigation({
      ...(loadedForm === undefined ? {} : { activeFormUid: loadedForm.uid }),
      workbench: createStudioWorkbenchState({
        expandedUids: Object.values(snapshot.project.forms).map(({ uid }) => uid),
        ...(loadedForm === undefined ? {} : { focusedUid: loadedForm.uid }),
      }),
    });
    repositoryRevision.current = snapshot.revision;
    setExportArtifacts([]);
    setActiveExportPath("");
  }, []);

  const persistCurrent = useCallback(async () => {
    const current = historyRef.current;
    if (current === undefined || !isStudioHistoryDirty(current)) return;
    const savedDocumentRevision = current.revision;
    const reason = saveReason.current;
    lastSaveFailed.current = false;
    setStatus(reason === "manual" ? "Saving local draft…" : "Autosaving local draft…");
    try {
      const saved = await repository.save(current.present, repositoryRevision.current);
      repositoryRevision.current = saved.revision;
      setHistory((latest) => {
        return latest === undefined || latest.revision !== savedDocumentRevision ? latest : markStudioHistorySaved(latest);
      });
      setStatus(reason === "manual" ? "Local draft saved" : reason === "lifecycle" ? "Local draft flushed" : "Local draft autosaved");
      await refreshRepositoryState();
    } catch (error: unknown) {
      lastSaveFailed.current = true;
      setStatus(error instanceof StudioProjectConflictError
        ? "Draft changed in another editor. Reload or restore a recovery copy before saving."
        : `Local save failed: ${platformErrorMessage(error, "Could not save the local draft.")}`);
    } finally {
      saveReason.current = "autosave";
    }
  }, [refreshRepositoryState, repository]);

  const autosave = useMemo(() => createStudioAutosave(persistCurrent), [persistCurrent]);

  useEffect(() => {
    if (startup.project === undefined) {
      setLoading(false);
      setStatus("Project import failed.");
      return;
    }
    const startupProject = startup.project;
    let active = true;
    setLoading(true);
    void repository.list().then(async (available) => {
      const preferred = available.find(({ uid }) => uid === startupProject.project.uid) ?? available[0];
      return preferred === undefined ? undefined : repository.load(preferred.uid);
    }).then(async (saved) => {
      if (!active) return;
      const project = saved?.project ?? startupProject;
      const loadedForm = firstForm(project);
      setHistory(createStudioHistory(project));
      setNavigation({
        ...(loadedForm === undefined ? {} : { activeFormUid: loadedForm.uid }),
        workbench: createStudioWorkbenchState({
          expandedUids: Object.values(project.forms).map(({ uid }) => uid),
          ...(loadedForm === undefined ? {} : { focusedUid: loadedForm.uid }),
        }),
      });
      repositoryRevision.current = saved?.revision ?? null;
      setStatus(saved === undefined ? "New local draft" : "Local draft loaded");
      setLoading(false);
      await refreshRepositoryState();
    }).catch((error: unknown) => {
      if (!active) return;
      setStatus(error instanceof Error ? `${error.message} Recovery copies are available below.` : "Could not load the local draft.");
      setLoading(false);
      void refreshRepositoryState();
    });
    return () => { active = false; };
  }, [refreshRepositoryState, repository, startup.project]);

  useEffect(() => {
    if (!loading && history !== undefined && isStudioHistoryDirty(history)) autosave.schedule();
    else autosave.cancel();
  }, [autosave, history, loading]);

  useEffect(() => {
    const flush = () => { saveReason.current = "lifecycle"; void autosave.flush(); };
    const visibility = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", visibility);
      autosave.cancel();
    };
  }, [autosave]);

  if (history === undefined) {
    return <main className="studio-v1-empty"><h2>Document v1 could not start</h2><p>{status}</p></main>;
  }
  const form = navigation.activeFormUid === undefined
    ? firstForm(history.present)
    : history.present.forms[navigation.activeFormUid];
  if (form === undefined) {
    return <main className="studio-v1-empty"><h2>This project has no forms</h2></main>;
  }
  const dirty = isStudioHistoryDirty(history);
  const outline = createStudioOutlineModel(history.present);
  const visibleOutlineUids = visibleStudioOutlineUids(outline, navigation.workbench.expandedUids);
  const selectedNodes = navigation.workbench.selectedUids.flatMap((uid) => {
    const node = form.nodes[uid];
    return node === undefined ? [] : [node];
  });
  const formSelected = navigation.workbench.selectedUids.includes(form.uid);
  const compiled = compilerSession.compile(form, history.present.fragments, {
    serviceBindings: STUDIO_PREVIEW_ASYNC_SERVICE_BINDINGS,
    localization: { defaultLocale: history.present.project.defaultLocale, resources: history.present.resources },
  });
  const canvasSourceNodes = new Map<Uid, StudioNode>(Object.entries(form.nodes) as [Uid, StudioNode][]);
  for (const [uid, entry] of compiled.sourceMap.byUid) {
    if (canvasSourceNodes.has(uid) || !entry.fragmentDefinitionUid || !entry.fragmentNodeUid) continue;
    const source = history.present.fragments[entry.fragmentDefinitionUid]?.nodes[entry.fragmentNodeUid];
    if (source) canvasSourceNodes.set(uid, source);
  }
  const insertBeforeByUid = new Map<Uid, StudioInsertPlacement>();
  for (const uid of Object.keys(form.nodes) as Uid[]) {
    const placement = locateStudioNode(form, uid);
    const parent = placement?.parentUid === null || placement === undefined ? undefined : form.nodes[placement.parentUid];
    if (placement !== undefined && parent?.kind !== "wizard" && !(parent?.kind === "collection" && isStudioVariantCollection(parent))) {
      insertBeforeByUid.set(uid, { parentUid: placement.parentUid, index: placement.index, beforeLabel: nodeLabel(form, uid) });
    }
  }

  const replaceHistory = (nextHistory: StudioHistoryState) => {
    const nextOutline = createStudioOutlineModel(nextHistory.present);
    const available = new Set(nextOutline.items.keys());
    setHistory(nextHistory);
    setNavigation((current) => ({
      ...current,
      workbench: reconcileStudioWorkbench(
        current.workbench,
        available,
        visibleStudioOutlineUids(nextOutline, current.workbench.expandedUids),
      ),
    }));
  };

  const importProject = () => {
    const result = importStudioProject(projectImportSource, { supportedDefinitions: STUDIO_SUPPORTED_DEFINITIONS });
    if (!result.ok) {
      setProjectTransferReport(result.diagnostics.map(({ code, propertyPath, message }) => `${code} at ${propertyPath.join(".") || "project"}: ${message}`).join("\n"));
      return;
    }
    const importedForm = firstForm(result.value);
    setHistory(createStudioHistory(result.value, { saved: false }));
    setNavigation({
      ...(importedForm === undefined ? {} : { activeFormUid: importedForm.uid }),
      workbench: createStudioWorkbenchState({
        expandedUids: Object.values(result.value.forms).map(({ uid }) => uid),
        ...(importedForm === undefined ? {} : { focusedUid: importedForm.uid }),
      }),
    });
    repositoryRevision.current = null;
    setExportArtifacts([]);
    setActiveExportPath("");
    setProjectTransferReport(result.migrations.length === 0
      ? "Imported and validated canonical Studio JSON; no migrations were required."
      : `Imported and validated Studio JSON. Applied: ${result.migrations.join(", ")}.`);
    setStatus("Imported project is an unsaved local draft");
  };

  const prepareExport = () => {
    const result = generateStudioExportBundle(history.present);
    if (!result.ok) {
      setExportArtifacts(result.artifacts);
      setActiveExportPath("project.stages.json");
      setProjectTransferReport(`Project JSON is ready to download. Runtime code could not be generated for ${new Set(result.diagnostics.map(({ formUid }) => formUid)).size} form(s). Other supported forms are included.\n\n${result.diagnostics.map(({ code, message, formUid, entityUid }) => `${history.present.forms[formUid!]?.title ?? formUid ?? "Project"}${entityUid === undefined ? "" : ` · ${entityUid}`}: ${message} (${code})`).join("\n")}`);
      return;
    }
    setExportArtifacts(result.value.artifacts);
    setActiveExportPath(result.value.artifacts[0]?.path ?? "");
    setProjectTransferReport(`Generated ${result.value.artifacts.length} deterministic artifacts.`);
  };

  const selectNode = (uid: Uid, options: StudioSelectionOptions = {}) => {
    setEditingFragmentUid(undefined);
    setNavigation((current) => ({
      ...current,
      workbench: selectStudioUid(current.workbench, uid, visibleOutlineUids, options),
    }));
  };
  const insertField = (
    definition: AnyStudioAuthoringFieldDefinition,
    destination: StudioInsertPlacement = { parentUid: null, index: form.rootNodeUids.length },
  ) => {
    const node = nextField(form, definition);
    const result = dispatchStudioCommand(history, {
      type: "node.insert",
      formUid: form.uid,
      parentUid: destination.parentUid,
      index: destination.index,
      node,
    }, { label: `Add ${definition.displayName}` });
    if (result.ok) {
      setHistory(result.history);
      setNavigation((current) => ({
        ...current,
        workbench: selectStudioUid(current.workbench, node.uid, [...visibleOutlineUids, node.uid]),
      }));
      setStatus(`${definition.displayName} added`);
    } else setStatus(result.failure.message);
  };

  const insertBlock = (
    definition: StudioBlockDefinition,
    destination: StudioInsertPlacement = { parentUid: null, index: form.rootNodeUids.length },
  ) => {
    const node = nextBlock(form, definition);
    const result = dispatchStudioCommand(history, {
      type: "node.insert",
      formUid: form.uid,
      parentUid: destination.parentUid,
      index: destination.index,
      node,
    }, { label: `Add ${definition.displayName}` });
    if (result.ok) {
      setHistory(result.history);
      setNavigation((current) => ({
        ...current,
        workbench: selectStudioUid(current.workbench, node.uid, [...visibleOutlineUids, node.uid]),
      }));
      setStatus(`${definition.displayName} added`);
    } else setStatus(result.failure.message);
  };

  const insertStructure = (
    kind: "collection" | "group" | "stage" | "variant" | "variant-collection" | "wizard",
    destination: StudioInsertPlacement = { parentUid: null, index: form.rootNodeUids.length },
  ) => {
    const selected = destination.parentUid === null ? (selectedNodes.length === 1 ? selectedNodes[0] : undefined) : form.nodes[destination.parentUid];
    const identity = nextStructuralIdentity(form, kind === "variant-collection" ? "items" : kind);
    let command;
    let selectedUid = identity.uid;
    if (kind === "stage") {
      if (selected?.kind !== "wizard") { setStatus("Select a wizard before adding a stage."); return; }
      command = { type: "node.insert" as const, formUid: form.uid, parentUid: selected.uid, index: selected.stageUids.length, node: { ...identity, kind: "stage" as const, childUids: [], presentation: { label: "Stage" } } };
    } else if (kind === "variant") {
      if (selected?.kind !== "collection" || !isStudioVariantCollection(selected)) { setStatus("Select a variant collection before adding a variant."); return; }
      command = { type: "node.insert" as const, formUid: form.uid, parentUid: selected.uid, index: selected.variantUids.length, node: { ...identity, kind: "variant" as const, childUids: [], presentation: { label: "Variant" } } };
    } else if (kind === "wizard") {
      const stage = nextStructuralIdentity(form, "stage");
      command = {
        type: "node.insert-subtree" as const, formUid: form.uid, parentUid: destination.parentUid, index: destination.index,
        rootUids: [identity.uid],
        nodes: {
          [identity.uid]: { ...identity, kind: "wizard" as const, stageUids: [stage.uid], initialStageUid: stage.uid, navigation: { nonLinear: false, validateCurrent: false }, presentation: { label: "Wizard" } },
          [stage.uid]: { ...stage, kind: "stage" as const, childUids: [], presentation: { label: "Stage 1" } },
        },
      };
    } else if (kind === "variant-collection") {
      const variant = nextStructuralIdentity(form, "variant");
      command = {
        type: "node.insert-subtree" as const, formUid: form.uid, parentUid: destination.parentUid, index: destination.index,
        rootUids: [identity.uid],
        nodes: {
          [identity.uid]: { ...identity, kind: "collection" as const, discriminator: "kind", variantUids: [variant.uid], initialVariantUid: variant.uid, initialRows: 0, itemKey: { kind: "index" as const }, presentation: { label: "Variant collection" } },
          [variant.uid]: { ...variant, kind: "variant" as const, childUids: [], presentation: { label: "Variant 1" } },
        },
      };
    } else {
      command = {
        type: "node.insert" as const, formUid: form.uid, parentUid: destination.parentUid, index: destination.index,
        node: { ...identity, kind, childUids: [], ...(kind === "collection" ? { initialRows: 0, itemKey: { kind: "index" as const } } : {}), presentation: { label: kind === "group" ? "Group" : "Collection" } },
      };
    }
    const result = dispatchStudioCommand(history, command, { label: `Add ${kind}` });
    if (!result.ok) { setStatus(result.failure.message); return; }
    setHistory(result.history);
    setNavigation((current) => ({
      ...current,
      workbench: selectStudioUid({ ...current.workbench, expandedUids: new Set([...current.workbench.expandedUids, ...(command.parentUid === null ? [] : [command.parentUid]), selectedUid]) }, selectedUid, [...visibleOutlineUids, selectedUid]),
    }));
    setStatus(`${kind} added`);
  };

  const insertMenuItems = (destination: StudioInsertPlacement): readonly StudioInsertMenuItem[] => {
    const parentKind = destination.parentUid === null ? "root" : form.nodes[destination.parentUid]?.kind;
    const allowed = (kind: StudioNode["kind"]) => parentKind !== undefined && canPlaceStudioNode(parentKind, kind);
    return [
      ...Object.values(STUDIO_FIELD_DEFINITIONS).map((definition) => ({
        group: "fields" as const,
        label: `Insert ${definition.displayName.toLowerCase()}`,
        disabled: !allowed("field"),
        onSelect: () => insertField(definition, destination),
      })),
      ...Object.values(STUDIO_BLOCK_DEFINITIONS).map((definition) => ({
        group: "content" as const,
        label: `Insert ${definition.displayName.toLowerCase()}`,
        disabled: !allowed("block"),
        onSelect: () => insertBlock(definition, destination),
      })),
      ...Object.values(history.present.fragments).map((fragment) => ({
        group: "structure" as const, label: `Insert ${fragment.title}`, disabled: !allowed("fragment"),
        onSelect: () => insertFragment(fragment, destination),
      })),
      ...(["group", "collection", "wizard", "variant-collection"] as const).map((kind) => ({
        group: "structure" as const,
        label: `Insert ${kind === "variant-collection" ? "variant collection" : kind}`,
        disabled: !allowed(kind === "variant-collection" ? "collection" : kind),
        onSelect: () => insertStructure(kind, destination),
      })),
    ];
  };

  const updateNode = (
    node: StudioNode,
    changes: Readonly<Record<string, unknown>>,
    label: string,
    coalesceKey?: string,
  ) => {
    const result = dispatchStudioCommand(history, {
      type: "node.update",
      formUid: form.uid,
      uid: node.uid,
      changes,
    }, { label, ...(coalesceKey === undefined ? {} : { coalesceKey }) });
    if (result.ok) setHistory(result.history);
    else setStatus(result.failure.message);
  };

  const updateFormValidators = (validators: readonly StudioValidatorSpec[] | undefined, label: string) => {
    const result = dispatchStudioCommand(history, { type: "form.update", formUid: form.uid, changes: { validators } }, { label, coalesceKey: `validators:${form.uid}` });
    if (result.ok) setHistory(result.history);
    else setStatus(result.failure.message);
  };

  const updateResources = (resources: StudioResourceCatalog) => {
    const validated = validateStudioProject({ ...history.present, resources }, { supportedDefinitions: STUDIO_SUPPORTED_DEFINITIONS });
    if (!validated.ok) {
      setStatus(validated.diagnostics.find(({ propertyPath }) => propertyPath[0] === "resources")?.message ?? "Resource catalog is invalid.");
      return;
    }
    const result = dispatchStudioCommand(history, { type: "project.resources.update", resources }, { label: "Edit extension and locale resources", coalesceKey: "project.resources" });
    if (result.ok) setHistory(result.history); else setStatus(result.failure.message);
  };

  const updateFormEvents = (events: readonly StudioEventDefinition[] | undefined, label: string) => {
    const result = dispatchStudioCommand(history, { type: "form.update", formUid: form.uid, changes: { events } }, { label, coalesceKey: `events:${form.uid}` });
    if (result.ok) setHistory(result.history);
    else setStatus(result.failure.message);
  };

  const updateFormTransforms = (transforms: readonly StudioLogicRule[] | undefined, label: string) => {
    const result = dispatchStudioCommand(history, { type: "form.update", formUid: form.uid, changes: { transforms } }, { label, coalesceKey: `transforms:${form.uid}` });
    if (result.ok) setHistory(result.history);
    else setStatus(result.failure.message);
  };

  const updateBulkSelection = (updates: readonly { readonly node: StudioNode; readonly changes: Readonly<Record<string, unknown>> }[], label: string): string | undefined => {
    const result = dispatchStudioCommand(history, {
      type: "transaction", label,
      commands: updates.map(({ node, changes }) => ({ type: "node.update" as const, formUid: form.uid, uid: node.uid, changes })),
    });
    if (!result.ok) { setStatus(result.failure.message); return result.failure.message; }
    setHistory(result.history);
    setStatus(`${updates.length} items updated`);
    return undefined;
  };

  const addScenario = (): StudioScenario | undefined => {
    const number = form.scenarios.length + 1;
    const scenario: StudioScenario = {
      uid: nextProjectUid(history.present, `scenario_${number}`),
      title: `Scenario ${number}`,
      value: createEmptyStudioScenarioValue(form, history.present.fragments),
      context: {},
      extensions: {},
      services: {},
    };
    const result = dispatchStudioCommand(history, { type: "scenario.insert", formUid: form.uid, index: form.scenarios.length, scenario }, { label: `Add ${scenario.title}` });
    if (!result.ok) { setStatus(result.failure.message); return undefined; }
    setHistory(result.history);
    setStatus(`${scenario.title} added`);
    return scenario;
  };

  const updateScenario = (scenario: StudioScenario, changes: Partial<Pick<StudioScenario, "title" | "value" | "context" | "extensions" | "services">>) => {
    const result = dispatchStudioCommand(history, { type: "scenario.update", formUid: form.uid, uid: scenario.uid, changes }, { label: `Edit ${scenario.title}`, coalesceKey: `scenario:${scenario.uid}:${Object.keys(changes)[0] ?? "settings"}` });
    if (result.ok) setHistory(result.history); else setStatus(result.failure.message);
  };

  const createFragment = (uids: readonly Uid[] = selectedNodes.map(({ uid }) => uid)) => {
    if (uids.length === 0) { setStatus("Select one or more nodes to create a fragment."); return; }
    const number = Object.keys(history.present.fragments).length + 1;
    const fragmentUid = nextProjectUid(history.present, `fragment_${number}`);
    const instanceUid = nextProjectUid(history.present, `fragment_instance_${number}`);
    const instance: StudioFragmentInstanceNode = { uid: instanceUid, kind: "fragment", runtimeId: nextStructuralIdentity(form, "fragment").runtimeId, fragmentUid };
    const result = dispatchStudioCommand(history, {
      type: "fragment.create",
      formUid: form.uid,
      uids,
      fragment: { uid: fragmentUid, title: `Fragment ${number}`, version: 1, parameters: [] },
      instance,
    }, { label: `Create Fragment ${number}` });
    if (!result.ok) { setStatus(result.failure.message); return; }
    replaceHistory(result.history);
    setNavigation((current) => ({ ...current, workbench: selectStudioUid(current.workbench, instanceUid, [...visibleOutlineUids, instanceUid]) }));
    setEditingFragmentUid(undefined);
    setStatus(`Fragment ${number} created`);
  };

  const fragmentDestination = (): StudioInsertPlacement => {
    const selected = selectedNodes.length === 1 ? selectedNodes[0] : undefined;
    if (selected && "childUids" in selected && selected.childUids && canPlaceStudioNode(selected.kind, "fragment")) {
      return { parentUid: selected.uid, index: selected.childUids.length };
    }
    const before = selected ? insertBeforeByUid.get(selected.uid) : undefined;
    return before ? { parentUid: before.parentUid, index: before.index + 1 } : { parentUid: null, index: form.rootNodeUids.length };
  };

  const insertFragment = (fragment: StudioFragmentDefinition, destination: StudioInsertPlacement = fragmentDestination()) => {
    const uid = nextProjectUid(history.present, `${fragment.uid}_instance`);
    const runtimeIds = new Set(Object.values(form.nodes).flatMap((node) => node.kind === "block" ? [] : [node.runtimeId]));
    let suffix = 1;
    let runtimeId = fragment.title.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase().slice(0, 118) || "fragment";
    while (runtimeIds.has(runtimeId)) runtimeId = `${runtimeId.replace(/\d+$/, "")}${++suffix}`;
    const result = dispatchStudioCommand(history, {
      type: "fragment.insert",
      formUid: form.uid,
      parentUid: destination.parentUid,
      index: destination.index,
      instance: { uid, kind: "fragment", runtimeId, fragmentUid: fragment.uid },
    }, { label: `Insert ${fragment.title}` });
    if (!result.ok) { setStatus(result.failure.message); return; }
    replaceHistory(result.history);
    setNavigation((current) => ({ ...current, workbench: selectStudioUid({ ...current.workbench, expandedUids: new Set([...current.workbench.expandedUids, ...(destination.parentUid ? [destination.parentUid] : [])]) }, uid, [...visibleOutlineUids, uid]) }));
    setEditingFragmentUid(undefined);
    setStatus(`${fragment.title} inserted`);
  };

  const updateFragmentNode = (node: StudioNode, changes: Readonly<Record<string, unknown>>, label: string, coalesceKey?: string) => {
    if (!editingFragmentUid) return;
    const result = dispatchStudioCommand(history, { type: "fragment.node.update", fragmentUid: editingFragmentUid, uid: node.uid, changes },
      { label, ...(coalesceKey ? { coalesceKey: `${editingFragmentUid}:${coalesceKey}` } : {}) });
    if (result.ok) setHistory(result.history); else setStatus(result.failure.message);
  };

  const updateFragment = (fragment: StudioFragmentDefinition, title: string) => {
    const result = dispatchStudioCommand(history, { type: "fragment.update", fragmentUid: fragment.uid, changes: { title } }, { label: "Rename fragment", coalesceKey: `fragment.title:${fragment.uid}` });
    if (result.ok) setHistory(result.history); else setStatus(result.failure.message);
  };

  const detachFragment = (instance: StudioFragmentInstanceNode, fragment: StudioFragmentDefinition) => {
    const uidMap = Object.fromEntries(Object.keys(fragment.nodes).map((uid) => [uid, nextProjectUid(history.present, `detached_${uid}`)])) as Readonly<Record<Uid, Uid>>;
    const result = dispatchStudioCommand(history, { type: "fragment.detach", formUid: form.uid, uid: instance.uid, uidMap }, { label: `Detach ${fragment.title}` });
    if (result.ok) { replaceHistory(result.history); setStatus(`${fragment.title} detached`); }
    else setStatus(result.failure.message);
  };

  const {
    moveNodes, deleteNodes, duplicateNodes, moveNode, dropNode, copyNodes, cutNodes, pasteNodes, groupNodes, ungroupNode, convertNode,
  } = createStudioStructuralActions({ history, form, navigation, replaceHistory, setNavigation, setStatus });

  const designKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (surface !== "design" || loading || event.defaultPrevented || event.nativeEvent.isComposing
      || target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="menu"], [role="dialog"]')
      || !target.closest(".studio-v1-canvas, .studio-v1-outline")) return;
    const primary = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();
    const uids = navigation.workbench.selectedUids.filter((uid) => form.nodes[uid] !== undefined);
    let action: (() => void) | undefined;
    if (primary && !event.altKey) {
      if (key === "c" && uids.length) action = () => { copyNodes(uids); };
      else if (key === "x" && uids.length) action = () => cutNodes(uids);
      else if (key === "v") action = () => pasteNodes(uids.length === 1 ? uids[0] : undefined);
      else if (key === "d" && uids.length) action = () => duplicateNodes(uids);
      else if (key === "g" && uids.length) action = () => {
        if (event.shiftKey && uids.length === 1) ungroupNode(uids[0]!);
        else if (!event.shiftKey) groupNodes(uids);
      };
      else if (key === "z") action = () => replaceHistory(event.shiftKey ? redoStudioHistory(history) : undoStudioHistory(history));
      else if (key === "y") action = () => replaceHistory(redoStudioHistory(history));
      else if (key === "a") action = () => setNavigation((current) => ({ ...current, workbench: { ...current.workbench, selectedUids: form.rootNodeUids } }));
    } else if (!primary && !event.altKey && !event.shiftKey) {
      if (key === "backspace" && uids.length) action = () => cutNodes(uids);
      else if (key === "delete" && uids.length) action = () => deleteNodes(uids);
      else if (key === "escape") action = () => setNavigation((current) => ({ ...current, workbench: clearStudioSelection(current.workbench) }));
    }
    if (!action && !primary && target.closest(".studio-v1-canvas") && uids.length) {
      const direction = key === "arrowup" ? "up" : key === "arrowdown" ? "down" : key === "arrowleft" ? "out" : key === "arrowright" ? "in" : undefined;
      if (direction) action = () => moveNodes(uids, direction);
    }
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    // Keep keyboard ownership when moving or removing the focused node unmounts it.
    target.closest<HTMLElement>(".studio-v1-canvas, .studio-v1-outline")?.focus({ preventScroll: true });
    action();
  };

  const contextItems = (uid: Uid, uids: readonly Uid[], position: StudioContextMenuPosition): readonly StudioInsertMenuItem[] => {
    const node = form.nodes[uid];
    if (!node) return [];
    const nodes = uids.flatMap((selectedUid) => form.nodes[selectedUid] ? [form.nodes[selectedUid]!] : []);
    const items: StudioInsertMenuItem[] = [];
    const add = (label: string, onSelect: () => void) => items.push({ group: "structure", label, onSelect });
    if (nodes.length > 0) add("Create fragment from selection", () => createFragment(uids));
    if (nodes.length === 1) {
      if (node.kind === "wizard") {
        add("Add stage", () => insertStructure("stage", { parentUid: uid, index: node.stageUids.length }));
        add(node.navigation?.nonLinear ? "Use sequential navigation" : "Allow free navigation", () => updateNode(node, { navigation: { ...node.navigation, nonLinear: !node.navigation?.nonLinear } }, "Change wizard navigation"));
      } else if (node.kind === "collection" && isStudioVariantCollection(node)) {
        add("Add variant", () => insertStructure("variant", { parentUid: uid, index: node.variantUids.length }));
      } else if (node.kind === "group" || node.kind === "stage" || node.kind === "variant" || node.kind === "collection") {
        add("Add item…", () => setCanvasInsertMenu({ ...position, parentUid: uid, index: node.childUids?.length ?? 0 }));
      }
      const placement = locateStudioNode(form, uid);
      const parent = placement?.parentUid ? form.nodes[placement.parentUid] : undefined;
      if (node.kind === "stage" && parent?.kind === "wizard" && parent.initialStageUid !== uid) {
        add("Make initial stage", () => updateNode(parent, { initialStageUid: uid }, "Set initial stage"));
      }
      if (node.kind === "variant" && parent?.kind === "collection" && isStudioVariantCollection(parent) && parent.initialVariantUid !== uid) {
        add("Make initial variant", () => updateNode(parent, { initialVariantUid: uid }, "Set initial variant"));
      }
      if (node.kind === "fragment") {
        const fragment = history.present.fragments[node.fragmentUid];
        if (fragment) add("Edit shared contents", () => setEditingFragmentUid(fragment.uid));
        if (fragment) add("Detach fragment", () => detachFragment(node, fragment));
      }
      const before = insertBeforeByUid.get(uid);
      if (before) {
        add("Insert before…", () => setCanvasInsertMenu({ ...position, ...before }));
        add("Insert after…", () => setCanvasInsertMenu({ ...position, parentUid: before.parentUid, index: before.index + 1 }));
      }
    }
    if (nodes.length > 0 && nodes.every((item) => item.kind === "field")) {
      const required = nodes.every((item) => item.validators?.some((validator) => validator.kind === "required"));
      const label = required ? "Make optional" : "Make required";
      add(label, () => updateBulkSelection(nodes.map((item) => ({ node: item, changes: {
        validators: required ? item.validators?.filter((validator) => validator.kind !== "required")
          : item.validators?.some((validator) => validator.kind === "required") ? item.validators : [...(item.validators ?? []), { kind: "required" }],
      } })), label));
    }
    if (nodes.length > 0 && nodes.every((item) => typeof item.behavior?.disabled !== "object")) {
      const disabled = nodes.every((item) => item.behavior?.disabled === true);
      const label = disabled ? "Enable" : "Disable";
      add(label, () => updateBulkSelection(nodes.map((item) => ({ node: item, changes: { behavior: { ...item.behavior, disabled: !disabled } } })), label));
    }
    if (nodes.length > 0) {
      add("Duplicate", () => duplicateNodes(uids));
      add("Delete", () => deleteNodes(uids));
    }
    return items;
  };

  const navigateProblem = (diagnostic: StudioProblem) => {
    const targetUid = diagnostic.entityUid ?? diagnostic.formUid;
    if (targetUid === undefined) return;
    setNavigation((current) => ({
      ...current,
      ...(diagnostic.formUid === undefined ? {} : { activeFormUid: diagnostic.formUid }),
      workbench: revealStudioUid(current.workbench, targetUid, outline.parentByUid),
    }));
    setInspectionPropertyPath(diagnostic.propertyPath);
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-outline-uid="${targetUid}"]`)?.scrollIntoView({ block: "nearest" });
      document.querySelector<HTMLElement>(`[data-canvas-uid="${targetUid}"]`)?.scrollIntoView({ block: "nearest" });
      document.querySelector<HTMLElement>(".studio-v1-inspector")?.focus();
    });
  };

  const save = async () => {
    saveReason.current = "manual";
    autosave.schedule();
    await autosave.flush();
  };

  const openProject = async (uid: Uid) => {
    saveReason.current = "lifecycle";
    await autosave.flush();
    if (lastSaveFailed.current) { setStatus("Could not switch projects because pending changes are not saved."); return; }
    setLoading(true);
    try {
      const snapshot = await repository.load(uid);
      if (snapshot === undefined) throw new Error("The selected project no longer exists.");
      openSnapshot(snapshot);
      setStatus("Local draft loaded");
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Could not open the selected project.");
    } finally { setLoading(false); await refreshRepositoryState(); }
  };

  const createProject = async (duplicate = false) => {
    saveReason.current = "lifecycle";
    await autosave.flush();
    if (lastSaveFailed.current) { setStatus("Could not create a project because pending changes are not saved."); return; }
    const title = duplicate ? `${history.present.project.title} copy` : "Untitled project";
    const project = copyStudioProject(history.present, projectUidFromRandomId(), title);
    setLoading(true);
    try {
      const snapshot = await repository.save(project, null);
      openSnapshot(snapshot);
      setStatus(duplicate ? "Project duplicated" : "Project created");
      await refreshRepositoryState();
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Could not create the project.");
    } finally { setLoading(false); }
  };

  const loadDemo = async () => {
    const demo = STUDIO_DEMO_PROJECTS.find(({ id }) => id === demoId);
    if (demo === undefined || loading) return;
    setLoading(true);
    saveReason.current = "lifecycle";
    try {
      autosave.schedule();
      await autosave.flush();
      if (lastSaveFailed.current) { setStatus("Could not open the demo because pending changes are not saved."); return; }
      const snapshot = await repository.save(copyStudioProject(demo.project, projectUidFromRandomId(), demo.project.project.title), null);
      openSnapshot(snapshot);
      setStatus(`${demo.project.project.title} opened as a new project`);
      await refreshRepositoryState();
    } catch (error: unknown) {
      setStatus(platformErrorMessage(error, "Could not open the demo."));
    } finally { setLoading(false); }
  };

  const renameProject = (title: string) => {
    const result = dispatchStudioCommand(history, { type: "project.update", changes: { title } }, { label: "Rename project", coalesceKey: "project.title" });
    if (result.ok) { setHistory(result.history); setStatus("Project renamed; autosave pending"); }
    else setStatus(result.failure.message);
  };

  const deleteProject = async () => {
    saveReason.current = "lifecycle";
    await autosave.flush();
    if (lastSaveFailed.current) { setStatus("Could not delete the project because pending changes are not saved."); return; }
    const expectedRevision = repositoryRevision.current;
    if (expectedRevision === null) { setStatus("Save the project before deleting it."); return; }
    autosave.cancel();
    setLoading(true);
    try {
      await repository.delete(history.present.project.uid, expectedRevision);
      const remaining = await repository.list();
      const next = remaining[0] === undefined ? undefined : await repository.load(remaining[0].uid);
      if (next) openSnapshot(next);
      else {
        const project = copyStudioProject(history.present, projectUidFromRandomId(), "Untitled project");
        const created = createStudioHistory(project, { saved: false });
        historyRef.current = created;
        setHistory(created);
        repositoryRevision.current = null;
      }
      setStatus("Project moved to recovery");
      await refreshRepositoryState();
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Could not delete the project.");
    } finally { setLoading(false); }
  };

  const restoreProject = async (entry: StudioProjectRecoverySummary) => {
    const expected = entry.projectUid === history.present.project.uid ? repositoryRevision.current : null;
    setLoading(true);
    try {
      const restored = await repository.restore(entry.id, expected);
      openSnapshot(restored);
      setStatus(`Recovered ${entry.title} from ${entry.kind} revision ${entry.revision}`);
      await refreshRepositoryState();
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Could not restore the recovery copy.");
    } finally { setLoading(false); }
  };

  const reloadProject = async () => {
    setLoading(true);
    try {
      const snapshot = await repository.load(history.present.project.uid);
      if (snapshot === undefined) throw new Error("The confirmed project no longer exists.");
      openSnapshot(snapshot);
      lastSaveFailed.current = false;
      setStatus("Confirmed project reloaded; unsaved in-memory changes were discarded");
      await refreshRepositoryState();
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Could not reload the confirmed project.");
    } finally { setLoading(false); }
  };

  const discardRecovery = async (id: string) => {
    await repository.discardRecovery(id);
    setStatus("Recovery copy permanently discarded");
    await refreshRepositoryState();
  };

  const migrateLegacy = async () => {
    if (legacyPreview.kind !== "ready") return;
    const imported = importStudioLegacyInput(legacyPreview.input, {
      projectUid: projectUidFromRandomId(),
      formUid: toUid(`form_${crypto.randomUUID().replaceAll("-", "_")}`),
    });
    if (!imported.ok) {
      setStatus(`Legacy migration failed: ${imported.diagnostics[0]?.message ?? "unknown input"}`);
      return;
    }
    setLoading(true);
    try {
      const saved = await repository.save(imported.value, null);
      localStorage.removeItem(LEGACY_STUDIO_STORAGE_KEY);
      setLegacyPreview({ kind: "absent" });
      openSnapshot(saved);
      setStatus(`Legacy project migrated with ${imported.diagnostics.length} diagnostic(s)`);
      await refreshRepositoryState();
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Could not migrate the legacy project.");
    } finally { setLoading(false); }
  };

  return (
    <main onKeyDown={designKeyDown} className="studio-v1-editor" data-testid="studio-v1-editor" data-preview-breakpoint={breakpoint} aria-busy={loading}>
      <header className="studio-v1-toolbar">
        <div><strong>{history.present.project.title}</strong><span data-project-dirty={dirty}>{dirty ? "Unsaved project changes" : "Project saved"}</span><span data-preview-state="session-local">Preview session is separate</span></div>
        <nav className="studio-v1-demo-picker" aria-label="Demo forms">
          <label className="studio-sr-only" htmlFor="studio-demo-form">Demo form</label>
          <select title={STUDIO_DEMO_PROJECTS.find(({ id }) => id === demoId)?.description} id="studio-demo-form" value={demoId} disabled={loading} onChange={(event) => setDemoId(event.currentTarget.value)}>
            {STUDIO_DEMO_PROJECTS.map((demo) => <option key={demo.id} value={demo.id}>{demo.label}</option>)}
          </select>
          <Button size="sm" variant="outline" disabled={loading} onClick={() => void loadDemo()}>Open demo</Button>
        </nav>
        <nav className="studio-v1-toolbar__drawers" aria-label="Workbench panels">
          {(["project", "layers", "insert"] as const).map((panel) => <Button
            key={panel}
            variant={drawer === panel ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={drawer === panel}
            onClick={() => setDrawer((current) => current === panel ? undefined : panel)}
          >{panel === "project" ? <FolderOpen size={15} aria-hidden="true" /> : panel === "layers" ? <Layers size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}{panel[0]!.toUpperCase() + panel.slice(1)}{panel === "project" && legacyPreview.kind !== "absent" ? <span className="studio-v1-toolbar__notice" aria-hidden="true" title="Legacy project available" /> : null}</Button>)}
        </nav>
        <nav className="studio-v1-toolbar__surface" aria-label="Studio mode">
          <Button variant={surface === "design" ? "secondary" : "ghost"} size="sm" aria-pressed={surface === "design"} onClick={() => setSurface("design")}><MousePointer2 size={14} aria-hidden="true" />Design</Button>
          <Button variant={surface === "preview" ? "secondary" : "ghost"} size="sm" aria-pressed={surface === "preview"} onClick={() => setSurface("preview")}><Eye size={14} aria-hidden="true" />Preview</Button>
        </nav>
        <nav className="studio-v1-toolbar__breakpoints" aria-label="Preview breakpoint">
          {([{ id: "desktop", label: "Desktop", width: 1024, icon: Monitor }, { id: "tablet", label: "Tablet", width: 768, icon: Tablet }, { id: "mobile", label: "Mobile", width: 390, icon: Smartphone }] as const).map(({ id, label, width, icon: Icon }) =>
            <Button key={id} size="icon" aria-label={label} variant={breakpoint === id ? "secondary" : "ghost"} aria-pressed={breakpoint === id} title={`${label} · ${width}px`} onClick={() => setBreakpoint(id)}><Icon size={15} aria-hidden="true" /></Button>)}
        </nav>
        <nav className="studio-v1-toolbar__history" aria-label="Document history">
          <EditorTooltip label="Undo"><Button variant="ghost" size="icon" aria-label="Undo" disabled={loading || history.past.length === 0} onClick={() => replaceHistory(undoStudioHistory(history))}><Undo2 size={16} aria-hidden="true" /></Button></EditorTooltip>
          <EditorTooltip label="Redo"><Button variant="ghost" size="icon" aria-label="Redo" disabled={loading || history.future.length === 0} onClick={() => replaceHistory(redoStudioHistory(history))}><Redo2 size={16} aria-hidden="true" /></Button></EditorTooltip>
          <Button size="sm" disabled={loading || !dirty} onClick={() => void save()}><Save size={14} aria-hidden="true" />Save draft</Button>
        </nav>
        <StudioHelp />
      </header>
      <div className="studio-v1-workspace" data-surface={surface} data-drawer-open={drawer !== undefined}>
        {drawer !== undefined && <aside className="studio-v1-left-panel" aria-label={`${drawer} panel`}>
          <div className="studio-v1-drawer-heading"><strong>{drawer[0]!.toUpperCase() + drawer.slice(1)}</strong><Button variant="ghost" size="sm" aria-label={`Close ${drawer} panel`} onClick={() => setDrawer(undefined)}><X size={15} aria-hidden="true" /></Button></div>
          {drawer === "project" && <>
            <StudioProjectPanel key={history.present.project.uid}
              projects={projects} recovery={recovery} activeUid={history.present.project.uid} title={history.present.project.title}
              legacy={legacyPreview} disabled={loading} onOpen={(uid) => void openProject(uid)} onReload={() => void reloadProject()}
              onCreate={() => void createProject(false)} onDuplicate={() => void createProject(true)} onRename={renameProject}
              onDelete={() => void deleteProject()} onRestore={(entry) => void restoreProject(entry)}
              onDiscardRecovery={(id) => void discardRecovery(id)} onMigrateLegacy={() => void migrateLegacy()}
            />
            <div className="studio-project-advanced">
            <InspectorSection title="Import & export" icon={ArrowDownToLine} defaultOpen={false}>
            <section className="studio-v1-palette" aria-labelledby="studio-v1-project-transfer-title">
              <h2 id="studio-v1-project-transfer-title" className="studio-sr-only">Import & export</h2>
              <label className="studio-field"><span>Studio project JSON</span><textarea className="ui-input" rows={8} value={projectImportSource} onChange={(event) => setProjectImportSource(event.currentTarget.value)} /></label>
              <Button variant="outline" disabled={loading} onClick={() => setProjectImportSource(serializeStudioProject(history.present))}><Braces size={14} aria-hidden="true" />Use current canonical JSON</Button>
              <Button variant="outline" disabled={loading || projectImportSource.trim() === ""} onClick={importProject}><ArrowUpFromLine size={14} aria-hidden="true" />Import and validate</Button>
              <Button variant="outline" disabled={loading} onClick={prepareExport}><ArrowDownToLine size={14} aria-hidden="true" />Generate export artifacts</Button>
              <p role="status" aria-live="polite" style={{ whiteSpace: "pre-wrap" }}>{projectTransferReport}</p>
              {exportArtifacts.length > 0 && <>
                <label className="studio-field"><span>Generated artifact</span><select value={activeExportPath} onChange={(event) => setActiveExportPath(event.currentTarget.value)}>{exportArtifacts.map((artifact) => <option key={artifact.path} value={artifact.path}>{artifact.path}</option>)}</select></label>
                <a className="ui-button ui-button--outline ui-button--default-size" download={activeExportPath.replaceAll("/", "-")} href={`data:${exportArtifacts.find(({ path }) => path === activeExportPath)?.mediaType ?? "text/plain"};charset=utf-8,${encodeURIComponent(exportArtifacts.find(({ path }) => path === activeExportPath)?.source ?? "")}`}>Download artifact</a>
                <label className="studio-field"><span>Artifact source</span><textarea className="ui-input" rows={12} readOnly value={exportArtifacts.find(({ path }) => path === activeExportPath)?.source ?? ""} /></label>
              </>}
            </section>
            </InspectorSection>
            <InspectorSection title="Extensions & locales" icon={Languages} defaultOpen={false}>
              <ResourceCatalogEditor key={history.present.project.uid} resources={history.present.resources} onUpdate={updateResources} />
            </InspectorSection>
            </div>
          </>}
          {drawer === "layers" && <StudioOutline
            project={history.present} state={navigation.workbench}
            onChange={(workbench) => setNavigation((current) => ({ ...current, workbench }))}
            onActivateForm={(activeFormUid) => { setEditingFragmentUid(undefined); setNavigation((current) => ({ ...current, activeFormUid })); }}
            onMove={moveNode} onDrop={dropNode} onCopy={copyNodes} onCut={cutNodes} onPaste={pasteNodes}
            onGroup={groupNodes} onUngroup={ungroupNode} onConvert={convertNode}
            contextItems={contextItems}
            onCreateFragment={() => createFragment()} canCreateFragment={!loading && selectedNodes.length > 0}
            onInsertFragment={(uid) => insertFragment(history.present.fragments[uid]!)} onEditFragment={setEditingFragmentUid}
            canPaste={navigation.clipboard !== undefined}
          />}
          {drawer === "insert" && <>
            <section className="studio-v1-palette" aria-labelledby="studio-v1-palette-title">
              <h2 id="studio-v1-palette-title">Fields</h2>
              {Object.values(STUDIO_FIELD_DEFINITIONS).map((definition) => <Button key={definition.key} variant="outline" disabled={loading} onClick={() => insertField(definition)}><StudioItemIcon kind={definition.key} /><span>Add {definition.displayName.toLowerCase()}</span><Plus className="studio-palette-add" size={13} aria-hidden="true" /></Button>)}
            </section>
            <section className="studio-v1-palette" aria-labelledby="studio-v1-content-palette-title">
              <h2 id="studio-v1-content-palette-title">Content</h2>
              {Object.values(STUDIO_BLOCK_DEFINITIONS).map((definition) => <Button key={definition.key} variant="outline" disabled={loading} onClick={() => insertBlock(definition)}><StudioItemIcon kind={definition.key} /><span>Add {definition.displayName.toLowerCase()}</span><Plus className="studio-palette-add" size={13} aria-hidden="true" /></Button>)}
            </section>
            <section className="studio-v1-palette" aria-labelledby="studio-v1-structure-palette-title">
              <h2 id="studio-v1-structure-palette-title">Structure</h2>
              <Button variant="outline" disabled={loading} onClick={() => insertStructure("group")}>Add group</Button>
              <Button variant="outline" disabled={loading} onClick={() => insertStructure("collection")}>Add collection</Button>
              <Button variant="outline" disabled={loading} onClick={() => insertStructure("variant-collection")}>Add variant collection</Button>
              <Button variant="outline" disabled={loading} onClick={() => insertStructure("wizard")}>Add wizard</Button>
              <Button variant="outline" disabled={loading} onClick={() => insertStructure("stage")}>Add stage to selected wizard</Button>
              <Button variant="outline" disabled={loading} onClick={() => insertStructure("variant")}>Add variant to selected collection</Button>
            </section>
            <section className="studio-v1-palette" aria-labelledby="studio-v1-fragment-palette-title">
              <h2 id="studio-v1-fragment-palette-title">Fragments</h2>
              <Button variant="outline" disabled={loading || selectedNodes.length === 0} onClick={() => createFragment()}>Create fragment from selection</Button>
              {Object.values(history.present.fragments).map((fragment) => <Button key={fragment.uid} variant="outline" disabled={loading} onClick={() => insertFragment(fragment)}>Insert {fragment.title}</Button>)}
            </section>
          </>}
        </aside>}
        {surface === "design" ? <>
          <section className="studio-v1-canvas" aria-label="Canvas" tabIndex={-1}>
            <ControlledPreview key={`${history.present.project.uid}:${form.uid}`}
              form={compiled.expandedForm} compiled={compiled} project={history.present.project} resources={history.present.resources}
              defaultLocale={history.present.project.defaultLocale} onNavigateProblem={navigateProblem}
              onUpdateScenario={updateScenario} onAddScenario={addScenario} variant="canvas"
              authoring={{
                breakpoint,
                sourceNodes: canvasSourceNodes,
                onWidth: (uid, width) => {
                  const node = form.nodes[uid];
                  if (!node) return;
                  const layout = studioPresentationLayout(node.presentation ?? {});
                  updateNode(node, { presentation: { ...node.presentation, layout: { ...layout, width: { ...layout.width, [breakpoint]: width } } } }, `Edit ${breakpoint} width`);
                },
                selectedUids: navigation.workbench.selectedUids,
                selectableUids: new Set(Object.keys(form.nodes) as Uid[]),
                insertBeforeByUid,
                onSelect: selectNode,
                onDrop: dropNode,
                onContextMenu: (uid, position) => {
                  setCanvasInsertMenu(undefined);
                  setCanvasContextMenu({ uid, ...position });
                },
                onInsertContextMenu: (placement, position) => {
                  setCanvasContextMenu(undefined);
                  setCanvasInsertMenu({ ...placement, ...position });
                },
              }}
            />
          </section>
          <aside className="studio-v1-inspector" aria-labelledby="studio-v1-inspector-title" tabIndex={-1} data-inspector-property={inspectionPropertyPath?.join(".")}>
          <h2 id="studio-v1-inspector-title"><SlidersHorizontal size={14} aria-hidden="true" />Inspector<span className="studio-inspector-caption">Design</span></h2>
          {inspectionPropertyPath !== undefined && <p role="status">Inspecting property: <code>{inspectionPropertyPath.join(".")}</code></p>}
          {editingFragmentUid && history.present.fragments[editingFragmentUid] ? <FragmentDefinitionInspector
            key={`${history.present.project.uid}:${editingFragmentUid}`}
            fragment={history.present.fragments[editingFragmentUid]} form={form} fragments={history.present.fragments}
            onUpdate={updateFragmentNode} onUpdateFragment={updateFragment} onEditFragment={setEditingFragmentUid}
            onClose={() => setEditingFragmentUid(undefined)}
          /> : formSelected ? <>
            <StudioEventEditor events={form.events} form={form} references={expressionReferences(form)} onChange={updateFormEvents} />
            <StudioLogicEditor kind="transform" rules={form.transforms} form={form} references={expressionReferences(form)} onChange={updateFormTransforms} />
            <StudioValidationEditor
              target="form"
              validators={form.validators}
              references={expressionReferences(form)}
              ownerLabel="form"
              onChange={updateFormValidators}
            />
          </> : <SelectionInspector
            key={selectedNodes.map(({ uid }) => uid).join("\u0000")}
            nodes={selectedNodes}
            form={form}
            fragments={history.present.fragments}
            onUpdate={updateNode}
            onUpdateFragment={updateFragment}
            onEditFragment={setEditingFragmentUid}
            onDetach={detachFragment}
            onBulkUpdate={updateBulkSelection}
          />}
          </aside>
          {canvasContextMenu !== undefined && form.nodes[canvasContextMenu.uid] !== undefined && (() => {
            const node = form.nodes[canvasContextMenu.uid]!;
            const actionUids = navigation.workbench.selectedUids.includes(node.uid)
              ? navigation.workbench.selectedUids
              : [node.uid];
            return <StudioNodeContextMenu
              items={contextItems(node.uid, actionUids, canvasContextMenu)}
              node={node} actionUids={actionUids} position={canvasContextMenu}
              canPaste={navigation.clipboard !== undefined} onClose={() => setCanvasContextMenu(undefined)}
              onMove={(direction) => moveNode(node.uid, direction)} onGroup={() => groupNodes(actionUids)}
              onUngroup={() => ungroupNode(node.uid)} onConvert={(kind) => convertNode(node.uid, kind)}
              onCopy={() => { copyNodes(actionUids); }} onCut={() => cutNodes(actionUids)} onPaste={() => pasteNodes(node.uid)}
            />;
          })()}
          {canvasInsertMenu !== undefined && <StudioInsertContextMenu
            position={canvasInsertMenu}
            items={insertMenuItems(canvasInsertMenu)}
            onClose={() => setCanvasInsertMenu(undefined)}
          />}
        </> : <div className="studio-v1-preview-workspace">
          <ControlledPreview key={`${history.present.project.uid}:${form.uid}`} form={compiled.expandedForm} compiled={compiled} project={history.present.project} resources={history.present.resources} defaultLocale={history.present.project.defaultLocale} onNavigateProblem={navigateProblem} onUpdateScenario={updateScenario} onAddScenario={addScenario} />
        </div>}
      </div>
      <footer className="studio-editor-status"><span className="studio-editor-status__local"><FolderOpen size={12} aria-hidden="true" />Local workspace</span><p role="status" aria-live="polite">{status}</p></footer>
    </main>
  );
}
