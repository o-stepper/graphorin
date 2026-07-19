/**
 * Runbook tool - gated content recall over procedural memory.
 * `runbook_search` finds validated procedures whose text / steps match
 * a task description and returns them **whole** (title line, numbered
 * steps, variables, success criteria), so the model can follow a known
 * workflow file-style instead of re-deriving it. Registered only when
 * the facade opts in (`createMemory({ runbookSearch: true })`) - the
 * default tool surface is unchanged.
 *
 * @packageDocumentation
 */

import type { Tool } from '@graphorin/core';
import { tool } from '@graphorin/tools';
import { z } from 'zod';
import type { MemoryToolDeps } from './types.js';

const runbookSearchInputSchema = z.object({
  query: z.string().min(1).max(512),
  topK: z.number().int().min(1).max(20).optional(),
});
const runbookSearchOutputSchema = z.object({
  procedures: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      steps: z.array(z.string()).optional(),
      variables: z.array(z.string()).optional(),
      successCriteria: z.array(z.string()).optional(),
      priority: z.number(),
      score: z.number(),
    }),
  ),
});

/** Explicit interfaces (see fact-tools.ts) - no zod generics in d.ts. */
export interface RunbookSearchInput {
  query: string;
  topK?: number | undefined;
}
export interface RunbookProcedureHit {
  id: string;
  text: string;
  steps?: string[] | undefined;
  variables?: string[] | undefined;
  successCriteria?: string[] | undefined;
  priority: number;
  score: number;
}
export interface RunbookSearchOutput {
  procedures: RunbookProcedureHit[];
}

// W-013 parity gate (compile-time only, erased from the build and the
// d.ts): each explicit interface must stay MUTUALLY assignable with its
// schema's inference - a drifted transcription fails `tsc` right here.
type W013Equals<A, B> = A extends B ? (B extends A ? true : false) : false;
type W013Assert<T extends true> = T;
type _W013Check1 = W013Assert<
  W013Equals<RunbookSearchInput, z.infer<typeof runbookSearchInputSchema>>
>;
type _W013Check2 = W013Assert<
  W013Equals<RunbookSearchOutput, z.infer<typeof runbookSearchOutputSchema>>
>;

/**
 * `runbook_search` - find validated procedures matching a task
 * description. Quarantined (unvalidated induced) procedures never
 * surface here: they must not drive actions until validated.
 *
 * @stable
 */
export function createRunbookSearchTool(
  deps: MemoryToolDeps,
): Tool<RunbookSearchInput, RunbookSearchOutput> {
  return tool<RunbookSearchInput, RunbookSearchOutput>({
    name: 'runbook_search',
    description:
      'Find a stored, validated procedure ("runbook") matching the task at hand - e.g. "deploy the docs site" or "rotate the API key". Returns whole procedures with their numbered steps, variables, and success criteria so you can follow a known-good workflow instead of improvising. Use BEFORE attempting a multi-step operational task the user may have done with you previously.',
    inputSchema: runbookSearchInputSchema,
    outputSchema: runbookSearchOutputSchema,
    sideEffectClass: 'read-only',
    sandboxPolicy: 'none',
    sensitivity: 'internal',
    memoryGuardTier: 'pure',
    tags: ['memory', 'procedural'],
    async execute(input, ctx) {
      const scope = await deps.resolveScope(ctx);
      const hits = await deps.procedural.search(scope, input.query, {
        ...(input.topK !== undefined ? { topK: input.topK } : {}),
      });
      return {
        procedures: hits.map((hit) => ({
          id: hit.record.id,
          text: hit.record.text,
          ...(hit.record.steps !== undefined ? { steps: [...hit.record.steps] } : {}),
          ...(hit.record.variables !== undefined ? { variables: [...hit.record.variables] } : {}),
          ...(hit.record.successCriteria !== undefined
            ? { successCriteria: [...hit.record.successCriteria] }
            : {}),
          priority: hit.record.priority,
          score: hit.score,
        })),
      };
    },
  });
}
