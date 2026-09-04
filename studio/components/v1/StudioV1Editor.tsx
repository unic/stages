import { fieldEvent, getAtPath, nodeEvent, type DataPath, type RenderNodeSnapshot, type StagesEvent } from "@stages/core";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  createStudioHistory,
  dispatchStudioCommand,
  isStudioHistoryDirty,
  markStudioHistorySaved,
  redoStudioHistory,
  undoStudioHistory,
} from "../../src/commands/history";
import type { StudioHistoryState } from "../../src/commands/types";
import { compileStudioForm, createEmptyStudioScenarioValue } from "../../src/compiler/compiler";
import type { CompiledStudioForm, StudioDiagnostic, StudioRenderNode, StudioRuntimeRenderNode } from "../../src/compiler/types";
import { isSafeObjectKey, toUid } from "../../src/document/uid";
import { isStudioVariantCollection, type JsonObject, type StudioFieldNode, type StudioFormDocument, type StudioFragmentDefinition, type StudioFragmentInstanceNode, type StudioNode, type StudioProjectDocument, type Uid } from "../../src/document/types";
import {
  STUDIO_FIELD_DEFINITIONS,
  STUDIO_BLOCK_DEFINITIONS,
  STUDIO_BREAKPOINTS,
  createStudioBlockNode,
  createStudioFieldNode,
  studioBlockDefinition,
  studioFieldDefinition,
  studioLayout,
  validateStudioFieldProps,
  type AnyStudioAuthoringFieldDefinition,
  type StudioBlockDefinition,
  type StudioBreakpoint,
  type StudioAlignment,
  type StudioLayoutSpec,
  type StudioPropControl,
  type StudioWidth,
} from "../../src/registry";
import { createIndexedDbProjectRepository } from "../../src/platform/indexeddb-project-repository";
import { StudioProjectConflictError } from "../../src/projects/types";
import type { StudioProjectRepository } from "../../src/projects/types";
import { createStudioPreviewHost } from "../../src/runtime/preview-host";
import { useStudioPreviewHost } from "../../src/runtime/use-studio-preview-host";
import {
  createStudioWorkbenchState,
  createStudioOutlineModel,
  reconcileStudioWorkbench,
  revealStudioUid,
  selectStudioUid,
  type StudioSelectionOptions,
  type StudioMoveDirection,
  visibleStudioOutlineUids,
} from "../../src/editor";
import { Button } from "../ui/button";
import { STUDIO_SUPPORTED_DEFINITIONS, useStudioDocumentStartup } from "./StudioDocumentStartup";
import { StudioOutline } from "./StudioOutline";
import {
  createStudioStructuralActions,
  type StudioEditorNavigationState,
} from "./studioStructuralActions";

interface StudioV1EditorProps {
  readonly repository?: StudioProjectRepository;
}

function firstForm(project: StudioHistoryState["present"]): StudioFormDocument | undefined {
  return Object.values(project.forms)[0];
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
    ...Object.values(project.fragments).flatMap((fragment) => Object.keys(fragment.nodes)),
  ]);
  const safeStem = stem.replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 118) || "entity";
  let suffix = 1;
  let uid = toUid(safeStem);
  while (used.has(uid)) uid = toUid(`${safeStem}_${++suffix}`);
  return uid;
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

function CanvasNode({ form, uid, selectedUids, onSelect }: {
  readonly form: StudioFormDocument;
  readonly uid: Uid;
  readonly selectedUids: readonly Uid[];
  readonly onSelect: (uid: Uid, options?: StudioSelectionOptions) => void;
}) {
  const node = form.nodes[uid];
  if (!node) return null;
  const children = node.kind === "group" || node.kind === "collection" || node.kind === "stage"
    ? node.kind === "collection" && isStudioVariantCollection(node) ? node.variantUids : node.childUids
    : node.kind === "variant" ? node.childUids
    : node.kind === "wizard" ? node.stageUids : [];
  return (
    <li className="studio-v1-node">
      <button
        type="button"
        className="studio-v1-node__select"
        aria-pressed={selectedUids.includes(uid)}
        onClick={(event) => onSelect(uid, { extend: event.shiftKey, toggle: event.metaKey || event.ctrlKey })}
      >
        <span>{nodeLabel(form, uid)}</span>
        <small>{node.kind}</small>
      </button>
      {children.length > 0 && (
        <ol className="studio-v1-node__children">
          {children.map((childUid) => (
            <CanvasNode key={childUid} form={form} uid={childUid} selectedUids={selectedUids} onSelect={onSelect} />
          ))}
        </ol>
      )}
    </li>
  );
}

function PreviewLayout({ node, children }: { readonly node: StudioRenderNode; readonly children: ReactNode }) {
  return (
    <div
      className="studio-v1-preview__layout"
      data-width-mobile={node.layout.width.mobile}
      data-width-tablet={node.layout.width.tablet}
      data-width-desktop={node.layout.width.desktop}
      data-align-mobile={node.layout.align.mobile}
      data-align-tablet={node.layout.align.tablet}
      data-align-desktop={node.layout.align.desktop}
      style={{ "--studio-layout-columns-mobile": node.layout.columns.mobile, "--studio-layout-columns-tablet": node.layout.columns.tablet, "--studio-layout-columns-desktop": node.layout.columns.desktop } as CSSProperties}
    >{children}</div>
  );
}

function PreviewBlock({ node }: { readonly node: Extract<StudioRenderNode, { readonly kind: "block" }> }) {
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
  return <PreviewLayout node={node}>{content}</PreviewLayout>;
}

