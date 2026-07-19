/**
 * Learned-context pass - Letta-style sleep-time maintenance of a
 * persistent, size-bounded, agent-editable digest block. The deep phase
 * rewrites one reserved working-memory block (`learned_context`) from
 * the previous digest + fresh evidence (recent episodes, active
 * insights, active procedures), so every subsequent step's system
 * prompt carries a compact "what I have learned about this user /
 * project" summary inside the stable KV-cache prefix - without
 * retrieval latency and without unbounded growth.
 *
 * The block itself is an ordinary working block: it is spliced into
 * layer 3 of the assembled context automatically, re-anchored after
 * compaction by the persona-block hook pattern, and remains editable by
 * the agent through the existing `block_*` tools (the pass rewrites it
 * on its own cadence, folding any agent edits into the next rewrite).
 *
 * Runs after the deep-phase reflection pass, reusing the same budget /
 * lock / run-audit envelope. Gated off by default at every tier
 * (`learnedContext: false`).
 *
 * @packageDocumentation
 */

import type { Provider, ProviderRequest, SessionScope, Tracer } from '@graphorin/core';
import { withMemorySpan } from '../../internal/spans.js';
import type { MemoryStoreAdapter } from '../../internal/storage-adapter.js';
import type { EpisodicMemory } from '../../tiers/episodic-memory.js';
import { defineBlock, type WorkingMemory } from '../../tiers/working-memory.js';
import type { BudgetTracker } from '../budget.js';

/** Reserved working-block label maintained by the pass. */
export const LEARNED_CONTEXT_BLOCK_LABEL = 'learned_context';

/** Default character bound for the digest block. */
export const DEFAULT_LEARNED_CONTEXT_MAX_CHARS = 1200;

/**
 * One curated-block declaration: the deep phase maintains
 * a rewrite pass per entry - `learnedContext: true` is sugar for
 * `[{ label: 'learned_context' }]`. `prompt` overrides the maintenance
 * system prompt (the default is a generic fold-the-evidence rewrite,
 * parameterised by the label); `maxChars` bounds the stored value.
 *
 * @stable
 */
export interface CuratedBlockSpec {
  readonly label: string;
  readonly prompt?: string;
  readonly maxChars?: number;
}

/** Resolved (defaulted) curated-block entry on the consolidator config. */
export interface ResolvedCuratedBlock {
  readonly label: string;
  readonly prompt: string | null;
  readonly maxChars: number;
}

/** How many recent episode summaries feed one rewrite. */
const EPISODE_CONTEXT_LIMIT = 15;

/** How many active insights / procedures feed one rewrite. */
const INSIGHT_CONTEXT_LIMIT = 10;
const PROCEDURE_CONTEXT_LIMIT = 8;

const LEARNED_CONTEXT_SYSTEM_PROMPT = [
  'You maintain the learned-context block of a long-running personal-assistant memory:',
  'a compact standing digest of what is durably known about the user and their active',
  'work (profile, preferences, ongoing projects, validated insights, working procedures).',
  'Rewrite the digest by folding the new evidence into the previous digest: keep what is',
  'still true, drop what is stale or superseded, and never invent anything the evidence',
  'does not support. Write plain prose or short dashed lines - no markdown headings, no',
  'code fences, no preamble. Stay strictly under the character budget.',
].join(' ');

/** Inputs accepted by {@link runLearnedContextPass}. */
export interface LearnedContextDeps {
  readonly provider: Provider;
  readonly tracer: Tracer;
  readonly scope: SessionScope;
  /** Working tier that owns the digest block. */
  readonly working: WorkingMemory;
  /** Recent-episode evidence source. `null` ⇒ episodes are skipped. */
  readonly episodic: EpisodicMemory | null;
  /** Storage adapter - supplies active insights + procedures as evidence. */
  readonly store: MemoryStoreAdapter;
  readonly budget: BudgetTracker;
  /** Character bound enforced on the stored digest. */
  readonly maxChars: number;
  readonly priceUsage?: (usage: { promptTokens: number; completionTokens: number }) => number;
  /** Override the wall clock - used by tests. */
  readonly now?: () => number;
}

