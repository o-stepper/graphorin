/**
 * Reflection pass (P1-1) — the deep phase's higher-order synthesis
 * step, following the Generative-Agents recipe. When the accumulated
 * importance of recent episodes crosses a threshold, ask the model for
 * the few most salient questions, retrieve evidence for each, and
 * synthesize an **insight** the evidence supports — recorded
 * quarantined, `provenance: 'reflection'`, and **citing the retrieved
 * memory ids** (citations are set by the framework from the actual
 * evidence, never chosen by the model, so they can never be
 * hallucinated). Insights start at ExpeL salience `2`; the pass prunes
 * any that have decayed to `0`.
 *
 * Runs after the deep-phase conflict drain (wired in the runtime
 * dispatch), reusing the same budget / lock / run-audit envelope. The
 * conflict-resolution logic in `deep.ts` is untouched.
 *
 * @packageDocumentation
 */

import type { Provider, ProviderRequest, SessionScope, Tracer } from '@graphorin/core';
import { newMemoryId } from '../../internal/id.js';
import { withMemorySpan } from '../../internal/spans.js';
import type { InsightMemoryStoreExt } from '../../internal/storage-adapter.js';
import type { EpisodicMemory } from '../../tiers/episodic-memory.js';
import type { SemanticMemory } from '../../tiers/semantic-memory.js';
import type { BudgetTracker } from '../budget.js';

/** ExpeL starting salience for a freshly-synthesized insight. */
const STARTING_SALIENCE = 2;

/** How many recent episode summaries to show the salient-questions prompt. */
const RECENT_CONTEXT_LIMIT = 20;

/** Inputs accepted by {@link runReflectionPass}. */
export interface ReflectionDeps {
  readonly provider: Provider;
  readonly tracer: Tracer;
  readonly scope: SessionScope;
  /** Tier used to retrieve fact evidence for each salient question. */
  readonly semantic: SemanticMemory;
  /** Importance source + episode-evidence retrieval. `null` ⇒ pass is a no-op. */
  readonly episodic: EpisodicMemory | null;
  /** Insight write + salience surface. */
  readonly insights: InsightMemoryStoreExt;
  readonly budget: BudgetTracker;
  /** Reflection fires only when accumulated episode importance ≥ this. */
  readonly importanceThreshold: number;
  /** Upper bound on salient questions asked per pass. */
  readonly maxQuestions: number;
  readonly priceUsage?: (usage: { promptTokens: number; completionTokens: number }) => number;
  /** Override the wall clock — used by tests. */
  readonly now?: () => number;
}

/** Summary returned by {@link runReflectionPass}. */
export interface ReflectionOutcome {
  /** True when accumulated importance crossed the threshold and the pass ran. */
  readonly triggered: boolean;
  readonly accumulatedImportance: number;
  readonly questionsAsked: number;
  readonly insightsCreated: number;
  readonly tokens: number;
  readonly costUsd: number;
}

const QUESTIONS_SYSTEM_PROMPT = [
  'You are the reflection step (salient-questions) of a long-running personal-assistant memory.',
  'Given a list of recent memories, name the few most salient, high-level questions whose',
  'answers would most improve understanding of the user. Do NOT answer them; ask only what the',
  'memories collectively raise. Return strictly JSON: { "questions": string[] }.',
].join(' ');

const INSIGHT_SYSTEM_PROMPT = [
  'You are the reflection step (insight-synthesis) of a long-running personal-assistant memory.',
  'Given a salient question and the supporting evidence, synthesize ONE concise, higher-order',
  'insight that the evidence collectively supports. Ground it ONLY in the supplied evidence; if',
  'the evidence is insufficient, return an empty string. Do NOT invent facts. Return strictly',
  'JSON: { "insight": string }.',
].join(' ');

interface Evidence {
  readonly id: string;
  readonly text: string;
}

/**
 * Run the reflection pass. Idempotent w.r.t. failures — a parse miss or
 * empty synthesis simply yields no insight. Never throws on model
 * output; only storage errors propagate.
 */