function PreviewFieldControl({ definition, field, node, currentValue, descriptionId, onInput }: {
  readonly definition: AnyStudioAuthoringFieldDefinition;
  readonly field: StudioFieldNode;
  readonly node: StudioRuntimeRenderNode<"field">;
  readonly currentValue: unknown;
  readonly descriptionId?: string;
  readonly onInput: (node: StudioRuntimeRenderNode, value: boolean | number | string) => void;
}) {
  const common = { className: "ui-input", "aria-describedby": descriptionId };
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
  return <input
    {...common}
    type={definition.preview.control}
    value={String(currentValue)}
    placeholder={typeof field.props["placeholder"] === "string" ? field.props["placeholder"] : undefined}
    min={typeof field.props["min"] === "number" || typeof field.props["min"] === "string" ? field.props["min"] : undefined}
    max={typeof field.props["max"] === "number" || typeof field.props["max"] === "string" ? field.props["max"] : undefined}
    step={typeof field.props["step"] === "number" ? field.props["step"] : undefined}
    onChange={(event) => onInput(node, definition.value.kind === "number" ? event.currentTarget.valueAsNumber : event.currentTarget.value)}
  />;
}

function PreviewField({ form, node, value, onInput }: {
  readonly form: StudioFormDocument;
  readonly node: StudioRuntimeRenderNode<"field">;
  readonly value: unknown;
  readonly onInput: (node: StudioRuntimeRenderNode, value: boolean | number | string) => void;
}) {
  const field = form.nodes[node.uid];
  if (field?.kind !== "field") return null;
  const definition = studioFieldDefinition(field.definition);
  if (!definition) return null;
  const description = typeof field.props["helpText"] === "string" ? field.props["helpText"] : "";
  const descriptionId = description.length > 0 ? `${node.uid}-help` : undefined;
  return <PreviewLayout node={node}><label className="studio-field">
    <span>{nodeLabel(form, node.uid)}</span>
    <PreviewFieldControl
      definition={definition}
      field={field}
      node={node}
      currentValue={getAtPath(value, node.runtimePath) ?? definition.value.emptyValue}
      {...(descriptionId === undefined ? {} : { descriptionId })}
      onInput={onInput}
    />
    {descriptionId && <small id={descriptionId}>{description}</small>}
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
  readonly onInput: (node: StudioRuntimeRenderNode, value: boolean | number | string) => void;
  readonly onStructureEvent: (event: StagesEvent) => void;
}

function PreviewCollection(props: PreviewNodeProps & { readonly node: StudioRuntimeRenderNode<"collection">; readonly path: DataPath }) {
  const { form, node, value, snapshotNodes, path, onInput, onStructureEvent } = props;
  const collection = form.nodes[node.uid];
  const snapshot = findPreviewSnapshot(snapshotNodes, path);
  const rows = getAtPath(value, path);
  const values = Array.isArray(rows) ? rows : [];
  return <PreviewLayout node={node}><div className="studio-v1-preview__collection">
      <div className="studio-v1-preview__collection-actions">
        {collection?.kind === "collection" && isStudioVariantCollection(collection)
          ? collection.variantUids.map((uid) => <button type="button" key={uid} disabled={snapshot?.kind !== "collection" || snapshot.canAdd === false} onClick={() => snapshot?.kind === "collection" && onStructureEvent(nodeEvent("collection:add", snapshot.address, { payload: { variant: runtimeIdFor(form, uid) } }))}>Add {nodeLabel(form, uid)}</button>)
          : <button type="button" disabled={snapshot?.kind !== "collection" || snapshot.canAdd === false} onClick={() => snapshot?.kind === "collection" && onStructureEvent(nodeEvent("collection:add", snapshot.address))}>Add row</button>}
      </div>
      {values.map((row, index) => {
      let children = node.children;
      if (collection?.kind === "collection" && isStudioVariantCollection(collection)) {
        const variantId = row !== null && typeof row === "object" ? (row as Record<string, unknown>)[collection.discriminator] : undefined;
        children = node.children.find((child) => child.kind === "variant" && runtimeIdFor(form, child.uid) === variantId)?.children ?? [];
      }
      const rowPath: DataPath = [...path, index];
      const rowSnapshot = snapshot?.kind === "collection" ? snapshot.nodes[index] : undefined;
      const rowKey = rowSnapshot?.kind === "row" ? rowSnapshot.id : `unavailable-${JSON.stringify(row)}`;
      return <div className="studio-v1-preview__row" data-row-index={index} key={rowKey}>{children.map((child) => (
        <PreviewNode key={child.uid} form={form} node={child} value={value} snapshotNodes={snapshotNodes} runtimePath={previewChildPath(form, rowPath, child)} onInput={onInput} onStructureEvent={onStructureEvent} />
      ))}<button type="button" disabled={snapshot?.kind !== "collection" || snapshot.canRemove === false} onClick={() => snapshot?.kind === "collection" && onStructureEvent(nodeEvent("collection:remove", snapshot.address, { payload: { index } }))}>Remove row {index + 1}</button></div>;
    })}</div></PreviewLayout>;
}

