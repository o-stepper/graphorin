/**
 * Integration adapters (A-E) that let the `@graphorin/tools` executor
 * consume the agent's `@graphorin/security` / `@graphorin/memory` /
 * `@graphorin/provider` surfaces.
 *
 * These are built and unit-tested in isolation. The run loop wires
 * them into `createToolExecutor(...)`; nothing here is exported from
 * the package entrypoint yet.
 *
 * Every adapter is typed against the executor's `ExecutorOptions` via
 * indexed access, so the values they produce are guaranteed assignable
 * to the hooks `createToolExecutor(...)` expects - without depending on
 * which individual hook types `@graphorin/tools` happens to re-export.
 *
 * @packageDocumentation
 */

import type { Memory } from '@graphorin/memory';
import {
  type ApiBoundaryGuardOptions,
  type AuditOnlyGuardOptions,
  createGuard,
  type StrictFullGuardOptions,
} from '@graphorin/security/guard';
import {
  createDockerSandbox,
  createIsolatedVMSandbox,
  createWorkerThreadsSandbox,
  type SandboxImpl,
} from '@graphorin/security/sandbox';
import { parseSecretRef, resolveSecret } from '@graphorin/security/secrets';
import type { ExecutorOptions } from '@graphorin/tools/executor';
import { countTokensHeuristic } from '@graphorin/tools/result';

// --- Executor hook shapes (derived from `ExecutorOptions`) ------------------
// Indexed access keeps these in lock-step with what the executor expects.

/** The executor's secret-resolver hook: `{ resolve(key): Promise<SecretValue | null> }`. */
type SecretResolver = NonNullable<ExecutorOptions['secretResolver']>;
/** A resolved `SecretValue`, or `null` when the backing store has no value. */
type SecretValueOrNull = Awaited<ReturnType<SecretResolver['resolve']>>;
/** The executor's sandbox-dispatch resolver: `(policy) => Sandbox | null`. */
type SandboxResolver = NonNullable<ExecutorOptions['sandboxResolver']>;
/** The executor's memory-guard factory: `(tier) => MemoryModificationGuard | null`. */
type MemoryGuardFactory = NonNullable<ExecutorOptions['memoryGuardFactory']>;
/** The discriminator the guard factory receives (`'pure' | … | 'untrusted'`). */
type MemoryGuardTier = Parameters<MemoryGuardFactory>[0];
/** A guard instance, or `null` when the tier needs no guard / cannot be built. */
type MemoryModificationGuardOrNull = ReturnType<MemoryGuardFactory>;
/** The reader the guard hashes pre/post execution: `{ regions; read(region) }`. */
type MemoryRegionReader = NonNullable<ExecutorOptions['memoryRegionReader']>;
/** The executor's **synchronous** truncation token counter: `{ count(text): number }`. */
type ToolTokenCounter = NonNullable<ExecutorOptions['tokenCounter']>;
/** A value the executor's `streamingSink` receives (a `tool.execute.*` event). */
type ExecutorEvent = Parameters<NonNullable<ExecutorOptions['streamingSink']>>[0];

// ---------------------------------------------------------------------------
// Adapter A - `secretResolver`
// ---------------------------------------------------------------------------

/**
 * Backend that turns a secret reference into a resolved value (or
 * `null` when the backing store represents "absent" as null). Defaults
 * to `@graphorin/security`'s global resolver registry
 * (`resolveSecret(parseSecretRef(key))`), which **rejects** on a
 * malformed ref / unknown scheme / resolution failure and never returns
 * null - those rejections surface as tool errors through the executor's
 * secrets accessor.
 */
export type SecretBackend = (key: string) => Promise<SecretValueOrNull>;

/** Options for {@link buildSecretResolver}. */
export interface SecretResolverOptions {
  /** Resolution backend. Defaults to `resolveSecret(parseSecretRef(key))`. */
  readonly backend?: SecretBackend;
}

