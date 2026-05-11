/**
 * Deep phase — minimum-viable drain of `conflict_check_pending`. The
 * MVP scope is exactly the RB-02 cross-cut: read every queued
 * candidate, ask the configured deep-tier provider to choose between
 * `dedup` / `supersede` / `admit`, apply the resolution, and clear
 * the row.
 *
 * Reflection / fact evolution / sleeptime updates are out of scope
 * (deferred per Phase 10c § Out of scope).
 *
 * @packageDocumentation
 */

import type { Provider, ProviderRequest, SessionScope, Tracer } from '@graphorin/core';
import { withMemorySpan } from '../../internal/spans.js';
import type {
  ConsolidatorMemoryStoreExt,
  MemoryStoreAdapter,
} from '../../internal/storage-adapter.js';
import type { BudgetTracker } from '../budget.js';
import type { PhaseOutcome } from '../types.js';

/** Inputs accepted by {@link runDeepPhase}. */
export interface DeepPhaseDeps {
  readonly store: MemoryStoreAdapter;
  readonly consolidatorStore: ConsolidatorMemoryStoreExt | null;
  readonly provider: Provider;
  readonly tracer: Tracer;
  readonly scope: SessionScope;
  readonly deepModel: string | null;
  readonly maxConflictsPerRun: number;
  readonly budget: BudgetTracker;
  readonly priceUsage?: (usage: { promptTokens: number; completionTokens: number }) => number;
  readonly tier: 'standard' | 'full' | 'custom';
  /** Override the wall clock — used by tests + the runtime clock seam. */
  readonly now?: () => number;
}

const JUDGE_PROMPT = [
  'You are a conflict-resolution judge for a long-running personal-assistant memory.',
  'Decide whether a candidate fact contradicts, dedups, or is unrelated to an existing fact.',
  'Return strictly JSON: { "decision": "supersede" | "dedup" | "admit", "reason": string }.',
  'Use "supersede" only when the candidate clearly replaces the older fact.',
  'Use "dedup" when both convey the same information.',
  'Use "admit" when the facts are independent or you are unsure.',
].join(' ');

interface JudgeOutcome {
  readonly decision: 'supersede' | 'dedup' | 'admit';
  readonly reason: string;
}

/** Run the deep phase. */
export async function runDeepPhase(deps: DeepPhaseDeps): Promise<PhaseOutcome> {
  return withMemorySpan(
    deps.tracer,
    'memory.consolidate.deep',
    deps.scope,
    {
      'consolidator.phase': 'deep',
      'consolidator.tier': deps.tier,
      'consolidator.deep_model': deps.deepModel ?? deps.provider.modelId,
    },
    async (span) => {
      const startedAt = (typeof deps.now === 'function' ? deps.now : Date.now)();
      const conflicts = deps.store.conflicts;
      if (conflicts === undefined) {
        span.setAttributes({
          'consolidator.deep.skipped': 'no-conflict-store',
          'consolidator.duration_ms': Math.max(
            0,
            (typeof deps.now === 'function' ? deps.now : Date.now)() - startedAt,
          ),
          'consolidator.facts_extracted': 0,
          'consolidator.budget_used_usd': 0,
        });
        return makeOutcome('completed', { conflictsResolved: 0 });
      }
      const semantic = deps.store.semantic;
      const pending = await conflicts.listPending(deps.scope, deps.maxConflictsPerRun);
      span.setAttributes({ 'consolidator.deep.pending_count': pending.length });
      if (pending.length === 0) {
        span.setAttributes({
          'consolidator.duration_ms': Math.max(
            0,
            (typeof deps.now === 'function' ? deps.now : Date.now)() - startedAt,
          ),
          'consolidator.facts_extracted': 0,
          'consolidator.budget_used_usd': 0,
        });
        return makeOutcome('completed', { conflictsResolved: 0 });
      }

      let resolved = 0;
      let factsUpdated = 0;
      let totalTokens = 0;
      let totalCost = 0;

      for (const row of pending) {
        const candidateText = row.candidateText;
        const conflictingId = row.conflictingIds[0] ?? null;
        let existingText: string | null = null;
        if (conflictingId !== null && typeof semantic.get === 'function') {
          const fact = await semantic.get(conflictingId);
          existingText = fact?.text ?? null;
        }
        const request = buildJudgeRequest(deps, candidateText, existingText);
        let response: Awaited<ReturnType<Provider['generate']>>;
        try {
          response = await deps.provider.generate(request);
        } catch (err) {
          span.recordException(err);
          continue;
        }
        const usage = response.usage;
        const tokens =
          (usage.promptTokens ?? 0) + (usage.completionTokens ?? 0) + (usage.reasoningTokens ?? 0);
        const cost =
          deps.priceUsage?.({
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
          }) ?? 0;
        totalTokens += tokens;
        totalCost += cost;
        deps.budget.record({ phase: 'deep', tokens, costUsd: cost });

        const judge = parseJudge(response.text);
        if (judge === null) continue;

        if (judge.decision === 'supersede' && conflictingId !== null) {
          if (typeof semantic.get === 'function') {
            const candidateFact = await semantic.get(row.factId);
            if (candidateFact !== null) {
              await semantic.supersede(conflictingId, candidateFact, judge.reason);
              factsUpdated += 1;
            }
          }
          await conflicts.markResolved(row.id, 'supersede');
        } else if (judge.decision === 'dedup' && conflictingId !== null) {
          if (typeof semantic.purge === 'function') {
            await semantic.purge(row.factId, judge.reason);
          } else if (typeof semantic.forget === 'function') {
            await semantic.forget(row.factId, judge.reason);
          }
          factsUpdated += 1;
          await conflicts.markResolved(row.id, 'dedup');
        } else {
          await conflicts.markResolved(row.id, 'admit');
        }
        resolved += 1;
      }

      const snapshot = deps.budget.snapshot();
      span.setAttributes({
        'consolidator.duration_ms': Math.max(
          0,
          (typeof deps.now === 'function' ? deps.now : Date.now)() - startedAt,
        ),
        'consolidator.facts_extracted': factsUpdated,
        'consolidator.budget_used_usd': totalCost,
        'consolidator.deep.resolved': resolved,
        'consolidator.deep.facts_updated': factsUpdated,
        'consolidator.deep.tokens.total': totalTokens,
        'consolidator.deep.cost.estimate.usd': totalCost,
        'consolidator.budget.remaining.tokens': snapshot.tokensRemaining,
        'consolidator.budget.remaining.usd': snapshot.costRemaining,
      });

      return {
        phase: 'deep',
        status: 'completed',
        factsCreated: 0,
        factsUpdated,
        conflictsResolved: resolved,
        noiseFilteredCount: 0,
        emptyExtractions: 0,
        llmTokensUsed: totalTokens,
        llmCostUsd: totalCost,
        errorMessage: null,
      };
    },
  );
}

