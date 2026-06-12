/**
 * `createAgent({...})` — the agent factory entry point.
 *
 * Wires the typed `model -> tool calls -> model` loop, the streamed
 * event surface, the steering / followUp queues, durable HITL via
 * `RunState`, the multi-agent handoff layer, the agent-level model
 * fallback chain, and the per-tool preferred-model resolution.
 *
 * Custom adapters override behaviour by supplying alternative
 * `Provider` / `Memory` / `CheckpointStore` instances; the loop
 * never reaches into adapter internals.
 *
 * @packageDocumentation
 */

import { createHash } from 'node:crypto';
import type {
  AgentEvent,
  AgentResult,
  AssistantMessage,
  CompletedToolCall,
  HandoffRecord,
  Message,
  MessageContent,
  ModelSpec,
  Provider,
  ProviderError,
  ProviderEvent,
  ProviderRequest,
  ReasoningContent,
  ReasoningRetention,
  RunContext,
  RunState,
  RunStep,
  Sensitivity,
  Tool,
  ToolApproval,
  ToolCall,
  ToolChoice,
  ToolDefinition,
  ToolDefinitionExample,
  ToolExecutionContext,
  Usage,
} from '@graphorin/core';
import { isStepCount, NOOP_LOGGER, NOOP_TRACER, zeroUsage } from '@graphorin/core';
import type { Memory } from '@graphorin/memory';
import { createReadResultTool, createToolSearchTool } from '@graphorin/tools/built-in';
import {
  type CodeExecuteBridge,
  createCodeExecuteTool,
  createCodeSearchTool,
  type ProjectableTool,
  projectToolApi,
} from '@graphorin/tools/code-mode';
import {
  createToolExecutor,
  type ExecutorOptions,
  type ToolExecutor,
} from '@graphorin/tools/executor';
import type { ToolRegistry } from '@graphorin/tools/registry';
import {
  createDefaultSpillWriter,
  createFileResultReader,
  type ResultReader,
} from '@graphorin/tools/result';
import {
  AgentRuntimeError,
  InvalidAgentConfigError,
  InvalidPreferredModelError,
  MultipleHandoffsInStepError,
  ToolNotFoundError,
} from './errors/index.js';
import { type AgentFallbackPolicy, isAgentFallbackEligible } from './fallback/index.js';
import {
  type FanOutResult,
  type FanOutOptions as RunFanOutOptions,
  runFanOut,
} from './fanout/index.js';
import { type DescribedFilter, filters as filterLib } from './filters/index.js';
import { newId } from './internal/ids.js';
import { InMemoryUsageAccumulator } from './internal/usage-accumulator.js';
import { CausalityMonitor } from './lateral-leak/causality-monitor.js';
import { type PreferredModelResolution, resolvePreferredModel } from './preferred-model/index.js';
import {
  createProgressIO,
  type ProgressIO,
  type ProgressReadOptions,
  type ProgressWriteOptions,
} from './progress/index.js';
import { addModelUsage, createInitialRunState } from './run-state/index.js';
import {
  buildMemoryGuard,
  buildSecretResolver,
  buildToolTokenCounter,
  createExecutorEventBridge,
  type ExecutorEventBridge,
} from './tooling/adapters.js';
import { buildDataFlowGuard } from './tooling/dataflow.js';
import { buildToolRegistry } from './tooling/registry-build.js';
import type {
  AbortOptions,
  Agent,
  AgentCallOptions,
  AgentConfig,
  AgentFanOutOptions,
  AgentInput,
  AgentProgressIO,
  AgentToToolOptions,
  CompactionApiResult,
  CompactOptions,
} from './types.js';

const sha256Hex = (input: string): string =>
  createHash('sha256').update(input, 'utf8').digest('hex');

const HANDOFF_TOOL_PREFIX = 'transfer_to_';

/** The built-in deferred-discovery tool's stable name (WI-05 / P0-3). */
const TOOL_SEARCH_NAME = 'tool_search';

/**
 * Register the built-in `tool_search` into `registry` when — and only
 * when — the registry holds at least one deferred tool
 * (`defer_loading: true`). `tool_search` is itself eager (so it is
 * always advertised while a deferred pool exists) and resolvable by the
 * executor like any other tool, so a model can both *see* it in the
 * per-step catalogue and *call* it.
 *
 * No-op when nothing defers (zero overhead — the tool never appears) or
 * when a user tool already occupies the name (the user's tool wins; we
 * never clobber it). Because deferral is decided at registration time
 * (`normaliseTool`), the deferred set is fixed for the life of the
 * registry — this runs once per registry, not per step.
 */
function registerToolSearch(registry: ToolRegistry): void {
  if (registry.listDeferred().length === 0) return;
  if (registry.get(TOOL_SEARCH_NAME) !== undefined) return;
  registry.register(createToolSearchTool({ registry }), {
    kind: 'built-in',
    subsystem: 'tool-discovery',
  });
}

/** The built-in result-handle reader tool's stable name (WI-10 / P1-4). */
const READ_RESULT_NAME = 'read_result';

/**
 * Register the built-in `read_result` into `registry` when at least one
 * registered tool opts into the `'spill-to-file'` truncation strategy
 * (the sole producer of spill handles today) — or when `force` is set,
 * which the agent passes when an operator wires external result readers
 * (e.g. an MCP `resource_link` reader; WI-13). The tool is eager, so it
 * is advertised alongside the producing tool and the model can fetch a
 * handle back on demand instead of inlining the full blob. No-op when
 * nothing produces handles (zero overhead) or when a user tool already
 * occupies the name (the user's tool wins).
 */
function registerReadResult(
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
 * the first that resolves the handle (WI-13). The spill-file reader is
 * placed first so `graphorin-spill:` handles resolve locally; operator
 * readers (e.g. an MCP resource reader) resolve the rest. Each reader
 * rejects handles it does not own, so resolution falls through cleanly.
 */
function composeResultReaders(readers: ReadonlyArray<ResultReader>): ResultReader {
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

/** The code-mode meta-tools' stable names (WI-11 / P1-2). */
const CODE_EXECUTE_NAME = 'code_execute';
const CODE_SEARCH_NAME = 'code_search';

/**
 * Wire code-mode (P1-2) into `registry`: register the `code_search` /
 * `code_execute` meta-tools and return them as the tools to advertise in
 * place of the full catalogue. The model reaches every other tool through
 * `code_execute`, whose in-script `tools.<name>(args)` calls route back
 * through `quietExecutor.executeOne(...)` under the calling step's
 * `runContext` — so per-tool ACL / sanitization / truncation still apply,
 * exactly as in direct mode. `quietExecutor` carries no `streamingSink`,
 * so the inner calls do not interleave `tool.execute.*` events into the
 * outer stream.
 *
 * Excluded from the code API (`reservedNames`): the meta-tools, the
 * discovery / handle built-ins, handoff tools (which stay first-class
 * provider tools), and — supplied by the caller — any approval-gated
 * tool, since code-mode has no durable-HITL path to suspend mid-script.
 *
 * Returns `[]` (registering nothing) when no real tool is exposable.
 */
function registerCodeMode(
  registry: ToolRegistry,
  quietExecutor: ToolExecutor,
  reservedNames: ReadonlySet<string>,
): ReadonlyArray<Tool<unknown, unknown, unknown>> {
  if (registry.get(CODE_EXECUTE_NAME) !== undefined) return []; // already wired
  const isApprovalGated = (t: { readonly needsApproval?: unknown }): boolean =>
    t.needsApproval === true || typeof t.needsApproval === 'function';
  const codeTools = registry
    .list()
    .filter((entry) => !reservedNames.has(entry.name) && !isApprovalGated(entry));
  if (codeTools.length === 0) return [];

  const allowedTools = codeTools.map((entry) => entry.name);
  const allowedSet = new Set(allowedTools);
  const eagerProjectable = codeTools.filter(
    (entry) => entry.__effectiveDeferLoading !== true,
  ) as unknown as ReadonlyArray<ProjectableTool>;
  const projection = projectToolApi(eagerProjectable);

  const executeTool: CodeExecuteBridge = async (call, ctx) => {
    const completed = await quietExecutor.executeOne({
      call: { toolCallId: newId('codecall'), toolName: call.name, args: call.args },
      runContext: ctx.runContext,
      stepNumber: ctx.runContext.stepNumber,
    });
    const { outcome } = completed;
    if ('kind' in outcome) throw new Error(`${call.name}: ${outcome.message}`);
    return outcome.output;
  };

  const codeSearch = createCodeSearchTool({
    projection,
    searchDeferred: async (query, k) =>
      (await registry.searchDeferred(query, k)).filter((match) => allowedSet.has(match.name)),
  });
  const codeExecute = createCodeExecuteTool({ projection, allowedTools, executeTool });
  registry.register(codeSearch, { kind: 'built-in', subsystem: 'code-mode' });
  registry.register(codeExecute, { kind: 'built-in', subsystem: 'code-mode' });
  return [codeSearch, codeExecute] as ReadonlyArray<Tool<unknown, unknown, unknown>>;
}

/**
 * Fold a completed `tool_search` result into the per-run promotion set:
 * every matched tool name becomes advertised (and thus callable) on the
 * next step. Tolerant of unexpected shapes (e.g. a user-shadowed
 * `tool_search`) — only string `name`s inside a `matches` array promote.
 */
function recordToolSearchPromotions(output: unknown, promoted: Set<string>): void {
  if (typeof output !== 'object' || output === null) return;
  const matches = (output as { readonly matches?: unknown }).matches;
  if (!Array.isArray(matches)) return;
  for (const match of matches) {
    const name = (match as { readonly name?: unknown } | null)?.name;
    if (typeof name === 'string') promoted.add(name);
  }
}

/**
 * Internal mutable view of {@link RunState}. The public type marks
 * most fields `readonly` to guard against accidental mutation by
 * consumers; the runtime owns the lifecycle and writes through
 * this view.
 */
interface MutableRunState {
  status: RunState['status'];
  currentAgentId: string;
  readonly steps: RunStep[];
  readonly messages: Message[];
  readonly pendingApprovals: ToolApproval[];
  readonly handoffs: HandoffRecord[];
  usage: Usage;
  error?: RunState['error'];
  finishedAt?: string;
  usageByModel?: RunState['usageByModel'];
}

interface InternalRunSnapshot<TOutput> {
  output: TOutput;
}

function isModelHintLike(value: unknown): boolean {
  return value === 'fast' || value === 'balanced' || value === 'smart';
}

function isModelSpecLike(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.modelId === 'string' && typeof v.name === 'string') return true;
  if (typeof v.provider === 'object' && v.provider !== null && typeof v.model === 'string') {
    return true;
  }
  return false;
}

function validatePreferredModel(value: unknown): void {
  if (value === undefined) return;
  if (isModelHintLike(value)) return;
  if (isModelSpecLike(value)) return;
  throw new InvalidPreferredModelError(value);
}

function isMessageObject(value: unknown): value is Message {
  if (typeof value !== 'object' || value === null) return false;
  const role = (value as { role?: unknown }).role;
  return role === 'system' || role === 'user' || role === 'assistant' || role === 'tool';
}

function isRunStateObject(value: unknown): value is RunState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.agentId === 'string' &&
    Array.isArray(v.messages) &&
    Array.isArray(v.steps)
  );
}

