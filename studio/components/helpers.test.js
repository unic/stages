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
});
