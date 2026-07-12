/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Tools-harness tour - library mode. One flow, six stages, fully offline
 * and deterministic (no network, no child processes, no LLM provider):
 *
 *  1. Start an IN-PROCESS MCP server on an `InMemoryTransport` linked
 *     pair, serving three deterministic tools (one returns >100 KB).
 *  2. Connect the MCP client side and bridge the catalogue into a
 *     `createToolRegistry(...)` via the public `adaptMCPTools` path
 *     (`toTools()`), with `truncationStrategy: 'spill-to-file'` and a
 *     small `maxResultTokens` baked onto every adapted tool.
 *  3. Load the bundled `offline-notes` skill folder with the
 *     `@graphorin/skills` loader, show its Tier-1 metadata card, and
 *     register its declared tool through `stampSkillTool(...)`.
 *  4. Register a first-party tool with `defer_loading: true` plus the
 *     built-in `tool_search`, and discover the deferred tool through
 *     `createToolExecutor(...)`.
 *  5. Run one code-mode call: `code_execute` executes a small script in
 *     the sandbox whose `tools.<name>(args)` calls bridge back into the
 *     SAME executor (per-tool sanitization/truncation still apply).
 *  6. Call the large-payload MCP tool so it spills, then page the spill
 *     artifact back via the built-in `read_result` over the same spill
 *     root - within the same `runId`, because spill handles are
 *     run-scoped.
 *
 * Exports `runTour(...)` (returns a {@link TourReport} for tests) and
 * `main()` (prints one line per stage plus the final
 * `tools-harness-tour: OK` summary line and returns an exit code).
 */

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import type { CompletedToolCall, ToolResult } from '@graphorin/core';
import { isMainModule, optionalTracerFromEnv } from '@graphorin/example-trace-helper';
import type { MCPClient } from '@graphorin/mcp';
import {
  createDefaultSpillWriter,
  createFileResultReader,
  createReadResultTool,
  createToolExecutor,
  createToolRegistry,
  createToolSearchTool,
  type ToolExecutor,
  type ToolRegistry,
  tool,
} from '@graphorin/tools';
import {
  type CodeExecuteBridge,
  createCodeExecuteTool,
  createCodeSearchTool,
  type ProjectableTool,
  projectToolApi,
} from '@graphorin/tools/code-mode';
import { z } from 'zod';

/** Canonical version constant, derived from `package.json` at build time. */
import pkg from '../package.json' with { type: 'json' };
import { connectTourMcpClient } from './mcp-client.js';
import { LARGE_PAYLOAD_MIN_BYTES, startTourMcpServer } from './mcp-server.js';
import { makeTourRunContext } from './run-context.js';
import { loadOfflineNotesSkill, readHarnessManualOnDemand } from './skill.js';

export const VERSION: string = pkg.version;

/** Spill handles are scoped to this run id (stage 6 reads under the same id). */
export const TOUR_RUN_ID = 'tour-run';

/** Names the code-mode script must reach through meta-tools, never directly. */
const RESERVED_TOOL_NAMES: ReadonlySet<string> = new Set([
  'tool_search',
  'read_result',
  'code_execute',
  'code_search',
]);

/** Byte cap requested per `read_result` page in stage 6. */
const PAGE_MAX_BYTES = 32_768;

/** Deterministic code-mode script: two bridged tool calls, one small return. */
const CODE_MODE_SOURCE = [
  "const counted = await tools.char_count({ text: 'graphorin tools harness tour' });",
  "const converted = await tools.unit_convert({ value: counted.count, from: 'km', to: 'm' });",
  'return { chars: counted.count, meters: converted.value };',
].join('\n');

/** Options accepted by {@link runTour}. */
export interface TourOptions {
  /** Per-stage summary-line sink. Default: silent (tests). */
  readonly log?: (line: string) => void;
  /** Override the spill artifact root. Default: a fresh temp dir, removed on exit. */
  readonly spillRoot?: string;
}

