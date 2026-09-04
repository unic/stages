import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  legacyFieldsetFixtures,
  legacyTemplateFixtures,
} from "./legacyFixtures";

const fingerprint = (value) => createHash("sha256")
  .update(JSON.stringify(value))
  .digest("hex");

describe("frozen legacy POC fixtures", () => {
  it("keeps every shipped template as explicit migration evidence", () => {
    expect(Object.keys(legacyTemplateFixtures)).toEqual([
      "initial",
      "interfaceState",
      "kitchensink",
      "layouting",
      "templating",
    ]);
    expect(Object.values(legacyTemplateFixtures).every(Object.isFrozen)).toBe(true);
    expect(Object.fromEntries(
      Object.entries(legacyTemplateFixtures).map(([name, config]) => [name, fingerprint(config)]),
    )).toEqual({
      initial: "5f07c526852d31acfcdc002acaa8efb6c50529d5a1d720bf92dcd0ce29443b2f",
      interfaceState: "8dfce90bbc20646667eafc8b5715c89c0d41c1042bfad8fcb1db0095ae39d14f",
      kitchensink: "e967bfe32884cb5f97bbe3547278d607984fd9afe502bc5fda6dd86e470cf259",
      layouting: "82011cc6f16abd9aa3d72f8de7b66a6a1f71783f8499349be2e5f6f00c642940",
      templating: "fe48c531be28f9bfc94f67297a9d9bff12f05811892421f159b6b5f4a4bb1653",
    });
  });

  it("retains both fieldset encodings observed by the POC and converter", () => {
    expect(legacyFieldsetFixtures.explicit.config[0]).toEqual({
      id: "billing",
      type: "fieldset",
      fieldset: "address",
    });
    expect(legacyFieldsetFixtures.poc.config[0]).toEqual({
      id: "billing",
      type: "address",
      label: "Address",
    });
    expect(Object.isFrozen(legacyFieldsetFixtures.explicit.fieldsets[0].config[0].fields)).toBe(true);
    expect(Object.isFrozen(legacyFieldsetFixtures.poc.fieldsets[0].config[0].fields)).toBe(true);
  });
});
