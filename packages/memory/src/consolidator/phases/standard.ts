/**
 * Standard phase — extracts new facts from session messages via the
 * configured cheap-tier provider. The phase is gated by the active
 * tier (DEC-144 / ADR-038) and the budget tracker; it never runs
 * under `tier: 'free'`.
 *
 * The extraction prompt asks the model to return a JSON array of
 * `{ text, subject?, predicate?, object?, confidence? }` objects;
 * malformed responses are tolerated (counted as `emptyExtractions`)
 * so a flaky cheap model never wedges the pipeline.
 *
 * @packageDocumentation
 */

import type { Provider, ProviderRequest, SessionScope, Tracer } from '@graphorin/core';
import { withMemorySpan } from '../../internal/spans.js';
import type {
  ConsolidatorMemoryStoreExt,
  MemoryStoreAdapter,
  SessionMessageRecord,
} from '../../internal/storage-adapter.js';
import type { SemanticMemory } from '../../tiers/semantic-memory.js';
import type { BudgetTracker } from '../budget.js';
import { tipMessageId } from '../idempotency.js';
import { applyNoiseFilters, type NoiseFilterPreset, renderText } from '../noise-filter.js';
import type { PhaseOutcome } from '../types.js';

/** Inputs accepted by {@link runStandardPhase}. */
export interface StandardPhaseDeps {
  readonly semantic: SemanticMemory;
  readonly store: MemoryStoreAdapter;
  readonly consolidatorStore: ConsolidatorMemoryStoreExt | null;
  readonly provider: Provider;
  readonly tracer: Tracer;
  readonly scope: SessionScope;
  readonly cheapModel: string | null;
  readonly noiseFilters: ReadonlyArray<NoiseFilterPreset>;
  readonly maxBatchSize: number;
  readonly lastProcessedMessageId: string | null;
  readonly budget: BudgetTracker;
  /** Computes USD cost for the recorded usage. Defaults to 0 when omitted. */
  readonly priceUsage?: (usage: { promptTokens: number; completionTokens: number }) => number;
  readonly tier: 'cheap' | 'standard' | 'full' | 'custom';
  /** Override the wall clock — used by tests + the runtime clock seam. */
  readonly now?: () => number;
  /**
   * Pre-fetched message batch — when supplied, the phase skips its
   * own `listMessagesSince(...)` call and operates on the supplied
   * rows. The runtime always pre-fetches the batch so the cursor
   * advance can use the same data the phase processed.
   */
  readonly batch?: ReadonlyArray<SessionMessageRecord>;
}

interface ExtractedFact {
  readonly text: string;
  readonly subject?: string;
  readonly predicate?: string;
  readonly object?: string;
  readonly confidence?: number;
}

const EXTRACTION_SYSTEM_PROMPT = [
  'You are a memory-extraction assistant for a long-running personal-assistant runtime.',
  'Read the supplied conversation slice and return the durable facts it asserts about the user, the world, or stable preferences.',
  'Skip greetings, banter, transient state, and anything the assistant produced as boilerplate.',
  'Return a single JSON object: { "facts": [{ "text": string, "subject"?: string, "predicate"?: string, "object"?: string, "confidence"?: number }] }.',
  'If the slice contains no durable facts, return { "facts": [] }.',
].join(' ');

/**
 * Run the standard phase. Returns a {@link PhaseOutcome}; errors are
 * surfaced via `status: 'failed'` + `errorMessage` so the caller can
 * land the batch in the DLQ.
 *
 * @stable
 */
