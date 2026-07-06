/**
 * The two code-mode meta-tools (P1-2, step 2).
 *
 * Code-mode advertises **only** these two tools to the model instead of
 * the full registry; the model reaches every real tool *through* them:
 *
 * - **`code_execute`** runs a model-written script in a sandbox
 *   ({@link runBridgedSource}). The script calls tools via an injected
 *   `tools.<name>(args)` object; each call round-trips to the host
 *   {@link CodeExecuteToolOptions.executeTool} bridge - which the agent
 *   wires to the real {@link ToolExecutor}, so per-tool ACL /
 *   sanitization / truncation still apply. Intermediate values stay in
 *   the sandbox; only the script's final `return` value comes back, so a
 *   workflow that would inline many large results consumes context for
 *   the final answer alone.
 * - **`code_search`** returns the exact call signatures of tools so the
 *   model can write correct code without every signature being inlined
 *   up front (progressive disclosure).
 *
 * They are named `code_execute` / `code_search` - Graphorin-owned, not a
 * vendor runtime name (no `python` / `bash` / `code_interpreter`), so the
 * model treats them as plain tools without importing memorised
 * vendor-specific behaviour (Principle #15). They render with underscores
 * (not the dotted `code.execute` of the plan) to match the provider
 * tool-name wire formats and the other built-ins (`tool_search`,
 * `read_result`).
 *
 * @packageDocumentation
 */

import type { Tool, ToolExecutionContext } from '@graphorin/core';
import type { BridgedSourceOptions, BridgedToolCall } from '@graphorin/security/sandbox';
import { runBridgedSource } from '@graphorin/security/sandbox';
import { z } from 'zod';
import { incrementCounter } from '../audit/index.js';
import { tool } from '../builder/index.js';
import { type CodeApiProjection, projectToolApi } from './project.js';

/** A tool-search match `code_search` can fold in (deferred pool). */
export interface CodeSearchMatch {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Readonly<Record<string, unknown>>;
  /** A5: the matched tool's output schema, when declared (renders a return type). */
  readonly outputSchema?: Readonly<Record<string, unknown>>;
}

/** Configuration for {@link createCodeSearchTool}. */
export interface CodeSearchToolOptions {
  /** Projection over the eager (advertised) tool set. */
  readonly projection: CodeApiProjection;
  /**
   * Approval-gated tool names (TL-8) - excluded from the code API but
   * surfaced in matches with a call-directly marker so the model is
   * never silently missing a capability.
   */
  readonly approvalGatedTools?: ReadonlyArray<string>;
  /**
   * Search the deferred pool for `query`, returning up to `k` matches.
   * Typically `registry.searchDeferred`. Omitted ⇒ eager-only search.
   */
  readonly searchDeferred?: (query: string, k: number) => Promise<ReadonlyArray<CodeSearchMatch>>;
  /** Default match cap when the model passes none. Default 8. */
  readonly defaultK?: number;
  /** Hard cap on matches. Default 25. */
  readonly maxK?: number;
}

const searchInput = z.object({
  query: z.string().min(1).max(512),
  limit: z.number().int().positive().max(25).optional(),
});
/** W-013: explicit interface - no concrete zod generics in the d.ts. */
export interface CodeSearchInput {
  query: string;
  limit?: number | undefined;
}

// W-013 parity gate (compile-time only, erased from the build and the
// d.ts): the explicit interface must stay MUTUALLY assignable with the
// schema's inference - a drifted transcription fails `tsc` right here.
type W013Equals<A, B> = A extends B ? (B extends A ? true : false) : false;
type W013Assert<T extends true> = T;
type _W013Check1 = W013Assert<W013Equals<CodeSearchInput, z.infer<typeof searchInput>>>;
type _W013Check2 = W013Assert<W013Equals<CodeExecuteInput, z.infer<typeof executeInput>>>;

/**
 * Build the `code_search` meta-tool. Returns matching `tools.<name>(…)`
 * signatures as text (eager substring match + the deferred pool).
 *
 * @stable
 */
export function createCodeSearchTool(opts: CodeSearchToolOptions): Tool<CodeSearchInput, string> {
  const defaultK = opts.defaultK ?? 8;
  const maxK = opts.maxK ?? 25;
  return tool<CodeSearchInput, string>({
    name: 'code_search',
    description:
      'Look up the exact call signature (parameters) of tools you can use from code_execute. Pass a tool name or a capability keyword; returns matching `tools.NAME(input: …)` signatures so you can call them correctly in a code_execute script. Use this when you are unsure of a tool name or its arguments.',
    inputSchema: searchInput,
    outputSchema: z.string(),
    sideEffectClass: 'read-only',
    sandboxPolicy: 'none',
    sensitivity: 'internal',
    tags: ['built-in', 'code-mode'],
    async execute(input) {
      const k = Math.min(input.limit ?? defaultK, maxK);
      const eager = opts.projection.search(input.query, k);
      let deferred = '';
      if (opts.searchDeferred !== undefined) {
        const matches = await opts.searchDeferred(input.query, k);
        if (matches.length > 0) {
          deferred = projectToolApi(matches).signaturesFor(matches.map((m) => m.name));
        }
      }
      incrementCounter('tool.code_mode.search.executed.total', undefined);
      // TL-8: gated tools are findable too - with the marker, never silent.
      const gatedMatches = (opts.approvalGatedTools ?? [])
        .filter((name) => name.toLowerCase().includes(input.query.toLowerCase()))
        .map(
          (name) =>
            `${name} - requires approval; call it directly as a normal tool call, not from code_execute`,
        )
        .join('\n');
      const blocks = [eager, deferred, gatedMatches].filter((s) => s.length > 0).join('\n\n');
      return blocks.length > 0
        ? blocks
        : `No tool matches "${input.query}". Tools available in code-mode:\n${opts.projection.catalogue}`;
    },
  });
}

