/**
 * `createToolRegistry(...)` - the strategy-aware registry that hosts
 * every {@link Tool} the agent runtime sees.
 *
 * Lifecycle:
 *
 *  1. The agent runtime / MCP client / skill loader calls
 *     `register(tool, source)` for every tool. Multiple registrations
 *     with the same `name` from different sources are allowed at this
 *     stage - the registry tracks them in a multi-map.
 *  2. The agent runtime calls `assertNoDuplicates()` to confirm no
 *     first-party / inline registrations collided (programming
 *     errors fail-fast).
 *  3. The MCP client / skill loader calls
 *     `assertNoDuplicates(strategy, ctx)` to resolve cross-source
 *     collisions per the requested strategy. The call returns the
 *     {@link CollisionResolution} records the audit emitter +
 *     counter increments read from.
 *  4. After resolution, every `name` has exactly one entry; `get()`,
 *     `list()`, `listEager()`, `listDeferred()` return that single
 *     view.
 *
 * @packageDocumentation
 */

import type { ResolvedTool, Tool, ToolSource } from '@graphorin/core';

import {
  createRegisteredEvent,
  emitToolAudit,
  incrementCounter,
  observeHistogram,
  type ToolAuditEvent,
} from '../audit/index.js';
import { DuplicateToolNameError, ToolCollisionError } from '../errors/index.js';
import { projectSchemaToJsonSchema } from '../schema/to-json-schema.js';
import { defineBm25Index } from './bm25.js';
import { normaliseTool } from './normalize.js';
import type {
  CollisionContext,
  CollisionResolution,
  CollisionStrategy,
  RegistryEntry,
  ToolSearchEmbedder,
  ToolSearchMatch,
} from './types.js';

const FIRST_PARTY_SOURCE: ToolSource = Object.freeze({ kind: 'first-party' });

/** Trust-class precedence for the `'priority'` ladder (higher wins). */
const TRUST_CLASS_PRIORITY: Readonly<Record<string, number>> = Object.freeze({
  'first-party-built-in': 100,
  'first-party-user-defined': 100,
  'skill-trusted': 80,
  'skill-untrusted': 60,
  'mcp-derived': 40,
  'web-search': 20,
});

/** Configuration for {@link createToolRegistry}. */
export interface ToolRegistryOptions {
  readonly embedder?: ToolSearchEmbedder;
  readonly emitAudit?: (event: ToolAuditEvent) => void;
  /** Cosine threshold above which a semantic match counts. Default `0.5`. */
  readonly semanticScoreThreshold?: number;
  /**
   * C6: treat tools that do not declare `defer_loading` as deferred
   * (the minimal-scaffold posture). An explicit `defer_loading: false`
   * on the tool still wins. Default `false` (per-tool opt-in).
   */
  readonly deferLoadingByDefault?: boolean;
}

/**
 * Strategy-aware tool registry.
 *
 * @stable
 */
export interface ToolRegistry {
  register<TInput, TOutput, TDeps>(
    tool: Tool<TInput, TOutput, TDeps>,
    source?: ToolSource,
  ): RegistryEntry<TInput, TOutput, TDeps>;
  unregister(name: string): boolean;
  get<TInput = unknown, TOutput = unknown, TDeps = unknown>(
    name: string,
  ): RegistryEntry<TInput, TOutput, TDeps> | undefined;
  list(): ReadonlyArray<RegistryEntry>;
  listEager(): ReadonlyArray<RegistryEntry>;
  listDeferred(): ReadonlyArray<RegistryEntry>;
  /**
   * Filter the registry by `tag`. Each registered tool's `tags` array is
   * inspected; tools that include `tag` are returned in registration
   * order. Empty array when no tool matches. Used by the deferred-tool
   * lookup path AND by operator queries (e.g. `tool({ tags:
   * ['experimental'] })` for opt-out from per-tool lint rules).
   */
  listByTag(tag: string): ReadonlyArray<RegistryEntry>;
  /**
   * Pure-detection collision check. Throws
   * {@link DuplicateToolNameError} on first-party / inline collisions
   * (programming errors). Bytes-equal back-compat for callers that
   * never wired a strategy.
   */
  assertNoDuplicates(): void;
  /**
   * Strategy-aware collision overload. Returns the
   * {@link CollisionResolution} records for the audit emitter +
   * counter increments. Throws {@link ToolCollisionError} on the
   * `'manual'` strategy with no automatic resolution.
   */
  assertNoDuplicates(
    strategy: CollisionStrategy,
    ctx: CollisionContext,
  ): ReadonlyArray<CollisionResolution>;
  /**
   * Search the deferred pool for tools matching `query`. Three-tier
   * composable chain: semantic (embedder-backed) ⟶ BM25 fallback ⟶
   * regex name-match final fallback.
   */
  searchDeferred(query: string, k?: number): Promise<ReadonlyArray<ToolSearchMatch>>;
  /** Snapshot for tests. */
  size(): number;
  /** Tear down the registry - clears every entry. */
  clear(): void;
}

