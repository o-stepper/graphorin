/**
 * Built-in `read_result` - fetch (a range of) a large tool result that was
 * stored behind a handle instead of being inlined (P1-4).
 *
 * The agent runtime auto-registers this tool when at least one registered
 * tool opts into the `'spill-to-file'` truncation strategy (the only
 * producer of result handles today). It is bound to a {@link ResultReader}
 * confined to the spill artifact root, so the model can page through a
 * spilled artifact on demand without the full blob ever entering context.
 *
 * The schema is declared inline with Zod - `@graphorin/tools` declares Zod
 * as a (required) peer dependency and consumes it as a runtime value here,
 * mirroring `tool_search`.
 *
 * @packageDocumentation
 */

import type { Tool } from '@graphorin/core';
import { z } from 'zod';
import { incrementCounter } from '../audit/index.js';
import { tool } from '../builder/index.js';
import { type ResultReader, type ResultReadRange, SPILL_HANDLE_SCHEME } from '../result/reader.js';

/** Configuration for {@link createReadResultTool}. */
export interface ReadResultToolOptions {
  readonly reader: ResultReader;
  /** Default `maxBytes` when the model does not pass one. Default `65536`. */
  readonly defaultMaxBytes?: number;
  /**
   * W-114: allow reading spill handles that belong to ANOTHER run.
   * Default `false`: spill artifacts live for days under the TTL sweep
   * (confidential bodies included), and a model steered by injection
   * could otherwise page through other runs' results. Opt in only for
   * deliberate cross-run flows (e.g. a parent folding a sub-agent's
   * handle, whose child run has its own runId).
   */
  readonly allowCrossRun?: boolean;
}

/**
 * W-114: extract the owning runId from a spill handle
 * (`graphorin-spill:<runId>/<toolCallId>.<ext>` - the format pinned by
 * the truncation spill writer). `undefined` when the handle is not a
 * spill URI or has no path segment.
 */
function spillHandleRunId(handle: string): string | undefined {
  if (!handle.startsWith(SPILL_HANDLE_SCHEME)) return undefined;
  const relative = handle.slice(SPILL_HANDLE_SCHEME.length);
  const slash = relative.indexOf('/');
  if (slash <= 0) return undefined;
  return relative.slice(0, slash);
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

/** W-013: explicit interfaces - no concrete zod generics in the d.ts. */
export interface ReadResultInput {
  handle: string;
  offset?: number | undefined;
  length?: number | undefined;
  startLine?: number | undefined;
  endLine?: number | undefined;
  maxBytes?: number | undefined;
}
export interface ReadResultOutput {
  content: string;
  bytes: number;
  totalBytes: number;
  eof: boolean;
  producerTrustClass?: string | undefined;
  producerSource?: ({ kind: string } & Record<string, unknown>) | undefined;
  producerSensitivity?: string | undefined;
}

// W-013 parity gate (compile-time only, erased from the build and the
// d.ts): the explicit interface must stay MUTUALLY assignable with the
// schema's inference - a drifted transcription fails `tsc` right here.
type W013Equals<A, B> = A extends B ? (B extends A ? true : false) : false;
type W013Assert<T extends true> = T;
type _W013Check1 = W013Assert<W013Equals<ReadResultInput, z.infer<typeof inputSchema>>>;
type _W013Check2 = W013Assert<W013Equals<ReadResultOutput, z.infer<typeof outputSchema>>>;

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
    async execute(input, ctx) {
      // W-114: spill handles are RUN-SCOPED by default. Resume of the
      // same run keeps its runId, so paging across a suspend still
      // works; reading another run's artifacts requires the explicit
      // `allowCrossRun` opt-in. Fail closed - the model sees a plain
      // execution_failed.
      if (opts.allowCrossRun !== true) {
        const owner = spillHandleRunId(input.handle);
        const currentRunId = (ctx?.runContext as { readonly runId?: string } | undefined)?.runId;
        if (owner !== undefined && currentRunId !== undefined && owner !== currentRunId) {
          incrementCounter('tool.result.read.cross-run-denied.total', undefined);
          throw new Error(
            `read_result: handle belongs to run '${owner}', not the current run - cross-run reads are disabled (set allowCrossRun on createReadResultTool for deliberate cross-run flows).`,
          );
        }
      }
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