/**
 * Host bridge: run one bridged tool call and return its output. Receives
 * the `code_execute` call's own {@link ToolExecutionContext}, so the agent
 * can route the inner call through the real executor under the same
 * `runContext` (same run / step / tracer / secrets scope).
 */
export type CodeExecuteBridge = (
  call: BridgedToolCall,
  ctx: ToolExecutionContext,
) => Promise<unknown>;

/** Tunable sandbox limits for {@link createCodeExecuteTool}. */
export interface CodeExecuteLimits {
  /** Hard wall-clock timeout (ms) for the whole script. Default 30000. */
  readonly timeoutMs?: number;
  /** Worker memory ceiling (MB). Omitted ⇒ Node default. */
  readonly maxMemoryMb?: number;
  /** Ceiling on bridged tool calls per run. Default 64. */
  readonly maxToolCalls?: number;
}

/** Configuration for {@link createCodeExecuteTool}. */
export interface CodeExecuteToolOptions {
  /** Projection over the eager tool set, embedded in the description. */
  readonly projection: CodeApiProjection;
  /** Names the script may call. Discovered (deferred) names may be added. */
  readonly allowedTools: ReadonlyArray<string>;
  /** Host bridge for each `tools.<name>(args)` call. */
  readonly executeTool: CodeExecuteBridge;
  /** Sandbox limits. */
  readonly limits?: CodeExecuteLimits;
  /** Override the runner (tests inject a fake). Default {@link runBridgedSource}. */
  readonly run?: (o: BridgedSourceOptions) => ReturnType<typeof runBridgedSource>;
  /**
   * Approval-gated tool names (TL-8) - listed in the catalogue with a
   * call-directly marker (they cannot suspend for HITL mid-script).
   */
  readonly approvalGatedTools?: ReadonlyArray<string>;
}

const executeInput = z.object({
  source: z.string().min(1).max(100_000),
});
/** W-013: explicit interface - no concrete zod generics in the d.ts. */
export interface CodeExecuteInput {
  source: string;
}

function buildExecuteDescription(
  projection: CodeApiProjection,
  approvalGatedTools: ReadonlyArray<string> = [],
): string {
  const gatedSection =
    approvalGatedTools.length === 0
      ? []
      : [
          '',
          'NOT callable from code_execute (each requires approval - call it directly as a normal tool call so the run can pause for a human decision):',
          approvalGatedTools.map((name) => `  ${name}`).join('\n'),
        ];
  return [
    'Run a JavaScript snippet that orchestrates several tool calls in a sandbox and returns only the final result. Prefer this over calling tools one at a time when a task needs multiple tool calls whose intermediate outputs you do not need to read: the intermediates stay inside the sandbox and never enter the conversation, so large or numerous results do not consume your context.',
    '',
    'Write the body of an async function. Call a tool with `await tools.NAME(args)` (use `await tools["NAME"](args)` for names containing dots). `return` your final answer - any JSON-serialisable value; only the returned value comes back. Tool arguments and results must be JSON-serialisable. The script runs in an isolated worker thread: network and filesystem access are blocked (best-effort) and host environment variables are not available - `process.env` is empty. The only way to reach the outside world is through the `tools` object.',
    '',
    'Example source:',
    '  const orders = await tools.list_orders({ customerId: "c1" });',
    '  const open = orders.filter((o) => o.status === "open");',
    '  return { openCount: open.length, ids: open.map((o) => o.id) };',
    '',
    'Available tools (call code_search for a tool’s exact parameters):',
    projection.catalogue,
    ...gatedSection,
  ].join('\n');
}

/**
 * Build the `code_execute` meta-tool. Its output is the script's final
 * value rendered as a string, so the executor's `maxResultTokens` /
 * `'spill-to-file'` pipeline bounds even a large final result (WI-10).
 *
 * @stable
 */
export function createCodeExecuteTool(
  opts: CodeExecuteToolOptions,
): Tool<CodeExecuteInput, string> {
  const run = opts.run ?? runBridgedSource;
  const limits = opts.limits ?? {};
  return tool<CodeExecuteInput, string>({
    name: 'code_execute',
    description: buildExecuteDescription(opts.projection, opts.approvalGatedTools ?? []),
    inputSchema: executeInput,
    outputSchema: z.string(),
    // Conservative: a script can call side-effecting tools.
    sideEffectClass: 'side-effecting',
    // The meta-tool runs in-process; the *script* is sandboxed inside.
    sandboxPolicy: 'none',
    sensitivity: 'internal',
    // Bound a large final result via the WI-10 handle pipeline.
    truncationStrategy: 'spill-to-file',
    tags: ['built-in', 'code-mode'],
    async execute(input, ctx) {
      const result = await run({
        source: input.source,
        allowedTools: opts.allowedTools,
        dispatch: (call) => opts.executeTool(call, ctx),
        signal: ctx.signal,
        ...(limits.timeoutMs !== undefined ? { timeoutMs: limits.timeoutMs } : {}),
        ...(limits.maxMemoryMb !== undefined ? { maxMemoryMb: limits.maxMemoryMb } : {}),
        ...(limits.maxToolCalls !== undefined ? { maxToolCalls: limits.maxToolCalls } : {}),
      });
      incrementCounter('tool.code_mode.execute.executed.total', undefined);
      incrementCounter('tool.code_mode.tool_calls.total', undefined, result.toolCalls);
      if (!result.ok) {
        throw new Error(`code_execute failed (${result.error.kind}): ${result.error.message}`);
      }
      const output = result.output;
      return typeof output === 'string' ? output : JSON.stringify(output, null, 2);
    },
  });
}
