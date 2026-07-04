/**
 * Built-in `read_result` — fetch (a range of) a large tool result that was
 * stored behind a handle instead of being inlined (P1-4).
 *
 * The agent runtime auto-registers this tool when at least one registered
 * tool opts into the `'spill-to-file'` truncation strategy (the only
 * producer of result handles today). It is bound to a {@link ResultReader}
 * confined to the spill artifact root, so the model can page through a
 * spilled artifact on demand without the full blob ever entering context.
 *
 * The schema is declared inline with Zod — `@graphorin/tools` declares Zod
 * as a (required) peer dependency and consumes it as a runtime value here,
 * mirroring `tool_search`.
 *
 * @packageDocumentation
 */

import type { Tool } from '@graphorin/core';
import { z } from 'zod';
import { incrementCounter } from '../audit/index.js';
import { tool } from '../builder/index.js';
import type { ResultReader, ResultReadRange } from '../result/reader.js';

/** Configuration for {@link createReadResultTool}. */
export interface ReadResultToolOptions {
  readonly reader: ResultReader;
  /** Default `maxBytes` when the model does not pass one. Default `65536`. */
  readonly defaultMaxBytes?: number;
}

const inputSchema = z.object({
  handle: z.string().min(1).max(2048),
  offset: z.number().int().nonnegative().optional(),
  length: z.number().int().positive().optional(),
  startLine: z.number().int().positive().optional(),
  endLine: z.number().int().positive().optional(),
  maxBytes: z.number().int().positive().max(1_048_576).optional(),
});

const outputSchema = z.object({
  content: z.string(),
  bytes: z.number(),
  totalBytes: z.number(),
  eof: z.boolean(),
  /** TL-6: producer trust class reported by the reader, when known. */
  producerTrustClass: z.string().optional(),
  /** tools-03: producer source (a `ToolSource` value) from the taint sidecar, when known. */
  producerSource: z.object({ kind: z.string() }).passthrough().optional(),
  /** tools-03: producer sensitivity recovered from the taint sidecar, when known. */
  producerSensitivity: z.string().optional(),
});

type ReadResultInput = z.infer<typeof inputSchema>;
type ReadResultOutput = z.infer<typeof outputSchema>;

/**
 * Build a `read_result` tool bound to a specific {@link ResultReader}.
 *
 * @stable
 */
export function createReadResultTool(
  opts: ReadResultToolOptions,
): Tool<ReadResultInput, ReadResultOutput> {
  const defaultMaxBytes = opts.defaultMaxBytes ?? 65_536;
  return tool<ReadResultInput, ReadResultOutput>({
    name: 'read_result',
    description:
      'Retrieve a large tool result that was stored behind a handle instead of being inlined. Pass the `handle` string from a prior tool result (e.g. "graphorin-spill:…"). Narrow the read with a byte range (`offset`/`length`) or a line range (`startLine`/`endLine`, 1-based inclusive). Returns at most `maxBytes` bytes (default 64 KiB) plus the total artifact size and an `eof` flag, so you can page through a large result and fetch only what you need.',
    inputSchema,
    outputSchema,
    sideEffectClass: 'read-only',
    sandboxPolicy: 'none',
    sensitivity: 'internal',
    tags: ['built-in', 'result-handle'],
    async execute(input) {
      const range: ResultReadRange = {
        ...(input.offset !== undefined ? { offset: input.offset } : {}),
        ...(input.length !== undefined ? { length: input.length } : {}),
        ...(input.startLine !== undefined ? { startLine: input.startLine } : {}),
        ...(input.endLine !== undefined ? { endLine: input.endLine } : {}),
        maxBytes: input.maxBytes ?? defaultMaxBytes,
      };
      const outcome = await opts.reader.read(input.handle, range);
      incrementCounter('tool.result.read.executed.total', undefined);
      return outcome;
    },
  });
}
