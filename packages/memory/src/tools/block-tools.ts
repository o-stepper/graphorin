import type { Tool } from '@graphorin/core';
import { tool } from '@graphorin/tools';
import { z } from 'zod';
import type { MemoryToolDeps } from './types.js';

const blockAppendInputSchema = z.object({
  label: z.string().min(1).max(128),
  content: z.string().min(1),
});
const blockAppendOutputSchema = z.object({
  label: z.string(),
  length: z.number(),
});

type BlockAppendInput = z.infer<typeof blockAppendInputSchema>;
type BlockAppendOutput = z.infer<typeof blockAppendOutputSchema>;

const blockReplaceInputSchema = z.object({
  label: z.string().min(1).max(128),
  oldUnique: z.string().min(1),
  newText: z.string(),
});
const blockReplaceOutputSchema = z.object({
  label: z.string(),
  length: z.number(),
});

type BlockReplaceInput = z.infer<typeof blockReplaceInputSchema>;
type BlockReplaceOutput = z.infer<typeof blockReplaceOutputSchema>;

const blockRethinkInputSchema = z.object({
  label: z.string().min(1).max(128),
  newValue: z.string(),
});
const blockRethinkOutputSchema = z.object({
  label: z.string(),
  length: z.number(),
});

type BlockRethinkInput = z.infer<typeof blockRethinkInputSchema>;
type BlockRethinkOutput = z.infer<typeof blockRethinkOutputSchema>;

/**
 * `block_append` — append text (with a newline separator) to a working
 * memory block.
 *
 * @stable
 */
export function createBlockAppendTool(
  deps: MemoryToolDeps,
): Tool<BlockAppendInput, BlockAppendOutput> {
  return tool<BlockAppendInput, BlockAppendOutput>({
    name: 'block_append',
    description:
      'Append text to a working memory block. The block is identified by its label (registered via memory.working.define(...)). Use this when accumulating notes, observations, or reasoning steps that should persist across turns.',
    inputSchema: blockAppendInputSchema,
    outputSchema: blockAppendOutputSchema,
    sideEffectClass: 'side-effecting',
    sandboxPolicy: 'none',
    sensitivity: 'internal',
    memoryGuardTier: 'memory-aware',
    tags: ['memory', 'working'],
    async execute(input, ctx) {
      const scope = await deps.resolveScope(ctx);
      const block = await deps.working.append(scope, input.label, input.content);
      return { label: block.label, length: block.value.length };
    },
  });
}

/**
 * `block_replace` — replace a unique substring inside a working
 * memory block. Throws when the substring is missing or appears more
 * than once.
 *
 * @stable
 */
export function createBlockReplaceTool(
  deps: MemoryToolDeps,
): Tool<BlockReplaceInput, BlockReplaceOutput> {
  return tool<BlockReplaceInput, BlockReplaceOutput>({
    name: 'block_replace',
    description:
      'Replace a UNIQUE substring inside a working memory block. The substring must appear exactly once; the call fails fast if missing or non-unique. Use block_rethink for full rewrites.',
    inputSchema: blockReplaceInputSchema,
    outputSchema: blockReplaceOutputSchema,
    sideEffectClass: 'side-effecting',
    sandboxPolicy: 'none',
    sensitivity: 'internal',
    memoryGuardTier: 'memory-aware',
    tags: ['memory', 'working'],
    async execute(input, ctx) {
      const scope = await deps.resolveScope(ctx);
      const block = await deps.working.replace(scope, input.label, input.oldUnique, input.newText);
      return { label: block.label, length: block.value.length };
    },
  });
}

/**
 * `block_rethink` — rewrite a working memory block from scratch.
 *
 * @stable
 */
export function createBlockRethinkTool(
  deps: MemoryToolDeps,
): Tool<BlockRethinkInput, BlockRethinkOutput> {
  return tool<BlockRethinkInput, BlockRethinkOutput>({
    name: 'block_rethink',
    description:
      "Replace a working memory block's value entirely. Use this when restructuring or summarising the block's contents. For surgical edits, prefer block_replace.",
    inputSchema: blockRethinkInputSchema,
    outputSchema: blockRethinkOutputSchema,
    sideEffectClass: 'side-effecting',
    sandboxPolicy: 'none',
    sensitivity: 'internal',
    memoryGuardTier: 'memory-aware',
    tags: ['memory', 'working'],
    async execute(input, ctx) {
      const scope = await deps.resolveScope(ctx);
      const block = await deps.working.rethink(scope, input.label, () => input.newValue);
      return { label: block.label, length: block.value.length };
    },
  });
}
