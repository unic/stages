import { Worker } from 'node:worker_threads';
let active = 0;
function encodeInput(value, context) {
  let work = 0;
  let characters = 0;
  const seen = new Set();
  const inspect = (item, depth = 0) => {
    if (++work > 10_000 || depth > 64) throw new TypeError('Portable worker input limit exceeded.');
    if (item === null || typeof item === 'boolean' || (typeof item === 'number' && Number.isFinite(item))) return;
    if (typeof item === 'string') {
      characters += item.length;
      if (characters > 1_000_000) throw new TypeError('Portable worker input limit exceeded.');
      return;
    }
    if (typeof item !== 'object' || seen.has(item) || (!Array.isArray(item) && ![Object.prototype, null].includes(Object.getPrototypeOf(item)))) throw new TypeError('Portable worker requires plain JSON input.');
    seen.add(item);
    const keys = Reflect.ownKeys(item);
    if (keys.length > 10_000 || (Array.isArray(item) && (item.length > 10_000 || keys.length !== item.length + 1))) throw new TypeError('Portable worker requires bounded dense arrays.');
    let index = 0;
    for (const key of keys) {
      if (Array.isArray(item) && key === 'length') continue;
      if (typeof key === 'string') characters += key.length;
      if (characters > 1_000_000) throw new TypeError('Portable worker input limit exceeded.');
      const property = Object.getOwnPropertyDescriptor(item, key);
      if (typeof key !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(key) || !property?.enumerable || !Object.hasOwn(property, 'value')
        || (Array.isArray(item) && key !== String(index++))) throw new TypeError('Portable worker requires JSON data properties.');
      inspect(property.value, depth + 1);
    }
    seen.delete(item);
  };
  const input = { value, ...(context === undefined ? {} : { context }) };
  inspect(input);
  const encoded = JSON.stringify(input);
  if (Buffer.byteLength(encoded) > 1_000_000) throw new TypeError('Portable worker input limit exceeded.');
  return encoded;
}
/** Application-owned Node hosting recipe. moduleURL is trusted host configuration, never request data. */
export async function isolatedSubmission(moduleURL, value, { timeoutMs = 1000, context } = {}) {
  if (!(moduleURL instanceof URL) || moduleURL.protocol !== 'file:') throw new TypeError('Expected a trusted local deployment module URL.');
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000) throw new TypeError('Invalid worker deadline.');
  if (active >= 4) throw new Error('Portable worker capacity exceeded.');
  const input = encodeInput(value, context);
  active++;
  let worker;
  let timer;
  try {
    worker = new Worker(new URL('./submission-worker.mjs', import.meta.url), {
      workerData: { moduleURL: moduleURL.href, input, timeoutMs },
      resourceLimits: { maxOldGenerationSizeMb: 64, maxYoungGenerationSizeMb: 16, stackSizeMb: 4 },
    });
    return await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('Portable worker deadline exceeded.')), timeoutMs);
      worker.once('message', message => message.ok ? resolve(message.result) : reject(new Error(message.error)));
      worker.once('error', reject);
      worker.once('exit', code => reject(new Error(`Portable worker exited before a result (${code}).`)));
    });
  } finally {
    clearTimeout(timer);
    if (worker) await worker.terminate();
    active--;
  }
}
