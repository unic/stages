import { useMemo, useRef, useState } from "react";
import { stages } from "@stages/core";
import { StagesField, useStages } from "@stages/react";
import { Button } from "primereact/button";
import primeFields from "../primeFields";
import { convertLegacyConfig, prepareStudioValue, studioPresentationKey } from "./legacyConfig.mjs";

const ARRAY_FIELDS = new Set(["buttons", "chips", "multiselect"]);
const BOOLEAN_FIELDS = new Set(["checkbox", "switch", "toggle"]);
const NUMBER_FIELDS = new Set(["number", "rating", "slider"]);

function initialValue(type) {
  if (ARRAY_FIELDS.has(type)) return [];
  if (BOOLEAN_FIELDS.has(type)) return false;
  if (NUMBER_FIELDS.has(type)) return 0;
  if (type === "calendar") return null;
  return "";
}

function createFieldRegistry() {
  return Object.fromEntries(Object.entries(primeFields).map(([type, definition]) => {
    const LegacyField = definition.component;
    function StudioField({ id, field, props, emit }) {
      const issue = field.state.visibleIssues[0];
      return (
        <LegacyField
          {...props}
          id={id}
          name={field.path.join(".")}
          value={field.value}
          onChange={(value) => emit("input", value)}
          onFocus={() => emit("focus")}
          onBlur={() => emit("blur")}
          isDisabled={field.state.disabled}
          isRequired={props.isRequired === true}
          isDirty={field.state.dirty}
          hasFocus={field.state.focused}
          isValidating={field.state.validating}
          error={issue?.message || issue?.code}
          aria-invalid={issue === undefined ? undefined : "true"}
        />
      );
    }
    StudioField.displayName = `StudioV1${type}`;
    return [type, {
      view: StudioField,
      initialValue: () => initialValue(type),
      reduce: ({ event }) => event.name === "input" ? { value: event.payload } : undefined,
    }];
  }));
}

const fields = createFieldRegistry();

function presentationFor(node, presentation) {
  return presentation[studioPresentationKey(node.address)] || {};
}

function widthFor(node, previewSize) {
  if (node.kind !== "field") return "100%";
  const width = node.props?.blockWidth?.[previewSize] || "large";
  if (width === "small") return "25%";
  if (width === "medium") return "50%";
  return "100%";
}

function nodeEvent(controller, node, name, payload) {
  controller.dispatch({
    name,
    target: { kind: "node", address: node.address },
    ...(payload === undefined ? {} : { payload }),
    source: "adapter",
  });
}

function Nodes({ controller, nodes, presentation, previewSize, rowCanRemove }) {
  return nodes.map((node) => {
    if (node.state.visible === false) return null;
    const meta = presentationFor(node, presentation);

    if (node.kind === "field") {
      return (
        <div
          key={studioPresentationKey(node.address)}
          style={{ flex: `0 0 ${widthFor(node, previewSize)}`, maxWidth: widthFor(node, previewSize), padding: "8px" }}
        >
          <StagesField controller={controller} path={node.path} />
        </div>
      );
    }

    if (node.kind === "stage") {
      if (node.active !== true) return null;
      return (
        <section key={studioPresentationKey(node.address)} style={{ width: "100%" }} aria-label={meta.label || node.id}>
          <Nodes controller={controller} nodes={node.nodes} presentation={presentation} previewSize={previewSize} rowCanRemove={rowCanRemove} />
        </section>
      );
    }

    if (node.kind === "row") {
      return (
        <div
          key={node.id}
          style={{ position: "relative", display: "flex", flexWrap: "wrap", width: "100%", margin: "4px 8px 12px", padding: "8px 46px 8px 0", border: "1px dashed #ddd", borderRadius: "3px" }}
        >
          <Nodes controller={controller} nodes={node.nodes} presentation={presentation} previewSize={previewSize} rowCanRemove={rowCanRemove} />
          <button
            type="button"
            disabled={!rowCanRemove}
            aria-label={`Remove ${node.id}`}
            onClick={() => nodeEvent(controller, node, "collection:remove")}
            style={{ position: "absolute", top: "10px", right: "10px" }}
          >
            remove
          </button>
        </div>
      );
    }

    if (node.kind === "wizard") {
      const stages = node.nodes.filter((child) => child.kind === "stage");
      return (
        <section key={studioPresentationKey(node.address)} style={{ width: "100%", padding: "8px" }} aria-label={meta.label || node.id}>
          {meta.label ? <label>{meta.label}</label> : null}
          {meta.secondaryText ? <div style={{ color: "#999", marginBottom: "12px" }}>{meta.secondaryText}</div> : null}
          <nav aria-label={`${meta.label || node.id} stages`} style={{ display: "flex", gap: "8px", margin: "8px 0 16px" }}>
            {stages.map((stage) => {
              const stageMeta = presentationFor(stage, presentation);
              return (
                <button
                  key={stage.id}
                  type="button"
                  disabled={stage.state.disabled || !node.canGo}
                  aria-current={stage.active ? "step" : undefined}
                  onClick={() => nodeEvent(controller, node, "wizard:go", stage.id)}
                >
                  {stageMeta.label || stage.id}
                </button>
              );
            })}
          </nav>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            <Nodes controller={controller} nodes={node.nodes} presentation={presentation} previewSize={previewSize} rowCanRemove={rowCanRemove} />
          </div>
          <div style={{ display: "flex", gap: "8px", margin: "12px 0" }}>
            <button type="button" disabled={!node.canPrevious} onClick={() => nodeEvent(controller, node, "wizard:previous")}>Previous</button>
            <button type="button" disabled={!node.canNext} onClick={() => nodeEvent(controller, node, "wizard:next")}>Next</button>
          </div>
        </section>
      );
    }

    if (node.kind === "collection") {
      return (
        <section key={studioPresentationKey(node.address)} style={{ width: "100%", padding: "8px" }} aria-label={meta.label || node.id}>
          {meta.label ? <label>{meta.label}</label> : null}
          {meta.secondaryText ? <div style={{ color: "#999", marginBottom: "12px" }}>{meta.secondaryText}</div> : null}
          <Nodes controller={controller} nodes={node.nodes} presentation={presentation} previewSize={previewSize} rowCanRemove={node.canRemove} />
          <button type="button" disabled={!node.canAdd} onClick={() => nodeEvent(controller, node, "collection:add")}>add row</button>
        </section>
      );
    }

    return (
      <section key={studioPresentationKey(node.address)} style={{ display: "flex", flexWrap: "wrap", width: "100%", padding: "8px" }} aria-label={meta.label || node.id}>
        {meta.label ? <label style={{ flex: "0 0 100%" }}>{meta.label}</label> : null}
        {meta.secondaryText ? <div style={{ flex: "0 0 100%", color: "#999", marginBottom: "12px" }}>{meta.secondaryText}</div> : null}
        <Nodes controller={controller} nodes={node.nodes} presentation={presentation} previewSize={previewSize} rowCanRemove={rowCanRemove} />
      </section>
    );
  });
}

