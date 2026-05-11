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