/** Inputs accepted by {@link runCuratedBlockPass}. */
export interface CuratedBlockDeps extends LearnedContextDeps {
  /** Which working block this pass maintains. */
  readonly label: string;
  /** Maintenance system prompt override (default: generic rewrite). */
  readonly systemPrompt?: string;
}

/** Summary returned by {@link runLearnedContextPass}. */
export interface LearnedContextOutcome {
  /** True when the block was rewritten this pass. */
  readonly updated: boolean;
  /** Stored digest length after the pass (0 when skipped and absent). */
  readonly chars: number;
  readonly tokens: number;
  readonly costUsd: number;
  /** Why the pass made no LLM call, when it did not. */
  readonly skippedReason?: 'budget' | 'no-evidence' | 'empty-rewrite' | 'provider-error';
}

/**
 * Strip an accidental leading code fence from the model's digest and
 * clamp it to the character budget. Returns `null` for an effectively
 * empty rewrite (the previous digest is then left untouched).
 */
export function normalizeLearnedContext(raw: string, maxChars: number): string | null {
  let text = raw.trim();
  const fence = /^```[^\n]*\n([\s\S]*?)\n?```\s*$/.exec(text);
  if (fence?.[1] !== undefined) text = fence[1].trim();
  if (text.length === 0) return null;
  return text.length > maxChars ? text.slice(0, maxChars).trimEnd() : text;
}

/**
 * Generic maintenance prompt for a curated block that is not the
 * learned-context digest.
 */
export function curatedBlockSystemPrompt(label: string): string {
  return [
    `You maintain the '${label}' working block of a long-running personal-assistant memory:`,
    'a compact standing text the operator curates for this agent. Rewrite it by folding the',
    'new evidence into the previous content: keep what is still true, drop what is stale or',
    'superseded, and never invent anything the evidence does not support. Write plain prose',
    'or short dashed lines - no markdown headings, no code fences, no preamble. Stay',
    'strictly under the character budget.',
  ].join(' ');
}

/** Build the single rewrite request (pure - testable offline). */
export function buildLearnedContextRequest(args: {
  readonly previous: string;
  readonly episodes: ReadonlyArray<string>;
  readonly insights: ReadonlyArray<string>;
  readonly procedures: ReadonlyArray<string>;
  readonly maxChars: number;
  /** Maintenance system prompt override (curated blocks). */
  readonly systemPrompt?: string;
}): ProviderRequest {
  const sections: string[] = [
    `Character budget: ${args.maxChars}.`,
    args.previous.length > 0
      ? `Previous digest:\n${args.previous}`
      : 'Previous digest: (none yet - write the first one)',
  ];
  if (args.episodes.length > 0) {
    sections.push(`Recent episodes:\n${args.episodes.map((s) => `- ${s}`).join('\n')}`);
  }
  if (args.insights.length > 0) {
    sections.push(`Validated insights:\n${args.insights.map((s) => `- ${s}`).join('\n')}`);
  }
  if (args.procedures.length > 0) {
    sections.push(`Active procedures:\n${args.procedures.map((s) => `- ${s}`).join('\n')}`);
  }
  sections.push('Return ONLY the rewritten digest text.');
  return {
    messages: [{ role: 'user', content: sections.join('\n\n') }],
    systemMessage: args.systemPrompt ?? LEARNED_CONTEXT_SYSTEM_PROMPT,
    temperature: 0,
    maxTokens: Math.max(256, Math.ceil(args.maxChars / 2)),
  };
}

/**
 * Run the learned-context rewrite. Resilient by construction: a
 * provider failure or empty rewrite leaves the existing block untouched
 * and never throws; only storage errors propagate. This pass
 * is sugar over {@link runCuratedBlockPass} with the reserved
 * `learned_context` label + its canonical prompt.
 */
export async function runLearnedContextPass(
  deps: LearnedContextDeps,
): Promise<LearnedContextOutcome> {
  return runCuratedBlockPass({ ...deps, label: LEARNED_CONTEXT_BLOCK_LABEL });
}

/**
 * Run one curated-block rewrite - the generalised
 * learned-context pass: previous block value + recent episodes +
 * active insights + active procedures fold into a size-bounded
 * rewrite of the block named by `deps.label`. Same resilience
 * contract as the learned-context pass.
 */