function PreviewWizard(props: PreviewNodeProps & { readonly node: StudioRuntimeRenderNode<"wizard">; readonly path: DataPath }) {
  const { form, node, value, snapshotNodes, path, onInput, onStructureEvent } = props;
  const snapshot = findPreviewSnapshot(snapshotNodes, path);
  const activeStage = snapshot?.kind === "wizard" ? snapshot.activeStage : undefined;
  const stages = activeStage === undefined ? node.children.slice(0, 1) : node.children.filter((child) => runtimeIdFor(form, child.uid) === activeStage);
  return <PreviewLayout node={node}><div className="studio-v1-preview__wizard">
      {snapshot?.kind === "wizard" && <nav aria-label={`${nodeLabel(form, node.uid)} stages`}>
        <button type="button" disabled={snapshot.canPrevious !== true} onClick={() => onStructureEvent(nodeEvent("wizard:previous", snapshot.address))}>Previous</button>
        {snapshot.canGo === true && node.children.map((stage) => <button type="button" key={stage.uid} aria-current={runtimeIdFor(form, stage.uid) === activeStage ? "step" : undefined} onClick={() => onStructureEvent(nodeEvent("wizard:go", snapshot.address, { payload: runtimeIdFor(form, stage.uid) }))}>{nodeLabel(form, stage.uid)}</button>)}
        <button type="button" disabled={snapshot.canNext !== true} onClick={() => onStructureEvent(nodeEvent("wizard:next", snapshot.address))}>Next</button>
      </nav>}
      {stages.map((child) => (
      <PreviewNode key={child.uid} form={form} node={child} value={value} snapshotNodes={snapshotNodes} runtimePath={previewChildPath(form, path, child)} onInput={onInput} onStructureEvent={onStructureEvent} />
    ))}</div></PreviewLayout>;
}

function PreviewNode(props: PreviewNodeProps) {
  const { form, node, value, snapshotNodes, runtimePath, onInput, onStructureEvent } = props;
  if (node.hidden) return null;
  if (node.kind === "block") return <PreviewBlock node={node} />;
  const path = runtimePath ?? node.runtimePath;
  if (node.kind === "group") {
    return <PreviewLayout node={node}><fieldset className="studio-v1-preview__group">{node.children.map((child) => (
      <PreviewNode key={child.uid} form={form} node={child} value={value} snapshotNodes={snapshotNodes} runtimePath={previewChildPath(form, path, child)} onInput={onInput} onStructureEvent={onStructureEvent} />
    ))}</fieldset></PreviewLayout>;
  }
  if (node.kind === "collection") return <PreviewCollection {...props} node={node} path={path} />;
  if (node.kind === "wizard") return <PreviewWizard {...props} node={node} path={path} />;
  if (node.kind === "stage" || node.kind === "variant") return <PreviewLayout node={node}><div className={`studio-v1-preview__${node.kind}`}>{node.children.map((child) => (
    <PreviewNode key={child.uid} form={form} node={child} value={value} snapshotNodes={snapshotNodes} runtimePath={previewChildPath(form, path, child)} onInput={onInput} onStructureEvent={onStructureEvent} />
  ))}</div></PreviewLayout>;
  return <PreviewField form={form} node={{ ...node, runtimePath: path }} value={value} onInput={onInput} />;
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
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({});
  if (!definition) return <p>This field definition is not available.</p>;
  const change = (control: StudioPropControl, draft: string | boolean) => {
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
    onUpdate(node, { props: nextProps }, `Edit ${definition.displayName} ${control.label.toLowerCase()}`, `props.${control.key}:${node.uid}`);
  };
  return <fieldset className="studio-v1-field-inspector">
    <legend>{definition.displayName} properties</legend>
    {definition.props.map((control) => {
      const errorId = errors[control.key] ? `${node.uid}-${control.key}-error` : undefined;
      const draft = drafts[control.key] ?? (control.control === "checkbox" ? false : "");
      return <label className="studio-field" key={control.key}>
        <span>{control.label}</span>
        {control.control === "textarea" ? <textarea className="ui-input" value={String(draft)} aria-invalid={Boolean(errorId)} aria-describedby={errorId} onChange={(event) => change(control, event.currentTarget.value)} />
          : control.control === "checkbox" ? <input type="checkbox" checked={Boolean(draft)} aria-invalid={Boolean(errorId)} aria-describedby={errorId} onChange={(event) => change(control, event.currentTarget.checked)} />
            : <input className="ui-input" type={control.control === "number" ? "text" : "text"} inputMode={control.control === "number" ? "decimal" : undefined} value={String(draft)} aria-invalid={Boolean(errorId)} aria-describedby={errorId} onChange={(event) => change(control, event.currentTarget.value)} />}
        {errorId && <small id={errorId} role="alert">{errors[control.key]}</small>}
      </label>;
    })}
  </fieldset>;
}

function BlockInspector({ node, onUpdate }: {
  readonly node: Extract<StudioNode, { readonly kind: "block" }>;
  readonly onUpdate: (node: StudioNode, changes: Readonly<Record<string, unknown>>, label: string, coalesceKey?: string) => void;
}) {
  const definition = studioBlockDefinition(node.definition);
  if (!definition) return <p>This content definition is not available.</p>;
  return <fieldset className="studio-v1-block-inspector">
    <legend>{definition.displayName} properties</legend>
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
  const layout = studioLayout(node.presentation?.["layout"]);
  const update = (key: "align" | "columns" | "width", breakpoint: StudioBreakpoint, value: number | string) => {
    const nextLayout: StudioLayoutSpec = key === "width"
      ? { ...layout, width: { ...layout.width, [breakpoint]: value as StudioWidth } }
      : key === "columns"
        ? { ...layout, columns: { ...layout.columns, [breakpoint]: value as number } }
        : { ...layout, align: { ...layout.align, [breakpoint]: value as StudioAlignment } };
    onUpdate(node, { presentation: { ...node.presentation, layout: nextLayout } satisfies JsonObject }, `Edit ${breakpoint} ${key}`, `presentation.layout.${key}.${breakpoint}:${node.uid}`);
  };
  return <fieldset className="studio-v1-layout-inspector">
    <legend>Responsive layout</legend>
    {STUDIO_BREAKPOINTS.map((breakpoint) => <fieldset key={breakpoint}>
      <legend>{breakpoint[0]?.toUpperCase()}{breakpoint.slice(1)}</legend>
      <label className="studio-field"><span>Width</span><select value={layout.width[breakpoint]} onChange={(event) => update("width", breakpoint, event.currentTarget.value)}>
        {(["full", "three-quarters", "two-thirds", "half", "third", "quarter"] as const).map((width) => <option key={width} value={width}>{width}</option>)}
      </select></label>
      <label className="studio-field"><span>Columns</span><select value={layout.columns[breakpoint]} onChange={(event) => update("columns", breakpoint, Number(event.currentTarget.value))}>
        {[1, 2, 3, 4].map((columns) => <option key={columns} value={columns}>{columns}</option>)}
      </select></label>
      <label className="studio-field"><span>Alignment</span><select value={layout.align[breakpoint]} onChange={(event) => update("align", breakpoint, event.currentTarget.value)}>
        {(["stretch", "start", "center", "end"] as const).map((align) => <option key={align} value={align}>{align}</option>)}
      </select></label>
    </fieldset>)}
  </fieldset>;
}

