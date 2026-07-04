import type { Tool } from '@graphorin/core';
import { tool } from '@graphorin/tools';
import { z } from 'zod';
import type { MemoryToolDeps } from './types.js';

const sensitivityEnum = z.enum(['public', 'internal', 'secret']);
const provenanceEnum = z.enum([
  'user',
  'tool',
  'extraction',
  'reflection',
  'induction',
  'imported',
]);

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
  /**
   * MRET-3: `true` when the write landed in quarantine (hidden from
   * default recall until validated). A synthesized consolidator write or
   * a candidate that tripped the injection heuristics quarantines.
   */
  quarantined: z.boolean(),
  /** Why it was quarantined, when it was. */
  quarantineReason: z.enum(['injection', 'synthesized']).optional(),
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
      /**
       * Set when the fact's validity interval was closed (superseded /
       * expired). Only present on `asOf` reads — default reads exclude
       * such facts entirely (memory-retrieval-01).
       */
      validTo: z.string().optional(),
      /** Id of the fact that superseded this one, when any. */
      supersededBy: z.string().optional(),
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
      const outcome = await deps.semantic.rememberWithDecision(scope, {
        text: input.text,
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.confidence !== undefined ? { confidence: input.confidence } : {}),
        ...(input.sensitivity !== undefined ? { sensitivity: input.sensitivity } : {}),
        ...(input.validFrom !== undefined ? { validFrom: input.validFrom } : {}),
        ...(input.validTo !== undefined ? { validTo: input.validTo } : {}),
      });
      // MRET-3: tell the caller when the write was quarantined so a
      // poisoned fact cannot masquerade as a normally-stored one.
      return {
        factId: outcome.fact.id,
        quarantined: outcome.fact.status === 'quarantined',
        ...(outcome.quarantineReason !== undefined
          ? { quarantineReason: outcome.quarantineReason }
          : {}),
      };
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
        // MRET-4: forward the tags filter — it was accepted by the
        // schema and silently dropped here.
        ...(input.tags !== undefined && input.tags.length > 0 ? { tags: input.tags } : {}),
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
          // memory-retrieval-01: surface validity metadata so the model
          // can tell a historical (asOf) hit from a current one.
          ...(hit.record.validTo !== undefined ? { validTo: hit.record.validTo } : {}),
          ...(hit.record.supersededBy !== undefined
            ? { supersededBy: hit.record.supersededBy }
            : {}),
        })),
      };
    },
  });
}

/**
 * `fact_supersede` — soft-supersede an old fact by storing a new one
 * that replaces it. The old fact is kept for replay but no longer
 * surfaced by default reads (they evaluate validity at NOW); it stays
 * reachable via `asOf` / inspector paths.
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
 * memory into action-driving recall once it has been reviewed; the
 * promotion is audited in `memory_history`.
 *
 * MRET-3 / MST-1 — two gates close the one-turn memory-poisoning chain
 * (`fact_remember(poison)` → `fact_validate(id)` → active recall):
 *
 * 1. `needsApproval: true` — the run suspends for a human decision
 *    before this tool ever executes, so the agent cannot silently
 *    promote any quarantined fact.
 * 2. The underlying `SemanticMemory.validate(...)` re-checks the fact's
 *    text against the injection heuristics and **refuses** (no `force`
 *    is passed here) — an injection-flagged memory cannot be promoted by
 *    the agent at all. Only an operator, via the programmatic API with
 *    `{ force: true }`, can override after review.
 *
 * Synthesized-but-clean consolidator writes promote normally once
 * approved.
 *
 * @stable
 */
export function createFactValidateTool(
  deps: MemoryToolDeps,
): Tool<FactValidateInput, FactValidateOutput> {
  return tool<FactValidateInput, FactValidateOutput>({
    name: 'fact_validate',
    description:
      'Promote a quarantined fact to active so it becomes eligible for normal recall. Quarantined facts are memories the system synthesized or flagged as risky; validating one is a deliberate, human-approved admission and never a routine step. This action requires approval, and facts flagged as prompt-injection cannot be promoted here — they are an operator-only decision.',
    inputSchema: factValidateInputSchema,
    outputSchema: factValidateOutputSchema,
    // MRET-3: the only real gate on a model-callable tool — suspend the
    // run for a human decision before promoting anything out of quarantine.
    needsApproval: true,
    sideEffectClass: 'side-effecting',
    sandboxPolicy: 'none',
    sensitivity: 'internal',
    memoryGuardTier: 'memory-aware',
    tags: ['memory', 'semantic', 'safety'],
    async execute(input, ctx) {
      const scope = await deps.resolveScope(ctx);
      // No `force`: the agent path can never promote an injection-flagged
      // fact (validate throws QuarantinePromotionRefusedError for those).
      await deps.semantic.validate(scope, input.factId, input.reason);
      return { factId: input.factId, validated: true };
    },
  });
}