/** Everything the tour observed - the smoke test asserts on this. */
export interface TourReport {
  readonly mcpServerToolCount: number;
  readonly mcpAdaptedCount: number;
  readonly toolsRegistered: number;
  readonly deferredCount: number;
  readonly lookupOutput: string;
  readonly skillName: string;
  readonly skillTrustLevel: string;
  readonly skillToolName: string;
  readonly noteOutput: string;
  readonly searchHits: ReadonlyArray<string>;
  readonly codeChars: number;
  readonly codeMeters: number;
  readonly spillHandle: string;
  readonly spillBytes: number;
  readonly firstPageBytes: number;
  readonly pagesRead: number;
  readonly pagedBytesTotal: number;
  readonly finalLine: string;
}

/** Narrow a completed call to its success outcome or throw with context. */
function expectOk(completed: CompletedToolCall): ToolResult {
  const outcome = completed.outcome;
  if ('kind' in outcome) {
    throw new Error(`tool '${outcome.toolName}' failed (${outcome.kind}): ${outcome.message}`);
  }
  return outcome;
}

/** Render a tool output the way the sanitize/truncate pipeline would. */
function asText(output: unknown): string {
  return typeof output === 'string' ? output : JSON.stringify(output);
}

/** Extract the deferred-tool names from a `tool_search` output. */
function extractSearchHits(output: unknown): ReadonlyArray<string> {
  if (typeof output !== 'object' || output === null) return [];
  const matches = (output as { readonly matches?: unknown }).matches;
  if (!Array.isArray(matches)) return [];
  return matches
    .map((match) => (match as { readonly name?: unknown } | null)?.name)
    .filter((name): name is string => typeof name === 'string');
}

/**
 * Extract a top-level numeric field from a JSON body that may be wrapped
 * in the untrusted-content envelope (the read_result output of a tainted
 * handle read comes back as a wrapped JSON string; quotes inside the
 * `content` string value are escaped, so the first literal `"<key>":<n>`
 * is always the object's own field).
 */
function extractJsonNumber(body: string, key: string): number | undefined {
  const match = new RegExp(`"${key}":\\s*(\\d+)`).exec(body);
  if (match?.[1] === undefined) return undefined;
  return Number.parseInt(match[1], 10);
}

/** First-party tools for the defer-loading and code-mode stages. */
function buildFirstPartyTools() {
  const unitConvert = tool<
    { value: number; from: 'km' | 'm'; to: 'km' | 'm' },
    { value: number; unit: string }
  >({
    name: 'unit_convert',
    description:
      'Convert a numeric length value between kilometers and meters (km, m). Deterministic arithmetic, no I/O.',
    inputSchema: z.object({
      value: z.number(),
      from: z.enum(['km', 'm']),
      to: z.enum(['km', 'm']),
    }),
    outputSchema: z.object({ value: z.number(), unit: z.string() }),
    sideEffectClass: 'pure',
    // Stage 4: kept OUT of the per-step catalogue until tool_search finds it.
    defer_loading: true,
    async execute(input) {
      const meters = input.from === 'km' ? input.value * 1000 : input.value;
      return { value: input.to === 'km' ? meters / 1000 : meters, unit: input.to };
    },
  });
  const charCount = tool<{ text: string }, { count: number }>({
    name: 'char_count',
    description: 'Count the characters of a string. Deterministic, no I/O.',
    inputSchema: z.object({ text: z.string() }),
    outputSchema: z.object({ count: z.number() }),
    sideEffectClass: 'pure',
    async execute(input) {
      return { count: input.text.length };
    },
  });
  return { unitConvert, charCount };
}

/**
 * Register the two code-mode meta-tools, mirroring the agent runtime's
 * wiring: the projection covers EAGER tools only (progressive
 * disclosure), `code_search` folds in deferred matches on demand, and
 * every in-script `tools.<name>(args)` call routes back through
 * `executor.executeOne(...)` so per-tool ACL / sanitization / truncation
 * still apply.
 */
