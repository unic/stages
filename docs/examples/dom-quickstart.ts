import {
  formEvent,
  stages,
  type StagesController,
  type StagesSchema,
} from "@stages/core";
import { createDomFields, mountStages } from "@stages/dom";

interface Profile {
  displayName: string;
}

const fields = createDomFields();
const schema = {
  id: "profile",
  version: 1,
  nodes: [{
    kind: "field",
    id: "displayName",
    type: "text",
    props: { label: "Display name", autocomplete: "name" },
  }],
} as const satisfies StagesSchema<Profile, typeof fields>;

// source:start dom-owner
export function mountProfile(root: Element) {
  let value: Profile = { displayName: "" };
  let controller!: StagesController<Profile, typeof fields>;
  controller = stages({
    schema,
    fields,
    value,
    onChange(change) {
      value = change.value;
      controller.update({ value });
    },
  });

  const mounted = mountStages(root, controller);
  return {
    async submit() {
      const result = await controller.validate({ event: "submit", reveal: true });
      if (!result.isValid) mounted.focusFirstIssue({ preventScroll: false });
      return result;
    },
    reset() {
      controller.dispatch(formEvent("reset"));
    },
    destroy() {
      mounted.destroy();
      controller.destroy();
    },
  };
}
// source:end dom-owner