function asMessages(input: AgentInput | RunState): {
  readonly seed: Message[];
  readonly resumed?: RunState;
} {
  if (typeof input === 'string') {
    return { seed: [{ role: 'user', content: input }] };
  }
  if (Array.isArray(input)) {
    return { seed: [...input] as Message[] };
  }
  if (isMessageObject(input)) {
    return { seed: [input] };
  }
  if (isRunStateObject(input)) {
    return { seed: [], resumed: input };
  }
  throw new InvalidAgentConfigError(`unrecognized AgentInput shape`);
}

/** Most-recent user-role text in `messages` (for context-engine auto-recall). */
function lastUserText(messages: ReadonlyArray<Message>): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role !== 'user') continue;
    if (typeof m.content === 'string') return m.content;
    const text = m.content
      .filter((p): p is { readonly type: 'text'; readonly text: string } => p.type === 'text')
      .map((p) => p.text)
      .join(' ');
    return text.length > 0 ? text : undefined;
  }
  return undefined;
}

function toolToDefinition(tool: Tool): ToolDefinition {
  const ts = tool as Tool & { readonly inputSchema?: { readonly toJSON?: () => unknown } };
  let schema: Readonly<Record<string, unknown>> = {};
  const raw = ts.inputSchema as unknown;
  const tj = (raw as { toJSON?: () => unknown }).toJSON;
  if (typeof tj === 'function') {
    schema = tj.call(raw) as Readonly<Record<string, unknown>>;
  } else if (raw && typeof raw === 'object') {
    schema = raw as Readonly<Record<string, unknown>>;
  }
  const examples = renderToolExamples(tool);
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: schema,
    ...(examples !== undefined ? { examples } : {}),
  };
}

/**
 * Project a tool's worked `examples` onto the provider wire contract
 * (WI-06 / P2-3). Examples are rendered only when the tool eagerly
 * renders them: the registry resolves the `defer_loading` auto-rule into
 * `examplesEagerlyRendered`, so a deferred tool resolves to `false` and is
 * skipped (its examples stay out of context even once `tool_search`
 * promotes it). `undefined` — the "runtime decides" case for a plain
 * eager tool — renders, since the tool is already advertised this step.
 *
 * Bounded to ≤5 to honour the `ToolExample` `[1,5]` contract even when a
 * tool slipped past the registry's overflow WARN (which does not truncate).
 */
function renderToolExamples(tool: Tool): ReadonlyArray<ToolDefinitionExample> | undefined {
  const examples = tool.examples;
  if (examples === undefined || examples.length === 0) return undefined;
  if (tool.examplesEagerlyRendered === false) return undefined;
  return examples.slice(0, 5).map((ex) => ({
    input: ex.input,
    output: ex.output,
    ...(ex.comment !== undefined ? { comment: ex.comment } : {}),
  }));
}

const PASSTHROUGH_SCHEMA = {
  parse: <T>(value: unknown): T => value as T,
  safeParse: <T>(value: unknown) => ({ success: true as const, data: value as T }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as const;

function isDescribedFilter(value: unknown): value is DescribedFilter {
  return (
    typeof value === 'function' &&
    'descriptor' in value &&
    typeof (value as DescribedFilter).descriptor === 'object'
  );
}

function buildHandoffTool<TDeps>(target: Agent<TDeps, unknown>): Tool<unknown, unknown, TDeps> {
  const cfg = target.config;
  const name = `${HANDOFF_TOOL_PREFIX}${cfg.name}`;
  const tool: Tool<unknown, unknown, TDeps> = {
    name,
    description: `Hand off control to agent '${cfg.name}'.`,
    inputSchema: PASSTHROUGH_SCHEMA as unknown as Tool<unknown, unknown, TDeps>['inputSchema'],
    sideEffectClass: 'pure',
    async execute(): Promise<string> {
      return `[handoff: ${cfg.name}]`;
    },
  };
  return tool;
}

function specToProvider(spec: ModelSpec): Provider {
  if ('provider' in spec) return spec.provider as Provider;
  return spec as Provider;
}

interface ToolCallAccumulator {
  readonly toolCallId: string;
  toolName: string;
  argsBuffer: string;
}

interface ProviderEventOutcome {
  readonly emit?: AgentEvent;
  readonly providerError?: ProviderError;
  readonly usage?: Usage;
  readonly finished?: boolean;
}

interface ProviderEventCollector {
  textBuffer: string;
  reasoningBuffer: string;
  reasoningParts: ReasoningContent[];
  calls: Map<string, ToolCallAccumulator>;
  finalCalls: ToolCall[];
}

function handleProviderEvent(
  ev: ProviderEvent,
  state: ProviderEventCollector,
): ProviderEventOutcome {
  switch (ev.type) {
    case 'stream-start':
      return {};
    case 'reasoning-delta':
      state.reasoningBuffer += ev.delta;
      return { emit: { type: 'reasoning.delta', delta: ev.delta } };
    case 'text-delta':
      state.textBuffer += ev.delta;
      return { emit: { type: 'text.delta', delta: ev.delta } };
    case 'tool-call-start':
      state.calls.set(ev.toolCallId, {
        toolCallId: ev.toolCallId,
        toolName: ev.toolName,
        argsBuffer: '',
      });
      return {
        emit: {
          type: 'tool.call.start',
          toolCallId: ev.toolCallId,
          toolName: ev.toolName,
          args: undefined,
        },
      };
    case 'tool-call-input-delta': {
      const acc = state.calls.get(ev.toolCallId);
      if (acc !== undefined) acc.argsBuffer += ev.argsDelta;
      return {
        emit: { type: 'tool.call.delta', toolCallId: ev.toolCallId, argsDelta: ev.argsDelta },
      };
    }
    case 'tool-call-end': {
      const acc = state.calls.get(ev.toolCallId);
      const toolName = acc?.toolName ?? '';
      state.finalCalls.push({ toolCallId: ev.toolCallId, toolName, args: ev.finalArgs });
      return {
        emit: { type: 'tool.call.end', toolCallId: ev.toolCallId, finalArgs: ev.finalArgs },
      };
    }
    case 'file':
    case 'source':
      return {};
    case 'finish':
      return { usage: ev.usage, finished: true };
    case 'error':
      return { providerError: ev.error };
    default: {
      const _exhaustive: never = ev;
      void _exhaustive;
      return {};
    }
  }
}

/**
 * Resolve the effective {@link ReasoningRetention} for a step. The
 * agent-level setting wins over the provider-level default; when
 * neither is supplied, the provider's `reasoningContract`
 * capability drives the default per RB-42 / suggested DEC-158.
 */
function effectiveReasoningRetention(
  agentOverride: ReasoningRetention | undefined,
  provider: Provider,
): ReasoningRetention {
  if (agentOverride !== undefined) return agentOverride;
  const contract = provider.capabilities.reasoningContract;
  switch (contract) {
    case 'round-trip-required':
      return 'pass-through-claude';
    case 'optional':
      return 'pass-through-all';
    case 'hidden':
      return 'strip';
    case undefined:
    default:
      return 'strip';
  }
}

/**
 * Build the assistant message that the runtime appends to the
 * message buffer after a successful provider call. When the
 * effective {@link ReasoningRetention} is not `'strip'`, the
 * assembled `reasoning` content parts ride along on `content` so
 * the next provider call honours the wire-correct round-trip
 * contract per RB-42.
 */
function buildAssistantMessage(
  text: string,
  reasoningParts: ReadonlyArray<ReasoningContent>,
  toolCalls: ReadonlyArray<ToolCall>,
  agentId: string,
  retention: ReasoningRetention,
): AssistantMessage {
  const preserveReasoning = retention !== 'strip' && reasoningParts.length > 0;
  if (preserveReasoning) {
    const parts: MessageContent[] = [...reasoningParts];
    if (text.length > 0) parts.push({ type: 'text', text });
    return {
      role: 'assistant',
      content: parts,
      ...(toolCalls.length > 0 ? { toolCalls } : {}),
      agentId,
    };
  }
  return {
    role: 'assistant',
    content: text,
    ...(toolCalls.length > 0 ? { toolCalls } : {}),
    agentId,
  };
}

/**
 * Strip every {@link ReasoningContent} part from each message in
 * the supplied list. Used at the swap point when `prepareStep`
 * downgrades the provider's `reasoningContract` mid-run.
 */
function stripReasoningFromMessages(messages: Message[]): { stripped: number } {
  let stripped = 0;
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg === undefined) continue;
    if (msg.role === 'system' || msg.role === 'tool') continue;
    if (typeof msg.content === 'string') continue;
    const filtered = msg.content.filter((p) => p.type !== 'reasoning');
    if (filtered.length === msg.content.length) continue;
    stripped += msg.content.length - filtered.length;
    if (msg.role === 'assistant') {
      messages[i] = { ...msg, content: filtered };
    } else {
      messages[i] = { ...msg, content: filtered };
    }
  }
  return { stripped };
}