/**
 * Build a {@link ToolRegistry} instance.
 *
 * @stable
 */
export function createToolRegistry(opts: ToolRegistryOptions = {}): ToolRegistry {
  // Multi-map: a single name may have multiple registrations across
  // different sources during the registration phase; collision
  // resolution collapses to one entry per name.
  const entriesByName = new Map<string, RegistryEntry[]>();
  const embedder = opts.embedder;
  const semanticScoreThreshold = opts.semanticScoreThreshold ?? 0.5;
  const emit = opts.emitAudit ?? emitToolAudit;
  const emittedWarnings = new Set<string>();
  const embeddingCache = new Map<string, Float32Array>();
  const deferLoadingByDefault = opts.deferLoadingByDefault === true;

  function register<TInput, TOutput, TDeps>(
    tool: Tool<TInput, TOutput, TDeps>,
    source: ToolSource = FIRST_PARTY_SOURCE,
  ): RegistryEntry<TInput, TOutput, TDeps> {
    const outcome = normaliseTool(tool, source, { deferLoadingByDefault });
    const resolved = outcome.resolved;

    for (const warning of outcome.warnings) {
      switch (warning.kind) {
        case 'classification:missing': {
          const key = `cls-missing:${warning.toolName}`;
          if (!emittedWarnings.has(key)) {
            emittedWarnings.add(key);
            incrementCounter('tool.classification.missing.total', { source: source.kind });
            if (outcome.deferredDefaultApplied) {
              incrementCounter('tool.classification.deferred-default-applied.total', {
                toolName: warning.toolName,
              });
            }
            emit({
              action: 'tool:classification:warn',
              actor: { kind: 'system', id: 'tool-registry' },
              target: warning.toolName,
              decision: 'success',
              ts: Date.now(),
              metadata: {
                kind: 'missing-classification',
                source: source.kind,
                deferredDefaultApplied: outcome.deferredDefaultApplied,
              },
            });
          }
          break;
        }
        case 'sandbox:advisory-inline': {
          const key = `sandbox-advisory:${warning.toolName}`;
          if (!emittedWarnings.has(key)) {
            emittedWarnings.add(key);
            incrementCounter('tool.sandbox.advisory.total', { toolName: warning.toolName });
            emit({
              action: 'tool:classification:warn',
              actor: { kind: 'system', id: 'tool-registry' },
              target: warning.toolName,
              decision: 'success',
              ts: Date.now(),
              metadata: {
                kind: 'sandbox-policy-advisory-inline',
                policy: warning.policy,
                hint: 'inline tools run in-process; real isolation applies to module-loadable (skill/MCP) tools and code-mode',
              },
            });
          }
          break;
        }
        case 'classification:idempotency-key-missing': {
          const key = `idem-missing:${warning.toolName}:${warning.sideEffectClass}`;
          if (!emittedWarnings.has(key)) {
            emittedWarnings.add(key);
            incrementCounter('tool.classification.idempotency-key-missing.total', {
              toolName: warning.toolName,
              sideEffectClass: warning.sideEffectClass,
            });
            emit({
              action: 'tool:classification:warn',
              actor: { kind: 'system', id: 'tool-registry' },
              target: warning.toolName,
              decision: 'success',
              ts: Date.now(),
              metadata: {
                kind: 'idempotency-key-missing-for-side-effecting',
                sideEffectClass: warning.sideEffectClass,
                source: source.kind,
              },
            });
          }
          break;
        }
        case 'examples:overflow': {
          const key = `examples-overflow:${warning.toolName}:${warning.count}`;
          if (!emittedWarnings.has(key)) {
            emittedWarnings.add(key);
            incrementCounter('tool.examples.overflow.total', { toolName: warning.toolName });
            emit({
              action: 'tool:examples:overflow',
              actor: { kind: 'system', id: 'tool-registry' },
              target: warning.toolName,
              decision: 'success',
              ts: Date.now(),
              metadata: { count: warning.count },
            });
          }
          break;
        }
        case 'result:cap-disabled': {
          const key = `cap-disabled:${warning.toolName}`;
          if (!emittedWarnings.has(key)) {
            emittedWarnings.add(key);
            incrementCounter('tool.result.cap-disabled.total', { toolName: warning.toolName });
            emit({
              action: 'tool:result:cap-disabled',
              actor: { kind: 'system', id: 'tool-registry' },
              target: warning.toolName,
              decision: 'success',
              ts: Date.now(),
            });
          }
          break;
        }
      }
    }

    if (resolved.__preferredModel !== undefined) {
      const hintKind =
        typeof resolved.__preferredModel === 'string'
          ? `tier-${resolved.__preferredModel}`
          : 'spec';
      incrementCounter('tool.preferred-model.hint.declared.total', {
        toolName: resolved.name,
        hintKind,
      });
    }
    if (resolved.__effectiveDeferLoading) {
      incrementCounter('tool.retrieval.deferred.total', { source: 'explicit' });
    } else {
      incrementCounter('tool.retrieval.eager.total');
    }
    if (resolved.__streamingHint) {
      incrementCounter('tool.streaming.tools.registered.total', { toolName: resolved.name });
    }

    const bucket = entriesByName.get(resolved.name) ?? [];
    // First-party / inline duplicates are programming errors - fail-fast.
    if (source.kind === 'first-party') {
      const conflictingFirstParty = bucket.find((e) => e.__source.kind === 'first-party');
      if (conflictingFirstParty !== undefined) {
        throw new DuplicateToolNameError(resolved.name);
      }
    }
    // Idempotent re-registration from the exact same source replaces.
    const sameSourceIndex = bucket.findIndex((e) => sameSource(e.__source, source));
    if (sameSourceIndex >= 0) {
      // mcp-skills-04 (adjusted): same-source replace is the designed
      // idempotent refresh path (a toTools() re-run), but it is ALSO
      // how two DISTINCT server instances reporting the same identity
      // silently swallow each other's tools - the registry cannot tell
      // them apart. Count every replace so an identity collision is
      // observable churn instead of a silent swap.
      incrementCounter('tool.registry.same-source-replaced.total', {
        toolName: resolved.name,
        sourceKind: source.kind,
      });
      bucket[sameSourceIndex] = resolved as RegistryEntry;
    } else {
      bucket.push(resolved as RegistryEntry);
    }
    entriesByName.set(resolved.name, bucket);

    emit(
      createRegisteredEvent({
        toolName: resolved.name,
        trustClass: resolved.__trustClass,
        sideEffectClass: resolved.__sideEffectClass,
        hasIdempotencyKey: resolved.__hasIdempotencyKey,
        streamingHint: resolved.__streamingHint,
        inboundSanitization: resolved.inboundSanitization ?? 'pass-through',
        truncationStrategy: resolved.truncationStrategy ?? 'middle',
        maxResultTokens: resolved.maxResultTokens ?? 0,
        deferLoading: resolved.__effectiveDeferLoading,
        examplesCount: resolved.__exampleCount,
      }),
    );

    return resolved;
  }

  function unregister(name: string): boolean {
    return entriesByName.delete(name);
  }

  function get<TInput = unknown, TOutput = unknown, TDeps = unknown>(
    name: string,
  ): RegistryEntry<TInput, TOutput, TDeps> | undefined {
    const bucket = entriesByName.get(name);
    if (bucket === undefined || bucket.length === 0) return undefined;
    if (bucket.length === 1) return bucket[0] as RegistryEntry<TInput, TOutput, TDeps> | undefined;
    // Multiple registrations under one name - return the first-party
    // entry if one exists, otherwise the first registered.
    const firstParty = bucket.find((e) => isFirstPartyLike(e.__source));
    return (firstParty ?? bucket[0]) as RegistryEntry<TInput, TOutput, TDeps> | undefined;
  }

  function list(): ReadonlyArray<RegistryEntry> {
    const out: RegistryEntry[] = [];
    for (const bucket of entriesByName.values()) {
      out.push(...bucket);
    }
    return Object.freeze(out);
  }

  function listEager(): ReadonlyArray<RegistryEntry> {
    return Object.freeze(list().filter((e) => !e.__effectiveDeferLoading));
  }

  function listDeferred(): ReadonlyArray<RegistryEntry> {
    return Object.freeze(list().filter((e) => e.__effectiveDeferLoading));
  }

  function listByTag(tag: string): ReadonlyArray<RegistryEntry> {
    if (tag.length === 0) return Object.freeze<RegistryEntry[]>([]);
    return Object.freeze(list().filter((e) => (e.tags ?? []).includes(tag)));
  }

  function assertNoDuplicates(
    strategy?: CollisionStrategy,
    ctx?: CollisionContext,
  ): undefined | ReadonlyArray<CollisionResolution> {
    if (strategy === undefined) {
      assertNoDuplicatesPure();
      return undefined;
    }
    if (ctx === undefined) {
      throw new TypeError(
        "ToolRegistry.assertNoDuplicates(strategy, ctx): the 'ctx' argument is required when a strategy is supplied.",
      );
    }
    return resolveCollisionsAware(strategy, ctx);
  }

  function assertNoDuplicatesPure(): void {
    for (const [name, bucket] of entriesByName) {
      if (bucket.length < 2) continue;
      const firstPartyHits = bucket.filter((e) => e.__source.kind === 'first-party');
      if (firstPartyHits.length >= 2) {
        throw new DuplicateToolNameError(name);
      }
    }
  }

  function resolveCollisionsAware(
    strategy: CollisionStrategy,
    ctx: CollisionContext,
  ): ReadonlyArray<CollisionResolution> {
    const start = performance.now();
    const resolutions: CollisionResolution[] = [];

    // W-116: the residual case where a loser could not be renamed. After
    // the fallback namespace + truncation this is practically
    // unreachable, but "losers are renamed or at least observable" must
    // hold even for a pathological source shape - fix the outcome in the
    // resolution list, the audit stream and a counter instead of a bare
    // `continue`.
    const suppress = (toolName: string, winner: ToolSource, loser: ToolSource): void => {
      resolutions.push({ toolName, winner, losers: [loser], action: 'suppressed' });
      emit({
        action: 'tool:collision:suppressed',
        actor: { kind: 'system', id: 'tool-registry' },
        target: toolName,
        decision: 'denied',
        ts: Date.now(),
        metadata: { winner: describeSource(winner), loser: describeSource(loser) },
      });
      incrementCounter('tool.collision.suppressed.total');
    };

    for (const [name, bucket] of [...entriesByName.entries()]) {
      if (bucket.length < 2) continue;
      // Only resolve if `ctx.source` is among the colliding sources OR
      // the caller passed a "global" intent (we treat any call as global
      // - `ctx` is a tag the call carries for audit metadata, not a filter).
      const sources = bucket.map((e) => e.__source);
      void ctx;
      // First-party precedence rule.
      const firstParty = bucket.find((e) => isFirstPartyLike(e.__source));

      emit({
        action: 'tool:collision:detected',
        actor: { kind: 'system', id: 'tool-registry' },
        target: name,
        decision: 'success',
        ts: Date.now(),
        metadata: { strategy, sources: sources.map(describeSource) },
      });
      incrementCounter('tool.collision.detected.total', { strategy });

      if (firstParty !== undefined) {
        if (strategy === 'auto-prefix') {
          // First-party stays un-prefixed; rename every other entry.
          const renamed: { entry: RegistryEntry; from: string; to: string }[] = [];
          for (const entry of bucket) {
            if (entry === firstParty) continue;
            const to = autoPrefix(name, entry.__source);
            if (to === name) {
              suppress(name, firstParty.__source, entry.__source);
              continue;
            }
            renamed.push({ entry, from: name, to });
          }
          // Apply the renames.
          entriesByName.set(name, [firstParty]);
          for (const r of renamed) {
            const targetBucket = entriesByName.get(r.to) ?? [];
            // W-116: a rename must not mint a NEW collision (target name
            // already taken - e.g. two same-source losers, or a tool
            // registered under the prefixed name directly). Suppress the
            // loser observably instead.
            if (targetBucket.length > 0) {
              suppress(name, firstParty.__source, r.entry.__source);
              continue;
            }
            const renamedEntry: RegistryEntry = { ...r.entry, name: r.to } as RegistryEntry;
            targetBucket.push(renamedEntry);
            entriesByName.set(r.to, targetBucket);
            const resolution: CollisionResolution = {
              toolName: name,
              winner: firstParty.__source,
              losers: [r.entry.__source],
              action: 'auto-prefix-applied',
              renamed: {
                from: r.from,
                to: r.to,
                namespaceSource: namespaceSource(r.entry.__source),
              },
            };
            resolutions.push(resolution);
            emit({
              action: 'tool:collision:auto-prefix-applied',
              actor: { kind: 'system', id: 'tool-registry' },
              target: name,
              decision: 'success',
              ts: Date.now(),
              metadata: { renamed: r },
            });
            incrementCounter('tool.collision.auto-prefix-applied.total', {
              namespaceSource: namespaceSource(r.entry.__source),
            });
          }
          continue;
        }
        // 'priority' / 'manual' - first-party always wins.
        const losers = bucket.filter((e) => e !== firstParty);
        entriesByName.set(name, [firstParty]);
        incrementCounter('tool.collision.first-party-suppressed.total', {
          trustClass: 'first-party',
        });
        const resolution: CollisionResolution = {
          toolName: name,
          winner: firstParty.__source,
          losers: losers.map((l) => l.__source),
          action: 'first-party-precedence',
        };
        resolutions.push(resolution);
        if (strategy === 'manual') {
          emit({
            action: 'tool:collision:manual-rejected',
            actor: { kind: 'system', id: 'tool-registry' },
            target: name,
            decision: 'denied',
            ts: Date.now(),
            metadata: { strategy, sources: sources.map(describeSource) },
          });
          incrementCounter('tool.collision.manual-rejected.total');
          throw new ToolCollisionError({
            toolName: name,
            conflictingSources: sources.map(describeSource),
            strategyAttempted: strategy,
            resolutionOptions: ['auto-prefix', 'priority', 'filter-incoming'],
          });
        }
        continue;
      }

      // No first-party participant.
      switch (strategy) {
        case 'auto-prefix': {
          // Pick the highest-priority entry as winner (no rename);
          // rename every other entry with its own namespace.
          const ladder = [...bucket].sort(
            (a, b) =>
              (TRUST_CLASS_PRIORITY[b.__trustClass] ?? 0) -
              (TRUST_CLASS_PRIORITY[a.__trustClass] ?? 0),
          );
          const winner = ladder[0];
          if (winner === undefined) continue;
          entriesByName.set(name, [winner]);
          for (const entry of bucket) {
            if (entry === winner) continue;
            const to = autoPrefix(name, entry.__source);
            if (to === name) {
              suppress(name, winner.__source, entry.__source);
              continue;
            }
            const targetBucket = entriesByName.get(to) ?? [];
            // W-116: never mint a new collision through a rename.
            if (targetBucket.length > 0) {
              suppress(name, winner.__source, entry.__source);
              continue;
            }
            const renamedEntry: RegistryEntry = { ...entry, name: to } as RegistryEntry;
            targetBucket.push(renamedEntry);
            entriesByName.set(to, targetBucket);
            const resolution: CollisionResolution = {
              toolName: name,
              winner: winner.__source,
              losers: [entry.__source],
              action: 'auto-prefix-applied',
              renamed: { from: name, to, namespaceSource: namespaceSource(entry.__source) },
            };
            resolutions.push(resolution);
            emit({
              action: 'tool:collision:auto-prefix-applied',
              actor: { kind: 'system', id: 'tool-registry' },
              target: name,
              decision: 'success',
              ts: Date.now(),
              metadata: { renamed: { from: name, to } },
            });
            incrementCounter('tool.collision.auto-prefix-applied.total', {
              namespaceSource: namespaceSource(entry.__source),
            });
          }
          break;
        }
        case 'priority': {
          // Sort by trust-class priority + supplied per-call `priority`.
          const sorted = [...bucket].sort((a, b) => {
            const aBase = TRUST_CLASS_PRIORITY[a.__trustClass] ?? 0;
            const bBase = TRUST_CLASS_PRIORITY[b.__trustClass] ?? 0;
            const aBoost = sameSource(a.__source, ctx.source) ? (ctx.priority ?? 0) : 0;
            const bBoost = sameSource(b.__source, ctx.source) ? (ctx.priority ?? 0) : 0;
            return bBase + bBoost - (aBase + aBoost);
          });
          const winner = sorted[0];
          if (winner === undefined) continue;
          const tieBreakReason: 'explicit-priority' | 'registration-order' =
            ctx.priority !== undefined ? 'explicit-priority' : 'registration-order';
          const losers = bucket.filter((e) => e !== winner);
          entriesByName.set(name, [winner]);
          const resolution: CollisionResolution = {
            toolName: name,
            winner: winner.__source,
            losers: losers.map((l) => l.__source),
            action: 'priority-resolved',
            tieBreakReason,
          };
          resolutions.push(resolution);
          emit({
            action: 'tool:collision:priority-resolved',
            actor: { kind: 'system', id: 'tool-registry' },
            target: name,
            decision: 'success',
            ts: Date.now(),
            metadata: { tieBreakReason },
          });
          incrementCounter('tool.collision.priority-resolved.total', { tieBreakReason });
          break;
        }
        case 'manual': {
          emit({
            action: 'tool:collision:manual-rejected',
            actor: { kind: 'system', id: 'tool-registry' },
            target: name,
            decision: 'denied',
            ts: Date.now(),
            metadata: { strategy, sources: sources.map(describeSource) },
          });
          incrementCounter('tool.collision.manual-rejected.total');
          const resolution: CollisionResolution = {
            toolName: name,
            conflictingSources: sources,
            action: 'manual-rejected',
          };
          resolutions.push(resolution);
          throw new ToolCollisionError({
            toolName: name,
            conflictingSources: sources.map(describeSource),
            strategyAttempted: strategy,
            resolutionOptions: ['auto-prefix', 'priority', 'filter-incoming'],
          });
        }
      }
    }

    observeHistogram('tool.collision.resolution.duration_ms', performance.now() - start, {
      strategy,
    });
    return Object.freeze(resolutions);
  }

  async function searchDeferred(query: string, k = 5): Promise<ReadonlyArray<ToolSearchMatch>> {
    const start = performance.now();
    const deferred = list().filter((e) => e.__effectiveDeferLoading);
    if (deferred.length === 0 || query.trim().length === 0) {
      return Object.freeze<ToolSearchMatch[]>([]);
    }
    const matches = new Map<string, ToolSearchMatch>();
    let stagesUsed = '';

    if (embedder !== undefined) {
      try {
        const semantic = await runSemantic(deferred, query, k);
        for (const match of semantic) {
          if (match.score >= semanticScoreThreshold && !matches.has(match.name)) {
            matches.set(match.name, match);
          }
        }
        if (matches.size > 0) stagesUsed += 's';
      } catch {
        // Embedder failure is silent - fall through to BM25.
      }
    }

    if (matches.size < k) {
      const docs = deferred.map((entry) => ({
        id: entry.name,
        text: searchableToolText(entry),
      }));
      const bm25 = defineBm25Index(docs);
      const bm25Matches = bm25(query, k);
      let added = 0;
      for (const m of bm25Matches) {
        if (matches.has(m.id)) continue;
        const entry = deferred.find((e) => e.name === m.id);
        if (entry === undefined) continue;
        matches.set(m.id, toMatch(entry, m.score, 'bm25'));
        added++;
        if (matches.size >= k) break;
      }
      if (added > 0) stagesUsed += 'b';
    }

    if (matches.size < k) {
      const lowered = query.toLowerCase();
      let added = 0;
      for (const entry of deferred) {
        if (matches.has(entry.name)) continue;
        if (
          entry.name.toLowerCase().includes(lowered) ||
          (entry.tags ?? []).some((t) => t.toLowerCase().includes(lowered))
        ) {
          matches.set(entry.name, toMatch(entry, 0.5, 'regex-name'));
          added++;
        }
        if (matches.size >= k) break;
      }
      if (added > 0) stagesUsed += 'r';
    }

    const stage = stageLabel(stagesUsed);
    incrementCounter('tool.retrieval.search.invoked.total', { stage });
    observeHistogram('tool.retrieval.search.duration_ms', performance.now() - start, { stage });
    return Object.freeze([...matches.values()]);

    async function runSemantic(
      pool: RegistryEntry[],
      q: string,
      kk: number,
    ): Promise<ReadonlyArray<ToolSearchMatch>> {
      if (embedder === undefined) return [];
      const queries = await embedder.embed([q]);
      const queryVec = queries[0];
      if (queryVec === undefined) return [];
      const toEmbed: { entry: RegistryEntry; cacheKey: string; text: string }[] = [];
      for (const entry of pool) {
        const text = searchableToolText(entry);
        const cacheKey = `${embedder.id()}:${entry.name}:${text}`;
        if (embeddingCache.has(cacheKey)) continue;
        toEmbed.push({ entry, cacheKey, text });
      }
      if (toEmbed.length > 0) {
        const fresh = await embedder.embed(toEmbed.map((t) => t.text));
        for (let i = 0; i < toEmbed.length; i++) {
          const slot = toEmbed[i];
          const vec = fresh[i];
          if (slot !== undefined && vec !== undefined) {
            embeddingCache.set(slot.cacheKey, vec);
          }
        }
      }
      const scored: ToolSearchMatch[] = [];
      for (const entry of pool) {
        const cacheKey = `${embedder.id()}:${entry.name}:${searchableToolText(entry)}`;
        const vec = embeddingCache.get(cacheKey);
        if (vec === undefined) continue;
        const sim = cosine(queryVec, vec);
        scored.push(toMatch(entry, sim, 'semantic'));
      }
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, kk);
    }

    function stageLabel(combo: string): 'semantic' | 'bm25' | 'regex-name' | 'mixed' {
      if (combo === 's') return 'semantic';
      if (combo === 'b') return 'bm25';
      if (combo === 'r') return 'regex-name';
      return 'mixed';
    }
  }

  function size(): number {
    return list().length;
  }

  function clear(): void {
    entriesByName.clear();
    embeddingCache.clear();
    emittedWarnings.clear();
  }

  return {
    register,
    unregister,
    get,
    list,
    listEager,
    listDeferred,
    listByTag,
    assertNoDuplicates: assertNoDuplicates as ToolRegistry['assertNoDuplicates'],
    searchDeferred,
    size,
    clear,
  };
}