function registerCodeModeTools(registry: ToolRegistry, executor: ToolExecutor): void {
  const codeTools = registry.list().filter((entry) => !RESERVED_TOOL_NAMES.has(entry.name));
  const eagerProjectable: ReadonlyArray<ProjectableTool> = codeTools.filter(
    (entry) => entry.__effectiveDeferLoading !== true,
  );
  const projection = projectToolApi(eagerProjectable);
  const allowedTools = codeTools.map((entry) => entry.name);

  let bridgedCalls = 0;
  const executeTool: CodeExecuteBridge = async (call, ctx) => {
    bridgedCalls += 1;
    const completed = await executor.executeOne({
      call: { toolCallId: `codecall-${bridgedCalls}`, toolName: call.name, args: call.args },
      runContext: ctx.runContext,
      stepNumber: ctx.runContext.stepNumber,
    });
    const outcome = completed.outcome;
    if ('kind' in outcome) throw new Error(`${call.name}: ${outcome.message}`);
    return outcome.output;
  };

  registry.register(
    createCodeSearchTool({
      projection,
      searchDeferred: (query, k) => registry.searchDeferred(query, k),
    }),
    { kind: 'built-in', subsystem: 'code-mode' },
  );
  registry.register(createCodeExecuteTool({ projection, allowedTools, executeTool }), {
    kind: 'built-in',
    subsystem: 'code-mode',
  });
}

/**
 * Run the six-stage tour. Fully offline; throws on the first broken
 * invariant so the caller sees a non-zero exit instead of a wrong OK.
 */
