import type { FieldDefinition, StagesSchema } from "@stages/core";
import { compiler, document } from "../src";

declare const project: document.StudioProjectDocument;

const formUid = document.toUid("form_event");
const form = project.forms[formUid];
const namedEvent: document.StudioEventDefinition = {
  id: "copy",
  title: "Copy billing address",
  name: "address:copy-billing",
  target: { kind: "form" },
  source: "user",
};
const transform: document.StudioLogicRule = {
  id: "copy-address",
  on: namedEvent.name,
  actions: [{
    op: "set",
    target: { kind: "node", uid: formUid },
    value: { kind: "reference", scope: "event", path: ["payload"] },
  }],
};

if (form) {
  const compiled = compiler.compileStudioForm(form);
  const schema: StagesSchema<unknown, compiler.StudioFieldRegistry, unknown> = compiled.schema;
  const text: FieldDefinition<string, document.JsonObject, "text"> = compiled.fields.text;
  const sourceEntry: compiler.StudioSourceMapEntry | undefined = compiled.sourceMap.byUid.get(formUid);

  void schema;
  void text;
  void sourceEntry;
}

void namedEvent;
void transform;
