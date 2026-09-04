import { fieldEvent, getAtPath } from "@stages/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createStudioHistory,
  dispatchStudioCommand,
  isStudioHistoryDirty,
  markStudioHistorySaved,
  redoStudioHistory,
  undoStudioHistory,
} from "../../src/commands/history";
import type { StudioHistoryState } from "../../src/commands/types";
import { compileStudioForm } from "../../src/compiler/compiler";
import type { CompiledStudioForm, StudioDiagnostic, StudioRenderNode } from "../../src/compiler/types";
import { isSafeObjectKey, toUid } from "../../src/document/uid";
import type { JsonObject, StudioFieldNode, StudioFormDocument, StudioNode, Uid } from "../../src/document/types";
import {
  STUDIO_FIELD_DEFINITIONS,
  createStudioFieldNode,
  studioFieldDefinition,
  validateStudioFieldProps,
  type AnyStudioAuthoringFieldDefinition,
  type StudioPropControl,
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

function nodeDisplayLabel(node: StudioNode): string {
  const configured = (node.kind === "field" || node.kind === "block" ? node.props["label"] : undefined)
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
    ? node.childUids
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

function PreviewNode({ form, node, value, onInput }: {
  readonly form: StudioFormDocument;
  readonly node: StudioRenderNode;
  readonly value: unknown;
  readonly onInput: (node: StudioRenderNode, value: boolean | number | string) => void;
}) {
  if (node.kind === "group") {
    return <fieldset className="studio-v1-preview__group">{node.children.map((child) => (
      <PreviewNode key={child.uid} form={form} node={child} value={value} onInput={onInput} />
    ))}</fieldset>;
  }
  const label = nodeLabel(form, node.uid);
  const field = form.nodes[node.uid];
  if (field?.kind !== "field") return null;
  const definition = studioFieldDefinition(field.definition);
  if (!definition) return null;
  const currentValue = getAtPath(value, node.runtimePath) ?? definition.value.emptyValue;
  const description = typeof field.props["helpText"] === "string" ? field.props["helpText"] : "";
  const descriptionId = description.length > 0 ? `${node.uid}-help` : undefined;
  const common = {
    className: "ui-input",
    "aria-describedby": descriptionId,
  };
  const control = definition.preview.control === "checkbox" ? (
    <input {...common} type="checkbox" checked={Boolean(currentValue)} onChange={(event) => onInput(node, event.currentTarget.checked)} />
  ) : definition.preview.control === "textarea" ? (
    <textarea {...common} rows={typeof field.props["rows"] === "number" ? field.props["rows"] : 4} value={String(currentValue)} onChange={(event) => onInput(node, event.currentTarget.value)} />
  ) : definition.preview.control === "select" ? (
    <select {...common} value={String(currentValue)} onChange={(event) => onInput(node, event.currentTarget.value)}>
      <option value="">Choose…</option>
      {String(field.props["options"] ?? "").split("\n").map((option) => option.trim()).filter(Boolean).map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  ) : (
    <input
      {...common}
      type={definition.preview.control}
      value={String(currentValue)}
      placeholder={typeof field.props["placeholder"] === "string" ? field.props["placeholder"] : undefined}
      min={typeof field.props["min"] === "number" || typeof field.props["min"] === "string" ? field.props["min"] : undefined}
      max={typeof field.props["max"] === "number" || typeof field.props["max"] === "string" ? field.props["max"] : undefined}
      step={typeof field.props["step"] === "number" ? field.props["step"] : undefined}
      onChange={(event) => onInput(node, definition.value.kind === "number" ? event.currentTarget.valueAsNumber : event.currentTarget.value)}
    />
  );
  return (
    <label className="studio-field">
      <span>{label}</span>
      {control}
      {descriptionId && <small id={descriptionId}>{description}</small>}
    </label>
  );
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

function ControlledPreview({ form, compiled }: { readonly form: StudioFormDocument; readonly compiled: CompiledStudioForm }) {
  const scenario = form.scenarios[0];
  const [value, setValue] = useState<unknown>(() => scenario?.value ?? {});
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

  return (
    <section className="studio-v1-preview" aria-labelledby="studio-v1-preview-title">
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
            onInput={(renderNode, nextValue) => preview.controller.dispatch(fieldEvent("input", renderNode.runtimePath, {
              payload: nextValue,
              source: "adapter",
            }))}
          />
        ))}
      </div>
    </section>
  );
}

function SelectionInspector({ nodes, onUpdate, onBulkLabel }: {
  readonly nodes: readonly StudioNode[];
  readonly onUpdate: (node: StudioNode, changes: Readonly<Record<string, unknown>>, label: string, coalesceKey?: string) => void;
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
  const compiled = compileStudioForm(form);

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
            onUpdate={updateNode}
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
      <ControlledPreview form={form} compiled={compiled} />
    </main>
  );
}
