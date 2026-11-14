// Node-only bridge. The dispatcher and HTTP transport share this registry.
const key = Symbol.for('rraabbiitt.scanner.progress');
const listeners = globalThis[key] ??= new Map();
export const subscribeProgress = (id, listener) => {
  listeners.set(id, listener);
  return () => listeners.delete(id);
};
export const publishProgress = (id, event) => {
  if (typeof id === 'string') listeners.get(id)?.(event);
};
