/**
 * Abort detection shared by the retry / fallback predicates.
 *
 * A network failure surfaces as `ProviderHttpError{ status: 0, cause }`,
 * and a user/agent abort surfaces the same way - the distinguishing
 * signal is an `AbortError` (DOMException) somewhere on the `cause`
 * chain. Network errors should be retried and failed over; an abort must
 * not be, even though the retry/fallback loops also short-circuit on
 * `req.signal?.aborted` independently.
 *
 * @packageDocumentation
 */

/**
 * True when `err` - or any error on its `cause` chain - is an abort
 * (`name === 'AbortError'` or Node's `code === 'ABORT_ERR'`). Walks at
 * most a few links so a cyclic / pathological cause chain cannot loop.
 *
 * @internal
 */
export function isAbortError(err: unknown): boolean {
  let cursor: unknown = err;
  for (let depth = 0; depth < 8 && cursor !== null && typeof cursor === 'object'; depth++) {
    const e = cursor as { name?: unknown; code?: unknown; cause?: unknown };
    if (e.name === 'AbortError' || e.code === 'ABORT_ERR') return true;
    if (e.cause === cursor) break;
    cursor = e.cause;
  }
  return false;
}