function buildJudgeRequest(
  deps: DeepPhaseDeps,
  candidateText: string,
  existingText: string | null,
): ProviderRequest {
  const userBlock = [
    `Candidate fact: ${candidateText}`,
    existingText !== null ? `Existing fact: ${existingText}` : 'Existing fact: (unknown)',
  ].join('\n');
  return {
    messages: [{ role: 'user', content: userBlock }],
    systemMessage: JUDGE_PROMPT,
    temperature: 0,
    metadata: {
      userId: deps.scope.userId,
      ...(deps.scope.sessionId !== undefined ? { sessionId: deps.scope.sessionId } : {}),
      ...(deps.scope.agentId !== undefined ? { agentId: deps.scope.agentId } : {}),
    },
    outputType: { kind: 'structured' },
  };
}

function parseJudge(text: string | undefined): JudgeOutcome | null {
  if (text === undefined || text.length === 0) return null;
  const candidate = stripFence(text).trim();
  if (candidate.length === 0) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    const slice = sliceJsonObject(candidate);
    if (slice === null) return null;
    try {
      parsed = JSON.parse(slice);
    } catch {
      return null;
    }
  }
  if (parsed === null || typeof parsed !== 'object') return null;
  const obj = parsed as { decision?: unknown; reason?: unknown };
  const decision = obj.decision;
  if (decision !== 'supersede' && decision !== 'dedup' && decision !== 'admit') return null;
  const reason = typeof obj.reason === 'string' ? obj.reason : 'unspecified';
  return { decision, reason };
}

function stripFence(text: string): string {
  const match = /^```(?:json)?\s*\n([\s\S]*?)\n```/u.exec(text.trim());
  return match?.[1] ?? text;
}

function sliceJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) return null;
  return text.slice(start, end + 1);
}

function makeOutcome(
  status: PhaseOutcome['status'],
  overrides: Partial<PhaseOutcome>,
): PhaseOutcome {
  return {
    phase: 'deep',
    status,
    factsCreated: 0,
    factsUpdated: 0,
    conflictsResolved: 0,
    noiseFilteredCount: 0,
    emptyExtractions: 0,
    llmTokensUsed: 0,
    llmCostUsd: null,
    errorMessage: null,
    ...overrides,
  };
}