export async function runStandardPhase(deps: StandardPhaseDeps): Promise<PhaseOutcome> {
  return withMemorySpan(
    deps.tracer,
    'memory.consolidate.standard',
    deps.scope,
    {
      'consolidator.phase': 'standard',
      'consolidator.tier': deps.tier,
      'consolidator.cheap_model': deps.cheapModel ?? deps.provider.modelId,
    },
    async (span) => {
      const startedAt = (typeof deps.now === 'function' ? deps.now : Date.now)();
      const session = deps.store.session;
      let rawBatch: ReadonlyArray<SessionMessageRecord>;
      if (deps.batch !== undefined) {
        rawBatch = deps.batch;
      } else {
        if (typeof session.listMessagesSince !== 'function') {
          span.setAttributes({
            'consolidator.standard.skipped': 'no-cursor-support',
            'consolidator.duration_ms': 0,
            'consolidator.facts_extracted': 0,
            'consolidator.budget_used_usd': 0,
          });
          return emptyOutcome('completed');
        }
        rawBatch = await session.listMessagesSince(
          deps.scope,
          deps.lastProcessedMessageId,
          deps.maxBatchSize,
        );
      }
      const filtered = applyNoiseFilters(
        rawBatch as ReadonlyArray<SessionMessageRecord>,
        deps.noiseFilters,
      );
      span.setAttributes({
        'consolidator.standard.batch_size': rawBatch.length,
        'consolidator.standard.kept_count': filtered.kept.length,
        'consolidator.standard.noise_filtered': filtered.droppedCount,
      });
      if (filtered.kept.length === 0) {
        span.setAttributes({
          'consolidator.duration_ms': Math.max(
            0,
            (typeof deps.now === 'function' ? deps.now : Date.now)() - startedAt,
          ),
          'consolidator.facts_extracted': 0,
          'consolidator.budget_used_usd': 0,
        });
        return {
          ...emptyOutcome('completed'),
          noiseFilteredCount: filtered.droppedCount,
        };
      }

      const transcript = renderTranscript(filtered.kept);
      const request = buildRequest(deps, transcript);
      const response = await deps.provider.generate(request);
      const usage = response.usage;
      const cost =
        deps.priceUsage?.({
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
        }) ?? 0;

      const facts = parseExtraction(response.text);
      let factsCreated = 0;
      const totalTokens =
        (usage.promptTokens ?? 0) + (usage.completionTokens ?? 0) + (usage.reasoningTokens ?? 0);
      const snapshot = deps.budget.record({
        phase: 'standard',
        tokens: totalTokens,
        costUsd: cost,
      });

      for (const fact of facts) {
        if (fact.text.trim().length === 0) continue;
        // P1-4: distilled-from-transcript facts are synthesized memory —
        // tag them `extraction` so they land quarantined (excluded from
        // action-driving recall until validated).
        const input: Parameters<SemanticMemory['remember']>[1] = {
          text: fact.text,
          provenance: 'extraction',
        };
        if (fact.subject !== undefined) Object.assign(input, { subject: fact.subject });
        if (fact.predicate !== undefined) Object.assign(input, { predicate: fact.predicate });
        if (fact.object !== undefined) Object.assign(input, { object: fact.object });
        if (fact.confidence !== undefined) Object.assign(input, { confidence: fact.confidence });
        await deps.semantic.remember(deps.scope, input);
        factsCreated += 1;
      }

      span.setAttributes({
        'consolidator.duration_ms': Math.max(
          0,
          (typeof deps.now === 'function' ? deps.now : Date.now)() - startedAt,
        ),
        'consolidator.facts_extracted': factsCreated,
        'consolidator.budget_used_usd': cost,
        'consolidator.standard.facts_extracted': factsCreated,
        'consolidator.standard.tokens.input': usage.promptTokens,
        'consolidator.standard.tokens.output': usage.completionTokens,
        'consolidator.standard.cost.estimate.usd': cost,
        'consolidator.budget.remaining.tokens': snapshot.tokensRemaining,
        'consolidator.budget.remaining.usd': snapshot.costRemaining,
        'consolidator.exceeded': snapshot.paused,
      });

      const cursorTip = tipMessageId(rawBatch);
      void cursorTip;

      return {
        phase: 'standard',
        status: 'completed',
        factsCreated,
        factsUpdated: 0,
        conflictsResolved: 0,
        noiseFilteredCount: filtered.droppedCount,
        emptyExtractions: facts.length === 0 ? 1 : 0,
        llmTokensUsed: totalTokens,
        llmCostUsd: cost,
        errorMessage: null,
      };
    },
  );
}

function buildRequest(deps: StandardPhaseDeps, transcript: string): ProviderRequest {
  return {
    messages: [
      {
        role: 'user',
        content: `Conversation slice:\n${transcript}`,
      },
    ],
    systemMessage: EXTRACTION_SYSTEM_PROMPT,
    temperature: 0,
    metadata: {
      userId: deps.scope.userId,
      ...(deps.scope.sessionId !== undefined ? { sessionId: deps.scope.sessionId } : {}),
      ...(deps.scope.agentId !== undefined ? { agentId: deps.scope.agentId } : {}),
    },
    outputType: { kind: 'structured' },
  };
}

function renderTranscript(messages: ReadonlyArray<SessionMessageRecord>): string {
  return messages
    .map((m) => {
      const role = m.message.role;
      const text = renderText(m.message);
      return `[${m.sequence}] ${role}: ${text}`;
    })
    .join('\n');
}

/**
 * Parse the model output into the structured fact list. Tolerates
 * fenced blocks + trailing commentary so a chatty model does not
 * wedge the cursor.
 *
 * @internal
 */
export function parseExtraction(text: string | undefined): ReadonlyArray<ExtractedFact> {
  if (text === undefined || text.length === 0) return [];
  const candidate = stripFence(text).trim();
  if (candidate.length === 0) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    const slice = sliceJsonObject(candidate);
    if (slice === null) return [];
    try {
      parsed = JSON.parse(slice);
    } catch {
      return [];
    }
  }
  if (parsed === null || typeof parsed !== 'object') return [];
  const root = parsed as { facts?: unknown };
  const facts = Array.isArray(root.facts) ? root.facts : Array.isArray(parsed) ? parsed : [];
  const out: ExtractedFact[] = [];
  for (const item of facts) {
    if (item === null || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const text = typeof obj.text === 'string' ? obj.text : null;
    if (text === null || text.trim().length === 0) continue;
    const fact: ExtractedFact = {
      text,
      ...(typeof obj.subject === 'string' ? { subject: obj.subject } : {}),
      ...(typeof obj.predicate === 'string' ? { predicate: obj.predicate } : {}),
      ...(typeof obj.object === 'string' ? { object: obj.object } : {}),
      ...(typeof obj.confidence === 'number' ? { confidence: obj.confidence } : {}),
    };
    out.push(fact);
  }
  return out;
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

function emptyOutcome(status: PhaseOutcome['status']): PhaseOutcome {
  return {
    phase: 'standard',
    status,
    factsCreated: 0,
    factsUpdated: 0,
    conflictsResolved: 0,
    noiseFilteredCount: 0,
    emptyExtractions: 0,
    llmTokensUsed: 0,
    llmCostUsd: null,
    errorMessage: null,
  };
}