function ControlledPreview({ form, compiled }: { readonly form: StudioFormDocument; readonly compiled: CompiledStudioForm }) {
  const scenario = form.scenarios[0];
  const [value, setValue] = useState<unknown>(() => scenario?.value ?? createEmptyStudioScenarioValue(form));
  const [host] = useState(() => createStudioPreviewHost({
    compiled,
    value,
    onProposal: (proposal) => setValue(proposal.value),
  }));
  const onProposal = useCallback((proposal: Parameters<NonNullable<Parameters<typeof createStudioPreviewHost>[0]["onProposal"]>>[0]) => {
    setValue(proposal.value);
  }, []);
  const input = useMemo(() => ({ compiled, value, onProposal }), [compiled, onProposal, value]);
  const preview = useStudioPreviewHost(host, input);
  const themeStyle = {
    "--studio-preview-background": compiled.renderPlan.theme.background,
    "--studio-preview-foreground": compiled.renderPlan.theme.foreground,
    "--studio-preview-muted": compiled.renderPlan.theme.muted,
    "--studio-preview-border": compiled.renderPlan.theme.border,
    "--studio-preview-accent": compiled.renderPlan.theme.accent,
    "--studio-preview-radius": compiled.renderPlan.theme.radius,
    "--studio-preview-spacing": compiled.renderPlan.theme.spacing,
  } as CSSProperties;

  return (
    <section className="studio-v1-preview" aria-labelledby="studio-v1-preview-title" style={themeStyle} data-studio-theme="default">
      <div className="studio-v1-section-heading">
        <h2 id="studio-v1-preview-title">Preview</h2>
        <span>{compiled.diagnostics.length + preview.diagnostics.length} problems</span>
      </div>
      <div className="studio-v1-preview__fields">
        {compiled.renderPlan.nodes.map((node) => (
          <PreviewNode
            key={node.uid}
            form={form}
            node={node}
            value={preview.snapshot.value}
            snapshotNodes={preview.snapshot.nodes}
            runtimePath={undefined}
            onInput={(renderNode, nextValue) => preview.controller.dispatch(fieldEvent("input", renderNode.runtimePath, {
              payload: nextValue,
              source: "adapter",
            }))}
            onStructureEvent={(event) => preview.controller.dispatch(event)}
          />
        ))}
      </div>
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
      <legend>{discriminated ? "Variant collection" : "Collection"} settings</legend>
      {(["min", "max", "initialRows"] as const).map((key) => <label className="studio-field" key={key}>
        <span>{key === "initialRows" ? "Initial scenario rows" : key}</span>
        <input className="ui-input" type="number" min="0" value={node[key] ?? ""} onChange={(event) => updateNumber(key, event.currentTarget.value)} />
      </label>)}
      <label className="studio-field"><span>Item key</span><select
        value={node.itemKey?.kind ?? "index"}
        onChange={(event) => onUpdate(node, { itemKey: event.currentTarget.value === "property" ? { kind: "property", property: "id" } : { kind: "index" } }, "Edit item key strategy")}
      ><option value="index">Row index</option><option value="property">Row property</option></select></label>
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
    <legend>Wizard settings</legend>
    <label className="studio-field"><span>Initial stage</span><select value={node.initialStageUid ?? ""} onChange={(event) => onUpdate(node, { initialStageUid: event.currentTarget.value === "" ? undefined : toUid(event.currentTarget.value) }, "Edit initial stage") }>
      <option value="">First visible stage</option>
      {node.stageUids.map((uid) => <option key={uid} value={uid}>{nodeLabel(form, uid)}</option>)}
    </select></label>
    <label><input type="checkbox" checked={node.navigation?.nonLinear ?? false} onChange={(event) => onUpdate(node, { navigation: { ...node.navigation, nonLinear: event.currentTarget.checked } }, "Edit nonlinear navigation") } /> Allow nonlinear navigation</label>
    <label><input type="checkbox" checked={node.navigation?.validateCurrent ?? false} onChange={(event) => onUpdate(node, { navigation: { ...node.navigation, validateCurrent: event.currentTarget.checked } }, "Edit validation gating") } /> Validate current stage before navigation</label>
  </fieldset>;
  return null;
}

function FragmentInspector({ instance, fragment, onUpdate, onUpdateFragment, onUpdateFragmentNode, onDetach }: {
  readonly instance: StudioFragmentInstanceNode;
  readonly fragment: StudioFragmentDefinition | undefined;
  readonly onUpdate: (node: StudioNode, changes: Readonly<Record<string, unknown>>, label: string, coalesceKey?: string) => void;
  readonly onUpdateFragment: (fragment: StudioFragmentDefinition, title: string) => void;
  readonly onUpdateFragmentNode: (fragment: StudioFragmentDefinition, node: StudioNode, changes: Readonly<Record<string, unknown>>) => void;
  readonly onDetach: (instance: StudioFragmentInstanceNode, fragment: StudioFragmentDefinition) => void;
}) {
  if (!fragment) return <p role="alert">The linked fragment is missing.</p>;
  return <fieldset className="studio-v1-fragment-inspector">
    <legend>Linked fragment</legend>
    <label className="studio-field"><span>Definition name</span><input className="ui-input" value={fragment.title} onChange={(event) => onUpdateFragment(fragment, event.currentTarget.value)} /></label>
    <p><small>Version {fragment.version} · edits below update every linked instance.</small></p>
    {Object.values(fragment.nodes).map((definitionNode) => <div key={definitionNode.uid}>
      {definitionNode.kind !== "block" && <label className="studio-field"><span>{nodeDisplayLabel(definitionNode)} definition ID</span><input className="ui-input" value={definitionNode.runtimeId} onChange={(event) => {
        const runtimeId = event.currentTarget.value;
        if (runtimeId.length > 0 && isSafeObjectKey(runtimeId)) onUpdateFragmentNode(fragment, definitionNode, { runtimeId });
      }} /></label>}
      {definitionNode.kind === "field" && <label className="studio-field"><span>Override {nodeDisplayLabel(definitionNode)} label</span><input className="ui-input" value={String(instance.overrides?.[definitionNode.uid]?.props?.["label"] ?? "")} placeholder="Use definition label" onChange={(event) => {
        const label = event.currentTarget.value;
        const current = instance.overrides?.[definitionNode.uid] ?? {};
        const props = { ...current.props } as Record<string, JsonObject[string]>;
        if (label === "") delete props["label"];
        else props["label"] = label;
        onUpdate(instance, { overrides: { ...instance.overrides, [definitionNode.uid]: { ...current, props } } }, "Override fragment field label", `fragment.override.${definitionNode.uid}:${instance.uid}`);
      }} /></label>}
    </div>)}
    <Button variant="outline" size="sm" onClick={() => onDetach(instance, fragment)}>Detach instance</Button>
  </fieldset>;
}

function SelectionInspector({ nodes, form, fragments, onUpdate, onUpdateFragment, onUpdateFragmentNode, onDetach, onBulkLabel }: {
  readonly nodes: readonly StudioNode[];
  readonly form: StudioFormDocument;
  readonly fragments: StudioProjectDocument["fragments"];
  readonly onUpdate: (node: StudioNode, changes: Readonly<Record<string, unknown>>, label: string, coalesceKey?: string) => void;
  readonly onUpdateFragment: (fragment: StudioFragmentDefinition, title: string) => void;
  readonly onUpdateFragmentNode: (fragment: StudioFragmentDefinition, node: StudioNode, changes: Readonly<Record<string, unknown>>) => void;
  readonly onDetach: (instance: StudioFragmentInstanceNode, fragment: StudioFragmentDefinition) => void;
  readonly onBulkLabel: (nodes: readonly StudioFieldNode[], label: string) => void;
}) {
  const [bulkLabel, setBulkLabel] = useState("");
  const [runtimeIdDraft, setRuntimeIdDraft] = useState(() => {
    const selected = nodes[0];
    return selected?.kind === "block" || selected === undefined ? "" : selected.runtimeId;
  });
  const [runtimeIdError, setRuntimeIdError] = useState("");

  if (nodes.length === 0) return <p>Select an item in the outline or canvas.</p>;
  if (nodes.length > 1) {
    const fields = nodes.filter((node): node is StudioFieldNode => node.kind === "field");
    if (fields.length !== nodes.length) {
      return <p>{nodes.length} items selected. This selection has no compatible bulk edits.</p>;
    }
    return (
      <div className="studio-v1-inspector__bulk">
        <p>{fields.length} fields selected</p>
        <label className="studio-field">
          <span>Label for selected fields</span>
          <input className="ui-input" value={bulkLabel} onChange={(event) => setBulkLabel(event.currentTarget.value)} />
        </label>
        <Button disabled={bulkLabel.length === 0} onClick={() => onBulkLabel(fields, bulkLabel)}>Apply to {fields.length} fields</Button>
      </div>
    );
  }

  const node = nodes[0]!;
  return (
    <div>
      <p><strong>{nodeDisplayLabel(node)}</strong> <small>{node.kind}</small></p>
      {node.kind !== "block" && (
        <label className="studio-field">
          <span>Runtime ID</span>
          <input
            className="ui-input"
            value={runtimeIdDraft}
            aria-invalid={runtimeIdError.length > 0}
            aria-describedby={runtimeIdError.length > 0 ? `${node.uid}-runtime-id-error` : undefined}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setRuntimeIdDraft(value);
              if (value.length === 0 || value.length > 128 || !isSafeObjectKey(value)) {
                setRuntimeIdError("Runtime ID must be a safe, non-empty identifier of at most 128 characters.");
                return;
              }
              setRuntimeIdError("");
              onUpdate(node, { runtimeId: value }, "Rename runtime ID", `runtimeId:${node.uid}`);
            }}
          />
          {runtimeIdError.length > 0 && <small id={`${node.uid}-runtime-id-error`} role="alert">{runtimeIdError}</small>}
        </label>
      )}
      {node.kind === "field" && (
        <FieldInspector node={node} onUpdate={onUpdate} />
      )}
      {node.kind === "block" && <BlockInspector node={node} onUpdate={onUpdate} />}
      {node.kind === "fragment" && <FragmentInspector instance={node} fragment={fragments[node.fragmentUid]} onUpdate={onUpdate} onUpdateFragment={onUpdateFragment} onUpdateFragmentNode={onUpdateFragmentNode} onDetach={onDetach} />}
      <StructuralInspector node={node} form={form} onUpdate={onUpdate} />
      <PresentationInspector node={node} onUpdate={onUpdate} />
    </div>
  );
}

