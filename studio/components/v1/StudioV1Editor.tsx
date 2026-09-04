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
import type { StudioRenderNode } from "../../src/compiler/types";
import { toUid } from "../../src/document/uid";
import type { JsonObject, StudioFieldNode, StudioFormDocument, Uid } from "../../src/document/types";
import { createIndexedDbProjectRepository } from "../../src/platform/indexeddb-project-repository";
import { StudioProjectConflictError } from "../../src/projects/types";
import type { StudioProjectRepository } from "../../src/projects/types";
import { createStudioPreviewHost } from "../../src/runtime/preview-host";
import { useStudioPreviewHost } from "../../src/runtime/use-studio-preview-host";
import { Button } from "../ui/button";
import { STUDIO_SUPPORTED_DEFINITIONS, useStudioDocumentStartup } from "./StudioDocumentStartup";

interface StudioV1EditorProps {
  readonly repository?: StudioProjectRepository;
}

function firstForm(project: StudioHistoryState["present"]): StudioFormDocument | undefined {
  return Object.values(project.forms)[0];
}

function nextTextField(form: StudioFormDocument): StudioFieldNode {
  let suffix = 1;
  let uid = toUid("field_text");
  let runtimeId = "text";
  const runtimeIds = new Set(Object.values(form.nodes).flatMap((node) => node.kind === "block" ? [] : [node.runtimeId]));
  while (form.nodes[uid] !== undefined || runtimeIds.has(runtimeId)) {
    suffix += 1;
    uid = toUid(`field_text_${suffix}`);
    runtimeId = `text${suffix}`;
  }
  return {
    uid,
    kind: "field",
    runtimeId,
    definition: { key: "text", version: 1 },
    props: { label: "Text field" },
  };
}

function nodeLabel(form: StudioFormDocument, uid: Uid): string {
  const node = form.nodes[uid];
  if (!node) return uid;
  const configured = (node.kind === "field" || node.kind === "block" ? node.props["label"] : undefined)
    ?? node.presentation?.["label"];
  if (typeof configured === "string" && configured.length > 0) return configured;
  return node.kind === "block" ? node.definition.key : node.runtimeId;
}

function CanvasNode({ form, uid, selectedUid, onSelect }: {
  readonly form: StudioFormDocument;
  readonly uid: Uid;
  readonly selectedUid: Uid | undefined;
  readonly onSelect: (uid: Uid) => void;
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
        aria-pressed={selectedUid === uid}
        onClick={() => onSelect(uid)}
      >
        <span>{nodeLabel(form, uid)}</span>
        <small>{node.kind}</small>
      </button>
      {children.length > 0 && (
        <ol className="studio-v1-node__children">
          {children.map((childUid) => (
            <CanvasNode key={childUid} form={form} uid={childUid} selectedUid={selectedUid} onSelect={onSelect} />
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
  readonly onInput: (node: StudioRenderNode, value: string) => void;
}) {
  if (node.kind === "group") {
    return <fieldset className="studio-v1-preview__group">{node.children.map((child) => (
      <PreviewNode key={child.uid} form={form} node={child} value={value} onInput={onInput} />
    ))}</fieldset>;
  }
  const label = nodeLabel(form, node.uid);
  return (
    <label className="studio-field">
      <span>{label}</span>
      <input
        className="ui-input"
        value={String(getAtPath(value, node.runtimePath) ?? "")}
        onChange={(event) => onInput(node, event.currentTarget.value)}
      />
    </label>
  );
}

function ControlledPreview({ form }: { readonly form: StudioFormDocument }) {
  const compiled = useMemo(() => compileStudioForm(form), [form]);
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

export function StudioV1Editor({ repository: repositoryProp }: StudioV1EditorProps) {
  const startup = useStudioDocumentStartup();
  const repository = useMemo(() => repositoryProp ?? createIndexedDbProjectRepository({
    supportedDefinitions: STUDIO_SUPPORTED_DEFINITIONS,
  }), [repositoryProp]);
  const [history, setHistory] = useState<StudioHistoryState | undefined>(() => (
    startup.project === undefined ? undefined : createStudioHistory(startup.project)
  ));
  const repositoryRevision = useRef<number | null>(null);
  const [selectedUid, setSelectedUid] = useState<Uid | undefined>();
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
      setHistory(createStudioHistory(project));
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
  const form = firstForm(history.present);
  if (form === undefined) {
    return <main className="studio-v1-empty"><h2>This project has no forms</h2></main>;
  }
  const selected = selectedUid === undefined ? undefined : form.nodes[selectedUid];
  const dirty = isStudioHistoryDirty(history);

  const insertText = () => {
    const node = nextTextField(form);
    const result = dispatchStudioCommand(history, {
      type: "node.insert",
      formUid: form.uid,
      parentUid: null,
      index: form.rootNodeUids.length,
      node,
    }, { label: "Add text field" });
    if (result.ok) {
      setHistory(result.history);
      setSelectedUid(node.uid);
      setStatus("Text field added");
    } else setStatus(result.failure.message);
  };

  const updateLabel = (label: string) => {
    if (!selected || selected.kind !== "field") return;
    const result = dispatchStudioCommand(history, {
      type: "node.update",
      formUid: form.uid,
      uid: selected.uid,
      changes: { props: { ...selected.props, label } satisfies JsonObject },
    }, { label: "Edit field label", coalesceKey: "props.label" });
    if (result.ok) setHistory(result.history);
    else setStatus(result.failure.message);
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
          <Button variant="outline" size="sm" disabled={loading || history.past.length === 0} onClick={() => setHistory(undoStudioHistory(history))}>Undo</Button>
          <Button variant="outline" size="sm" disabled={loading || history.future.length === 0} onClick={() => setHistory(redoStudioHistory(history))}>Redo</Button>
          <Button size="sm" disabled={loading || !dirty} onClick={() => void save()}>Save draft</Button>
        </nav>
        <p role="status" aria-live="polite">{status}</p>
      </header>
      <div className="studio-v1-workspace">
        <aside className="studio-v1-palette" aria-labelledby="studio-v1-palette-title">
          <h2 id="studio-v1-palette-title">Fields</h2>
          <Button variant="outline" disabled={loading} onClick={insertText}>Add text field</Button>
        </aside>
        <section className="studio-v1-canvas" aria-labelledby="studio-v1-canvas-title">
          <div className="studio-v1-section-heading"><h2 id="studio-v1-canvas-title">Canvas</h2><span>{form.rootNodeUids.length} blocks</span></div>
          <ol className="studio-v1-node-list">
            {form.rootNodeUids.map((uid) => (
              <CanvasNode key={uid} form={form} uid={uid} selectedUid={selectedUid} onSelect={setSelectedUid} />
            ))}
          </ol>
        </section>
        <aside className="studio-v1-inspector" aria-labelledby="studio-v1-inspector-title">
          <h2 id="studio-v1-inspector-title">Inspector</h2>
          {selected?.kind === "field" ? (
            <label className="studio-field"><span>Label</span><input className="ui-input" value={String(selected.props["label"] ?? "")} onChange={(event) => updateLabel(event.currentTarget.value)} /></label>
          ) : <p>Select a field on the canvas.</p>}
        </aside>
      </div>
      <ControlledPreview form={form} />
    </main>
  );
}
