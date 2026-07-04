import type {
  MemoryHit,
  MemoryOwner,
  MemoryProvenance,
  MemoryStatus,
  Rule,
  RunState,
  Sensitivity,
  SessionScope,
  Tracer,
} from '@graphorin/core';
import {
  type InducedProcedure,
  runWorkflowInduction,
  type Trajectory,
  trajectoryFromRunState,
  type WorkflowInducer,
} from '../consolidator/phases/induce.js';
import {
  ProcedureInductionNotConfiguredError,
  QuarantinePromotionRefusedError,
} from '../errors/index.js';
import { newMemoryId } from '../internal/id.js';
import { detectMemoryInjection } from '../internal/injection-heuristics.js';
import { withMemorySpan } from '../internal/spans.js';
import type { MemoryStoreAdapter } from '../internal/storage-adapter.js';

/** Default priority for an *induced* procedure — below the author default
 * (50) because an induced, still-quarantined procedure is provisional. */
const INDUCED_PRIORITY = 40;

/**
 * Author-time rule payload accepted by {@link ProceduralMemory.define}.
 *
 * @stable
 */
export interface RuleInput {
  readonly text: string;
  /**
   * Free-form predicate evaluated by {@link ProceduralMemory.activate}.
   * The predicate language is intentionally narrow in v0.1: either
   * the literal string `'always'`, or a `'topic=...'` / `'tag=...'`
   * shorthand. Custom predicates should be expressed as a callable
   * matched in `activate(...)`'s `customMatchers` argument.
   */
  readonly condition?: string;
  /** Default `'public'` per DEC-126 — rules are NOT user data. */
  readonly sensitivity?: Sensitivity;
  readonly priority?: number;
  readonly tags?: ReadonlyArray<string>;
  /**
   * Optional structured workflow payload (P2-2). Usually set by
   * {@link ProceduralMemory.induce}, but accepted here so an author can
   * round-trip a hand-written procedure. See {@link Rule.steps}.
   */
  readonly steps?: ReadonlyArray<string>;
  /** Variable names abstracted into {@link RuleInput.steps} (P2-2). */
  readonly variables?: ReadonlyArray<string>;
  /** Verifiable success criteria stored with the procedure (P2-2). */
  readonly successCriteria?: ReadonlyArray<string>;
  /** Principal dimension (D3). Absent ⇒ NULL (treated `'user'`). */
  readonly owner?: MemoryOwner;
}

/**
 * Options for {@link ProceduralMemory.induce}.
 *
 * @stable
 */
export interface InduceOptions {
  /** Sensitivity of the stored procedure. Default `'internal'`. */
  readonly sensitivity?: Sensitivity;
  /** Priority of the stored procedure. Default {@link INDUCED_PRIORITY} (40). */
  readonly priority?: number;
}

/**
 * Predicate context passed to {@link ProceduralMemory.activate}.
 *
 * @stable
 */
export interface RuleActivationContext {
  readonly topic?: string;
  readonly tags?: ReadonlyArray<string>;
}

/**
 * `ProceduralMemory` — standing orders activated when the agent's
 * current context matches the rule's predicate. The activation rules
 * are deterministic so the agent runtime + ContextEngine can render
 * the active set into the system prompt every step.
 *
 * P2-2 adds {@link ProceduralMemory.induce}: distil a reusable workflow
 * from a successful agent trajectory and store it **quarantined** (it must
 * not drive actions until validated). Quarantined procedures are excluded
 * from {@link ProceduralMemory.activate} but remain visible to
 * {@link ProceduralMemory.list}.
 *
 * @stable
 */
export class ProceduralMemory {
  readonly #store: MemoryStoreAdapter;
  readonly #tracer: Tracer;
  /** Opt-in workflow inducer (P2-2). `null` ⇒ {@link induce} throws. */
  readonly #inducer: WorkflowInducer | null;
  /**
   * Promotion-by-demonstrated-success threshold (MCON-2 part 4).
   * `null` ⇒ outcomes are counted but never auto-promote.
   */
  readonly #promoteAfterSuccesses: number | null;

  constructor(args: {
    store: MemoryStoreAdapter;
    tracer: Tracer;
    inducer?: WorkflowInducer | null;
    promoteAfterSuccesses?: number | null;
  }) {
    this.#store = args.store;
    this.#tracer = args.tracer;
    this.#inducer = args.inducer ?? null;
    const k = args.promoteAfterSuccesses;
    this.#promoteAfterSuccesses =
      typeof k === 'number' && Number.isFinite(k) && k >= 1 ? Math.floor(k) : null;
  }