export default function StudioV1Preview({ config, fieldsets, value, onChange, previewSize }) {
  const formRef = useRef(null);
  const [message, setMessage] = useState("");
  const converted = useMemo(() => convertLegacyConfig(config, {
    fieldTypes: Object.keys(fields),
    fieldsets,
  }), [config, fieldsets]);
  const preparedValue = useMemo(() => prepareStudioValue(converted.schema, value), [converted.schema, value]);
  const { controller, snapshot } = useStages(
    () => stages({
      schema: converted.schema,
      fields,
      value: preparedValue,
      onChange: ({ value: nextValue }) => onChange(nextValue),
    }),
    { value: preparedValue, schema: converted.schema },
  );

  const submit = async (event) => {
    event.preventDefault();
    const validation = await controller.validate({ scope: "form", event: "submit", reveal: true });
    setMessage(validation.isValid ? "Form is valid. See the submitted value in the console." : "Please fix the highlighted fields.");
    if (validation.isValid) console.log("onSubmit:", snapshot.value);
    else requestAnimationFrame(() => formRef.current?.querySelector("[aria-invalid='true']")?.focus());
  };

  return (
    <form ref={formRef} onSubmit={submit} data-stages-runtime="v1">
      <div style={{ position: "relative", display: "flex", flexWrap: "wrap", maxWidth: previewSize === "mobile" ? "480px" : previewSize === "tablet" ? "640px" : "960px", margin: "0 auto", paddingBottom: "64px" }}>
        {converted.diagnostics.length > 0 ? (
          <aside role="status" style={{ flex: "0 0 100%", margin: "0 8px 16px", padding: "10px 12px", color: "#7a5100", background: "#fff7df", border: "1px solid #ead39b", borderRadius: "3px" }}>
            <strong>v1 compatibility preview</strong>
            <ul style={{ marginBottom: 0 }}>
              {converted.diagnostics.map((diagnostic) => <li key={`${diagnostic.code}:${diagnostic.path.join(".")}`}>{diagnostic.message}</li>)}
            </ul>
          </aside>
        ) : null}
        {snapshot.diagnostics.length > 0 ? (
          <aside role="alert" style={{ flex: "0 0 100%", margin: "0 8px 16px" }}>
            {snapshot.diagnostics.map((diagnostic, index) => <div key={`${diagnostic.code}:${index}`}>{diagnostic.message}</div>)}
          </aside>
        ) : null}
        <Nodes controller={controller} nodes={snapshot.nodes} presentation={converted.presentation} previewSize={previewSize} />
        <div style={{ flex: "0 0 100%", padding: "8px" }}>
          <Button type="submit">Submit</Button>
          {message ? <p role="status">{message}</p> : null}
        </div>
      </div>
    </form>
  );
}