/**
 * C2: the text a deferred tool is FOUND by - name + description + tags +
 * worked-example comments. Example comments routinely carry the concrete
 * phrasing a model searches with ("resize an image to a width"), so
 * indexing them measurably widens recall over name+description alone.
 * Example input/output VALUES are deliberately excluded (JSON noise).
 */
function searchableToolText(entry: ResolvedTool): string {
  const parts: string[] = [entry.name, entry.description];
  if (entry.tags !== undefined && entry.tags.length > 0) parts.push(entry.tags.join(' '));
  for (const example of entry.examples ?? []) {
    if (example.comment !== undefined && example.comment.length > 0) parts.push(example.comment);
  }
  return parts.join(' ');
}

function toMatch(
  entry: ResolvedTool,
  score: number,
  source: 'semantic' | 'bm25' | 'regex-name',
): ToolSearchMatch {
  const bounded = Math.max(0, Math.min(1, score));
  // tools-01: project the live validator (plain Zod, toJSON-bearing, or
  // already-JSON-Schema) onto a JSON Schema record - `tool_search` output
  // is model-facing, so serialising Zod internals here would ship garbage.
  const inputSchema = projectSchemaToJsonSchema(entry.inputSchema) ?? {};
  // A5: carry the output schema so code-mode can render the signature's return type.
  const outputSchema = projectSchemaToJsonSchema(entry.outputSchema);
  return Object.freeze({
    name: entry.name,
    description: entry.description,
    inputSchema: inputSchema as Readonly<Record<string, unknown>>,
    ...(outputSchema !== undefined ? { outputSchema } : {}),
    score: bounded,
    source,
  });
}

