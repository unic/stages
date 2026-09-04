import { describe, expect, it } from "vitest";
import { moveConfigField } from "./helpers";

const field = (id, extra = {}) => ({ id, type: "text", ...extra });

describe("moveConfigField", () => {
  it("places a field in the trailing insertion slot", () => {
    const config = [field("first"), field("second"), field("third")];

    expect(moveConfigField(config, "first", "third+")).toBe(true);
    expect(config.map(({ id }) => id)).toEqual(["second", "third", "first"]);
  });

  it("moves fields between containers", () => {
    const config = [
      { id: "left", type: "group", fields: [field("first"), field("second")] },
      { id: "right", type: "group", fields: [field("third")] },
    ];

    expect(moveConfigField(config, "left.second", "right.third")).toBe(true);
    expect(config[0].fields.map(({ id }) => id)).toEqual(["first"]);
    expect(config[1].fields.map(({ id }) => id)).toEqual(["second", "third"]);
  });

  it("does not move a container into itself", () => {
    const config = [{ id: "group", type: "group", fields: [field("child")] }];

    expect(moveConfigField(config, "group", "group.child")).toBe(false);
    expect(config[0].fields.map(({ id }) => id)).toEqual(["child"]);
  });

  it("moves a field to each relative position used by editor commands", () => {
    const config = [field("first"), field("second"), field("third")];

    expect(moveConfigField(config, "third", "first")).toBe(true);
    expect(config.map(({ id }) => id)).toEqual(["third", "first", "second"]);
    expect(moveConfigField(config, "third", "second+")).toBe(true);
    expect(config.map(({ id }) => id)).toEqual(["first", "second", "third"]);
  });

  it("leaves the source unchanged when a path cannot be resolved", () => {
    const config = [field("first"), field("second")];
    const before = structuredClone(config);

    expect(moveConfigField(config, "missing", "second")).toBe(false);
    expect(config).toEqual(before);
  });
});