function StructureControls({ nodes, canPaste, onMove, onGroup, onUngroup, onConvert, onCopy, onCut, onPaste }: {
  readonly nodes: readonly StudioNode[];
  readonly canPaste: boolean;
  readonly onMove: (direction: StudioMoveDirection) => void;
  readonly onGroup: () => void;
  readonly onUngroup: () => void;
  readonly onConvert: (kind: "collection" | "group" | "wizard") => void;
  readonly onCopy: () => void;
  readonly onCut: () => void;
  readonly onPaste: () => void;
}) {
  const selected = nodes[0];
  const convertible = nodes.length === 1 && (selected?.kind === "group" || selected?.kind === "collection" || selected?.kind === "wizard");
  const unwrappable = nodes.length === 1 && (selected?.kind === "group" || selected?.kind === "collection");
  return (
    <section className="studio-v1-structure" aria-labelledby="studio-v1-structure-title">
      <h3 id="studio-v1-structure-title">Structure</h3>
      <div>
        <Button variant="outline" size="sm" disabled={nodes.length !== 1} onClick={() => onMove("up")}>Move up</Button>
        <Button variant="outline" size="sm" disabled={nodes.length !== 1} onClick={() => onMove("down")}>Move down</Button>
        <Button variant="outline" size="sm" disabled={nodes.length !== 1} onClick={() => onMove("in")}>Move in</Button>
        <Button variant="outline" size="sm" disabled={nodes.length !== 1} onClick={() => onMove("out")}>Move out</Button>
        <Button variant="outline" size="sm" disabled={nodes.length === 0} onClick={onGroup}>Group</Button>
        <Button variant="outline" size="sm" disabled={!unwrappable} onClick={onUngroup}>Ungroup</Button>
        <Button variant="outline" size="sm" disabled={nodes.length === 0} onClick={onCopy}>Copy</Button>
        <Button variant="outline" size="sm" disabled={nodes.length === 0} onClick={onCut}>Cut</Button>
        <Button variant="outline" size="sm" disabled={!canPaste || nodes.length !== 1} onClick={onPaste}>Paste</Button>
      </div>
      {convertible && (
        <div>
          <Button variant="outline" size="sm" disabled={selected.kind === "group"} onClick={() => onConvert("group")}>Convert to group</Button>
          <Button variant="outline" size="sm" disabled={selected.kind === "collection"} onClick={() => onConvert("collection")}>Convert to collection</Button>
          <Button variant="outline" size="sm" disabled={selected.kind === "wizard"} onClick={() => onConvert("wizard")}>Convert to wizard</Button>
        </div>
      )}
      <p><small>Move: Alt+Arrow · Copy/Cut/Paste: Ctrl/⌘+C/X/V</small></p>
    </section>
  );
}

