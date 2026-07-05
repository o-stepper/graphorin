/**
 * Built-in `tool_search` - deferred-tool catalogue lookup.
 *
 * The tool is auto-registered by the agent runtime when the tool
 * registry contains at least one deferred tool (`__effectiveDeferLoading
 * === true`). It is always present (never itself deferred) so the model
 * can discover deferred tools mid-step.
 *
 * The schema is declared inline using Zod - `@graphorin/tools`
 * declares Zod as a (required) peer dependency and consumes it as a
 * runtime value here. The agent runtime supplies the registry
 * reference + an optional embedder via {@link ToolSearchToolOptions}.
 *
 * @packageDocumentation
 */

import type { Tool } from '@graphorin/core';
import { z } from 'zod';
import { incrementCounter } from '../audit/index.js';
import { tool } from '../builder/index.js';
import type { ToolRegistry } from '../registry/registry.js';

/** Configuration for {@link createToolSearchTool}. */
export interface ToolSearchToolOptions {
  readonly registry: ToolRegistry;
  /** Default `k` when the model does not pass one. Default `5`. */
  readonly defaultK?: number;
  /** Hard cap on `k` (model-supplied). Default `15`. */
  readonly maxK?: number;
  /**
   * When matched tools become callable, reflected in the model-facing
   * description so the model is never promised availability the harness
   * does not deliver. `'next-step'` (default) matches the agent's
   * immediate promotion mode; `'next-run'` matches
   * `toolPromotion: 'run-boundary'` (C1), where the catalogue is frozen
   * for the current run.
   */
  readonly availability?: 'next-step' | 'next-run';
}

const inputSchema = z.object({
  query: z.string().min(1).max(1024),
  k: z.number().int().positive().max(15).optional(),
});

const outputSchema = z.object({
  matches: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      inputSchema: z.record(z.string(), z.unknown()),
      score: z.number(),
      source: z.enum(['semantic', 'bm25', 'regex-name']),
    }),
  ),
});

type ToolSearchInput = z.infer<typeof inputSchema>;
type ToolSearchOutput = z.infer<typeof outputSchema>;

/**
 * Build a `tool_search` tool bound to a specific registry.
 *
 * @stable
 */
export function createToolSearchTool(
  opts: ToolSearchToolOptions,
): Tool<ToolSearchInput, ToolSearchOutput> {
  const defaultK = opts.defaultK ?? 5;
  const maxK = opts.maxK ?? 15;
  const availabilityText =
    opts.availability === 'next-run'
      ? "the matched tools are recorded and become available on the agent's NEXT run (the current run's catalogue is frozen)."
      : 'the matched tools become available on the NEXT step of the agent loop.';
  return tool<ToolSearchInput, ToolSearchOutput>({
    name: 'tool_search',
    description: `Search the agent's deferred-tool catalogue for tools matching a natural-language query. Returns up to \`k\` matched tools with their name, description, JSON Schema, score, and the ranking stage that produced the match. Invoke this tool BEFORE attempting an unknown tool - ${availabilityText}`,
    inputSchema,
    outputSchema,
    sideEffectClass: 'read-only',
    sandboxPolicy: 'none',
    sensitivity: 'public',
    tags: ['built-in', 'tool-discovery'],
    async execute(input) {
      const k = Math.min(maxK, input.k ?? defaultK);
      const matches = await opts.registry.searchDeferred(input.query, k);
      incrementCounter('tool.retrieval.search.executed.total', undefined);
      return { matches: [...matches] };
    },
  });
}