  /**
   * Record the outcome of one demonstrated reuse of a procedure
   * (MCON-2 part 4). A success increments the rule's persistent
   * `successCount`; when `procedurePromotion.afterSuccesses` is
   * configured and a QUARANTINED procedure reaches the threshold it is
   * promoted through {@link validate} — the injection gate still
   * applies, so a flagged text refuses promotion (surfaced as
   * `refused: true`) no matter how many successes accumulate.
   * Failures are observed but not persisted (no negative counter yet).
   *
   * Callers decide what "success" means — typically
   * `checkSuccessCriteria(...)` over the procedure's stored
   * `successCriteria`, or an operator's judgement.
   *
   * @stable
   */
  async recordOutcome(
    scope: SessionScope,
    ruleId: string,
    succeeded: boolean,
  ): Promise<{
    readonly successCount: number;
    readonly promoted: boolean;
    readonly refused: boolean;
  }> {
    return withMemorySpan(
      this.#tracer,
      'memory.write.procedural',
      scope,
      { 'memory.procedural.action': 'record-outcome', 'memory.procedural.rule_id': ruleId },
      async (span) => {
        const store = this.#store.procedural;
        if (!succeeded || typeof store.recordSuccess !== 'function') {
          span.setAttributes({ 'memory.procedural.outcome.counted': false });
          return { successCount: 0, promoted: false, refused: false };
        }
        const successCount = await store.recordSuccess(ruleId);
        span.setAttributes({ 'memory.procedural.outcome.success_count': successCount });
        const threshold = this.#promoteAfterSuccesses;
        if (threshold === null || successCount < threshold) {
          return { successCount, promoted: false, refused: false };
        }
        const existing = (await store.list(scope)).find((rule) => rule.id === ruleId) ?? null;
        if (existing === null || existing.status !== 'quarantined') {
          return { successCount, promoted: false, refused: false };
        }
        try {
          await this.validate(
            scope,
            ruleId,
            `demonstrated-success: ${successCount} >= ${threshold}`,
          );
          span.setAttributes({ 'memory.procedural.outcome.promoted': true });
          return { successCount, promoted: true, refused: false };
        } catch (err) {
          if (err instanceof QuarantinePromotionRefusedError) {
            span.setAttributes({ 'memory.procedural.outcome.refused': true });
            return { successCount, promoted: false, refused: true };
          }
          throw err;
        }
      },
    );
  }

