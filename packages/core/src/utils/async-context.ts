import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Thin typed wrapper around Node's `AsyncLocalStorage`. Used to thread a
 * tool-execution / request-scoped context through the async stack
 * without explicit parameter passing.
 *
 * The wrapper exists because:
 * - The Node API requires a fresh `AsyncLocalStorage<T>` per scope; this
 *   helper centralizes the construction with consistent typing.
 * - Downstream packages (security, tools) want a single canonical
 *   constructor so that their `getStore()` code paths share the same
 *   identity (matters for HMR / multi-realm setups).
 *
 * @stable
 */
export interface AsyncContext<T> {
  /** Run `fn` inside a fresh scope carrying `value`. */
  run<R>(value: T, fn: () => R): R;
  /** Run `fn` inside a fresh scope carrying `value` (async-friendly). */
  runAsync<R>(value: T, fn: () => Promise<R>): Promise<R>;
  /** Get the value of the current scope, or `undefined` outside one. */
  get(): T | undefined;
  /** Replace the value of the current scope (advanced; rarely needed). */
  enterWith(value: T): void;
  /** Exit any in-flight scope (advanced; rarely needed). */
  disable(): void;
}

/**
 * Construct a typed `AsyncContext`. The optional `name` is surfaced in
 * the diagnostics channel of `AsyncLocalStorage` (debugging only).
 *
 * @stable
 */
export function createAsyncContext<T>(_name?: string): AsyncContext<T> {
  const als = new AsyncLocalStorage<T>();
  return {
    run<R>(value: T, fn: () => R): R {
      return als.run(value, fn);
    },
    runAsync<R>(value: T, fn: () => Promise<R>): Promise<R> {
      return als.run(value, fn);
    },
    get(): T | undefined {
      return als.getStore();
    },
    enterWith(value: T): void {
      als.enterWith(value);
    },
    disable(): void {
      als.disable();
    },
  };
}