export async function runReflectionPass(deps: ReflectionDeps): Promise<ReflectionOutcome> {
  return withMemorySpan(
    deps.tracer,
    'memory.consolidate.reflect',
    deps.scope,
    { 'consolidator.phase': 'reflect' },
    async (span) => {
      const empty = (over: Partial<ReflectionOutcome> = {}): ReflectionOutcome => ({
        triggered: false,
        accumulatedImportance: 0,
        questionsAsked: 0,
        insightsCreated: 0,
        tokens: 0,
        costUsd: 0,
        ...over,
      });

      if (deps.episodic === null) {
        span.setAttributes({ 'consolidator.reflect.skipped': 'no-episodic' });
        return empty();
      }
      if (deps.budget.snapshot().paused) {
        span.setAttributes({ 'consolidator.reflect.skipped': 'budget' });
        return empty();
      }

      // 1. Accumulated-importance gate. Auto-formed episodes (P1-2) land
      //    quarantined, so importance accrues there — include them.
      const recent = await deps.episodic.search(deps.scope, '*', {
        topK: 50,
        includeQuarantined: true,
      });
      const accumulated = recent.reduce((sum, hit) => sum + (hit.record.importance ?? 0), 0);
      span.setAttributes({
        'consolidator.reflect.accumulated_importance': accumulated,
        'consolidator.reflect.threshold': deps.importanceThreshold,
      });
      if (accumulated < deps.importanceThreshold) {
        span.setAttributes({ 'consolidator.reflect.triggered': 0 });
        return empty({ accumulatedImportance: accumulated });
      }

      let tokens = 0;
      let costUsd = 0;
      const record = (usage: {
        promptTokens?: number;
        completionTokens?: number;
        reasoningTokens?: number;
      }): void => {
        const t =
          (usage.promptTokens ?? 0) + (usage.completionTokens ?? 0) + (usage.reasoningTokens ?? 0);
        const c =
          deps.priceUsage?.({
            promptTokens: usage.promptTokens ?? 0,
            completionTokens: usage.completionTokens ?? 0,
          }) ?? 0;
        tokens += t;
        costUsd += c;
        deps.budget.record({ phase: 'deep', tokens: t, costUsd: c });
      };

      // 2. Salient questions over recent memories.
      const recentSummaries = recent
        .slice(0, RECENT_CONTEXT_LIMIT)
        .map((hit) => `- ${hit.record.summary}`)
        .join('\n');
      const questionsRes = await deps.provider.generate(
        buildQuestionsRequest(deps, recentSummaries),
      );
      record(questionsRes.usage);
      const questions = parseQuestions(questionsRes.text).slice(0, Math.max(0, deps.maxQuestions));
      span.setAttributes({ 'consolidator.reflect.questions': questions.length });

      const nowFn = typeof deps.now === 'function' ? deps.now : Date.now;
      let insightsCreated = 0;
      for (const question of questions) {
        if (deps.budget.snapshot().paused) break;

        // 3. Retrieve evidence. Facts are trustworthy (active only);
        //    episodes include the quarantined auto-formed ones.
        const factHits = await deps.semantic.search(deps.scope, question, { topK: 5 });
        const epHits = await deps.episodic.search(deps.scope, question, {
          topK: 5,
          includeQuarantined: true,
        });
        const evidence = dedupeEvidence([
          ...factHits.map((h) => ({ id: h.record.id, text: h.record.text })),
          ...epHits.map((h) => ({ id: h.record.id, text: h.record.summary })),
        ]);
        // Citations are mandatory — no evidence ⇒ no insight.
        if (evidence.length === 0) continue;

        // 4. Synthesize an insight grounded in that evidence.
        if (deps.budget.snapshot().paused) break;
        const insightRes = await deps.provider.generate(
          buildInsightRequest(deps, question, evidence),
        );
        record(insightRes.usage);
        const text = parseInsight(insightRes.text);
        if (text === null) continue;

        const iso = new Date(nowFn()).toISOString();
        await deps.insights.insert({
          id: newMemoryId('ins'),
          kind: 'insight',
          userId: deps.scope.userId,
          ...(deps.scope.sessionId !== undefined ? { sessionId: deps.scope.sessionId } : {}),
          ...(deps.scope.agentId !== undefined ? { agentId: deps.scope.agentId } : {}),
          text,
          // cites = the actual retrieved evidence ids (framework-set).
          cites: evidence.map((e) => e.id),
          salience: STARTING_SALIENCE,
          provenance: 'reflection',
          status: 'quarantined',
          sensitivity: 'internal',
          createdAt: iso,
          updatedAt: iso,
        });
        insightsCreated += 1;
      }

      // 5. ExpeL forgetting — prune any salience-0 insights.
      await deps.insights.prune(deps.scope);

      span.setAttributes({
        'consolidator.reflect.triggered': 1,
        'consolidator.reflect.insights_created': insightsCreated,
        'consolidator.reflect.tokens': tokens,
        'consolidator.reflect.cost.usd': costUsd,
      });
      return {
        triggered: true,
        accumulatedImportance: accumulated,
        questionsAsked: questions.length,
        insightsCreated,
        tokens,
        costUsd,
      };
    },
  );
}

