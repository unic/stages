import { parentPort, workerData } from 'node:worker_threads';
try {
  // Deployment module and its executable bindings are selected exclusively by the host.
  const { validatePortableSubmission, deployment } = await import(workerData.moduleURL);
  const { value, context } = JSON.parse(workerData.input);
  const result = await validatePortableSubmission(deployment, value, { context, timeoutMs: workerData.timeoutMs });
  parentPort.postMessage({ ok: true, result });
} catch (error) {
  parentPort.postMessage({ ok: false, error: error instanceof Error ? error.message : 'Worker execution failed.' });
}
