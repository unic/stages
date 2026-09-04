import initialConfig from "./initialConfig";
import interfaceStateConfig from "./interfaceStateConfig";
import kitchensinkConfig from "./kitchensinkConfig";
import layoutingConfig from "./layoutingConfig";
import templatingConfig from "./templatingConfig";

function freeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
}

function fixture(value) {
  return freeze(structuredClone(value));
}

// These are migration inputs, not new-document examples. Their fingerprints are
// asserted in legacyFixtures.test.js so an intentional POC template change has
// to update the compatibility baseline explicitly.
export const legacyTemplateFixtures = freeze({
  initial: fixture(initialConfig),
  interfaceState: fixture(interfaceStateConfig),
  kitchensink: fixture(kitchensinkConfig),
  layouting: fixture(layoutingConfig),
  templating: fixture(templatingConfig),
});

export const legacyFieldsetFixtures = freeze({
  explicit: fixture({
    config: [{ id: "billing", type: "fieldset", fieldset: "address" }],
    fieldsets: [{
      id: "address",
      label: "Address",
      config: [{
        id: "address",
        type: "group",
        fields: [{ id: "city", type: "text", label: "City" }],
      }],
    }],
  }),
  poc: fixture({
    config: [{ id: "billing", type: "address", label: "Address" }],
    fieldsets: [{
      id: "address",
      label: "Address",
      config: [{
        id: "address",
        type: "group",
        fields: [{ id: "city", type: "text", label: "City" }],
      }],
    }],
  }),
});