function buildQuestionsRequest(deps: ReflectionDeps, recentSummaries: string): ProviderRequest {
  const userBlock = [
    'Recent memories:',
    recentSummaries.length > 0 ? recentSummaries : '(none)',
    '',
    `Name up to ${deps.maxQuestions} salient questions.`,
  ].join('\n');
  return {
    messages: [{ role: 'user', content: userBlock }],
    systemMessage: QUESTIONS_SYSTEM_PROMPT,
    temperature: 0,
    metadata: scopeMetadata(deps.scope),
    outputType: { kind: 'structured' },
  };
}

function buildInsightRequest(
  deps: ReflectionDeps,
  question: string,
  evidence: ReadonlyArray<Evidence>,
): ProviderRequest {
  const evidenceBlock = evidence.map((e, i) => `[${i + 1}] (id=${e.id}) ${e.text}`).join('\n');
  const userBlock = [`Question: ${question}`, '', 'Evidence:', evidenceBlock].join('\n');
  return {
    messages: [{ role: 'user', content: userBlock }],
    systemMessage: INSIGHT_SYSTEM_PROMPT,
    temperature: 0,
    metadata: scopeMetadata(deps.scope),
    outputType: { kind: 'structured' },
  };
}

function scopeMetadata(scope: SessionScope): Record<string, string> {
  return {
    userId: scope.userId,
    ...(scope.sessionId !== undefined ? { sessionId: scope.sessionId } : {}),
    ...(scope.agentId !== undefined ? { agentId: scope.agentId } : {}),
  };
}

function dedupeEvidence(items: ReadonlyArray<Evidence>): Evidence[] {
  const seen = new Set<string>();
  const out: Evidence[] = [];
  for (const e of items) {
    if (e.id.length === 0 || seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}

/**
 * Parse the salient-questions response — accepts `{ questions: [...] }`
 * or a bare `[...]`, tolerating chatty / fenced output. Returns the
 * trimmed, non-empty string questions (possibly `[]`).
 *
 * @internal
 */
export function parseQuestions(text: string | undefined): string[] {
  if (text === undefined || text.length === 0) return [];
  const candidate = stripFence(text).trim();
  const parsed = tryParse(candidate);
  if (parsed === undefined) return [];
  const arr = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.questions)
      ? parsed.questions
      : null;
  if (arr === null) return [];
  return arr
    .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
    .map((q) => q.trim());
}

/**
 * Parse the insight-synthesis response — accepts `{ insight: string }`
 * (or `{ text: string }`), tolerating chatty / fenced output. Returns
 * the trimmed insight text, or `null` when absent / empty (insufficient
 * evidence ⇒ no insight).
 *
 * @internal
 */
export function parseInsight(text: string | undefined): string | null {
  if (text === undefined || text.length === 0) return null;
  const candidate = stripFence(text).trim();
  const parsed = tryParse(candidate);
  if (!isRecord(parsed)) return null;
  const raw = typeof parsed.insight === 'string' ? parsed.insight : null;
  const fallback = typeof parsed.text === 'string' ? parsed.text : null;
  const value = raw ?? fallback;
  if (value === null || value.trim().length === 0) return null;
  return value.trim();
}

function tryParse(candidate: string): unknown {
  if (candidate.length === 0) return undefined;
  try {
    return JSON.parse(candidate);
  } catch {
    const obj = sliceBetween(candidate, '{', '}');
    if (obj !== null) {
      try {
        return JSON.parse(obj);
      } catch {
        // fall through to array attempt
      }
    }
    const arr = sliceBetween(candidate, '[', ']');
    if (arr !== null) {
      try {
        return JSON.parse(arr);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stripFence(text: string): string {
  const match = /^```(?:json)?\s*\n([\s\S]*?)\n```/u.exec(text.trim());
  return match?.[1] ?? text;
}

function sliceBetween(text: string, open: string, close: string): string | null {
  const start = text.indexOf(open);
  const end = text.lastIndexOf(close);
  if (start < 0 || end < start) return null;
  return text.slice(start, end + 1);
}