/**
 * Adapter A - build the executor's `secretResolver` hook.
 *
 * This is a thin **value resolver**. The executor's secrets accessor
 * (`@graphorin/tools` `tool-context.ts`) already (1) enforces the
 * per-tool `secretsAllowed` ACL via `enforceSecretAcl(key)` inside a
 * `withChildToolSecretsContext(...)` scope and (2) maps a `null` result
 * onto the optional/required-secret error contract. This adapter must
 * therefore **not** re-implement ACL - it only resolves a key to a
 * value.
 */
export function buildSecretResolver(options: SecretResolverOptions = {}): SecretResolver {
  const backend: SecretBackend =
    options.backend ?? (async (key) => resolveSecret(parseSecretRef(key)));
  return Object.freeze({ resolve: backend });
}

// ---------------------------------------------------------------------------
// Adapter B - `sandboxResolver`
// ---------------------------------------------------------------------------

/** Isolation kinds the default resolver knows how to construct. */
type IsolatedKind = 'worker-threads' | 'isolated-vm' | 'docker';

/** Factory producing a concrete sandbox for a given isolation kind. */
export type SandboxFactory = () => SandboxImpl;

/** Per-kind sandbox factory overrides (e.g. fakes in tests, custom adapters). */
export type SandboxFactoryMap = Partial<Record<IsolatedKind, SandboxFactory>>;

/** Options for {@link buildSandboxResolver}. */
export interface SandboxResolverOptions {
  /**
   * Per-kind factory overrides. Defaults wire the three out-of-process
   * `@graphorin/security` adapters. Tests inject fakes so unit runs
   * never spawn real worker threads / containers (offline). The
   * factories are invoked **lazily** - never at build time - so the
   * production default costs nothing until a tool actually needs that
   * isolation kind.
   */
  readonly factories?: SandboxFactoryMap;
}

/**
 * Adapter B - build the executor's `sandboxResolver`.
 *
 * Maps a `ResolvedSandboxPolicy.kind` to a cached `SandboxImpl`,
 * lazily constructing **one instance per kind**. Returns `null` for
 * `'none'` (run the tool inline) and for any kind without a registered
 * factory (custom kinds need a custom resolver).
 */
export function buildSandboxResolver(options: SandboxResolverOptions = {}): SandboxResolver {
  const factories: Record<IsolatedKind, SandboxFactory> = {
    'worker-threads': options.factories?.['worker-threads'] ?? (() => createWorkerThreadsSandbox()),
    'isolated-vm': options.factories?.['isolated-vm'] ?? (() => createIsolatedVMSandbox()),
    docker: options.factories?.docker ?? (() => createDockerSandbox()),
  };
  // Look up factories by the (open) policy kind. `SandboxKind` carries a
  // `(string & {})` member that defeats literal narrowing, so we index a
  // string-keyed view: a miss (incl. `'none'` and custom kinds) runs inline.
  const lookup = factories as Record<string, SandboxFactory | undefined>;
  const cache = new Map<string, SandboxImpl>();

  return (policy) => {
    const kind = policy.kind;
    const factory = lookup[kind];
    if (factory === undefined) {
      return null;
    }
    let impl = cache.get(kind);
    if (impl === undefined) {
      impl = factory();
      cache.set(kind, impl);
    }
    return impl;
  };
}

// ---------------------------------------------------------------------------
// Adapter C - `memoryGuardFactory` + `memoryRegionReader`
// ---------------------------------------------------------------------------

