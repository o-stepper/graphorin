import type { Tool } from '@graphorin/core';
import { tool } from '@graphorin/tools';
import { z } from 'zod';
import type { MemoryToolDeps } from './types.js';

const sensitivityEnum = z.enum(['public', 'internal', 'secret']);

const factRememberInputSchema = z.object({
  text: z.string().min(1).max(8192),
  tags: z.array(z.string().min(1).max(64)).max(32).optional(),
  confidence: z.number().min(0).max(1).optional(),
  sensitivity: sensitivityEnum.optional(),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
});
const factRememberOutputSchema = z.object({
  factId: z.string(),
});

type FactRememberInput = z.infer<typeof factRememberInputSchema>;
type FactRememberOutput = z.infer<typeof factRememberOutputSchema>;

const factSearchInputSchema = z.object({
  query: z.string().min(1).max(1024),
  topK: z.number().int().positive().max(50).optional(),
  tags: z.array(z.string().min(1)).max(16).optional(),
});
const factSearchOutputSchema = z.object({
  hits: z.array(
    z.object({
      factId: z.string(),
      text: z.string(),
      score: z.number(),
      sensitivity: sensitivityEnum,
    }),
  ),
});

type FactSearchInput = z.infer<typeof factSearchInputSchema>;
type FactSearchOutput = z.infer<typeof factSearchOutputSchema>;

const factSupersedeInputSchema = z.object({
  oldId: z.string().min(1),
  newText: z.string().min(1).max(8192),
  reason: z.string().max(512).optional(),
});
const factSupersedeOutputSchema = z.object({
  oldId: z.string(),
  newId: z.string(),
});

type FactSupersedeInput = z.infer<typeof factSupersedeInputSchema>;
type FactSupersedeOutput = z.infer<typeof factSupersedeOutputSchema>;

const factForgetInputSchema = z.object({
  factId: z.string().min(1),
  reason: z.string().max(512).optional(),
});
const factForgetOutputSchema = z.object({
  factId: z.string(),
  forgotten: z.boolean(),
});

type FactForgetInput = z.infer<typeof factForgetInputSchema>;
type FactForgetOutput = z.infer<typeof factForgetOutputSchema>;

/**
 * `fact_remember` — persist a single semantic fact. The minimum-viable
 * pipeline writes the fact straight through with MD5 deduplication;
 * Phase 10b extends the body with the multi-stage conflict resolution.
 *
 * @stable
 */
export function createFactRememberTool(
  deps: MemoryToolDeps,
): Tool<FactRememberInput, FactRememberOutput> {
  return tool<FactRememberInput, FactRememberOutput>({
    name: 'fact_remember',
    description:
      'Persist an atomic factual statement about the user, the world, or the current session. Prefer one fact per call; the system applies dedup + conflict resolution downstream. Pass `validFrom` / `validTo` for bi-temporal facts and `sensitivity` to control redaction.',
    inputSchema: factRememberInputSchema,
    outputSchema: factRememberOutputSchema,
    sideEffectClass: 'side-effecting',
    sandboxPolicy: 'none',
    sensitivity: 'internal',
    memoryGuardTier: 'memory-aware',
    tags: ['memory', 'semantic'],
    async execute(input, ctx) {
      const scope = await deps.resolveScope(ctx);
      const fact = await deps.semantic.remember(scope, {
        text: input.text,
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.confidence !== undefined ? { confidence: input.confidence } : {}),
        ...(input.sensitivity !== undefined ? { sensitivity: input.sensitivity } : {}),
        ...(input.validFrom !== undefined ? { validFrom: input.validFrom } : {}),
        ...(input.validTo !== undefined ? { validTo: input.validTo } : {}),
      });
      return { factId: fact.id };
    },
  });
}

/**
 * `fact_search` — hybrid (vector + FTS5) search over the user's
 * semantic memory. Results merged through the configured reranker.
 *
 * @stable
 */
export function createFactSearchTool(
  deps: MemoryToolDeps,
): Tool<FactSearchInput, FactSearchOutput> {
  return tool<FactSearchInput, FactSearchOutput>({
    name: 'fact_search',
    description:
      "Search the user's long-term factual memory by natural-language query. Returns up to `topK` matched facts with their score and sensitivity. Use this BEFORE asking the user a question they may have answered earlier.",
    inputSchema: factSearchInputSchema,
    outputSchema: factSearchOutputSchema,
    sideEffectClass: 'read-only',
    sandboxPolicy: 'none',
    sensitivity: 'internal',
    memoryGuardTier: 'pure',
    tags: ['memory', 'semantic'],
    async execute(input, ctx) {
      const scope = await deps.resolveScope(ctx);
      const hits = await deps.semantic.search(scope, input.query, {
        ...(input.topK !== undefined ? { topK: input.topK } : {}),
        signal: ctx.signal,
      });
      return {
        hits: hits.map((hit) => ({
          factId: hit.record.id,
          text: hit.record.text,
          score: hit.score,
          sensitivity: hit.record.sensitivity,
        })),
      };
    },
  });
}

/**
 * `fact_supersede` — soft-supersede an old fact by storing a new one
 * that replaces it. The old fact is kept for replay but ranked below
 * the new one.
 *
 * @stable
 */
export function createFactSupersedeTool(
  deps: MemoryToolDeps,
): Tool<FactSupersedeInput, FactSupersedeOutput> {
  return tool<FactSupersedeInput, FactSupersedeOutput>({
    name: 'fact_supersede',
    description:
      "Mark an old fact superseded by a new one. Use this when the user's situation changed (moved cities, updated a goal, switched a preference) — the old fact is preserved for replay but no longer surfaced as current.",
    inputSchema: factSupersedeInputSchema,
    outputSchema: factSupersedeOutputSchema,
    sideEffectClass: 'side-effecting',
    sandboxPolicy: 'none',
    sensitivity: 'internal',
    memoryGuardTier: 'memory-aware',
    tags: ['memory', 'semantic'],
    async execute(input, ctx) {
      const scope = await deps.resolveScope(ctx);
      const result = await deps.semantic.supersede(
        scope,
        input.oldId,
        { text: input.newText },
        input.reason,
      );
      return { oldId: result.old, newId: result.new.id };
    },
  });
}

/**
 * `fact_forget` — soft-delete a fact (kept for replay; never hard-
 * deleted at this layer).
 *
 * @stable
 */
export function createFactForgetTool(
  deps: MemoryToolDeps,
): Tool<FactForgetInput, FactForgetOutput> {
  return tool<FactForgetInput, FactForgetOutput>({
    name: 'fact_forget',
    description:
      'Soft-delete a fact. The record is preserved for replay but no longer surfaced by fact_search. Use only for explicit user-driven removal (privacy / user request).',
    inputSchema: factForgetInputSchema,
    outputSchema: factForgetOutputSchema,
    sideEffectClass: 'side-effecting',
    sandboxPolicy: 'none',
    sensitivity: 'internal',
    memoryGuardTier: 'memory-aware',
    tags: ['memory', 'semantic'],
    async execute(input, ctx) {
      const scope = await deps.resolveScope(ctx);
      await deps.semantic.forget(scope, input.factId, input.reason);
      return { factId: input.factId, forgotten: true };
    },
  });
}
