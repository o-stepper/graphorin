/**
 * Warm-up tool wiring for the agent runtime: registration of the
 * built-in `tool_search` / `read_result` tools, code-mode meta-tool
 * wiring, result-reader composition, and the `tool_search` promotion
 * fold. Extracted verbatim from `factory.ts` (issue #23).
 *
 * @packageDocumentation
 */

import type { Tool } from '@graphorin/core';
import type { CodeModeRunner } from '@graphorin/security/sandbox';
import { createReadResultTool, createToolSearchTool } from '@graphorin/tools/built-in';
import {
  type CodeExecuteBridge,
  type CodeExecuteLimits,
  createCodeExecuteTool,
  createCodeSearchTool,
  type ProjectableTool,
  projectToolApi,
} from '@graphorin/tools/code-mode';
import type { ToolExecutor } from '@graphorin/tools/executor';
import type { ToolRegistry } from '@graphorin/tools/registry';
import type { ResultReader } from '@graphorin/tools/result';
import { newId } from '../internal/ids.js';

/** The built-in deferred-discovery tool's stable name. */
export const TOOL_SEARCH_NAME = 'tool_search';

/**
 * Register the built-in `tool_search` into `registry` when - and only
 * when - the registry holds at least one deferred tool
 * (`defer_loading: true`). `tool_search` is itself eager (so it is
 * always advertised while a deferred pool exists) and resolvable by the
 * executor like any other tool, so a model can both *see* it in the
 * per-step catalogue and *call* it.
 *
 * No-op when nothing defers (zero overhead - the tool never appears) or
 * when a user tool already occupies the name (the user's tool wins; we
 * never clobber it). Because deferral is decided at registration time
 * (`normaliseTool`), the deferred set is fixed for the life of the
 * registry - this runs once per registry, not per step.
 */
export function registerToolSearch(
  registry: ToolRegistry,
  availability?: 'next-step' | 'next-run',
  excludeTool?: (toolName: string) => boolean,
): void {
  if (registry.listDeferred().length === 0) return;
  if (registry.get(TOOL_SEARCH_NAME) !== undefined) return;
  registry.register(
    createToolSearchTool({
      registry,
      ...(availability !== undefined ? { availability } : {}),
      // E1 deny-by-name: a name-denied deferred tool must be neither
      // discoverable nor promotable - its name/schema would leak while
      // execution stays blocked.
      ...(excludeTool !== undefined ? { excludeTool } : {}),
    }),
    {
      kind: 'built-in',
      subsystem: 'tool-discovery',
    },
  );
}

/** The built-in result-handle reader tool's stable name. */
export const READ_RESULT_NAME = 'read_result';

/**
 * Register the built-in `read_result` into `registry` when at least one
 * registered tool opts into the `'spill-to-file'` truncation strategy
 * (the sole producer of spill handles today) - or when `force` is set,
 * which the agent passes when an operator wires external result readers
 * (e.g. an MCP `resource_link` reader). The tool is eager, so it
 * is advertised alongside the producing tool and the model can fetch a
 * handle back on demand instead of inlining the full blob. No-op when
 * nothing produces handles (zero overhead) or when a user tool already
 * occupies the name (the user's tool wins).
 */
export function registerReadResult(
  registry: ToolRegistry,
  reader: ResultReader,
  opts?: { readonly force?: boolean },
): void {
  if (
    opts?.force !== true &&
    !registry.list().some((entry) => entry.truncationStrategy === 'spill-to-file')
  ) {
    return;
  }
  if (registry.get(READ_RESULT_NAME) !== undefined) return;
  registry.register(createReadResultTool({ reader }), {
    kind: 'built-in',
    subsystem: 'result-handle',
  });
}

/**
 * Compose result readers into one that tries each in order, returning
 * the first that resolves the handle. The spill-file reader is
 * placed first so `graphorin-spill:` handles resolve locally; operator
 * readers (e.g. an MCP resource reader) resolve the rest. Each reader
 * rejects handles it does not own, so resolution falls through cleanly.
 */
export function composeResultReaders(readers: ReadonlyArray<ResultReader>): ResultReader {
  return {
    async read(uri, range) {
      let lastError: unknown;
      for (const r of readers) {
        try {
          return await r.read(uri, range);
        } catch (err) {
          lastError = err;
        }
      }
      throw lastError instanceof Error
        ? lastError
        : new Error(`No result reader resolved handle ${JSON.stringify(uri)}.`);
    },
  };
}

/** The code-mode meta-tools' stable names. */
export const CODE_EXECUTE_NAME = 'code_execute';
export const CODE_SEARCH_NAME = 'code_search';

/** Structural check: is this tool approval-gated (static or predicate form)? */
export const isApprovalGated = (t: { readonly needsApproval?: unknown }): boolean =>
  t.needsApproval === true || typeof t.needsApproval === 'function';

