import type { Rule, Sensitivity, SessionScope, Tracer } from '@graphorin/core';
import { newMemoryId } from '../internal/id.js';
import { withMemorySpan } from '../internal/spans.js';
import type { MemoryStoreAdapter } from '../internal/storage-adapter.js';

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
 * @stable
 */
export class ProceduralMemory {
  readonly #store: MemoryStoreAdapter;
  readonly #tracer: Tracer;

  constructor(args: { store: MemoryStoreAdapter; tracer: Tracer }) {
    this.#store = args.store;
    this.#tracer = args.tracer;
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
   */
  async activate(
    scope: SessionScope,
    context: RuleActivationContext = {},
  ): Promise<ReadonlyArray<Rule>> {
    const rules = await this.list(scope);
    return rules
      .filter((rule) => predicateMatches(rule, context))
      .sort((a, b) => b.priority - a.priority);
  }
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