/** Options for {@link buildMemoryGuard}. */
export interface MemoryGuardOptions {
  /**
   * Options for the `'memory-aware'` API-boundary guard. The guard
   * requires an operation allowlist + a recorder of observed
   * `<scope>.<op>` calls, both supplied by the runtime once a run scope
   * exists. When omitted, the factory returns `null` for the
   * `'memory-aware'` tier and the executor skips the guard.
   */
  readonly apiBoundary?: ApiBoundaryGuardOptions;
  /** Options for the `'unknown'` (audit-only) guard. */
  readonly auditOnly?: AuditOnlyGuardOptions;
  /** Options for the `'untrusted'` (strict-full) guard. */
  readonly strictFull?: StrictFullGuardOptions;
  /**
   * The region reader the guard hashes pre/post execution. The reader
   * is **scope-bound** (it materialises memory regions for a specific
   * run scope), so the runtime supplies it at wiring time - the `Memory`
   * facade exposes no scope-free read surface. When omitted, the
   * executor skips the snapshot/verify cycle (it only runs the guard
   * when the reader is present).
   */
  readonly regionReader?: MemoryRegionReader;
}

/** The executor wiring produced by {@link buildMemoryGuard}. */
export interface MemoryGuardWiring {
  readonly memoryGuardFactory: MemoryGuardFactory;
  readonly memoryRegionReader?: MemoryRegionReader;
}

/**
 * Adapter C - build the executor's `memoryGuardFactory` (+ an optional
 * `memoryRegionReader`) from the agent's configured `Memory`.
 *
 * When `memory` is `undefined`, the factory returns `null` for every
 * tier and no reader is supplied - the executor degrades to its
 * audit-only baseline (the guard step is skipped).
 */
export function buildMemoryGuard(
  memory: Memory | undefined,
  options: MemoryGuardOptions = {},
): MemoryGuardWiring {
  if (memory === undefined) {
    return Object.freeze({ memoryGuardFactory: () => null });
  }

  const memoryGuardFactory: MemoryGuardFactory = (
    tier: MemoryGuardTier,
  ): MemoryModificationGuardOrNull => {
    switch (tier) {
      case 'pure':
      case 'side-effecting-no-memory':
        return createGuard({ tier });
      case 'unknown':
        return createGuard({ tier, ...(options.auditOnly ?? {}) });
      case 'untrusted':
        return createGuard({ tier, ...(options.strictFull ?? {}) });
      case 'memory-aware':
        return options.apiBoundary === undefined
          ? null
          : createGuard({ tier, ...options.apiBoundary });
      default:
        return null;
    }
  };

  return Object.freeze(
    options.regionReader === undefined
      ? { memoryGuardFactory }
      : { memoryGuardFactory, memoryRegionReader: options.regionReader },
  );
}

/**
 * Construct a `MemoryRegionReader` from an explicit region list and a
 * read function. The runtime uses this to bind the agent's `Memory` tiers to
 * named regions once a run scope exists; exposed here so the reader
 * contract is unit-testable in isolation.
 */
export function createMemoryRegionReader(
  regions: ReadonlyArray<string>,
  read: (region: string) => Promise<Uint8Array | string>,
): MemoryRegionReader {
  return Object.freeze({ regions: Object.freeze([...regions]), read });
}

// ---------------------------------------------------------------------------
// Adapter D - `tokenCounter` (the sync/async impedance mismatch)
// ---------------------------------------------------------------------------

/** A synchronous tokenizer (e.g. js-tiktoken's `encode`) returning a token array. */
export type SyncTokenize = (text: string) => { readonly length: number };

/** Options for {@link buildToolTokenCounter}. */
export interface ToolTokenCounterOptions {
  /**
   * Optional synchronous tokenizer. When provided, the token count is
   * `tokenize(text).length`. Defaults to the `@graphorin/tools`
   * heuristic (4 chars/token).
   */
  readonly tokenize?: SyncTokenize;
}

/**
 * Adapter D - build the **synchronous** token counter the executor's
 * truncation pipeline requires.
 *
 * DESIGN DECISION (impedance mismatch §1.6.1): `@graphorin/tools`'
 * `TokenCounter.count(text): number` is synchronous, while
 * `@graphorin/provider`'s `createDefaultCounter().count(input): Promise<number>`
 * is asynchronous (and also accepts `Message[]`). The truncation path
 * runs inside `executeBatch` and must not `await`, so we never wire the
 * provider's async counter here. We default to the tools heuristic
 * (deterministic, offline) and allow a *synchronous* tokenizer (e.g.
 * js-tiktoken's `encode`) to be injected when a caller wants
 * vendor-accurate counts without blocking. The async provider counter
 * stays reserved for budget accounting elsewhere, not for
 * executor truncation.
 */
