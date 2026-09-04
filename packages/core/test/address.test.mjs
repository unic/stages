import assert from "node:assert/strict";
import test from "node:test";
import { addressKey, addressStartsWith, parseNodeAddress } from "../dist/address.js";

test("address keys are unambiguous across segment kinds and ids", () => {
  assert.notEqual(
    addressKey([{ kind: "node", id: "a/b" }]),
    addressKey([{ kind: "node", id: "a" }, { kind: "row", id: "b" }]),
  );
  assert.notEqual(addressKey([{ kind: "node", id: "same" }]), addressKey([{ kind: "row", id: "same" }]));
});

test("address prefixes compare complete segments", () => {
  const address = [{ kind: "node", id: "items" }, { kind: "row", id: "first" }];
  assert.equal(addressStartsWith(address, [{ kind: "node", id: "items" }]), true);
  assert.equal(addressStartsWith(address, [{ kind: "node", id: "item" }]), false);
  assert.equal(addressStartsWith(address, [...address, { kind: "node", id: "name" }]), false);
});

test("serialized node addresses are parsed without retaining input objects", () => {
  const input = [{ kind: "node", id: "items", ignored: true }, { kind: "row", id: "first" }];
  const parsed = parseNodeAddress(input);

  assert.deepEqual(parsed, [{ kind: "node", id: "items" }, { kind: "row", id: "first" }]);
  assert.notEqual(parsed[0], input[0]);
  assert.equal(parseNodeAddress([{ kind: "stage", id: "first" }]), undefined);
  assert.equal(parseNodeAddress([{ kind: "node", id: 1 }]), undefined);
  assert.equal(parseNodeAddress({ kind: "node", id: "items" }), undefined);
});