/**
 * Count the leading contiguous run of `system` messages in the initial
 * buffer — the trusted, KV-cache-stable instruction prefix. Captured
 * once at run start (WI-09 / P1-1): auto-compaction summarises only the
 * messages after this prefix, so the prefix stays byte-identical across
 * every step (the provider's cache breakpoint is real) and a long run
 * never re-pays for the system prompt.
 *
 * The length is fixed for the run rather than re-derived per compaction
 * on purpose: each compaction inserts its summary as a `system` message
 * right after the prefix, so re-scanning the leading run would absorb
 * that summary into the prefix and shield it from the next compaction —
 * summaries would stack unbounded. Pinning the original length keeps
 * each prior summary inside the compactable body, where the next pass
 * folds it into a fresh summary-of-summary.
 */
function countLeadingSystemMessages(messages: ReadonlyArray<Message>): number {
  let i = 0;
  while (i < messages.length && messages[i]?.role === 'system') i += 1;
  return i;
}

/**
 * Build a fresh {@link Agent} from the supplied configuration.
 *
 * @stable
 */
export function createAgent<TDeps = unknown, TOutput = string>(
  config: AgentConfig<TDeps, TOutput>,
): Agent<TDeps, TOutput> {
  if (typeof config.name !== 'string' || config.name.length === 0) {
    throw new InvalidAgentConfigError("missing 'name'");
  }
  if (config.provider === undefined || config.provider === null) {
    throw new InvalidAgentConfigError("missing 'provider'");
  }
  validatePreferredModel(config.preferredModel);
  if (config.modelTierMap !== undefined) {
    for (const [tier, spec] of Object.entries(config.modelTierMap)) {
      if (!isModelHintLike(tier)) throw new InvalidPreferredModelError({ tier });
      if (spec === undefined) continue;
      if (!isModelSpecLike(spec)) throw new InvalidPreferredModelError(spec);
    }
  }
  if (config.fallbackModels !== undefined) {
    for (const spec of config.fallbackModels) {
      if (!isModelSpecLike(spec)) throw new InvalidPreferredModelError(spec);
    }
  }

  const agentId = newId('agent');
  const tracer = config.tracer ?? NOOP_TRACER;
  const stopWhen = config.stopWhen ?? isStepCount(50);
  const fallbackPolicy: AgentFallbackPolicy = config.fallbackPolicy ?? {};
  const handoffMap = new Map<
    string,
    { readonly agent: Agent<TDeps, unknown>; readonly filter: DescribedFilter | undefined }
  >();
  for (const entry of config.handoffs ?? []) {
    const isWrappedHandoff = typeof entry === 'object' && entry !== null && 'target' in entry;
    const subAgent: Agent<TDeps, unknown> = isWrappedHandoff
      ? (entry as { readonly target: Agent<TDeps, unknown> }).target
      : (entry as Agent<TDeps, unknown>);
    const userFilter = isWrappedHandoff
      ? (
          entry as {
            readonly inputFilter?:
              | DescribedFilter
              | ((history: readonly Message[]) => readonly Message[]);
          }
        ).inputFilter
      : undefined;
    const filter = isDescribedFilter(userFilter) ? userFilter : undefined;
    const toolName = `${HANDOFF_TOOL_PREFIX}${subAgent.config.name}`;
    handoffMap.set(toolName, { agent: subAgent, filter });
  }

  let pendingSteer: Message[] = [];
  const pendingFollowUp: Message[] = [];
  let abortController: AbortController | undefined;
  let pendingAbort: AbortOptions | undefined;
  // Per-run scratch refs surfaced through the public surface for
  // event emission from `steer(...)` / `followUp(...)`.
  let activeRunState: RunState | undefined;
  const externalEventQueue: AgentEvent<TOutput>[] = [];

  const memory: Memory | undefined = config.memory;
  const progressIO: ProgressIO = createProgressIO({
    ...(config.sensitivity !== undefined ? { defaultSensitivity: config.sensitivity } : {}),
  });

  // Assemble the unified tool registry at warm-up (Principle #12): one
  // registry across first-party + skill sources, with deterministic
  // cross-source collision resolution. Exposed read-only as
  // `agent.registry`; the run loop and `tool_search` consume it. The
  // registry is the tool-validation authority, so a malformed tool
  // fails fast here at construction.
  const toolRegistry = buildToolRegistry({
    ...(config.tools !== undefined
      ? { tools: config.tools as ReadonlyArray<Tool<unknown, unknown, unknown>> }
      : {}),
    ...(config.skills !== undefined ? { skills: config.skills } : {}),
  }).registry;

  // WI-05 (deferred loading + tool_search / P0-3): if any registered
  // tool sets `defer_loading: true`, register the built-in `tool_search`
  // so the model can discover those tools on demand. Tools that defer are
  // withheld from the per-step catalogue (see the loop below) until a
  // `tool_search` match promotes them, keeping large tool sets out of the
  // context window. When nothing defers this is a no-op.
  registerToolSearch(toolRegistry);

  // WI-10 (result references / handles / P1-4): construct one spill
  // writer + reader pair at warm-up. The writer is handed to the executor
  // so a tool's `'spill-to-file'` truncation strategy externalises large
  // bodies to disk (0600, run-scoped); the reader — over the *same*
  // artifact root — backs the built-in `read_result` tool so the model can
  // page through a spilled artifact on demand instead of inlining the
  // whole blob. `read_result` is registered only when some tool spills.
  const spillWriter = createDefaultSpillWriter();
  const fileResultReader = createFileResultReader({ artifactRoot: spillWriter.artifactRoot });
  // WI-13 (P2-2): compose any operator-supplied result readers (e.g. an
  // MCP resource reader from `createMcpResourceReader`, for resolving
  // `resource_link` handles) after the spill-file reader. `read_result`
  // then pages both `graphorin-spill:` artifacts and external handles,
  // and is force-registered when external readers exist (even if no tool
  // spills) so those handles are resolvable.
  const externalResultReaders = config.resultReaders ?? [];
  const resultReader: ResultReader =
    externalResultReaders.length === 0
      ? fileResultReader
      : composeResultReaders([fileResultReader, ...externalResultReaders]);
  registerReadResult(toolRegistry, resultReader, { force: externalResultReaders.length > 0 });

  // Construct the unified ToolExecutor once at warm-up (WI-03 / P0-1),
  // bound to the registry above. Routing tool execution through the
  // executor activates the documented tool fields the inline loop
  // bypassed: per-tool `secretsAllowed` ACL, result truncation
  // (`maxResultTokens` / `truncationStrategy`), inbound sanitization,
  // memory-guard, idempotency keys and single-round repair.
  //
  // Durable HITL stays in the agent: approval is pre-screened below and
  // suspends the run, so the executor's `ApprovalGate` only ever sees
  // no-approval / pre-approved calls — it auto-grants and never blocks
  // the generator (Adapter G).
  //
  // Sandbox note: `config.tools` are inline `tool({...})` closures that
  // cannot be serialised to an out-of-process sandbox, and
  // `resolveSandbox` defaults user-defined tools to `worker-threads`.
  // Wiring a resolver that returned a real sandbox for that kind would
  // break every inline tool, so `sandboxResolver` is intentionally left
  // unset (the executor then runs inline — its documented fallback).
  // The resolved policy is still surfaced on the tool-execute span /
  // audit; real isolation applies to module-loadable (skill / MCP)
  // tools and is wired when those land.
  let activeExecutorBridge: ExecutorEventBridge | undefined;
  const toolApprovalGate: NonNullable<ExecutorOptions['approvalGate']> = {
    request: async () => ({ granted: true }),
  };
  const toolSecretResolver = buildSecretResolver();
  const toolTokenCounter = buildToolTokenCounter();
  const { memoryGuardFactory: toolMemoryGuardFactory } = buildMemoryGuard(memory);
  // Provenance / data-flow guard (WI-12 / P1-3, opt-in). Built once and
  // shared by every executor (direct + code-mode quiet), so the sink gate
  // and taint recording apply uniformly. Off unless configured with a
  // non-`'off'` mode — zero overhead on the default path.
  const toolDataFlowGuard =
    config.dataFlowPolicy !== undefined && config.dataFlowPolicy.mode !== 'off'
      ? buildDataFlowGuard(config.dataFlowPolicy)
      : undefined;
  const toolStreamingSink: NonNullable<ExecutorOptions['streamingSink']> = (event) =>
    activeExecutorBridge?.sink(event);
  // `quiet` builds an executor without the streaming sink — used for
  // code-mode's in-script tool calls (WI-11), whose `tool.execute.*`
  // events must not interleave into the outer agent stream.
  const makeToolExecutor = (
    registry: ToolRegistry,
    opts?: { readonly quiet?: boolean },
  ): ToolExecutor =>
    createToolExecutor({
      registry,
      approvalGate: toolApprovalGate,
      secretResolver: toolSecretResolver,
      tokenCounter: toolTokenCounter,
      memoryGuardFactory: toolMemoryGuardFactory,
      spill: spillWriter,
      ...(toolDataFlowGuard !== undefined ? { dataFlowGuard: toolDataFlowGuard } : {}),
      ...(opts?.quiet === true ? {} : { streamingSink: toolStreamingSink }),
      ...(config.maxParallelTools !== undefined
        ? { maxParallelTools: config.maxParallelTools }
        : {}),
    });
  const toolExecutor = makeToolExecutor(toolRegistry);

  // Code-mode (WI-11 / P1-2, opt-in): advertise only the `code_search` /
  // `code_execute` meta-tools and let the model orchestrate tools inside a
  // sandbox, so intermediate results stay out of context. A quiet executor
  // backs the in-script tool bridge (same per-tool governance as direct
  // mode). `read_result` is registered after the meta-tools because
  // `code_execute` opts into `'spill-to-file'`, so a large final result can
  // be fetched back on demand. Default `'direct'` mode leaves all of this
  // untouched — `codeModeAdvertised` stays empty and the loop is unchanged.
  const isCodeMode = config.toolInvocation === 'code-mode';
  let codeModeAdvertised: ReadonlyArray<Tool<unknown, unknown, TDeps>> = [];
  if (isCodeMode) {
    const reserved = new Set<string>([
      CODE_EXECUTE_NAME,
      CODE_SEARCH_NAME,
      TOOL_SEARCH_NAME,
      READ_RESULT_NAME,
      ...handoffMap.keys(),
    ]);
    const metas = registerCodeMode(
      toolRegistry,
      makeToolExecutor(toolRegistry, { quiet: true }),
      reserved,
    );
    registerReadResult(toolRegistry, resultReader);
    const readResult = toolRegistry.get(READ_RESULT_NAME);
    codeModeAdvertised = [
      ...metas,
      ...(readResult !== undefined ? [readResult] : []),
    ] as ReadonlyArray<Tool<unknown, unknown, TDeps>>;
  }

  const causalityMonitor = config.causalityMonitor
    ? new CausalityMonitor(config.causalityMonitor)
    : undefined;

  async function* runLoop(
    input: AgentInput | RunState,
    options: AgentCallOptions<TDeps>,
  ): AsyncGenerator<AgentEvent<TOutput>, AgentResult<TOutput>, void> {
    const { seed, resumed } = asMessages(input);
    const sessionId = options.sessionId ?? config.sessionId ?? `session_${newId()}`;
    const userId = options.userId ?? config.userId;
    const localCtl = new AbortController();
    abortController = localCtl;
    // AG-5: the loop + every provider request must observe the LOCAL
    // controller, so `agent.abort()` (which aborts `localCtl`) is honoured even
    // when the caller supplied their own `options.signal`. The caller's signal
    // is propagated INTO `localCtl` by the listener below; the listener is torn
    // down in the run's `finally` so it does not accumulate across runs that
    // share one long-lived parent signal.
    const signal = localCtl.signal;
    const parentSignal = options.signal;
    const onParentAbort = (): void => localCtl.abort();
    if (parentSignal !== undefined) {
      if (parentSignal.aborted) localCtl.abort();
      else parentSignal.addEventListener('abort', onParentAbort);
    }

    const usageAcc = new InMemoryUsageAccumulator();
    const baseState: RunState = resumed
      ? resumed
      : createInitialRunState({
          id: newId('run'),
          agentId,
          sessionId,
          ...(userId !== undefined ? { userId } : {}),
        });
    // Mutable view (the public RunState is `readonly` but the runtime
    // owns the lifecycle; cast to a writable shape here).
    const state = baseState as RunState as unknown as MutableRunState & RunState;
    activeRunState = state;

    const messages: Message[] = resumed ? [...state.messages] : [];
    if (!resumed) {
      // Inject the agent's system prompt at the top of the buffer
      // exactly once per run, before any seed messages.
      const instructionsRaw = config.instructions;
      // AG-8: resolve the function form of `instructions` (sync or async). It is
      // resolved ONCE per run (the per-run contract documented on `AgentConfig`),
      // against a RunContext snapshot at step 0; the result is pinned as the
      // run's system-prompt prefix. A function that previously returned nothing
      // observable now actually seeds the system message.
      let instructionsText: string;
      if (typeof instructionsRaw === 'string') {
        instructionsText = instructionsRaw;
      } else {
        const instructionsCtx: RunContext<TDeps> = {
          runId: state.id,
          sessionId,
          ...(userId !== undefined ? { userId } : {}),
          agentId,
          deps: (options.deps ?? config.deps) as TDeps,
          tracer,
          signal,
          usage: usageAcc,
          stepNumber: 0,
          messages,
          state,
        };
        instructionsText = await instructionsRaw(instructionsCtx);
      }
      let systemPrompt = instructionsText;
      if (config.autoAssembleContext === true && memory !== undefined) {
        // CE-1 (opt-in): build the memory-aware 6-layer system prompt via the
        // context engine. The instructions become Layer 2; the engine prepends
        // the memory base and appends working blocks, procedural rules, skill
        // cards, the metadata counts, and (when `factsAutoRecall` is configured)
        // auto-recalled facts. Default-off keeps the explicit memory-tools
        // pattern, so the system prompt is `instructions` alone.
        const lastUser = lastUserText(seed);
        const assembled = await memory.contextEngine.assemble(memory, {
          scope: { userId: userId ?? agentId, sessionId, agentId },
          agentId,
          sessionId,
          runId: state.id,
          ...(instructionsText.length > 0 ? { agentInstructions: instructionsText } : {}),
          ...(lastUser !== undefined ? { lastUserMessage: lastUser } : {}),
        });
        systemPrompt = assembled.systemMessage.content;
      }
      if (systemPrompt.length > 0) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push(...seed);
      // Mirror the assembled messages into RunState so the JSONL
      // session export and any downstream consumers see what the
      // agent saw.
      for (const m of messages) state.messages.push(m);
    }

    yield { type: 'agent.start', runId: state.id, agentId };

    // Process resume directive — apply approval decisions to any
    // pending approvals captured in the previous suspend.
    if (
      resumed &&
      options.directive?.approvals !== undefined &&
      state.pendingApprovals.length > 0
    ) {
      const decisions = new Map(options.directive.approvals.map((d) => [d.toolCallId, d]));
      const stillPending: ToolApproval[] = [];
      for (const approval of state.pendingApprovals) {
        const decision = decisions.get(approval.toolCallId);
        if (decision === undefined) {
          stillPending.push(approval);
          continue;
        }
        if (decision.granted) {
          yield {
            type: 'tool.approval.granted',
            toolCallId: approval.toolCallId,
          };
          // Pretend the tool call has not yet executed; we record
          // its outcome as a tool message so the model sees the
          // approved result on the next step.
          messages.push({
            role: 'tool',
            toolCallId: approval.toolCallId,
            content: '[approval granted; tool not actually executed in resume]',
          });
          state.messages.push({
            role: 'tool',
            toolCallId: approval.toolCallId,
            content: '[approval granted; tool not actually executed in resume]',
          });
        } else {
          yield {
            type: 'tool.approval.denied',
            toolCallId: approval.toolCallId,
            ...(decision.reason !== undefined ? { reason: decision.reason } : {}),
          };
          messages.push({
            role: 'tool',
            toolCallId: approval.toolCallId,
            content: `Error: tool approval denied${decision.reason ? `: ${decision.reason}` : ''}`,
          });
          state.messages.push({
            role: 'tool',
            toolCallId: approval.toolCallId,
            content: `Error: tool approval denied${decision.reason ? `: ${decision.reason}` : ''}`,
          });
        }
      }
      // Clear the queue + restore the running status so the loop
      // resumes from where it paused.
      state.pendingApprovals.splice(0, state.pendingApprovals.length, ...stillPending);
      if (stillPending.length === 0) {
        state.status = 'running';
      }
    } else if (resumed) {
      // Caller passed a RunState but no directive — bring the
      // status back to `running` if the previous run completed.
      if (state.status === 'completed' || state.status === 'failed') {
        state.status = 'completed';
      }
    }

    // WI-09: pin the trusted system-prompt prefix length now, on the
    // fully-assembled initial buffer, so auto-compaction never rewrites
    // it and prior summaries stay re-compactable (see
    // `countLeadingSystemMessages`).
    const systemPrefixLength = countLeadingSystemMessages(messages);

    const runContextBase: RunContext<TDeps> = {
      runId: state.id,
      sessionId,
      ...(userId !== undefined ? { userId } : {}),
      agentId,
      deps: (options.deps ?? config.deps) as TDeps,
      tracer,
      signal,
      usage: usageAcc,
      stepNumber: 0,
      messages,
      state,
    };

    const finalSnapshot: InternalRunSnapshot<TOutput> = {
      output: '' as unknown as TOutput,
    };

    // WI-05: deferred tools promoted by a `tool_search` call this run.
    // Membership grows as the model discovers tools and gates which
    // deferred entries the per-step catalogue advertises. In-memory per
    // run — not persisted across a suspend/resume (see changeset).
    const promotedDeferred = new Set<string>();

    /**
     * Dispatch a batch of (non-handoff) tool calls through the
     * {@link ToolExecutor} and surface the results as `AgentEvent`s.
     *
     * The agent owns the `tool.execute.start` / `.end` / `.error`
     * lifecycle (derived deterministically from the returned
     * {@link CompletedToolCall} outcomes) so every outcome kind —
     * success, unknown-tool, invalid-input, sanitization-blocked,
     * execution error — yields a consistent event and tool message,
     * preserving the pre-WI-03 stream shape (R10). The executor's
     * genuinely-live streaming events (`tool.execute.progress` /
     * `.partial`, emitted only by streaming-hint tools) are bridged
     * through Adapter E while the batch runs and are purely additive.
     *
     * Parallelism (WI-04): the executor runs independent calls in this
     * batch concurrently, bounded by `maxParallelTools`. `tool.execute.start`
     * is emitted up-front in call order and `.end` / `.error` after the
     * batch settles, also in call order — so result mapping and tool-message
     * history are deterministic regardless of which call finishes first,
     * while `.progress` / `.partial` events for concurrent calls interleave
     * (keyed by `toolCallId`). Tools declaring `executionMode: 'sequential'`
     * are serialised by the executor and never overlap.
     */
    async function* dispatchBatch(
      calls: ReadonlyArray<ToolCall>,
      executor: ToolExecutor,
      runContext: RunContext<TDeps>,
      stepNum: number,
    ): AsyncGenerator<AgentEvent<TOutput>, void, void> {
      if (calls.length === 0) return;
      for (const call of calls) {
        yield { type: 'tool.execute.start', toolCallId: call.toolCallId };
      }

      const bridge = createExecutorEventBridge();
      activeExecutorBridge = bridge;
      const resultsPromise = executor.executeBatch({ calls, runContext, stepNumber: stepNum });
      // Close the bridge once the batch settles so `drain()` ends; the
      // executor catches per-call errors, so the batch never rejects.
      const closeOnSettle = resultsPromise.then(
        () => bridge.close(),
        () => bridge.close(),
      );
      for await (const event of bridge.drain()) {
        if (event.type === 'tool.execute.progress' || event.type === 'tool.execute.partial') {
          yield event as AgentEvent<TOutput>;
        }
      }
      await closeOnSettle;
      activeExecutorBridge = undefined;

      const completed = await resultsPromise;
      const byCallId = new Map(completed.map((c) => [c.outcome.toolCallId, c]));
      const stepEntry = state.steps[state.steps.length - 1];
      for (const call of calls) {
        const result = byCallId.get(call.toolCallId);
        if (result === undefined) continue;
        if (stepEntry !== undefined) {
          (stepEntry.toolCalls as CompletedToolCall[]).push(result);
        }
        const outcome = result.outcome;
        if ('kind' in outcome) {
          yield { type: 'tool.execute.error', toolCallId: call.toolCallId, error: outcome };
          const text = `Error: ${outcome.message}`;
          messages.push({ role: 'tool', toolCallId: call.toolCallId, content: text });
          state.messages.push({ role: 'tool', toolCallId: call.toolCallId, content: text });
          causalityMonitor?.recordCall(`tool.error:${call.toolName}`);
        } else {
          const output = outcome.output;
          yield {
            type: 'tool.execute.end',
            toolCallId: call.toolCallId,
            result: output,
            durationMs: outcome.durationMs,
          };
          // WI-10 (P1-4): when the result spilled to a handle, inline only
          // the bounded preview plus a retrieval hint so the full blob never
          // enters the context window — the model fetches the rest on demand
          // via `read_result`. Inlined results serialise exactly as before
          // (preserves the happy-path message contract, R10).
          const handle = outcome.resultHandle;
          const text =
            handle !== undefined
              ? `${handle.preview}\n\n[Full result${
                  handle.bytes !== undefined ? ` (${handle.bytes} bytes)` : ''
                } stored behind a handle. Call read_result with handle ${JSON.stringify(
                  handle.uri,
                )} to retrieve it — optionally narrow with offset/length (bytes) or startLine/endLine.]`
              : typeof output === 'string'
                ? output
                : JSON.stringify(output);
          messages.push({ role: 'tool', toolCallId: call.toolCallId, content: text });
          state.messages.push({ role: 'tool', toolCallId: call.toolCallId, content: text });
          causalityMonitor?.recordCall(`tool:${call.toolName}`);
          // WI-05: a successful `tool_search` promotes its matches so the
          // catalogue advertises them on the next step.
          if (call.toolName === TOOL_SEARCH_NAME) {
            recordToolSearchPromotions(output, promotedDeferred);
          }
        }
      }
    }

    /**
     * Auto-compaction trigger (WI-09 / P1-1). Before assembling each
     * provider request, ask the memory {@link ContextEngine} whether the
     * in-flight buffer has crossed its per-provider threshold
     * (`shouldCompact`); when it has, summarise the older turns
     * (`compactNow`, `source: 'auto-trigger'`), splice the result back in
     * — preserving the byte-stable system prefix and the most-recent
     * turns verbatim — and emit `context.compacted`. The compaction is
     * configured on the memory facade (`createMemory({ contextEngine })`,
     * RB-46); there is no parallel agent-level knob.
     *
     * No-op when no memory is wired, when compaction is disabled or below
     * threshold (the engine returns `false`), or for `secret`-tier runs
     * (secret history is never shipped to the summarizer — a less-trusted
     * external sink; per-result handle references land in WI-10). Best
     * effort: a misconfigured engine (e.g. no summarizer) is swallowed and
     * the run proceeds uncompacted rather than aborting mid-flight.
     */
    async function* maybeAutoCompact(): AsyncGenerator<AgentEvent<TOutput>, void, void> {
      const mem = memory;
      if (mem === undefined) return;
      // Sensitivity gate (WI-09 step 2): drop, never re-route, secret-tier
      // content. Auto-compaction is an LLM summarizer call, so a secret
      // run is left un-compacted here.
      if (config.sensitivity === 'secret') return;
      const engine = mem.contextEngine;
      const triggered = await engine.shouldCompact(messages).catch(() => false);
      if (!triggered) return;

      const prefix = messages.slice(0, systemPrefixLength);
      const body = messages.slice(systemPrefixLength);
      const startedAt = Date.now();
      const envelope = await engine
        .compactNow({
          scope: { userId: state.userId ?? agentId, sessionId, agentId },
          runId: state.id,
          sessionId,
          agentId,
          source: 'auto-trigger',
          messages: body,
          memory: mem,
        })
        // No summarizer configured (or the strategy threw) — proceed with
        // the un-compacted buffer rather than failing a live run.
        .catch(() => undefined);
      if (envelope === undefined) return;
      const { result, extraContent } = envelope;
      // Nothing was old enough to trim (body ≤ preserve-recent) — skip the
      // splice + event so `context.compacted` only fires on real work.
      if (result.droppedMessageIndices.length === 0) return;

      // Rebuild: stable system prefix + [summary, ...recent turns]. The
      // post-compaction hooks already fired inside `compactNow`; re-inject
      // their text Context Essentials as a trailing system message so they
      // survive the trim (RB-46 re-anchoring).
      const rebuilt: Message[] = [...prefix, ...result.trimmedMessages];
      const essentials = extraContent
        .map((part) =>
          typeof part === 'object' && part !== null && 'text' in part
            ? String((part as { readonly text: unknown }).text)
            : '',
        )
        .filter((text) => text.length > 0)
        .join('\n\n');
      if (essentials.length > 0) {
        rebuilt.push({ role: 'system', content: essentials });
      }
      messages.splice(0, messages.length, ...rebuilt);
      state.messages.splice(0, state.messages.length, ...rebuilt);

      yield {
        type: 'context.compacted',
        runId: state.id,
        sessionId,
        agentId,
        beforeTokens: result.beforeTokens,
        afterTokens: result.afterTokens,
        summaryTokens: result.summaryTokens,
        durationMs: Date.now() - startedAt,
        source: 'auto-trigger',
        hooksFiredCount: result.hooksFiredCount,
      };
    }

    const handoffNames = Array.from(handoffMap.keys());
    let stepNumber = 0;

    try {
      while (!stopWhen.check(state)) {
        // Drain any externally-queued lifecycle events
        // (`agent.steered`, `agent.followup.queued`).
        while (externalEventQueue.length > 0) {
          const ev = externalEventQueue.shift();
          if (ev !== undefined) yield ev;
        }
        if (signal.aborted) {
          yield {
            type: 'agent.cancelling',
            runId: state.id,
            drain: pendingAbort?.drain ?? false,
            onPendingApprovals: pendingAbort?.onPendingApprovals ?? 'deny',
          };
          // Resolve pending approvals per the operator's policy.
          const policy = pendingAbort?.onPendingApprovals ?? 'deny';
          if (policy === 'deny') {
            const drained = state.pendingApprovals.splice(0, state.pendingApprovals.length);
            for (const approval of drained) {
              yield {
                type: 'tool.approval.denied',
                toolCallId: approval.toolCallId,
                reason: 'auto-denied: agent.abort()',
              };
            }
          } else if (policy === 'fail') {
            state.status = 'failed';
            state.error = { message: 'aborted with pending approvals', code: 'run-aborted' };
            yield {
              type: 'agent.error',
              error: { message: 'aborted with pending approvals', code: 'run-aborted' },
            };
            return finalize(state, finalSnapshot);
          }
          state.status = 'aborted';
          break;
        }
        stepNumber += 1;
        const stepStart = new Date().toISOString();

        // Drain steering queue.
        if (pendingSteer.length > 0) {
          for (const m of pendingSteer) {
            messages.push(m);
            state.messages.push(m);
          }
          pendingSteer = [];
        }

        yield { type: 'step.start', stepNumber };

        // WI-09 (P1-1): bound context growth before the provider call.
        // Fires `context.compacted` and rewrites the buffer in place only
        // when the memory ContextEngine's trigger crosses threshold; a
        // no-memory / below-threshold / secret-tier step is a no-op, so
        // the happy-path event stream is unchanged (R10).
        yield* maybeAutoCompact();

        const stepCtx: RunContext<TDeps> = { ...runContextBase, stepNumber, messages };
        const overrides = config.prepareStep ? await config.prepareStep(stepCtx) : {};

        // Resolve the registry + executor for this step. The warm-up
        // pair is bound to config.tools + skills; a `prepareStep` tool
        // override builds a step-scoped pair so the advertised catalogue
        // and the executor agree on the same tool set (incl. deferred
        // discovery for the overridden set). Code-mode does not honour a
        // per-step `tools` override (the meta-tools + bridge are bound to
        // the warm-up registry), so it always uses the warm-up pair.
        const useOverrideRegistry = overrides.tools !== undefined && !isCodeMode;
        const stepRegistry: ToolRegistry = useOverrideRegistry
          ? buildToolRegistry({
              tools: overrides.tools as ReadonlyArray<Tool<unknown, unknown, unknown>>,
            }).registry
          : toolRegistry;
        if (useOverrideRegistry) {
          registerToolSearch(stepRegistry);
          registerReadResult(stepRegistry, resultReader);
        }
        const stepExecutor: ToolExecutor = useOverrideRegistry
          ? makeToolExecutor(stepRegistry)
          : toolExecutor;

        // Build the per-step tool catalogue. Handoff tools are synthetic
        // per-step entries and are always advertised.
        const handoffTools: Tool<unknown, unknown, TDeps>[] = handoffNames.map((n) => {
          const h = handoffMap.get(n);
          if (h === undefined) throw new ToolNotFoundError(n);
          return buildHandoffTool<TDeps>(h.agent);
        });
        // Code-mode (WI-11): advertise only the `code_search` /
        // `code_execute` (+ `read_result`) meta-tools — the model reaches
        // every real tool through `code_execute`, so the real tools stay
        // registered (executable via the in-script bridge) but out of the
        // model's catalogue. Otherwise (WI-05): advertise the eager tools
        // (`tool_search` is itself eager iff a deferred tool exists) plus
        // any deferred tools already promoted by a `tool_search` this run —
        // never the rest of the deferred pool.
        let stepTools: ReadonlyArray<Tool<unknown, unknown, TDeps>>;
        if (isCodeMode) {
          stepTools = [...codeModeAdvertised, ...handoffTools];
        } else {
          const eagerTools = stepRegistry.listEager() as ReadonlyArray<
            Tool<unknown, unknown, TDeps>
          >;
          const promotedTools = (
            promotedDeferred.size === 0
              ? []
              : stepRegistry.listDeferred().filter((entry) => promotedDeferred.has(entry.name))
          ) as ReadonlyArray<Tool<unknown, unknown, TDeps>>;
          stepTools = [...eagerTools, ...promotedTools, ...handoffTools];
        }

        const toolPreferences = stepTools.map((t) => {
          const tt = t as Tool<unknown, unknown, TDeps> & { readonly preferredModel?: unknown };
          return tt.preferredModel as Parameters<
            typeof resolvePreferredModel
          >[0]['toolPreferredModels'][number];
        });

        const primary: PreferredModelResolution = resolvePreferredModel({
          ...(overrides.provider !== undefined ? { prepareStepProvider: overrides.provider } : {}),
          toolPreferredModels: toolPreferences,
          ...(config.preferredModel !== undefined
            ? { agentPreferredModel: config.preferredModel }
            : {}),
          agentDefaultProvider: config.provider,
          ...(config.modelTierMap !== undefined ? { modelTierMap: config.modelTierMap } : {}),
        });

        // RB-48: when `prepareStep` returns an explicit provider
        // override, the fallback chain is NOT consulted for this
        // step (the operator's explicit choice supersedes the
        // implicit fallback chain).
        const fallbackChain: Provider[] =
          primary.source === 'prepare-step'
            ? [primary.resolvedProvider]
            : [primary.resolvedProvider, ...(config.fallbackModels ?? []).map(specToProvider)];

        // Resolve the effective reasoning-retention policy for
        // this step (RB-42). Drop any buffered reasoning when the
        // contract downgrades to `'strip'`.
        const reasoningPolicy = effectiveReasoningRetention(
          config.reasoningRetention,
          primary.resolvedProvider,
        );
        if (reasoningPolicy === 'strip') {
          const { stripped } = stripReasoningFromMessages(messages);
          // Mirror the strip into RunState so the persisted state
          // matches the in-flight buffer.
          if (stripped > 0) {
            // The structural drop is bytes-equal across `messages`
            // and `state.messages` (both arrays carry the same
            // references); re-strip RunState explicitly to be safe.
            stripReasoningFromMessages(state.messages);
          }
        }

        const toolDefs: ReadonlyArray<ToolDefinition> = stepTools.map((t) =>
          toolToDefinition(t as Tool<unknown, unknown, unknown>),
        );

        const baseRequest: ProviderRequest = {
          messages,
          tools: toolDefs,
          ...(overrides.toolChoice !== undefined
            ? { toolChoice: overrides.toolChoice }
            : config.toolChoice !== undefined
              ? { toolChoice: config.toolChoice as ToolChoice }
              : {}),
          metadata: {
            sessionId,
            agentId,
            ...(userId !== undefined ? { userId } : {}),
            runId: state.id,
            stepNumber,
          },
          signal,
          ...(overrides.temperature !== undefined ? { temperature: overrides.temperature } : {}),
          ...(overrides.maxTokens !== undefined ? { maxTokens: overrides.maxTokens } : {}),
          reasoningRetention: reasoningPolicy,
        };

        const stepUsage: Usage = zeroUsage();
        let attempt = 0;
        let textBuffer = '';
        let providerForStep = primary.resolvedProvider;
        let lastModelId = primary.resolvedModelId;
        let modelSucceeded = false;
        let lastError: ProviderError | undefined;
        let finalCalls: ToolCall[] = [];
        let stepReasoningParts: ReasoningContent[] = [];

        for (let chainIdx = 0; chainIdx < fallbackChain.length; chainIdx++) {
          const candidate = fallbackChain[chainIdx];
          if (candidate === undefined) continue;
          providerForStep = candidate;
          const providerModelId = providerForStep.modelId;
          if (chainIdx > 0) {
            attempt += 1;
            const reason = lastError
              ? (isAgentFallbackEligible(lastError, fallbackPolicy).reason ?? 'transient')
              : 'transient';
            yield {
              type: 'agent.model.fellback',
              runId: state.id,
              sessionId,
              agentId,
              from: lastModelId,
              to: providerModelId,
              reason,
              stepNumber,
              attempt,
            };
            lastModelId = providerModelId;
          }
          const evState: ProviderEventCollector = {
            textBuffer: '',
            reasoningBuffer: '',
            reasoningParts: [],
            calls: new Map<string, ToolCallAccumulator>(),
            finalCalls: [] as ToolCall[],
          };
          let providerError: ProviderError | undefined;
          let providerCallCompleted = false;
          let providerStepUsage: Usage = zeroUsage();
          try {
            const stream = providerForStep.stream(baseRequest);
            for await (const ev of stream) {
              if (signal.aborted) {
                throw new AgentRuntimeError('run-aborted', 'aborted');
              }
              const out = handleProviderEvent(ev, evState);
              if (out.emit !== undefined) {
                yield out.emit as AgentEvent<TOutput>;
              }
              if (out.providerError !== undefined) {
                providerError = out.providerError;
              }
              if (out.usage !== undefined) {
                providerStepUsage = {
                  promptTokens: providerStepUsage.promptTokens + out.usage.promptTokens,
                  completionTokens: providerStepUsage.completionTokens + out.usage.completionTokens,
                  totalTokens: providerStepUsage.totalTokens + out.usage.totalTokens,
                  ...(out.usage.reasoningTokens !== undefined ||
                  providerStepUsage.reasoningTokens !== undefined
                    ? {
                        reasoningTokens:
                          (providerStepUsage.reasoningTokens ?? 0) +
                          (out.usage.reasoningTokens ?? 0),
                      }
                    : {}),
                };
              }
              if (out.finished === true) providerCallCompleted = true;
            }
          } catch (cause) {
            if (cause instanceof AgentRuntimeError && cause.code === 'run-aborted') {
              providerError = { kind: 'unknown', message: 'aborted', cause };
              break;
            }
            const message = cause instanceof Error ? cause.message : String(cause);
            providerError = { kind: 'unknown', message, cause };
          }
          if (providerError !== undefined) {
            lastError = providerError;
            const eligibility = isAgentFallbackEligible(providerError, fallbackPolicy);
            if (!eligibility.eligible || chainIdx === fallbackChain.length - 1) {
              yield {
                type: 'agent.error',
                error: { message: providerError.message, code: providerError.kind },
              };
              state.status = 'failed';
              state.error = { message: providerError.message, code: providerError.kind };
              return finalize(state, finalSnapshot);
            }
            continue;
          }
          if (providerCallCompleted) {
            modelSucceeded = true;
            textBuffer = evState.textBuffer;
            finalCalls = evState.finalCalls;
            // Materialize the streamed reasoning deltas into a
            // single `ReasoningContent` part. Adapters that expose
            // structured reasoning blocks may emit multiple
            // deltas; v0.1 collapses them into one part — Phase
            // 06 owns the per-block structure when it lands.
            if (evState.reasoningBuffer.length > 0) {
              stepReasoningParts = [
                {
                  type: 'reasoning',
                  text: evState.reasoningBuffer,
                },
              ];
            }
            stepUsage.promptTokens += providerStepUsage.promptTokens;
            stepUsage.completionTokens += providerStepUsage.completionTokens;
            stepUsage.totalTokens += providerStepUsage.totalTokens;
            if (providerStepUsage.reasoningTokens !== undefined) {
              stepUsage.reasoningTokens =
                (stepUsage.reasoningTokens ?? 0) + providerStepUsage.reasoningTokens;
            }
            break;
          }
        }

        if (!modelSucceeded) {
          yield {
            type: 'agent.error',
            error: {
              message: 'all configured providers failed without finishing',
              code: 'no-provider-completed',
            },
          };
          state.status = 'failed';
          state.error = { message: 'no provider completed', code: 'no-provider-completed' };
          return finalize(state, finalSnapshot);
        }

        usageAcc.add(lastModelId, stepUsage);
        addModelUsage(state, lastModelId, stepUsage);
        state.usage.promptTokens += stepUsage.promptTokens;
        state.usage.completionTokens += stepUsage.completionTokens;
        state.usage.totalTokens += stepUsage.totalTokens;
        if (stepUsage.reasoningTokens !== undefined) {
          state.usage.reasoningTokens =
            (state.usage.reasoningTokens ?? 0) + stepUsage.reasoningTokens;
        }

        const assistant: AssistantMessage = buildAssistantMessage(
          textBuffer,
          stepReasoningParts,
          finalCalls,
          agentId,
          reasoningPolicy,
        );
        messages.push(assistant);
        state.messages.push(assistant);

        // Lateral-leak (RB-55): scan the outgoing assistant
        // content for causality laundering / commentary-phase
        // patterns and surface a `agent.lateral-leak.detected`
        // event when the configured monitor flags / blocks.
        if (causalityMonitor !== undefined && textBuffer.length > 0) {
          const check = causalityMonitor.checkMessage(textBuffer);
          if (check.leakDetected) {
            const sha = sha256Hex(textBuffer);
            yield {
              type: 'agent.lateral-leak.detected',
              runId: state.id,
              sessionId,
              agentId,
              vector: check.vector,
              severity: check.severity,
              causalityChain: check.causalityChain,
              messageContentSha256: sha,
              ...(check.matchedPattern !== undefined
                ? { matchedPattern: check.matchedPattern }
                : {}),
              decision: check.decision,
              detectedAtIso: new Date().toISOString(),
            };
          }
        }

        const handoffCalls = finalCalls.filter((c) => handoffMap.has(c.toolName));
        if (handoffCalls.length > 1) {
          throw new MultipleHandoffsInStepError(handoffCalls.map((c) => c.toolName));
        }

        const stepRecord: RunStep = {
          stepNumber,
          startedAt: stepStart,
          endedAt: new Date().toISOString(),
          usage: stepUsage,
          toolCalls: [],
          agentId: state.currentAgentId,
        };
        state.steps.push(stepRecord);

        if (textBuffer.length > 0) {
          finalSnapshot.output = textBuffer as unknown as TOutput;
          yield { type: 'text.complete', text: textBuffer };
        }

        if (finalCalls.length > 0) {
          // `stepRegistry` / `stepExecutor` were resolved with the
          // catalogue above (so the advertised tools and the executor's
          // resolvable tools agree, including any `prepareStep` override).
          const execRunContext: RunContext<TDeps> = { ...runContextBase, stepNumber, messages };

          // Walk calls in finalCalls order. Handoffs are special-cased
          // inline (≤1 per step) and never routed through the executor.
          // Non-handoff calls accumulate into a batch dispatched through
          // the ToolExecutor; the batch is flushed before a handoff and
          // before a durable-HITL suspend so execution order is kept.
          let batch: ToolCall[] = [];

          for (const call of finalCalls) {
            const handoff = handoffMap.get(call.toolName);
            if (handoff !== undefined) {
              if (batch.length > 0) {
                yield* dispatchBatch(batch, stepExecutor, execRunContext, stepNumber);
                batch = [];
              }
              yield { type: 'tool.execute.start', toolCallId: call.toolCallId };
              const filter = (handoff.filter ??
                filterLib.defaultHandoffFilter()) as DescribedFilter;
              const filtered = filter(messages);
              const targetId = handoff.agent.id;
              const handoffRec: HandoffRecord = {
                fromAgentId: agentId,
                toAgentId: targetId,
                stepNumber,
                at: new Date().toISOString(),
                inputFilter: filter.descriptor,
                secretsInheritance: 'inherit-allowlist',
                inheritedSecrets: [],
              };
              state.handoffs.push(handoffRec);
              yield { type: 'handoff', fromAgentId: agentId, toAgentId: targetId };
              state.currentAgentId = targetId;
              const subAgent = handoff.agent;
              const subOutputs: string[] = [];
              const subStream = subAgent.stream(filtered as Message[]);
              for await (const subEv of subStream) {
                if (subEv.type === 'text.complete') subOutputs.push(subEv.text);
              }
              const result = subOutputs.join('');
              const completed: CompletedToolCall = {
                call,
                outcome: {
                  toolCallId: call.toolCallId,
                  toolName: call.toolName,
                  output: result,
                  durationMs: 0,
                },
                stepNumber,
              };
              const stepEntry = state.steps[state.steps.length - 1];
              if (stepEntry !== undefined) {
                (stepEntry.toolCalls as CompletedToolCall[]).push(completed);
              }
              yield {
                type: 'tool.execute.end',
                toolCallId: call.toolCallId,
                result,
                durationMs: 0,
              };
              messages.push({ role: 'tool', toolCallId: call.toolCallId, content: result });
              state.messages.push({
                role: 'tool',
                toolCallId: call.toolCallId,
                content: result,
              });
              continue;
            }

            // Approval pre-screen (Adapter G / durable HITL). Evaluate the
            // registry-resolved `needsApproval`; an unapproved gated call
            // suspends the run exactly as before — after flushing any
            // queued batch so prior calls' side-effects complete first.
            const resolvedTool = stepRegistry.get(call.toolName);
            const needsApproval = await invokeNeedsApproval(
              resolvedTool,
              call.args,
              execRunContext,
              signal,
            );
            if (needsApproval) {
              if (batch.length > 0) {
                yield* dispatchBatch(batch, stepExecutor, execRunContext, stepNumber);
                batch = [];
              }
              yield { type: 'tool.execute.start', toolCallId: call.toolCallId };
              const approval: ToolApproval = {
                toolCallId: call.toolCallId,
                toolName: call.toolName,
                args: call.args,
                requestedAt: new Date().toISOString(),
              };
              state.pendingApprovals.push(approval);
              state.status = 'awaiting_approval';
              yield {
                type: 'tool.approval.requested',
                toolCallId: call.toolCallId,
              };
              if (config.checkpointStore !== undefined) {
                await config.checkpointStore.put(
                  state.id,
                  'agent',
                  {
                    id: state.id,
                    threadId: state.id,
                    namespace: 'agent',
                    state,
                    channelVersions: {},
                    stepNumber,
                    createdAt: new Date().toISOString(),
                  },
                  { source: 'sync', status: 'suspended', nodeName: 'agent.run' },
                );
              }
              return finalize(state, finalSnapshot);
            }

            batch.push(call);
          }

          if (batch.length > 0) {
            yield* dispatchBatch(batch, stepExecutor, execRunContext, stepNumber);
          }
        }

        yield { type: 'step.end', stepNumber, usage: stepUsage };

        if (finalCalls.length === 0) {
          state.status = 'completed';
          break;
        }
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      const code = cause instanceof AgentRuntimeError ? (cause.code as string) : 'unknown';
      yield { type: 'agent.error', error: { message, code } };
      state.status = 'failed';
      state.error = { message, code };
      return finalize(state, finalSnapshot);
    } finally {
      // AG-5: drop the parent-signal listener so it does not accumulate across
      // runs that share one long-lived `options.signal`. Runs after this point
      // (the follow-up loop) keep working via `agent.abort()` on `localCtl`.
      if (parentSignal !== undefined) {
        parentSignal.removeEventListener('abort', onParentAbort);
      }
    }

    if (state.status === 'running') {
      state.status = 'completed';
    }
    // Drain any queued follow-ups into a new turn while the run
    // is still active. Each follow-up message is appended to the
    // buffer + state, and the loop is restarted from the top so
    // the model produces the next assistant message.
    if (pendingFollowUp.length > 0 && state.status === 'completed' && !signal.aborted) {
      const turn = pendingFollowUp.splice(0, pendingFollowUp.length);
      for (const m of turn) {
        messages.push(m);
        state.messages.push(m);
      }
      state.status = 'running';
      delete (state as { finishedAt?: string }).finishedAt;
      yield* runFollowUpLoop(messages, state, stepNumber, signal, sessionId, userId);
    }
    activeRunState = undefined;
    return finalize(state, finalSnapshot);
  }

  /**
   * Re-enter the loop with the supplied buffer + accumulated
   * step counter when a queued follow-up turn fires.
   */
  async function* runFollowUpLoop(
    _messages: Message[],
    _state: RunState,
    _stepNumber: number,
    _signal: AbortSignal,
    _sessionId: string,
    _userId: string | undefined,
  ): AsyncGenerator<AgentEvent<TOutput>, void, void> {
    // Intentional minimal-loop placeholder: the v0.1 follow-up
    // semantics document the queueing path but do NOT auto-spawn
    // a new provider call inside the same generator. Operators
    // who want a follow-up turn invoke `agent.run(...)` again
    // with the queued message; the queue is documented as
    // "next-turn metadata", not "auto-spawn-a-turn". Keeping the
    // generator here so we can extend it later without breaking
    // the public surface.
    yield* (async function* (): AsyncGenerator<AgentEvent<TOutput>, void, void> {})();
  }

  function finalize(
    state: MutableRunState,
    snapshot: InternalRunSnapshot<TOutput>,
  ): AgentResult<TOutput> {
    state.finishedAt = state.finishedAt ?? new Date().toISOString();
    return {
      output: snapshot.output,
      usage: state.usage,
    };
  }

  const stream = (
    input: AgentInput | RunState,
    options?: AgentCallOptions<TDeps>,
  ): AsyncIterable<AgentEvent<TOutput>> => {
    const opts = options ?? {};
    return {
      [Symbol.asyncIterator]: () => {
        const gen = runLoop(input, opts);
        return {
          async next(): Promise<IteratorResult<AgentEvent<TOutput>, void>> {
            const r = await gen.next();
            if (r.done === true) {
              return { done: true, value: undefined };
            }
            return { done: false, value: r.value };
          },
          async return(): Promise<IteratorResult<AgentEvent<TOutput>, void>> {
            await gen.return(undefined as unknown as AgentResult<TOutput>);
            return { done: true, value: undefined };
          },
        };
      },
    };
  };

  const run = async (
    input: AgentInput | RunState,
    options?: AgentCallOptions<TDeps>,
  ): Promise<AgentResult<TOutput>> => {
    const opts = options ?? {};
    const gen = runLoop(input, opts);
    let result: AgentResult<TOutput> = {
      output: '' as unknown as TOutput,
      usage: zeroUsage(),
    };
    let next = await gen.next();
    while (next.done !== true) {
      next = await gen.next();
    }
    if (next.value !== undefined) {
      result = next.value;
    }
    return result;
  };

  const steer = (message: AgentInput): void => {
    const { seed } = asMessages(message);
    pendingSteer.push(...seed);
    if (activeRunState !== undefined) {
      externalEventQueue.push({
        type: 'agent.steered',
        runId: activeRunState.id,
      } as AgentEvent<TOutput>);
    }
  };

  const followUp = (message: AgentInput): void => {
    const { seed } = asMessages(message);
    pendingFollowUp.push(...seed);
    if (activeRunState !== undefined) {
      externalEventQueue.push({
        type: 'agent.followup.queued',
        runId: activeRunState.id,
      } as AgentEvent<TOutput>);
    }
  };

  const abort = (options?: AbortOptions): void => {
    pendingAbort = options ?? {};
    abortController?.abort();
  };

  const toTool = (
    options: AgentToToolOptions = {},
  ): Tool<{ readonly input: string }, TOutput, TDeps> => {
    const exposeTurns = options.exposeTurns ?? 'final';
    const toolName = options.name ?? `subagent_${config.name}`;
    const description = options.description ?? `Invoke sub-agent '${config.name}'.`;
    const schema = {
      parse: (v: unknown): { readonly input: string } => v as { readonly input: string },
      safeParse: (v: unknown) => ({
        success: true as const,
        data: v as { readonly input: string },
      }),
      toJSON: (): Record<string, unknown> => ({
        type: 'object',
        properties: { input: { type: 'string' } },
        required: ['input'],
      }),
    };
    const tool: Tool<{ readonly input: string }, TOutput, TDeps> = {
      name: toolName,
      description,
      inputSchema: schema as unknown as Tool<
        { readonly input: string },
        TOutput,
        TDeps
      >['inputSchema'],
      sideEffectClass: 'side-effecting',
      async execute(input) {
        if (exposeTurns === 'all') {
          // Replay the streamed text completions as the result so
          // the parent agent sees every turn the sub-agent
          // produced. `exposeTurns: 'final'` (default) and
          // `'none'` skip the per-turn assembly.
          const turns: string[] = [];
          for await (const ev of stream(input.input, {})) {
            if (ev.type === 'text.complete') turns.push(ev.text);
          }
          return turns.join('\n\n') as unknown as TOutput;
        }
        const result = await run(input.input, {});
        if (exposeTurns === 'none') return '' as unknown as TOutput;
        return result.output;
      },
    };
    return tool;
  };

  const compact = async (options?: CompactOptions): Promise<CompactionApiResult> => {
    if (memory === undefined) {
      // No memory wired — emit a noop result. Operators can still
      // see this on the trace; the helper is intentionally
      // forgiving so example apps that don't wire memory don't
      // crash on `agent.compact()`.
      return {
        beforeTokens: 0,
        afterTokens: 0,
        summaryTokens: 0,
        durationMs: 0,
        hooksFiredCount: 0,
        summary: '',
      };
    }
    if (activeRunState === undefined) {
      return {
        beforeTokens: 0,
        afterTokens: 0,
        summaryTokens: 0,
        durationMs: 0,
        hooksFiredCount: 0,
        summary: '',
      };
    }
    const sessionId = activeRunState.sessionId;
    // `SessionScope.userId` is required on the contract; fall
    // through to `agentId` as the scope's "logical user" when the
    // run state has no explicit `userId`. Single-user-per-process
    // is the v0.1 default per DEC-005, so the substitution is
    // idempotent across calls.
    const scopeUserId = activeRunState.userId ?? agentId;
    const start = Date.now();
    const result = await memory.contextEngine.compactNow({
      scope: { userId: scopeUserId, sessionId, agentId },
      runId: activeRunState.id,
      sessionId,
      agentId,
      source: options?.source ?? 'manual',
      messages: activeRunState.messages,
      memory,
    });
    return {
      beforeTokens: result.result.beforeTokens,
      afterTokens: result.result.afterTokens,
      summaryTokens: result.result.summaryTokens,
      durationMs: Date.now() - start,
      hooksFiredCount: result.extraContent.length,
      summary: result.result.summary ?? '',
    };
  };

  const fanOut = async <TFanOutOutput = unknown>(
    options: AgentFanOutOptions<TFanOutOutput>,
  ): Promise<FanOutResult<TFanOutOutput>> => {
    const runId = activeRunState?.id ?? `run_${newId()}`;
    const sessionId = activeRunState?.sessionId ?? `session_${newId()}`;
    const fanOutOptions: RunFanOutOptions<TFanOutOutput> = {
      children: options.children,
      ...(options.maxConcurrentChildren !== undefined
        ? { maxConcurrentChildren: options.maxConcurrentChildren }
        : {}),
      ...(options.perBudget !== undefined ? { perBudget: options.perBudget } : {}),
      ...(options.mergeStrategy !== undefined ? { mergeStrategy: options.mergeStrategy } : {}),
      ...(options.signal !== undefined ? { signal: options.signal } : {}),
      runId,
      sessionId,
      agentId,
    };
    return runFanOut<TFanOutOutput>(fanOutOptions);
  };

  const progress: AgentProgressIO = {
    write: (content: string, opts?: ProgressWriteOptions) => {
      const runId = activeRunState?.id ?? `run_${newId()}`;
      return progressIO.write(runId, content, opts);
    },
    read: (opts?: ProgressReadOptions) => {
      const runId = activeRunState?.id ?? `run_${newId()}`;
      return progressIO.read(runId, opts);
    },
  };

  void pendingFollowUp;
  void config.sensitivity as Sensitivity | undefined;

  const agent: Agent<TDeps, TOutput> = {
    id: agentId,
    config,
    stream,
    run,
    steer,
    followUp,
    abort,
    toTool,
    compact,
    fanOut,
    progress,
    registry: toolRegistry,
  };

  return agent;
}

/**
 * Pre-execution approval screen (Adapter G / durable HITL). Evaluates a
 * (registry-resolved) tool's `needsApproval` against the realized args.
 * Returns `true` when the run must suspend before the tool executes.
 *
 * Actual execution flows through the `@graphorin/tools` executor, whose
 * `ApprovalGate` auto-grants because only no-approval / pre-approved
 * calls ever reach it; this probe is what keeps the suspend in the
 * agent so the durable-HITL contract (persist `RunState`, resume via
 * directive) is preserved.
 */
async function invokeNeedsApproval(
  tool: Pick<Tool, 'needsApproval'> | undefined,
  args: unknown,
  baseCtx: RunContext,
  signal: AbortSignal,
): Promise<boolean> {
  const predicate = tool?.needsApproval;
  if (predicate === undefined || predicate === false) return false;
  if (predicate === true) return true;
  const probeCtx: ToolExecutionContext = {
    toolCallId: 'probe',
    runContext: baseCtx,
    signal,
    tracer: baseCtx.tracer,
    logger: NOOP_LOGGER,
    secrets: probeSecretsAccessor(),
    reportProgress: () => {},
    streamContent: () => {},
  };
  return Boolean(await predicate(args as never, probeCtx));
}

/**
 * Rejecting secrets accessor used only by the {@link invokeNeedsApproval}
 * probe. Real tool execution resolves secrets through the executor's
 * ACL-scoped accessor; an approval predicate has no legitimate need to
 * read secret material, so every `require(...)` rejects.
 */
function probeSecretsAccessor(): ToolExecutionContext['secrets'] {
  const rejector = (_key: string, _options?: { readonly optional?: boolean }): Promise<never> =>
    Promise.reject(new Error('secrets.require is unavailable inside a needsApproval predicate'));
  return { require: rejector } as unknown as ToolExecutionContext['secrets'];
}
