import { describe, expect, it } from "vitest";
import { defineStudioCodecBindings, STUDIO_PREVIEW_CODEC_BINDINGS } from "./codecs";

describe("Studio codec bindings", () => {
  it("resolves trusted value and extension codecs by exact version", () => {
    const valueCodec = { encode: (value: unknown) => ({ wrapped: String(value) }), decode: (value: unknown) => value } as const;
    const extensionCodec = { encode: (value: unknown) => String(value), decode: (value: unknown) => value } as const;
    const bindings = defineStudioCodecBindings({
      values: [{ schemaId: "orders", schemaVersion: 2, codec: valueCodec }],
      extensions: [{ key: "preferences", version: 3, codec: extensionCodec }],
    });

    expect(bindings.resolveValue({ schemaId: "orders", schemaVersion: 2 })).toBe(valueCodec);
    expect(bindings.resolveValue({ schemaId: "orders", schemaVersion: 1 })).toBeUndefined();
    expect(bindings.resolveExtension({ key: "preferences", version: 3 })).toBe(extensionCodec);
    expect(bindings.resolveExtension({ key: "preferences", version: 2 })).toBeUndefined();
  });

  it("rejects duplicate bindings and provides only the JSON preview extension codec", () => {
    const codec = STUDIO_PREVIEW_CODEC_BINDINGS.resolveValue({ schemaId: "any", schemaVersion: 1 });
    expect(codec).toBeDefined();
    expect(STUDIO_PREVIEW_CODEC_BINDINGS.resolveExtension({ key: "json", version: 1 })).toBeDefined();
    expect(STUDIO_PREVIEW_CODEC_BINDINGS.resolveExtension({ key: "json", version: 2 })).toBeUndefined();
    expect(() => defineStudioCodecBindings({ values: [
      { schemaId: "same", schemaVersion: 1, codec: codec! },
      { schemaId: "same", schemaVersion: 1, codec: codec! },
    ] })).toThrow(/Duplicate value codec binding same@1/);
  });
});
