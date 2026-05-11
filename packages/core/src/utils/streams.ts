/**
 * Stream / async-iterable helpers. All helpers honor `AbortSignal`
 * propagation: when the supplied signal aborts, the underlying
 * iterator's `return()` method is invoked so that resources held by the
 * upstream generator are released cleanly.
 *
 * @packageDocumentation
 */

/**
 * Internal helper: detect whether `it` already has its own
 * `AsyncIterator.return` so we know whether to forward cancellations.
 */
function hasReturn<T>(
  iter: AsyncIterator<T>,
): iter is AsyncIterator<T> & { return: NonNullable<AsyncIterator<T>['return']> } {
  return typeof iter.return === 'function';
}

/**
 * Drain an `AsyncIterable` into an array.
 *
 * @stable
 */
export async function collect<T>(source: AsyncIterable<T>, signal?: AbortSignal): Promise<T[]> {
  const out: T[] = [];
  for await (const item of withSignal(source, signal)) {
    out.push(item);
  }
  return out;
}

/**
 * Map every value of an async iterable. The mapper may be async.
 * Cancellation via `signal` is honored.
 *
 * @stable
 */
export async function* mapStream<T, U>(
  source: AsyncIterable<T>,
  fn: (value: T, index: number) => U | Promise<U>,
  signal?: AbortSignal,
): AsyncIterable<U> {
  let index = 0;
  for await (const item of withSignal(source, signal)) {
    yield await fn(item, index++);
  }
}

/**
 * Filter values produced by `source`. The predicate may be async.
 *
 * @stable
 */
export async function* filter<T>(
  source: AsyncIterable<T>,
  pred: (value: T, index: number) => boolean | Promise<boolean>,
  signal?: AbortSignal,
): AsyncIterable<T> {
  let index = 0;
  for await (const item of withSignal(source, signal)) {
    if (await pred(item, index++)) yield item;
  }
}

/**
 * Take the first `n` items.
 *
 * @stable
 */
export async function* take<T>(
  source: AsyncIterable<T>,
  n: number,
  signal?: AbortSignal,
): AsyncIterable<T> {
  if (n <= 0) return;
  let i = 0;
  for await (const item of withSignal(source, signal)) {
    yield item;
    if (++i >= n) return;
  }
}

/**
 * Take items as long as `pred` returns truthy. The first item for which
 * `pred` returns falsy ends the stream.
 *
 * @stable
 */
export async function* takeWhile<T>(
  source: AsyncIterable<T>,
  pred: (value: T, index: number) => boolean | Promise<boolean>,
  signal?: AbortSignal,
): AsyncIterable<T> {
  let index = 0;
  for await (const item of withSignal(source, signal)) {
    if (!(await pred(item, index++))) return;
    yield item;
  }
}

/**
 * Merge multiple async iterables into a single output iterable. Items
 * are yielded in the order they arrive (interleaved), not in source
 * order. Cancellation propagates to every upstream iterator.
 *
 * @stable
 */
export async function* merge<T>(
  sources: ReadonlyArray<AsyncIterable<T>>,
  signal?: AbortSignal,
): AsyncIterable<T> {
  if (sources.length === 0) return;

  const iterators = sources.map((s) => s[Symbol.asyncIterator]());
  type Pending = { iter: AsyncIterator<T>; index: number; promise: Promise<IteratorResult<T>> };
  const pending: Array<Pending | null> = iterators.map((iter, index) => ({
    iter,
    index,
    promise: iter.next(),
  }));

  const onAbort = async (): Promise<void> => {
    await Promise.all(
      pending.map(async (p) => {
        if (p && hasReturn(p.iter)) {
          try {
            await p.iter.return(undefined);
          } catch {
            // Suppress: we are cancelling regardless.
          }
        }
      }),
    );
  };

  if (signal?.aborted) {
    await onAbort();
    return;
  }

  const abortListener = (): void => {
    void onAbort();
  };
  signal?.addEventListener('abort', abortListener, { once: true });

  try {
    while (pending.some((p) => p !== null)) {
      if (signal?.aborted) return;

      // Race only the still-active iterators.
      const live = pending.filter((p): p is Pending => p !== null);
      const winner = await Promise.race(live.map(async (p) => ({ p, result: await p.promise })));

      if (winner.result.done) {
        pending[winner.p.index] = null;
        continue;
      }

      yield winner.result.value;

      // Re-prime the winning iterator.
      pending[winner.p.index] = {
        ...winner.p,
        promise: winner.p.iter.next(),
      };
    }
  } finally {
    signal?.removeEventListener('abort', abortListener);
    // Flush any remaining iterators.
    await Promise.all(
      pending.map(async (p) => {
        if (p && hasReturn(p.iter)) {
          try {
            await p.iter.return(undefined);
          } catch {
            // Suppress.
          }
        }
      }),
    );
  }
}

/**
 * Wrap `source` with abort-signal propagation: when `signal` aborts the
 * underlying iterator's `return()` is called and the loop exits cleanly.
 *
 * @stable
 */
export async function* withSignal<T>(
  source: AsyncIterable<T>,
  signal?: AbortSignal,
): AsyncIterable<T> {
  if (!signal) {
    yield* source;
    return;
  }
  if (signal.aborted) return;

  const iter = source[Symbol.asyncIterator]();
  let abortListener: (() => void) | null = null;

  const abortPromise = new Promise<{ aborted: true }>((resolve) => {
    abortListener = (): void => resolve({ aborted: true });
    signal.addEventListener('abort', abortListener, { once: true });
  });

  try {
    while (true) {
      const next = iter.next();
      const winner = await Promise.race([
        next.then((r) => ({ aborted: false as const, result: r })),
        abortPromise,
      ]);

      if (winner.aborted) {
        if (hasReturn(iter)) {
          try {
            await iter.return(undefined);
          } catch {
            // Suppress.
          }
        }
        return;
      }
      if (winner.result.done) return;
      yield winner.result.value;
    }
  } finally {
    if (abortListener) signal.removeEventListener('abort', abortListener);
  }
}
