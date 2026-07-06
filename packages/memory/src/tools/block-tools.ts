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

/**
 * W-013: explicit interfaces instead of `z.infer<typeof schema>` - the
 * inferred aliases baked concrete v3 zod object generics into
 * the published d.ts, which do not typecheck under a zod@4 consumer.
 * Interface<->schema equality is pinned by type tests.
 */
export interface BlockAppendInput {
  label: string;
  content: string;
}
export interface BlockAppendOutput {
  label: string;
  length: number;
}

const blockReplaceInputSchema = z.object({
  label: z.string().min(1).max(128),
  oldUnique: z.string().min(1),
  newText: z.string(),
});
const blockReplaceOutputSchema = z.object({
  label: z.string(),
  length: z.number(),
});

export interface BlockReplaceInput {
  label: string;
  oldUnique: string;
  newText: string;
}
export interface BlockReplaceOutput {
  label: string;
  length: number;
}

const blockRethinkInputSchema = z.object({
  label: z.string().min(1).max(128),
  newValue: z.string(),
});
const blockRethinkOutputSchema = z.object({
  label: z.string(),
  length: z.number(),
});

export interface BlockRethinkInput {
  label: string;
  newValue: string;
}
export interface BlockRethinkOutput {
  label: string;
  length: number;
}

// W-013 parity gate (compile-time only, erased from the build and the
// d.ts): each explicit interface must stay MUTUALLY assignable with its
// schema's inference - a drifted transcription fails `tsc` right here.
type W013Equals<A, B> = A extends B ? (B extends A ? true : false) : false;
type W013Assert<T extends true> = T;
type _W013Check1 = W013Assert<W013Equals<BlockAppendInput, z.infer<typeof blockAppendInputSchema>>>;
type _W013Check2 = W013Assert<
  W013Equals<BlockAppendOutput, z.infer<typeof blockAppendOutputSchema>>
>;
type _W013Check3 = W013Assert<
  W013Equals<BlockReplaceInput, z.infer<typeof blockReplaceInputSchema>>
>;
type _W013Check4 = W013Assert<
  W013Equals<BlockReplaceOutput, z.infer<typeof blockReplaceOutputSchema>>
>;
type _W013Check5 = W013Assert<
  W013Equals<BlockRethinkInput, z.infer<typeof blockRethinkInputSchema>>
>;
type _W013Check6 = W013Assert<
  W013Equals<BlockRethinkOutput, z.infer<typeof blockRethinkOutputSchema>>
>;

/**
 * `block_append` - append text (with a newline separator) to a working
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
 * `block_replace` - replace a unique substring inside a working
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
 * `block_rethink` - rewrite a working memory block from scratch.
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
