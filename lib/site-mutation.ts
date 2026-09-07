import 'server-only';

// All document read/modify/write handlers share this process-local queue. This
// avoids an autosave overwriting a simultaneous site-settings publication.
// A multi-instance deployment still needs a storage driver with conditional writes.
const key = Symbol.for('open-canvas.site-mutation');
const queues = globalThis as unknown as Record<symbol, Promise<unknown> | undefined>;
export function withSiteMutation<T>(operation: () => Promise<T>): Promise<T> {
  const result = (queues[key] || Promise.resolve()).then(operation, operation);
  queues[key] = result.then(() => undefined, () => undefined);
  return result;
}