function autoPrefix(name: string, source: ToolSource): string {
  // W-116: a loser must ALWAYS be renameable. An empty sanitised
  // namespace (e.g. an MCP serverIdentity made of non-alphanumerics)
  // falls back to `<kind>-<hash of the identifying field>`, and an
  // over-long candidate is truncated to the 128-char tool-name limit
  // with a hash suffix (so two long names truncating to the same stem
  // stay unique) instead of refusing the rename - previously either
  // case returned `name` unchanged and the loser silently vanished.
  const ns = namespaceSource(source);
  const effective =
    ns.length > 0 ? ns : sanitiseNamespace(`${source.kind}-${fnv1a(describeSource(source))}`);
  const candidate = `${effective}.${name}`;
  if (candidate.length <= 128) return candidate;
  const hash = fnv1a(candidate);
  return `${candidate.slice(0, 128 - hash.length - 1)}-${hash}`;
}

/** Deterministic 32-bit FNV-1a as 8 hex chars (naming only, not security). */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function namespaceSource(source: ToolSource): string {
  switch (source.kind) {
    case 'mcp':
      return sanitiseNamespace(source.serverIdentity);
    case 'skill':
      return sanitiseNamespace(source.skillName);
    case 'web-search':
      return sanitiseNamespace(source.providerName);
    case 'built-in':
      return sanitiseNamespace(source.subsystem);
    case 'first-party':
      return '';
  }
}

function sanitiseNamespace(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}

function describeSource(source: ToolSource): string {
  switch (source.kind) {
    case 'first-party':
      return 'first-party';
    case 'built-in':
      return `built-in:${source.subsystem}`;
    case 'skill':
      return `skill:${source.skillName}#${source.trustLevel}`;
    case 'mcp':
      return `mcp:${source.serverIdentity}`;
    case 'web-search':
      return `web-search:${source.providerName}`;
  }
}

function isFirstPartyLike(source: ToolSource): boolean {
  return source.kind === 'first-party' || source.kind === 'built-in';
}

function sameSource(a: ToolSource, b: ToolSource): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'first-party':
      return true;
    case 'built-in':
      return a.subsystem === (b as { subsystem: string }).subsystem;
    case 'skill':
      return (
        a.skillName === (b as { skillName: string }).skillName &&
        a.trustLevel === (b as { trustLevel: string }).trustLevel
      );
    case 'mcp':
      return a.serverIdentity === (b as { serverIdentity: string }).serverIdentity;
    case 'web-search':
      return a.providerName === (b as { providerName: string }).providerName;
  }
}

function cosine(a: Float32Array, b: Float32Array): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < length; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
