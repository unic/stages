import assert from "node:assert/strict";
import test from "node:test";
import {
  checkedValidationIssues,
  createValidationCancellation,
  eventNames,
  pathsIntersect,
  validationRecordKey,
} from "../dist/validation.js";

test("validation cancellation is idempotent and late listeners run immediately", () => {
  const cancellation = createValidationCancellation();
  let calls = 0;
  cancellation.signal.onCancel(() => { calls += 1; });
  const unsubscribe = cancellation.signal.onCancel(() => { calls += 10; });
  unsubscribe();

  cancellation.cancel();
  cancellation.cancel();
  cancellation.signal.onCancel(() => { calls += 1; });

  assert.equal(cancellation.signal.aborted, true);
  assert.equal(calls, 2);
});

test("validation issue checking accepts complete issues and rejects unsafe or malformed values", () => {
  const issues = [{ id: "required", code: "required", path: ["name"], severity: "error", meta: { source: "test" } }];
  assert.equal(checkedValidationIssues(issues), issues);
  assert.throws(() => checkedValidationIssues({}), /array of issues/);
  assert.throws(
    () => checkedValidationIssues([{ id: "unsafe", code: "unsafe", path: ["__proto__"], severity: "error" }]),
    /malformed issue/,
  );
  assert.throws(
    () => checkedValidationIssues([{ id: "warning", code: "warning", path: [], severity: "notice" }]),
    /malformed issue/,
  );
});

test("validation matching helpers preserve exact names, path overlap, and collision-safe keys", () => {
  assert.deepEqual(eventNames(undefined), []);
  assert.deepEqual(eventNames("submit"), ["submit"]);
  assert.deepEqual(eventNames(["blur", "submit"]), ["blur", "submit"]);
  assert.equal(pathsIntersect(["person"], ["person", "name"]), true);
  assert.equal(pathsIntersect(["person", "name"], ["person", "age"]), false);
  assert.notEqual(
    validationRecordKey([{ kind: "node", id: "a#b" }], "c"),
    validationRecordKey([{ kind: "node", id: "a" }], "b#c"),
  );
});