/**
 * Wire code-mode into `registry`: register the `code_search` /
 * `code_execute` meta-tools and return them as the tools to advertise in
 * place of the full catalogue. The model reaches every other tool through
 * `code_execute`, whose in-script `tools.<name>(args)` calls route back
 * through `quietExecutor.executeOne(...)` under the calling step's
 * `runContext` - so per-tool ACL / sanitization / truncation still apply,
 * exactly as in direct mode. `quietExecutor` carries no `streamingSink`,
 * so the inner calls do not interleave `tool.execute.*` events into the
 * outer stream.
 *
 * Excluded from the code API (`reservedNames`): the meta-tools, the
 * discovery / handle built-ins, handoff tools (which stay first-class
 * provider tools), and - supplied by the caller - any approval-gated
 * tool, since code-mode has no durable-HITL path to suspend mid-script.
 *
 * Returns `[]` (registering nothing) when no real tool is exposable.
 */
export function registerCodeMode(
  registry: ToolRegistry,
  quietExecutor: ToolExecutor,
  reservedNames: ReadonlySet<string>,
  getRunCapability?: () => 'read-only' | undefined,
  codeMode?: {
    readonly run?: CodeModeRunner;
    readonly limits?: CodeExecuteLimits;
  },
): ReadonlyArray<Tool<unknown, unknown, unknown>> {
  if (registry.get(CODE_EXECUTE_NAME) !== undefined) return []; // already wired
  const codeTools = registry
    .list()
    .filter((entry) => !reservedNames.has(entry.name) && !isApprovalGated(entry));
  if (codeTools.length === 0) return [];

  // TL-8: gated tools cannot suspend for HITL mid-script, so they are
  // excluded from the code API - but VISIBLY: they appear in the
  // catalogue/search with a call-directly marker, and a bridged call
  // fails with the same hint instead of an opaque unknown-tool error.
  const approvalGatedTools = registry
    .list()
    .filter((entry) => !reservedNames.has(entry.name) && isApprovalGated(entry))
    .map((entry) => entry.name);
  const approvalGatedSet = new Set(approvalGatedTools);

  const allowedTools = [...codeTools.map((entry) => entry.name), ...approvalGatedTools];
  const allowedSet = new Set(codeTools.map((entry) => entry.name));
  const eagerProjectable = codeTools.filter(
    (entry) => entry.__effectiveDeferLoading !== true,
  ) as unknown as ReadonlyArray<ProjectableTool>;
  const projection = projectToolApi(eagerProjectable);

  const executeTool: CodeExecuteBridge = async (call, ctx) => {
    if (approvalGatedSet.has(call.name)) {
      throw new Error(
        `${call.name} requires human approval and cannot run inside code_execute - call it directly as a standalone tool call so the run can suspend for the approval.`,
      );
    }
    const runCapability = getRunCapability?.();
    const completed = await quietExecutor.executeOne({
      call: { toolCallId: newId('codecall'), toolName: call.name, args: call.args },
      runContext: ctx.runContext,
      stepNumber: ctx.runContext.stepNumber,
      // D2: in-script calls inherit the active run's capability.
      ...(runCapability !== undefined ? { capability: runCapability } : {}),
    });
    const { outcome } = completed;
    if ('kind' in outcome) throw new Error(`${call.name}: ${outcome.message}`);
    return outcome.output;
  };

  const codeSearch = createCodeSearchTool({
    projection,
    approvalGatedTools,
    searchDeferred: async (query, k) =>
      (await registry.searchDeferred(query, k)).filter((match) => allowedSet.has(match.name)),
  });
  // E3: the caller-chosen runtime + limits ride into the meta-tool; the
  // default stays the in-process worker runner.
  const codeExecute = createCodeExecuteTool({
    projection,
    allowedTools,
    executeTool,
    approvalGatedTools,
    ...(codeMode?.run !== undefined ? { run: codeMode.run } : {}),
    ...(codeMode?.limits !== undefined ? { limits: codeMode.limits } : {}),
  });
  registry.register(codeSearch, { kind: 'built-in', subsystem: 'code-mode' });
  registry.register(codeExecute, { kind: 'built-in', subsystem: 'code-mode' });
  return [codeSearch, codeExecute] as ReadonlyArray<Tool<unknown, unknown, unknown>>;
}

/**
 * Fold a completed `tool_search` result into the per-run promotion set:
 * every matched tool name becomes advertised (and thus callable) on the
 * next step. Tolerant of unexpected shapes (e.g. a user-shadowed
 * `tool_search`) - only string `name`s inside a `matches` array promote.
 */
export function recordToolSearchPromotions(output: unknown, promoted: Set<string>): void {
  if (typeof output !== 'object' || output === null) return;
  const matches = (output as { readonly matches?: unknown }).matches;
  if (!Array.isArray(matches)) return;
  for (const match of matches) {
    const name = (match as { readonly name?: unknown } | null)?.name;
    if (typeof name === 'string') promoted.add(name);
  }
}