export async function runCuratedBlockPass(deps: CuratedBlockDeps): Promise<LearnedContextOutcome> {
  const isLearnedContext = deps.label === LEARNED_CONTEXT_BLOCK_LABEL;
  return withMemorySpan(
    deps.tracer,
    isLearnedContext ? 'memory.consolidate.learned-context' : 'memory.consolidate.curated-block',
    deps.scope,
    {
      'consolidator.phase': isLearnedContext ? 'learned-context' : 'curated-block',
      'consolidator.block.label': deps.label,
    },
    async (span) => {
      const skip = (
        reason: NonNullable<LearnedContextOutcome['skippedReason']>,
        chars = 0,
      ): LearnedContextOutcome => {
        span.setAttributes({ 'consolidator.learned_context.skipped': reason });
        return { updated: false, chars, tokens: 0, costUsd: 0, skippedReason: reason };
      };
      if (deps.budget.snapshot().paused) return skip('budget');

      // Ensure the block is registered so write() can create it.
      if (deps.working.definitionFor(deps.label) === undefined) {
        deps.working.define(
          defineBlock({
            label: deps.label,
            description: isLearnedContext
              ? 'Standing digest of durable knowledge about the user and active work, ' +
                'maintained by the deep-phase learned-context pass.'
              : `Curated working block maintained by the deep-phase curated-block pass ('${deps.label}').`,
            charLimit: deps.maxChars,
          }),
        );
      }
      const previous = (await deps.working.read(deps.scope, deps.label)) ?? '';

      // Evidence: recent episodes (incl. quarantined auto-formed ones -
      // they carry the importance signal), ACTIVE insights only (the
      // digest drives behaviour, so quarantined synthesis stays out),
      // and active procedures.
      const episodes =
        deps.episodic === null
          ? []
          : (
              await deps.episodic.listRecent(deps.scope, EPISODE_CONTEXT_LIMIT, {
                includeQuarantined: true,
              })
            ).map((episode) => episode.summary);
      const insights =
        deps.store.insights === undefined
          ? []
          : (await deps.store.insights.list(deps.scope, { limit: INSIGHT_CONTEXT_LIMIT })).map(
              (insight) => insight.text,
            );
      const procedures = (await deps.store.procedural.list(deps.scope))
        .filter((rule) => rule.status !== 'quarantined')
        .slice(0, PROCEDURE_CONTEXT_LIMIT)
        .map((rule) => rule.text.split('\n')[0] ?? rule.text);

      const evidenceCount = episodes.length + insights.length + procedures.length;
      span.setAttributes({ 'consolidator.learned_context.evidence': evidenceCount });
      // Nothing new to fold and nothing written yet ⇒ no paid call.
      if (evidenceCount === 0) return skip('no-evidence', previous.length);

      let tokens = 0;
      let costUsd = 0;
      try {
        const res = await deps.provider.generate(
          buildLearnedContextRequest({
            previous,
            episodes,
            insights,
            procedures,
            maxChars: deps.maxChars,
            ...(deps.systemPrompt !== undefined
              ? { systemPrompt: deps.systemPrompt }
              : isLearnedContext
                ? {}
                : { systemPrompt: curatedBlockSystemPrompt(deps.label) }),
          }),
        );
        tokens =
          (res.usage.promptTokens ?? 0) +
          (res.usage.completionTokens ?? 0) +
          (res.usage.reasoningTokens ?? 0);
        costUsd =
          deps.priceUsage?.({
            promptTokens: res.usage.promptTokens ?? 0,
            completionTokens: res.usage.completionTokens ?? 0,
          }) ?? 0;
        deps.budget.record({ phase: 'deep', tokens, costUsd });
        const next = normalizeLearnedContext(res.text ?? '', deps.maxChars);
        if (next === null) {
          return { ...skip('empty-rewrite', previous.length), tokens, costUsd };
        }
        await deps.working.write(deps.scope, deps.label, next);
        span.setAttributes({
          'consolidator.learned_context.updated': true,
          'consolidator.learned_context.chars': next.length,
        });
        return { updated: true, chars: next.length, tokens, costUsd };
      } catch {
        // Resilient: a provider failure must never fail the deep phase.
        return { ...skip('provider-error', previous.length), tokens, costUsd };
      }
    },
  );
}
