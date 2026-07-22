/**
 * `createRequestTimeout` - the one deadline primitive shared by the
 * non-HTTP adapters (Vercel AI SDK, in-process GGUF) and available to
 * custom adapter authors. The `baseUrl` adapters get the same
 * semantics from `callJsonHttp` (time-to-response, timer cleared once
 * headers arrive); adapters whose transport is owned by an SDK or
 * runs in-process cannot observe headers, so they clear the timer on
 * the first produced event instead.
 *
 * @packageDocumentation
 */

/**
 * Handle returned by {@link createRequestTimeout}.
 *
 * @stable
 */
export interface RequestTimeout {
  /**
   * Effective signal to hand to the transport: the caller's signal
   * merged with the deadline via `AbortSignal.any`, either alone when
   * only one exists, or `undefined` when neither does.
   */
  readonly signal: AbortSignal | undefined;
  /**
   * True once the deadline expired. A caller-initiated abort never
   * sets this - adapters use `fired && req.signal?.aborted !== true`
   * to tell a timeout (throw a retryable `ProviderHttpError`) from a
   * cancellation (surface `finishReason: 'aborted'`).
   */
  readonly fired: boolean;
  /**
   * Cancel the deadline. Idempotent. Adapters call this the moment
   * the call starts producing output (first stream event) and again
   * in a `finally` so a completed call never leaks a timer.
   */
  clear(): void;
}

const NO_TIMEOUT = Object.freeze({
  signal: undefined,
  fired: false,
  clear(): void {},
});

/**
 * Arm a deadline of `timeoutMs` milliseconds composed with an
 * optional caller signal. `timeoutMs` unset or `0` disables the
 * deadline (the caller signal, when present, still passes through).
 *
 * @stable
 */
export function createRequestTimeout(args: {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}): RequestTimeout {
  const timeoutMs = args.timeoutMs ?? 0;
  if (timeoutMs <= 0) {
    if (args.signal === undefined) return NO_TIMEOUT;
    return { signal: args.signal, fired: false, clear(): void {} };
  }
  const ctl = new AbortController();
  let fired = false;
  const timer = setTimeout(() => {
    fired = true;
    ctl.abort();
  }, timeoutMs);
  // A leaked timer must never hold the process open (Node-only API;
  // absent in other runtimes).
  (timer as { unref?: () => void }).unref?.();
  const signal =
    args.signal !== undefined ? AbortSignal.any([args.signal, ctl.signal]) : ctl.signal;
  return {
    signal,
    get fired(): boolean {
      return fired;
    },
    clear(): void {
      clearTimeout(timer);
    },
  };
}