export function buildToolTokenCounter(options: ToolTokenCounterOptions = {}): ToolTokenCounter {
  const { tokenize } = options;
  if (tokenize === undefined) {
    return countTokensHeuristic;
  }
  return Object.freeze({
    count: (text: string): number => tokenize(text).length,
  });
}

// ---------------------------------------------------------------------------
// Adapter E - `streamingSink` → `AgentEvent` stream bridge
// ---------------------------------------------------------------------------

/** Options for {@link createExecutorEventBridge}. */
export interface ExecutorEventBridgeOptions {
  /**
   * Maximum buffered events before backpressure drops the **oldest**
   * event (preserving the most-recent window). Defaults to `256`, matching
   * the executor's `streamingEventQueueDepth` default. Under normal
   * operation the consumer drains faster than the producer and nothing
   * is ever dropped; this bound is a safety valve.
   */
  readonly queueDepth?: number;
}

/**
 * Bridges the executor's synchronous `streamingSink` callback into an
 * async iterable the run loop can `for await` over.
 *
 * Single-producer / single-consumer: `sink` is the producer (called by
 * the executor); one `drain()` iterator is the consumer (the loop). It
 * is generic over the event type (defaulting to the executor's
 * `ExecutorEvent`) so the queue mechanics can be exercised in isolation.
 */
export interface ExecutorEventBridge<T = ExecutorEvent> {
  /**
   * Synchronous sink handed to the executor's `streamingSink`. Never
   * throws and never blocks; events emitted after {@link close} are
   * dropped.
   */
  readonly sink: (event: T) => void;
  /**
   * Async iterable yielding events in arrival order. Completes once
   * {@link close} has been called **and** the buffer is drained.
   */
  drain(): AsyncIterableIterator<T>;
  /** Signal end-of-stream; `drain()` finishes after the buffer drains. */
  close(): void;
  /** Count of events dropped under backpressure (oldest-dropped). */
  readonly dropped: number;
}

/**
 * Adapter E - bridge the executor's `streamingSink` callback to an
 * async iterator via a bounded queue.
 */
export function createExecutorEventBridge<T = ExecutorEvent>(
  options: ExecutorEventBridgeOptions = {},
): ExecutorEventBridge<T> {
  const queueDepth = options.queueDepth ?? 256;
  const buffer: T[] = [];
  let pending: ((result: IteratorResult<T, undefined>) => void) | null = null;
  let closed = false;
  let dropped = 0;

  const sink = (event: T): void => {
    if (closed) {
      return;
    }
    if (pending !== null) {
      // A consumer is parked - hand the event off directly.
      const resolve = pending;
      pending = null;
      resolve({ value: event, done: false });
      return;
    }
    buffer.push(event);
    if (buffer.length > queueDepth) {
      buffer.shift();
      dropped += 1;
    }
  };

  async function* drain(): AsyncIterableIterator<T> {
    for (;;) {
      if (buffer.length > 0) {
        const event = buffer.shift();
        if (event !== undefined) {
          yield event;
        }
        continue;
      }
      if (closed) {
        return;
      }
      const next = await new Promise<IteratorResult<T, undefined>>((resolve) => {
        pending = resolve;
      });
      if (next.done === true) {
        return;
      }
      yield next.value;
    }
  }

  const close = (): void => {
    closed = true;
    if (pending !== null) {
      const resolve = pending;
      pending = null;
      resolve({ value: undefined, done: true });
    }
  };

  return Object.freeze({
    sink,
    drain,
    close,
    get dropped(): number {
      return dropped;
    },
  });
}
