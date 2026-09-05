import assert from 'node:assert/strict';
import test from 'node:test';
import { isolatedSubmission } from '../../../scripts/portable/isolated-submission.mjs';
const moduleURL = new URL('./fixtures/isolated-deployment.mjs', import.meta.url);
const valid = { name: 'a', email: 'a@b.ch', confirm: 'a@b.ch', subscribe: false, company: 'Company' };
test('host worker kills synchronous pathological regex and keeps later requests isolated', async () => {
  assert.equal((await isolatedSubmission(moduleURL, valid, { timeoutMs: 2000 })).status, 'accepted');
  const before = Date.now();
  await assert.rejects(isolatedSubmission(moduleURL, { ...valid, name: 'a'.repeat(100) + '!' }, { timeoutMs: 500 }), /deadline/);
  assert(Date.now() - before < 3000);
  assert.equal((await isolatedSubmission(moduleURL, valid, { timeoutMs: 2000 })).status, 'accepted');
  await assert.rejects(isolatedSubmission(moduleURL, { ...valid, name: 'a'.repeat(1_000_001) }), /input limit/);
  const pending = Array.from({ length: 4 }, () => isolatedSubmission(moduleURL, { ...valid, name: 'a'.repeat(100) + '!' }, { timeoutMs: 500 }));
  await assert.rejects(isolatedSubmission(moduleURL, valid), /capacity/);
  assert((await Promise.allSettled(pending)).every(result => result.status === 'rejected'));
});


test('worker transport refuses coercion, getters and non-JSON fields before allocating a worker', async () => {
  let getter = false;
  const value = { ...valid };
  Object.defineProperty(value, 'name', { enumerable: true, get() { getter = true; return 'a'; } });
  await assert.rejects(isolatedSubmission(moduleURL, value), /data properties/);
  assert.equal(getter, false);
  for (const value of [{ ...valid, extra: undefined }, { ...valid, name: new String('a') }, { ...valid, extra: NaN }, { ...valid, extra: new Date() }]) {
    await assert.rejects(isolatedSubmission(moduleURL, value), /JSON/);
  }
});
