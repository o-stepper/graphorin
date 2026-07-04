import type { Tool } from '@graphorin/core';
import { tool } from '@graphorin/tools';
import { z } from 'zod';
import type { MemoryToolDeps } from './types.js';

const recallEpisodesInputSchema = z.object({
  query: z.string().min(1).max(1024),
  topK: z.number().int().positive().max(20).optional(),
  dateRange: z
    .object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    })
    .optional(),
});
const recallEpisodesOutputSchema = z.object({
  episodes: z.array(
    z.object({
      episodeId: z.string(),
      summary: z.string(),
      score: z.number(),
      startedAt: z.string(),
      endedAt: z.string(),
      /** Trust-provenance tag (MST-10) — synthesized episodes say so. */
      provenance: z.string().optional(),
    }),
  ),
});

type RecallEpisodesInput = z.infer<typeof recallEpisodesInputSchema>;
type RecallEpisodesOutput = z.infer<typeof recallEpisodesOutputSchema>;

const conversationSearchInputSchema = z.object({
  query: z.string().min(1).max(1024),
  topK: z.number().int().positive().max(20).optional(),
});
const conversationSearchOutputSchema = z.object({
  matches: z.array(
    z.object({
      messageId: z.string(),
      score: z.number(),
    }),
  ),
});

type ConversationSearchInput = z.infer<typeof conversationSearchInputSchema>;
type ConversationSearchOutput = z.infer<typeof conversationSearchOutputSchema>;

const deepRecallSensitivityEnum = z.enum(['public', 'internal', 'secret']);
const deepRecallInputSchema = z.object({
  query: z.string().min(1).max(1024),
  topK: z.number().int().positive().max(50).optional(),
  maxIterations: z.number().int().min(1).max(5).optional(),
  asOf: z.string().datetime().optional(),
});
const deepRecallOutputSchema = z.object({
  hits: z.array(
    z.object({
      factId: z.string(),
      text: z.string(),
      score: z.number(),
      sensitivity: deepRecallSensitivityEnum,
      /** Trust-provenance tag (MST-10) — synthesized facts say so. */
      provenance: z.string().optional(),
      /** Closed validity end (only surfaces on `asOf` reads). */
      validTo: z.string().optional(),
      /** Id of the fact that superseded this one, when any. */
      supersededBy: z.string().optional(),
    }),
  ),
  sufficient: z.boolean(),
  abstained: z.boolean(),
  /**
   * Whether the grader actually judged sufficiency
   * (memory-retrieval-02). When `false`, `sufficient: true` is a
   * default, not a verdict.
   */
  graded: z.boolean(),
  iterations: z.number().int(),
});

type DeepRecallInput = z.infer<typeof deepRecallInputSchema>;
type DeepRecallOutput = z.infer<typeof deepRecallOutputSchema>;

/**
 * `recall_episodes` — triple-signal episode retrieval (recency ×
 * relevance × importance).
 *
 * @stable
 */
export function createRecallEpisodesTool(
  deps: MemoryToolDeps,
): Tool<RecallEpisodesInput, RecallEpisodesOutput> {
  return tool<RecallEpisodesInput, RecallEpisodesOutput>({
    name: 'recall_episodes',
    description:
      "Recall summarized episodes (multi-message stretches of past activity) matching a natural-language query. Combines vector relevance, time-decay recency, and the per-episode importance score. Use for long-horizon recall ('the last time we discussed X').",
    inputSchema: recallEpisodesInputSchema,
    outputSchema: recallEpisodesOutputSchema,
    sideEffectClass: 'read-only',
    sandboxPolicy: 'none',
    sensitivity: 'internal',
    memoryGuardTier: 'pure',
    tags: ['memory', 'episodic'],
    async execute(input, ctx) {
      const scope = await deps.resolveScope(ctx);
      const dateRange =
        input.dateRange !== undefined
          ? {
              ...(input.dateRange.from !== undefined ? { from: input.dateRange.from } : {}),
              ...(input.dateRange.to !== undefined ? { to: input.dateRange.to } : {}),
            }
          : undefined;
      const hits = await deps.episodic.search(scope, input.query, {
        ...(input.topK !== undefined ? { topK: input.topK } : {}),
        ...(dateRange !== undefined ? { dateRange } : {}),
        signal: ctx.signal,
      });
      return {
        episodes: hits.map((hit) => ({
          episodeId: hit.record.id,
          summary: hit.record.summary,
          score: hit.score,
          startedAt: hit.record.startedAt,
          endedAt: hit.record.endedAt,
          // MST-10: surface origin so a consumer can tell a synthesized
          // (consolidator-extracted) episode from a first-party record —
          // recalled text re-enters the model as trusted tool output.
          ...(hit.record.provenance !== undefined ? { provenance: hit.record.provenance } : {}),
        })),
      };
    },
  });
}