  /** Persist a rule. Returns the stored record. */
  async define(scope: SessionScope, input: RuleInput): Promise<Rule> {
    return withMemorySpan(this.#tracer, 'memory.write.procedural', scope, {}, async (span) => {
      const now = new Date().toISOString();
      const rule: Rule = {
        id: newMemoryId('rule'),
        kind: 'procedural',
        userId: scope.userId,
        ...(scope.sessionId !== undefined ? { sessionId: scope.sessionId } : {}),
        ...(scope.agentId !== undefined ? { agentId: scope.agentId } : {}),
        sensitivity: input.sensitivity ?? 'public',
        text: input.text,
        ...(input.condition !== undefined ? { condition: input.condition } : {}),
        priority: input.priority ?? 50,
        ...(input.tags !== undefined ? { tags: Object.freeze([...input.tags]) } : {}),
        ...(input.steps !== undefined ? { steps: Object.freeze([...input.steps]) } : {}),
        ...(input.variables !== undefined
          ? { variables: Object.freeze([...input.variables]) }
          : {}),
        ...(input.successCriteria !== undefined
          ? { successCriteria: Object.freeze([...input.successCriteria]) }
          : {}),
        ...(input.owner !== undefined ? { owner: input.owner } : {}),
        createdAt: now,
        updatedAt: now,
      };
      await this.#store.procedural.add(rule);
      span.setAttributes({
        'memory.procedural.priority': rule.priority,
        'memory.procedural.text_length': input.text.length,
      });
      return rule;
    });
  }

  /**
   * Induce a reusable procedure (P2-2) from a successful agent trajectory
   * and store it **quarantined** + `provenance: 'induction'` (P1-4). Returns
   * the stored {@link Rule}, or `null` when the trajectory was unsuccessful /
   * empty or the inducer produced nothing inducible.
   *
   * Throws {@link ProcedureInductionNotConfiguredError} when no inducer was
   * configured (`createMemory({ procedureInduction: { provider } })`).
   */
  async induce(
    scope: SessionScope,
    trajectory: Trajectory,
    opts: InduceOptions = {},
  ): Promise<Rule | null> {
    const inducer = this.#inducer;
    if (inducer === null) throw new ProcedureInductionNotConfiguredError();
    return withMemorySpan(
      this.#tracer,
      'memory.write.procedural',
      scope,
      { 'memory.procedural.action': 'induce' },
      async (span) => {
        const induced = await runWorkflowInduction(trajectory, inducer, {});
        if (induced === null) {
          span.setAttributes({ 'memory.procedural.induced': 0 });
          return null;
        }
        const now = new Date().toISOString();
        const rule: Rule = {
          id: newMemoryId('rule'),
          kind: 'procedural',
          userId: scope.userId,
          ...(scope.sessionId !== undefined ? { sessionId: scope.sessionId } : {}),
          ...(scope.agentId !== undefined ? { agentId: scope.agentId } : {}),
          // Induced from a run ⇒ user-derived, so 'internal' (not the public
          // default for author-defined rules).
          sensitivity: opts.sensitivity ?? 'internal',
          text: renderProcedureText(induced),
          priority: opts.priority ?? INDUCED_PRIORITY,
          steps: Object.freeze([...induced.steps]),
          variables: Object.freeze([...induced.variables]),
          successCriteria: Object.freeze([...induced.successCriteria]),
          // Highest-poisoning-risk write in the system — procedures drive
          // actions, so it lands quarantined + provenance-tagged (P1-4).
          provenance: 'induction' satisfies MemoryProvenance,
          status: 'quarantined' satisfies MemoryStatus,
          // D3: an induced procedure is the agent's own inference.
          owner: 'agent',
          createdAt: now,
          updatedAt: now,
        };
        await this.#store.procedural.add(rule);
        span.setAttributes({
          'memory.procedural.induced': 1,
          'memory.procedural.steps': induced.steps.length,
          'memory.procedural.variables': induced.variables.length,
        });
        return rule;
      },
    );
  }

  /**
   * Convenience over {@link induce}: distil the {@link Trajectory} from a
   * completed {@link RunState} (the agent's already-emitted run state) and
   * induce a procedure. The success signal is `status === 'completed'`.
   */
  async induceFromRun(
    scope: SessionScope,
    run: RunState,
    opts: InduceOptions = {},
  ): Promise<Rule | null> {
    return this.induce(scope, trajectoryFromRunState(run), opts);
  }

  /** Soft-delete a rule. */
  async remove(scope: SessionScope, ruleId: string, reason?: string): Promise<void> {
    await withMemorySpan(
      this.#tracer,
      'memory.write.procedural',
      scope,
      { 'memory.procedural.action': 'remove', 'memory.procedural.rule_id': ruleId },
      async () => {
        await this.#store.procedural.remove(ruleId, reason);
      },
    );
  }

  /** List every active (non-deleted) rule for the supplied scope. */
  async list(scope: SessionScope): Promise<ReadonlyArray<Rule>> {
    return withMemorySpan(this.#tracer, 'memory.read.procedural', scope, {}, async (span) => {
      const out = await this.#store.procedural.list(scope);
      span.setAttributes({ 'memory.read.procedural.count': out.length });
      return out;
    });
  }

  /**
   * Return the rules active under `context`. Rules without a
   * `condition` are always active; the bundled predicate vocabulary
   * supports the literals `'always'`, `'topic=<topic>'`, and
   * `'tag=<tag>'`. Anything outside that grammar is treated as
   * always-active so callers do not silently lose rules.
   *
   * **Quarantined procedures are excluded** (P1-4 / P2-2): an induced
   * procedure must not drive actions until validated, so activation — which
   * feeds the system prompt — never surfaces it.
   */
  async activate(
    scope: SessionScope,
    context: RuleActivationContext = {},
  ): Promise<ReadonlyArray<Rule>> {
    const rules = await this.list(scope);
    return rules
      .filter((rule) => rule.status !== 'quarantined' && predicateMatches(rule, context))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Runbook content search (D3): "find the procedure for this task" —
   * lexical recall over rule text, as opposed to predicate
   * {@link activate}. Returns **whole validated procedures** (the full
   * {@link Rule} incl. steps / variables / success criteria) so a match
   * can be followed file-style rather than re-synthesized from
   * fragments. Quarantined (unvalidated induced) procedures are
   * excluded — they must not drive actions — unless the inspector opts
   * in via `includeQuarantined`.
   *
   * Uses the storage adapter's FTS surface when available
   * (`procedural.search`, the default `@graphorin/store-sqlite` adapter
   * implements it via migration 028); otherwise degrades to an offline
   * in-memory token-overlap scan over {@link list}, so custom adapters
   * keep working without the index.
   */
  async search(
    scope: SessionScope,
    query: string,
    opts: { readonly topK?: number; readonly includeQuarantined?: boolean } = {},
  ): Promise<ReadonlyArray<MemoryHit<Rule>>> {
    return withMemorySpan(
      this.#tracer,
      'memory.read.procedural',
      scope,
      { 'memory.procedural.action': 'search' },
      async (span) => {
        const topK = opts.topK ?? 5;
        const store = this.#store.procedural;
        if (typeof store.search === 'function') {
          const hits = await store.search(scope, query, {
            topK,
            ...(opts.includeQuarantined === true ? { includeQuarantined: true } : {}),
          });
          span.setAttributes({
            'memory.read.procedural.count': hits.length,
            'memory.read.procedural.search_backend': 'store',
          });
          return hits;
        }
        // Fallback: offline token-overlap scoring over list(). Coarse by
        // design — it exists so the runbook surface degrades instead of
        // disappearing on adapters without an FTS index.
        const tokens = tokenizeForRunbook(query);
        const rules = await this.list(scope);
        const scored = rules
          .filter((rule) => opts.includeQuarantined === true || rule.status !== 'quarantined')
          .map((rule) => {
            const haystack = tokenizeForRunbook(
              [rule.text, ...(rule.steps ?? []), ...(rule.tags ?? [])].join(' '),
            );
            const overlap = tokens.filter((t) => haystack.includes(t)).length;
            return { rule, overlap };
          })
          .filter((entry) => entry.overlap > 0)
          .sort((a, b) => b.overlap - a.overlap || (a.rule.id < b.rule.id ? -1 : 1))
          .slice(0, topK);
        span.setAttributes({
          'memory.read.procedural.count': scored.length,
          'memory.read.procedural.search_backend': 'fallback',
        });
        return scored.map((entry) => ({
          record: entry.rule,
          score: tokens.length === 0 ? 0 : entry.overlap / tokens.length,
          signals: { lexical: entry.overlap },
        }));
      },
    );
  }

  /**
   * Promote a quarantined (induced) procedure into `activate()` (MCON-2).
   * Mirrors {@link SemanticMemory.validate}: re-derives the injection verdict
   * from the stored rule text and **refuses** promotion of an injection-flagged
   * procedure unless an operator passes `{ force: true }`. Induced procedures
   * drive *actions*, so this gate matters most for them.
   */
  async validate(
    scope: SessionScope,
    ruleId: string,
    reason?: string,
    options?: { readonly force?: boolean },
  ): Promise<void> {
    await withMemorySpan(
      this.#tracer,
      'memory.write.procedural',
      scope,
      { 'memory.procedural.action': 'validate', 'memory.procedural.rule_id': ruleId },
      async (span) => {
        const store = this.#store.procedural;
        if (typeof store.setStatus !== 'function') {
          throw new TypeError(
            '[graphorin/memory] ProceduralMemory.validate(...) requires a storage adapter that implements `procedural.setStatus(id, status)`. ' +
              'The default `@graphorin/store-sqlite` adapter implements it; custom adapters can opt in via ProceduralMemoryStoreExt.',
          );
        }
        const force = options?.force === true;
        // No store get-by-id for rules — list() already surfaces quarantined.
        const existing = (await store.list(scope)).find((rule) => rule.id === ruleId) ?? null;
        if (existing !== null && !force) {
          const injection = detectMemoryInjection(existing.text);
          if (injection.flagged) {
            span.setAttributes({ 'memory.procedural.validate.refused': true });
            throw new QuarantinePromotionRefusedError(ruleId, injection.markers);
          }
        }
        span.setAttributes({ 'memory.procedural.validate.forced': force });
        await store.setStatus(ruleId, 'active', reason);
      },
    );
  }
}

/** Render an induced procedure into the human-readable `Rule.text`. */
function renderProcedureText(procedure: InducedProcedure): string {
  const lines = [procedure.title, ...procedure.steps.map((step, i) => `${i + 1}. ${step}`)];
  return lines.join('\n');
}

/** Lowercased word tokens for the offline runbook-search fallback (D3). */
function tokenizeForRunbook(text: string): ReadonlyArray<string> {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 1);
}

function predicateMatches(rule: Rule, context: RuleActivationContext): boolean {
  if (rule.condition === undefined || rule.condition === 'always') return true;
  if (rule.condition.startsWith('topic=')) {
    const wanted = rule.condition.slice('topic='.length).trim();
    return context.topic === wanted;
  }
  if (rule.condition.startsWith('tag=')) {
    const wanted = rule.condition.slice('tag='.length).trim();
    return (context.tags ?? []).includes(wanted);
  }
  return true;
}
