import type { Tool } from '@graphorin/core';
import { tool } from '@graphorin/tools';
import { z } from 'zod';
import type { MemoryToolDeps } from './types.js';

const sensitivityEnum = z.enum(['public', 'internal', 'secret']);
const provenanceEnum = z.enum(['user', 'tool', 'extraction', 'reflection', 'imported']);

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
  asOf: z.string().datetime().optional(),
});
const factSearchOutputSchema = z.object({
  hits: z.array(
    z.object({
      factId: z.string(),
      text: z.string(),
      score: z.number(),
      sensitivity: sensitivityEnum,
      provenance: provenanceEnum.optional(),
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

const factHistoryInputSchema = z.object({
  factId: z.string().min(1),
});
const factHistoryOutputSchema = z.object({
  chain: z.array(
    z.object({
      factId: z.string(),
      text: z.string(),
      validFrom: z.string().optional(),
      validTo: z.string().optional(),
      supersedes: z.string().optional(),
      supersededBy: z.string().optional(),
      sensitivity: sensitivityEnum,
    }),
  ),
});

type FactHistoryInput = z.infer<typeof factHistoryInputSchema>;
type FactHistoryOutput = z.infer<typeof factHistoryOutputSchema>;

const factValidateInputSchema = z.object({
  factId: z.string().min(1),
  reason: z.string().max(512).optional(),
});
const factValidateOutputSchema = z.object({
  factId: z.string(),
  validated: z.boolean(),
});

type FactValidateInput = z.infer<typeof factValidateInputSchema>;
type FactValidateOutput = z.infer<typeof factValidateOutputSchema>;

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
      "Search the user's long-term factual memory by natural-language query. Returns up to `topK` matched facts with their score and sensitivity. Use this BEFORE asking the user a question they may have answered earlier. Pass `asOf` (ISO-8601) to read memory as it was at a past instant — point-in-time / 'what was true on date X' — instead of the current state.",
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
        ...(input.asOf !== undefined ? { asOf: input.asOf } : {}),
        signal: ctx.signal,
      });
      return {
        hits: hits.map((hit) => ({
          factId: hit.record.id,
          text: hit.record.text,
          score: hit.score,
          sensitivity: hit.record.sensitivity,
          ...(hit.record.provenance !== undefined ? { provenance: hit.record.provenance } : {}),
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

/**
 * `fact_history` — trace how a fact changed over time. Returns the
 * full bi-temporal supersede chain the given fact belongs to, oldest →
 * newest, including superseded entries, so the agent can answer "what
 * did the user say before" / "how did this change". Read-only. P0-2.
 *
 * @stable
 */
export function createFactHistoryTool(
  deps: MemoryToolDeps,
): Tool<FactHistoryInput, FactHistoryOutput> {
  return tool<FactHistoryInput, FactHistoryOutput>({
    name: 'fact_history',
    description:
      "Trace how a fact changed over time. Given a factId, returns its full bi-temporal supersede chain (oldest → newest), including superseded entries, with each entry's validFrom/validTo. Use this to answer 'how did this change' or 'what was the previous value'.",
    inputSchema: factHistoryInputSchema,
    outputSchema: factHistoryOutputSchema,
    sideEffectClass: 'read-only',
    sandboxPolicy: 'none',
    sensitivity: 'internal',
    memoryGuardTier: 'pure',
    tags: ['memory', 'semantic', 'temporal'],
    async execute(input, ctx) {
      const scope = await deps.resolveScope(ctx);
      const chain = await deps.semantic.history(scope, input.factId);
      return {
        chain: chain.map((f) => ({
          factId: f.id,
          text: f.text,
          ...(f.validFrom !== undefined ? { validFrom: f.validFrom } : {}),
          ...(f.validTo !== undefined ? { validTo: f.validTo } : {}),
          ...(f.supersedes !== undefined ? { supersedes: f.supersedes } : {}),
          ...(f.supersededBy !== undefined ? { supersededBy: f.supersededBy } : {}),
          sensitivity: f.sensitivity,
        })),
      };
    },
  });
}

/**
 * `fact_validate` — promote a quarantined fact to active (P1-4). The
 * validation path that admits a synthesized (consolidator / reflection)
 * or injection-flagged memory into action-driving recall once it has
 * been reviewed; the promotion is audited in `memory_history`. This is
 * intended as an operator / inspector action: the agent's `fact_search`
 * cannot enumerate quarantined facts, so it cannot be socially
 * engineered by a poisoned (and therefore hidden) memory into validating
 * one.
 *
 * @stable
 */
export function createFactValidateTool(
  deps: MemoryToolDeps,
): Tool<FactValidateInput, FactValidateOutput> {
  return tool<FactValidateInput, FactValidateOutput>({
    name: 'fact_validate',
    description:
      'Promote a quarantined fact to active so it becomes eligible for normal recall. Quarantined facts are memories the system synthesized or flagged as risky; validating one is a deliberate, audited admission. Use only for explicit, reviewed promotion — not as a routine step.',
    inputSchema: factValidateInputSchema,
    outputSchema: factValidateOutputSchema,
    sideEffectClass: 'side-effecting',
    sandboxPolicy: 'none',
    sensitivity: 'internal',
    memoryGuardTier: 'memory-aware',
    tags: ['memory', 'semantic', 'safety'],
    async execute(input, ctx) {
      const scope = await deps.resolveScope(ctx);
      await deps.semantic.validate(scope, input.factId, input.reason);
      return { factId: input.factId, validated: true };
    },
  });
}