/**
 * `conversation_search` — FTS5 search over the active session
 * messages.
 *
 * @stable
 */
export function createConversationSearchTool(
  deps: MemoryToolDeps,
): Tool<ConversationSearchInput, ConversationSearchOutput> {
  return tool<ConversationSearchInput, ConversationSearchOutput>({
    name: 'conversation_search',
    description:
      'Search the active session message log by natural-language query. Returns up to `topK` matched messages with their stable id and BM25 score.',
    inputSchema: conversationSearchInputSchema,
    outputSchema: conversationSearchOutputSchema,
    sideEffectClass: 'read-only',
    sandboxPolicy: 'none',
    sensitivity: 'internal',
    memoryGuardTier: 'pure',
    tags: ['memory', 'session'],
    async execute(input, ctx) {
      const scope = await deps.resolveScope(ctx);
      const hits = await deps.session.search(scope, input.query, {
        ...(input.topK !== undefined ? { topK: input.topK } : {}),
        signal: ctx.signal,
      });
      return {
        matches: hits.map((hit) => ({
          messageId: hit.record.id,
          score: hit.score,
        })),
      };
    },
  });
}

/**
 * `deep_recall` — gated, multi-pass ("deep") recall over the user's
 * factual memory for HARD questions (P2-4). A local difficulty gate keeps
 * simple lookups single-shot; only queries judged hard trigger a
 * grade-and-reformulate loop (bounded by `maxIterations`, hard-capped at
 * 5), widening to one-hop graph expansion on reformulation passes. The
 * output reports `abstained: true` when memory was insufficient even
 * after reformulating — the agent should then say it lacks the
 * information rather than guess. Registered only when the facade is
 * created with `iterativeRetrieval`; otherwise it degrades to a single
 * pass, so prefer the cheaper `fact_search` for ordinary lookups.
 *
 * @stable
 */
export function createDeepRecallTool(
  deps: MemoryToolDeps,
): Tool<DeepRecallInput, DeepRecallOutput> {
  return tool<DeepRecallInput, DeepRecallOutput>({
    name: 'deep_recall',
    description:
      "Multi-pass ('deep') recall over the user's long-term factual memory for HARD multi-hop or temporal questions one search can't answer (e.g. 'who recommended the book the person I met in Tbilisi mentioned?'). A difficulty gate keeps simple lookups single-shot; hard questions trigger a bounded grade-and-reformulate loop. If `abstained` is true the memory was insufficient even after reformulating — tell the user you don't have enough stored to answer and DO NOT guess. Prefer the cheaper fact_search for ordinary lookups.",
    inputSchema: deepRecallInputSchema,
    outputSchema: deepRecallOutputSchema,
    sideEffectClass: 'read-only',
    sandboxPolicy: 'none',
    sensitivity: 'internal',
    memoryGuardTier: 'pure',
    tags: ['memory', 'semantic'],
    async execute(input, ctx) {
      const scope = await deps.resolveScope(ctx);
      const result = await deps.semantic.searchIterative(scope, input.query, {
        ...(input.topK !== undefined ? { topK: input.topK } : {}),
        ...(input.maxIterations !== undefined ? { maxIterations: input.maxIterations } : {}),
        ...(input.asOf !== undefined ? { asOf: input.asOf } : {}),
        // memory-retrieval-02: the model choosing deep_recall over
        // fact_search IS the hardness signal — the local heuristic gate
        // rejected the tool's own documented multi-hop examples
        // (W_MULTI_HOP 0.4 < threshold 0.5) and is English-only. The
        // cap + grader stop conditions still bound cost.
        forceHard: true,
        signal: ctx.signal,
      });
      return {
        hits: result.hits.map((hit) => ({
          factId: hit.record.id,
          text: hit.record.text,
          score: hit.score,
          sensitivity: hit.record.sensitivity,
          // MST-10: origin annotation, mirroring fact_search.
          ...(hit.record.provenance !== undefined ? { provenance: hit.record.provenance } : {}),
          ...(hit.record.validTo !== undefined ? { validTo: hit.record.validTo } : {}),
          ...(hit.record.supersededBy !== undefined
            ? { supersededBy: hit.record.supersededBy }
            : {}),
        })),
        sufficient: result.sufficient,
        abstained: result.abstained,
        graded: result.graded,
        iterations: result.iterations,
      };
    },
  });
}