function ProblemsPanel({ diagnostics, onNavigate }: {
  readonly diagnostics: readonly StudioDiagnostic[];
  readonly onNavigate: (diagnostic: StudioDiagnostic) => void;
}) {
  return (
    <section className="studio-v1-problems" aria-labelledby="studio-v1-problems-title">
      <div className="studio-v1-section-heading">
        <h2 id="studio-v1-problems-title">Problems</h2><span>{diagnostics.length}</span>
      </div>
      {diagnostics.length === 0 ? <p>No problems</p> : (
        <ul>
          {diagnostics.map((diagnostic) => (
            <li key={`${diagnostic.code}:${diagnostic.entityUid ?? "form"}:${JSON.stringify(diagnostic.propertyPath)}:${diagnostic.message}`}>
              <button type="button" onClick={() => onNavigate(diagnostic)}>
                <strong>{diagnostic.code}</strong><span>{diagnostic.message}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function StudioV1Editor({ repository: repositoryProp }: StudioV1EditorProps) {
  const startup = useStudioDocumentStartup();
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
  const [status, setStatus] = useState("Loading local draft…");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (startup.project === undefined) {
      setLoading(false);
      setStatus("Project import failed.");
      return;
    }
    const startupProject = startup.project;
    let active = true;
    setLoading(true);
    void repository.load(startupProject.project.uid).then((saved) => {
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
    }).catch((error: unknown) => {
      if (!active) return;
      setStatus(error instanceof Error ? error.message : "Could not load the local draft.");
      setLoading(false);
    });
    return () => { active = false; };
  }, [repository, startup.project]);

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
  const compiled = compileStudioForm(form, history.present.fragments);

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

  const selectNode = (uid: Uid, options: StudioSelectionOptions = {}) => {
    setNavigation((current) => ({
      ...current,
      workbench: selectStudioUid(current.workbench, uid, visibleOutlineUids, options),
    }));
  };

  const insertField = (definition: AnyStudioAuthoringFieldDefinition) => {
    const node = nextField(form, definition);
    const result = dispatchStudioCommand(history, {
      type: "node.insert",
      formUid: form.uid,
      parentUid: null,
      index: form.rootNodeUids.length,
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

  const insertBlock = (definition: StudioBlockDefinition) => {
    const node = nextBlock(form, definition);
    const result = dispatchStudioCommand(history, {
      type: "node.insert",
      formUid: form.uid,
      parentUid: null,
      index: form.rootNodeUids.length,
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

  const insertStructure = (kind: "collection" | "group" | "stage" | "variant" | "variant-collection" | "wizard") => {
    const selected = selectedNodes.length === 1 ? selectedNodes[0] : undefined;
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
        type: "node.insert-subtree" as const, formUid: form.uid, parentUid: null, index: form.rootNodeUids.length,
        rootUids: [identity.uid],
        nodes: {
          [identity.uid]: { ...identity, kind: "wizard" as const, stageUids: [stage.uid], initialStageUid: stage.uid, navigation: { nonLinear: false, validateCurrent: false }, presentation: { label: "Wizard" } },
          [stage.uid]: { ...stage, kind: "stage" as const, childUids: [], presentation: { label: "Stage 1" } },
        },
      };
    } else if (kind === "variant-collection") {
      const variant = nextStructuralIdentity(form, "variant");
      command = {
        type: "node.insert-subtree" as const, formUid: form.uid, parentUid: null, index: form.rootNodeUids.length,
        rootUids: [identity.uid],
        nodes: {
          [identity.uid]: { ...identity, kind: "collection" as const, discriminator: "kind", variantUids: [variant.uid], initialVariantUid: variant.uid, initialRows: 0, itemKey: { kind: "index" as const }, presentation: { label: "Variant collection" } },
          [variant.uid]: { ...variant, kind: "variant" as const, childUids: [], presentation: { label: "Variant 1" } },
        },
      };
    } else {
      command = {
        type: "node.insert" as const, formUid: form.uid, parentUid: null, index: form.rootNodeUids.length,
        node: { ...identity, kind, childUids: [], ...(kind === "collection" ? { initialRows: 0, itemKey: { kind: "index" as const } } : {}), presentation: { label: kind === "group" ? "Group" : "Collection" } },
      };
    }
    const result = dispatchStudioCommand(history, command, { label: `Add ${kind}` });
    if (!result.ok) { setStatus(result.failure.message); return; }
    setHistory(result.history);
    setNavigation((current) => ({
      ...current,
      workbench: selectStudioUid({ ...current.workbench, expandedUids: new Set([...current.workbench.expandedUids, selectedUid]) }, selectedUid, [...visibleOutlineUids, selectedUid]),
    }));
    setStatus(`${kind} added`);
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

  const updateBulkLabel = (nodes: readonly StudioFieldNode[], label: string) => {
    const result = dispatchStudioCommand(history, {
      type: "transaction",
      label: `Label ${nodes.length} fields`,
      commands: nodes.map((node) => ({
        type: "node.update" as const,
        formUid: form.uid,
        uid: node.uid,
        changes: { props: { ...node.props, label } satisfies JsonObject },
      })),
    });
    if (result.ok) {
      setHistory(result.history);
      setStatus(`${nodes.length} field labels updated`);
    } else setStatus(result.failure.message);
  };

  const createFragment = () => {
    const uids = selectedNodes.map(({ uid }) => uid);
    if (uids.length === 0) { setStatus("Select one or more nodes to create a fragment."); return; }
    const number = Object.keys(history.present.fragments).length + 1;
    const fragmentUid = nextProjectUid(history.present, `fragment_${number}`);
    const instanceUid = nextProjectUid(history.present, `fragment_instance_${number}`);
    const instance: StudioFragmentInstanceNode = { uid: instanceUid, kind: "fragment", runtimeId: `fragment${number}`, fragmentUid };
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
    setStatus(`Fragment ${number} created`);
  };

  const insertFragment = (fragment: StudioFragmentDefinition) => {
    const uid = nextProjectUid(history.present, `${fragment.uid}_instance`);
    const runtimeIds = new Set(Object.values(form.nodes).flatMap((node) => node.kind === "block" ? [] : [node.runtimeId]));
    let suffix = 1;
    let runtimeId = fragment.title.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase().slice(0, 118) || "fragment";
    while (runtimeIds.has(runtimeId)) runtimeId = `${runtimeId.replace(/\d+$/, "")}${++suffix}`;
    const result = dispatchStudioCommand(history, {
      type: "fragment.insert",
      formUid: form.uid,
      parentUid: null,
      index: form.rootNodeUids.length,
      instance: { uid, kind: "fragment", runtimeId, fragmentUid: fragment.uid },
    }, { label: `Insert ${fragment.title}` });
    if (!result.ok) { setStatus(result.failure.message); return; }
    replaceHistory(result.history);
    setNavigation((current) => ({ ...current, workbench: selectStudioUid(current.workbench, uid, [...visibleOutlineUids, uid]) }));
    setStatus(`${fragment.title} inserted`);
  };

  const updateFragment = (fragment: StudioFragmentDefinition, title: string) => {
    const result = dispatchStudioCommand(history, { type: "fragment.update", fragmentUid: fragment.uid, changes: { title } }, { label: "Rename fragment", coalesceKey: `fragment.title:${fragment.uid}` });
    if (result.ok) setHistory(result.history); else setStatus(result.failure.message);
  };

  const updateFragmentNode = (fragment: StudioFragmentDefinition, node: StudioNode, changes: Readonly<Record<string, unknown>>) => {
    const result = dispatchStudioCommand(history, { type: "fragment.node.update", fragmentUid: fragment.uid, uid: node.uid, changes }, { label: "Edit fragment definition" });
    if (result.ok) setHistory(result.history); else setStatus(result.failure.message);
  };

  const detachFragment = (instance: StudioFragmentInstanceNode, fragment: StudioFragmentDefinition) => {
    const uidMap = Object.fromEntries(Object.keys(fragment.nodes).map((uid) => [uid, nextProjectUid(history.present, `detached_${uid}`)])) as Readonly<Record<Uid, Uid>>;
    const result = dispatchStudioCommand(history, { type: "fragment.detach", formUid: form.uid, uid: instance.uid, uidMap }, { label: `Detach ${fragment.title}` });
    if (result.ok) { replaceHistory(result.history); setStatus(`${fragment.title} detached`); }
    else setStatus(result.failure.message);
  };

  const {
    moveNode, dropNode, copyNodes, cutNodes, pasteNodes, groupNodes, ungroupNode, convertNode,
  } = createStudioStructuralActions({ history, form, navigation, replaceHistory, setNavigation, setStatus });

  const navigateProblem = (diagnostic: StudioDiagnostic) => {
    const targetUid = diagnostic.entityUid ?? diagnostic.formUid;
    if (targetUid === undefined) return;
    setNavigation((current) => ({
      ...current,
      ...(diagnostic.formUid === undefined ? {} : { activeFormUid: diagnostic.formUid }),
      workbench: revealStudioUid(current.workbench, targetUid, outline.parentByUid),
    }));
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-outline-uid="${targetUid}"]`)?.focus();
    });
  };

  const save = async () => {
    const savedDocumentRevision = history.revision;
    setStatus("Saving local draft…");
    try {
      const saved = await repository.save(history.present, repositoryRevision.current);
      repositoryRevision.current = saved.revision;
      setHistory((current) => current === undefined || current.revision !== savedDocumentRevision
        ? current
        : markStudioHistorySaved(current));
      setStatus("Local draft saved");
    } catch (error: unknown) {
      setStatus(error instanceof StudioProjectConflictError
        ? "Draft changed in another editor. Reload before saving."
        : error instanceof Error ? error.message : "Could not save the local draft.");
    }
  };

  return (
    <main className="studio-v1-editor" data-testid="studio-v1-editor" aria-busy={loading}>
      <header className="studio-v1-toolbar">
        <div><strong>{history.present.project.title}</strong><span>{dirty ? "Unsaved changes" : "Saved"}</span></div>
        <nav aria-label="Document history">
          <Button variant="outline" size="sm" disabled={loading || history.past.length === 0} onClick={() => replaceHistory(undoStudioHistory(history))}>Undo</Button>
          <Button variant="outline" size="sm" disabled={loading || history.future.length === 0} onClick={() => replaceHistory(redoStudioHistory(history))}>Redo</Button>
          <Button size="sm" disabled={loading || !dirty} onClick={() => void save()}>Save draft</Button>
        </nav>
        <p role="status" aria-live="polite">{status}</p>
      </header>
      <div className="studio-v1-workspace">
        <div className="studio-v1-left-panel">
          <StudioOutline
            project={history.present}
            state={navigation.workbench}
            onChange={(workbench) => setNavigation((current) => ({ ...current, workbench }))}
            onActivateForm={(activeFormUid) => setNavigation((current) => ({ ...current, activeFormUid }))}
            onMove={moveNode}
            onDrop={dropNode}
            onCopy={copyNodes}
            onCut={cutNodes}
            onPaste={pasteNodes}
            onGroup={groupNodes}
            onUngroup={ungroupNode}
          />
          <section className="studio-v1-palette" aria-labelledby="studio-v1-palette-title">
            <h2 id="studio-v1-palette-title">Fields</h2>
            {Object.values(STUDIO_FIELD_DEFINITIONS).map((definition) => (
              <Button key={definition.key} variant="outline" disabled={loading} onClick={() => insertField(definition)}>
                Add {definition.displayName.toLowerCase()}
              </Button>
            ))}
          </section>
          <section className="studio-v1-palette" aria-labelledby="studio-v1-content-palette-title">
            <h2 id="studio-v1-content-palette-title">Content</h2>
            {Object.values(STUDIO_BLOCK_DEFINITIONS).map((definition) => (
              <Button key={definition.key} variant="outline" disabled={loading} onClick={() => insertBlock(definition)}>
                Add {definition.displayName.toLowerCase()}
              </Button>
            ))}
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
            <Button variant="outline" disabled={loading || selectedNodes.length === 0} onClick={createFragment}>Create fragment from selection</Button>
            {Object.values(history.present.fragments).map((fragment) => <Button key={fragment.uid} variant="outline" disabled={loading} onClick={() => insertFragment(fragment)}>Insert {fragment.title}</Button>)}
          </section>
        </div>
        <section className="studio-v1-canvas" aria-labelledby="studio-v1-canvas-title">
          <div className="studio-v1-section-heading"><h2 id="studio-v1-canvas-title">Canvas</h2><span>{form.rootNodeUids.length} blocks</span></div>
          <ol className="studio-v1-node-list">
            {form.rootNodeUids.map((uid) => (
              <CanvasNode key={uid} form={form} uid={uid} selectedUids={navigation.workbench.selectedUids} onSelect={selectNode} />
            ))}
          </ol>
        </section>
        <aside className="studio-v1-inspector" aria-labelledby="studio-v1-inspector-title">
          <h2 id="studio-v1-inspector-title">Inspector</h2>
          <SelectionInspector
            key={selectedNodes.map(({ uid }) => uid).join("\u0000")}
            nodes={selectedNodes}
            form={form}
            fragments={history.present.fragments}
            onUpdate={updateNode}
            onUpdateFragment={updateFragment}
            onUpdateFragmentNode={updateFragmentNode}
            onDetach={detachFragment}
            onBulkLabel={updateBulkLabel}
          />
          <StructureControls
            nodes={selectedNodes}
            canPaste={navigation.clipboard !== undefined}
            onMove={(direction) => { const uid = selectedNodes[0]?.uid; if (uid) moveNode(uid, direction); }}
            onGroup={() => groupNodes(selectedNodes.map(({ uid }) => uid))}
            onUngroup={() => { const uid = selectedNodes[0]?.uid; if (uid) ungroupNode(uid); }}
            onConvert={(kind) => { const uid = selectedNodes[0]?.uid; if (uid) convertNode(uid, kind); }}
            onCopy={() => { copyNodes(selectedNodes.map(({ uid }) => uid)); }}
            onCut={() => cutNodes(selectedNodes.map(({ uid }) => uid))}
            onPaste={() => { const uid = selectedNodes[0]?.uid; if (uid) pasteNodes(uid); }}
          />
        </aside>
      </div>
      <ProblemsPanel diagnostics={compiled.diagnostics} onNavigate={navigateProblem} />
      <ControlledPreview form={compiled.expandedForm} compiled={compiled} />
    </main>
  );
}
