/**
 * Workflow channel kinds. Every state field declared on a workflow's
 * `stateSchema` is bound to a channel that decides the merge strategy
 * applied when multiple writers update the same field within a single
 * execution step.
 *
 * The names are **Graphorin's own design** and must not be aliased to
 * terms from other workflow libraries. A dedicated lint rule lands later
 * in the release line to enforce this.
 *
 * @stable
 */
export type ChannelKind =
  | 'latest-value'
  | 'any-value'
  | 'reducer'
  | 'list-aggregate'
  | 'stream'
  | 'barrier'
  | 'ephemeral';

/**
 * Discriminated union of every channel descriptor.
 *
 * Channels are a *description* of the merge strategy, not a runtime
 * value: the engine reads the `kind` field plus optional auxiliary
 * fields (`reduce`, `from`, `unique`) to decide how to combine writes.
 *
 * @stable
 */
export type Channel<T = unknown> =
  | LatestValue<T>
  | AnyValue<T>
  | Reducer<T>
  | ListAggregate<T>
  | Stream<T>
  | Barrier<T>
  | Ephemeral<T>;

/**
 * Overwrite-on-write. Multiple writes within the same execution step
 * raise `MultiWriteError` (use `AnyValue` if collisions are acceptable).
 *
 * @stable
 */
export interface LatestValue<T = unknown> {
  readonly kind: 'latest-value';
  readonly default?: T;
}

/**
 * Overwrite-on-write — collisions are silently allowed (last-write-wins
 * semantics within a step).
 *
 * @stable
 */
export interface AnyValue<T = unknown> {
  readonly kind: 'any-value';
  readonly default?: T;
}

/**
 * Fold writes via a user-provided `reduce` function. The reducer is
 * invoked left-to-right over the writes collected within an execution
 * step.
 *
 * @stable
 */
export interface Reducer<T = unknown> {
  readonly kind: 'reducer';
  readonly default?: T;
  readonly reduce: (prev: T, next: T) => T;
}

/**
 * Specialization of `Reducer<T[]>` that appends each write to a list.
 *
 * @stable
 */
export interface ListAggregate<T = unknown> {
  readonly kind: 'list-aggregate';
  readonly default?: ReadonlyArray<T>;
}

/**
 * Append-only queue. Used for dynamic task creation via `Dispatch(...)`
 * and for application-defined event streams.
 *
 * @stable
 */
export interface Stream<T = unknown> {
  readonly kind: 'stream';
  readonly unique?: boolean;
  readonly default?: ReadonlyArray<T>;
}

/**
 * Barrier — completes when every writer in `from` has produced a value.
 *
 * @stable
 */
export interface Barrier<T = unknown> {
  readonly kind: 'barrier';
  readonly from: ReadonlyArray<string>;
  readonly default?: T;
}

/**
 * Value scoped to a single execution step — discarded when the step
 * ends.
 *
 * @stable
 */
export interface Ephemeral<T = unknown> {
  readonly kind: 'ephemeral';
  readonly default?: T;
}

/**
 * Construct a `LatestValue` channel.
 *
 * @stable
 */
export function latestValue<T>(opts?: { readonly default?: T }): LatestValue<T> {
  return opts !== undefined && 'default' in opts && opts.default !== undefined
    ? { kind: 'latest-value', default: opts.default }
    : { kind: 'latest-value' };
}

/**
 * Construct an `AnyValue` channel.
 *
 * @stable
 */
export function anyValue<T>(opts?: { readonly default?: T }): AnyValue<T> {
  return opts !== undefined && 'default' in opts && opts.default !== undefined
    ? { kind: 'any-value', default: opts.default }
    : { kind: 'any-value' };
}

/**
 * Construct a `Reducer` channel.
 *
 * @stable
 */
export function reducer<T>(
  reduce: (prev: T, next: T) => T,
  opts?: { readonly default?: T },
): Reducer<T> {
  return opts !== undefined && 'default' in opts && opts.default !== undefined
    ? { kind: 'reducer', reduce, default: opts.default }
    : { kind: 'reducer', reduce };
}

/**
 * Construct a `ListAggregate` channel.
 *
 * @stable
 */
export function listAggregate<T>(opts?: { readonly default?: ReadonlyArray<T> }): ListAggregate<T> {
  return opts !== undefined && 'default' in opts && opts.default !== undefined
    ? { kind: 'list-aggregate', default: opts.default }
    : { kind: 'list-aggregate' };
}

/**
 * Construct a `Stream` channel.
 *
 * @stable
 */
export function stream<T>(opts?: {
  readonly unique?: boolean;
  readonly default?: ReadonlyArray<T>;
}): Stream<T> {
  const out: { kind: 'stream'; unique?: boolean; default?: ReadonlyArray<T> } = {
    kind: 'stream',
  };
  if (opts?.unique !== undefined) out.unique = opts.unique;
  if (opts?.default !== undefined) out.default = opts.default;
  return out;
}

/**
 * Construct a `Barrier` channel.
 *
 * @stable
 */
export function barrier<T>(
  from: ReadonlyArray<string>,
  opts?: { readonly default?: T },
): Barrier<T> {
  return opts !== undefined && 'default' in opts && opts.default !== undefined
    ? { kind: 'barrier', from, default: opts.default }
    : { kind: 'barrier', from };
}

/**
 * Construct an `Ephemeral` channel.
 *
 * @stable
 */
export function ephemeral<T>(opts?: { readonly default?: T }): Ephemeral<T> {
  return opts !== undefined && 'default' in opts && opts.default !== undefined
    ? { kind: 'ephemeral', default: opts.default }
    : { kind: 'ephemeral' };
}