export async function runTour(options: TourOptions = {}): Promise<TourReport> {
  const log = options.log ?? ((): void => {});
  const tracer = optionalTracerFromEnv(process.env);

  // Stage 1 - the in-process MCP server (linked-pair transport, no wire).
  const server = await startTourMcpServer();
  const spillRoot =
    options.spillRoot ?? (await fs.mkdtemp(path.join(os.tmpdir(), 'graphorin-tour-spill-')));
  const ownsSpillRoot = options.spillRoot === undefined;
  let client: MCPClient | undefined;
  try {
    log(
      `[1/6] mcp-server: ${server.toolCount} deterministic tools on an in-memory linked-pair transport (large payload ${server.largePayloadBytes} bytes)`,
    );

    // Stage 2 - MCP client -> toTools() -> registry. The per-server
    // options bake the WI-10 spill pipeline onto every adapted tool.
    client = await connectTourMcpClient({
      transport: server.clientTransport,
      serverInfoName: 'tour-mcp',
    });
    const registry = createToolRegistry();
    const mcpTools = await client.toTools({
      maxResultTokens: 256,
      truncationStrategy: 'spill-to-file',
    });
    for (const adapted of mcpTools) {
      registry.register(adapted, { kind: 'mcp', serverIdentity: client.id });
    }

    // Stage 3 wiring - skill folder -> declared tool -> stamped registration.
    const { skill, stamped } = await loadOfflineNotesSkill();
    registry.register(stamped.tool, stamped.source);

    // Stage 4 wiring - a deferred first-party tool + the code-mode helper.
    const { unitConvert, charCount } = buildFirstPartyTools();
    registry.register(unitConvert);
    registry.register(charCount);

    // Resolve cross-source name collisions (none expected here) exactly
    // like the agent runtime does before wiring the built-ins.
    registry.assertNoDuplicates('auto-prefix', { source: { kind: 'first-party' } });

    // Built-ins: tool_search (the registry holds a deferred pool) and
    // read_result over the SAME artifact root the spill writer uses.
    if (registry.listDeferred().length > 0 && registry.get('tool_search') === undefined) {
      registry.register(createToolSearchTool({ registry }), {
        kind: 'built-in',
        subsystem: 'tool-discovery',
      });
    }
    const spill = createDefaultSpillWriter({ root: spillRoot, startupSweepTtlMs: false });
    const reader = createFileResultReader({ artifactRoot: spillRoot });
    registry.register(createReadResultTool({ reader }), {
      kind: 'built-in',
      subsystem: 'result-handle',
    });

    // The executor resolves tools at call time, so registering the
    // code-mode meta-tools after construction is fine (agent parity).
    const executor = createToolExecutor({ registry, spill, imperativeBudgetMs: 250 });
    registerCodeModeTools(registry, executor);

    const deferredCount = registry.listDeferred().length;
    const runContext = makeTourRunContext({
      runId: TOUR_RUN_ID,
      ...(tracer === undefined ? {} : { tracer }),
    });

    let step = 0;
    const runOne = async (toolName: string, args: unknown): Promise<ToolResult> => {
      step += 1;
      return expectOk(
        await executor.executeOne({
          call: { toolCallId: `call-${step}-${toolName}`, toolName, args },
          runContext,
          stepNumber: step,
        }),
      );
    };

    // Stage 2 demo - one MCP round-trip through the executor. The output
    // arrives wrapped in the untrusted-content envelope (mcp-derived).
    const lookup = await runOne('lookup_city', { id: 'kyiv' });
    const lookupOutput = asText(lookup.output);
    if (!lookupOutput.includes('Kyiv')) {
      throw new Error('lookup_city did not return the Kyiv record.');
    }
    log(
      `[2/6] mcp-client: adapted ${mcpTools.length} tools via toTools() (server='${client.id}'); lookup_city('kyiv') returned ${lookupOutput.length} chars (untrusted-wrapped)`,
    );

    // Stage 3 demo - metadata card + one call to the skill-declared tool.
    const note = await runOne('note_lookup', { topic: 'spill' });
    const noteOutput = asText(note.output);
    if (!noteOutput.includes('run-scoped')) {
      throw new Error('note_lookup did not return the bundled spill note.');
    }
    // C6 skill pattern - README on demand: the listing is lazy (zero
    // bytes read); the manual body loads only at readText().
    const manual = await readHarnessManualOnDemand(skill);
    if (!manual.includes('loaded on demand')) {
      throw new Error('resources/MANUAL.md did not load through the lazy resource accessor.');
    }
    log(
      `[3/6] skill: '${skill.metadata.name}' (trust=${skill.metadata.graphorinTrustLevel}, declared tools=${skill.toolDeclarations().length}, description=${JSON.stringify(firstLine(skill.metadata.description))}); registered '${stamped.tool.name}'; manual read on demand (${manual.length} chars via Skill.resources)`,
    );

    // Stage 4 - discover the deferred tool through the executor.
    const search = await runOne('tool_search', { query: 'convert kilometers to meters' });
    const searchHits = extractSearchHits(search.output);
    if (!searchHits.includes('unit_convert')) {
      throw new Error(
        `tool_search did not surface the deferred 'unit_convert' tool (hits: ${searchHits.join(', ') || 'none'}).`,
      );
    }
    log(
      `[4/6] tool_search: 'convert kilometers to meters' -> ${searchHits.length} deferred hit(s): ${searchHits.join(', ')}`,
    );

    // Stage 5 - one code-mode call; intermediates stay in the sandbox.
    const code = await runOne('code_execute', { source: CODE_MODE_SOURCE });
    const codeParsed = JSON.parse(asText(code.output)) as {
      readonly chars?: unknown;
      readonly meters?: unknown;
    };
    const codeChars = typeof codeParsed.chars === 'number' ? codeParsed.chars : Number.NaN;
    const codeMeters = typeof codeParsed.meters === 'number' ? codeParsed.meters : Number.NaN;
    if (codeChars !== 28 || codeMeters !== 28_000) {
      throw new Error(
        `code_execute returned unexpected values (chars=${codeChars}, meters=${codeMeters}).`,
      );
    }
    log(
      `[5/6] code-mode: sandboxed script bridged 2 tool calls -> chars=${codeChars}, meters=${codeMeters}`,
    );

    // Stage 6 - spill the large MCP payload, then page it back via
    // read_result under the SAME runId (spill handles are run-scoped).
    const atlas = await runOne('render_atlas', {});
    const handle = atlas.resultHandle;
    if (handle === undefined) {
      throw new Error('render_atlas did not spill - no resultHandle on the outcome.');
    }
    const spillBytes = handle.bytes ?? 0;
    if (spillBytes <= LARGE_PAYLOAD_MIN_BYTES) {
      throw new Error(`spilled artifact is only ${spillBytes} bytes - expected > 100 KB.`);
    }
    if (handle.producerTrustClass !== 'mcp-derived') {
      throw new Error(
        `spill handle lost its producer taint (got '${handle.producerTrustClass ?? 'none'}').`,
      );
    }

    let offset = 0;
    let pagesRead = 0;
    let firstPageBytes = 0;
    let pagedBytesTotal = 0;
    while (pagesRead < 12) {
      const page = await runOne('read_result', {
        handle: handle.uri,
        offset,
        maxBytes: PAGE_MAX_BYTES,
      });
      const pageText = asText(page.output);
      const bytes = extractJsonNumber(pageText, 'bytes');
      if (bytes === undefined || bytes <= 0) {
        throw new Error('read_result returned an empty page.');
      }
      pagesRead += 1;
      pagedBytesTotal += bytes;
      if (pagesRead === 1) {
        firstPageBytes = bytes;
        if (!pageText.includes('atlas row 0000')) {
          throw new Error('first read_result page does not contain the atlas payload head.');
        }
      }
      offset += bytes;
      if (/"eof":\s*true/.test(pageText)) break;
    }
    if (pagedBytesTotal !== spillBytes) {
      throw new Error(
        `paged bytes (${pagedBytesTotal}) do not add up to the spilled artifact (${spillBytes}).`,
      );
    }
    log(
      `[6/6] spill: handle ${handle.uri} (${spillBytes} bytes spilled); read_result paged it back in ${pagesRead} page(s), first page ${firstPageBytes} bytes`,
    );

    const finalLine =
      `graphorin v${VERSION} tools-harness-tour: OK - ` +
      `tools=${registry.size()} deferred=${deferredCount} searchHits=${searchHits.length} ` +
      `spillBytes=${spillBytes} pagesRead=${pagesRead}`;

    return {
      mcpServerToolCount: server.toolCount,
      mcpAdaptedCount: mcpTools.length,
      toolsRegistered: registry.size(),
      deferredCount,
      lookupOutput,
      skillName: skill.metadata.name,
      skillTrustLevel: skill.metadata.graphorinTrustLevel,
      skillToolName: stamped.tool.name,
      noteOutput,
      searchHits,
      codeChars,
      codeMeters,
      spillHandle: handle.uri,
      spillBytes,
      firstPageBytes,
      pagesRead,
      pagedBytesTotal,
      finalLine,
    };
  } finally {
    if (client !== undefined) await client.close().catch(() => {});
    await server.close().catch(() => {});
    if (ownsSpillRoot) await fs.rm(spillRoot, { recursive: true, force: true }).catch(() => {});
  }
}

/** First line of a (possibly multi-line) skill description. */
function firstLine(text: string): string {
  const line = text.split('\n', 1)[0] ?? '';
  return line.trim();
}

/**
 * CLI entry point: run the tour, print one summary line per stage plus
 * the final `tools-harness-tour: OK` line, and return the exit code.
 */
export async function main(): Promise<number> {
  try {
    const report = await runTour({ log: (line) => process.stdout.write(`${line}\n`) });
    process.stdout.write(`${report.finalLine}\n`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`tools-harness-tour: FAILED - ${message}\n`);
    return 1;
  }
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const exitCode = await main();
  if (exitCode !== 0) process.exit(exitCode);
}
