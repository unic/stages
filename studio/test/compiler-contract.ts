import type { FieldDefinition, StagesSchema } from "@stages/core";
import { compiler, document } from "../src";

declare const project: document.StudioProjectDocument;

const formUid = document.toUid("form_event");
const form = project.forms[formUid];

if (form) {
  const compiled = compiler.compileStudioForm(form);
  const schema: StagesSchema<unknown, compiler.StudioFieldRegistry, unknown> = compiled.schema;
  const text: FieldDefinition<string, document.JsonObject, "text"> = compiled.fields.text;
  const sourceEntry: compiler.StudioSourceMapEntry | undefined = compiled.sourceMap.byUid.get(formUid);

  void schema;
  void text;
  void sourceEntry;
}
