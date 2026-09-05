import test from 'node:test';
test('authoritative submission matrix also runs in the isolated packed consumer', async () => {
  await import('./fixtures/packed-submissions.mjs');
});
