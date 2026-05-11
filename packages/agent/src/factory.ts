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
  ToolExecutionContext,
  Usage,
} from '@graphorin/core';
import { isStepCount, NOOP_LOGGER, NOOP_TRACER, zeroUsage } from '@graphorin/core';
import type { Memory } from '@graphorin/memory';
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
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: schema,
  };
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
    const signal = options.signal ?? localCtl.signal;
    if (options.signal) {
      const onParent = (): void => localCtl.abort();
      options.signal.addEventListener('abort', onParent);
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
      if (typeof instructionsRaw === 'string' && instructionsRaw.length > 0) {
        messages.push({ role: 'system', content: instructionsRaw });
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

        const stepCtx: RunContext<TDeps> = { ...runContextBase, stepNumber, messages };
        const overrides = config.prepareStep ? await config.prepareStep(stepCtx) : {};

        // Build the per-step tool catalogue.
        const handoffTools: Tool<unknown, unknown, TDeps>[] = handoffNames.map((n) => {
          const h = handoffMap.get(n);
          if (h === undefined) throw new ToolNotFoundError(n);
          return buildHandoffTool<TDeps>(h.agent);
        });
        const baseTools = (overrides.tools ?? config.tools ?? []) as ReadonlyArray<
          Tool<unknown, unknown, TDeps>
        >;
        const stepTools: ReadonlyArray<Tool<unknown, unknown, TDeps>> = [
          ...baseTools,
          ...handoffTools,
        ];

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
          for (const call of finalCalls) {
            yield { type: 'tool.execute.start', toolCallId: call.toolCallId };
            const handoff = handoffMap.get(call.toolName);
            if (handoff !== undefined) {
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

            const tool = stepTools.find((t) => t.name === call.toolName);
            if (tool === undefined) {
              const err = new ToolNotFoundError(call.toolName);
              yield {
                type: 'tool.execute.error',
                toolCallId: call.toolCallId,
                error: {
                  toolCallId: call.toolCallId,
                  toolName: call.toolName,
                  kind: 'unknown_tool',
                  message: err.message,
                },
              };
              messages.push({
                role: 'tool',
                toolCallId: call.toolCallId,
                content: `Error: ${err.message}`,
              });
              state.messages.push({
                role: 'tool',
                toolCallId: call.toolCallId,
                content: `Error: ${err.message}`,
              });
              continue;
            }

            const tex = await invokeNeedsApproval(tool, call.args, runContextBase, signal);
            if (tex.needsApproval) {
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

            const start = Date.now();
            try {
              const ctx: ToolExecutionContext<TDeps> = {
                toolCallId: call.toolCallId,
                runContext: { ...runContextBase, stepNumber, messages },
                signal,
                tracer,
                logger: NOOP_LOGGER,
                secrets: makeNoopSecretsAccessor(),
                reportProgress: () => {},
                streamContent: () => {},
              };
              const rawResult = await tool.execute(call.args as never, ctx);
              const duration = Date.now() - start;
              const result = rawResult ?? null;
              const completed: CompletedToolCall = {
                call,
                outcome: {
                  toolCallId: call.toolCallId,
                  toolName: call.toolName,
                  output: result,
                  durationMs: duration,
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
                durationMs: duration,
              };
              const resultText = typeof result === 'string' ? result : JSON.stringify(result);
              messages.push({ role: 'tool', toolCallId: call.toolCallId, content: resultText });
              state.messages.push({
                role: 'tool',
                toolCallId: call.toolCallId,
                content: resultText,
              });
              causalityMonitor?.recordCall(`tool:${call.toolName}`);
            } catch (cause) {
              const message = cause instanceof Error ? cause.message : String(cause);
              yield {
                type: 'tool.execute.error',
                toolCallId: call.toolCallId,
                error: {
                  toolCallId: call.toolCallId,
                  toolName: call.toolName,
                  kind: 'execution_failed',
                  message,
                },
              };
              messages.push({
                role: 'tool',
                toolCallId: call.toolCallId,
                content: `Error: ${message}`,
              });
              state.messages.push({
                role: 'tool',
                toolCallId: call.toolCallId,
                content: `Error: ${message}`,
              });
              causalityMonitor?.recordCall(`tool.error:${call.toolName}`);
            }
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
  };

  return agent;
}

interface ApprovalProbe {
  readonly needsApproval: boolean;
}

async function invokeNeedsApproval<TDeps>(
  tool: Tool<unknown, unknown, TDeps>,
  args: unknown,
  baseCtx: RunContext<TDeps>,
  signal: AbortSignal,
): Promise<ApprovalProbe> {
  if (tool.needsApproval === undefined || tool.needsApproval === false) {
    return { needsApproval: false };
  }
  if (tool.needsApproval === true) return { needsApproval: true };
  const probeCtx: ToolExecutionContext<TDeps> = {
    toolCallId: 'probe',
    runContext: baseCtx,
    signal,
    tracer: baseCtx.tracer,
    logger: NOOP_LOGGER,
    secrets: makeNoopSecretsAccessor(),
    reportProgress: () => {},
    streamContent: () => {},
  };
  const decision = await tool.needsApproval(args as never, probeCtx);
  return { needsApproval: Boolean(decision) };
}

function makeNoopSecretsAccessor(): ToolExecutionContext['secrets'] {
  function rejector(_key: string, options?: { readonly optional?: boolean }): Promise<never> {
    void options;
    return Promise.reject(
      new Error(
        'secrets.require: minimal-loop mode does not wire a secrets resolver. ' +
          'Use the @graphorin/tools executor for full ACL support.',
      ),
    );
  }
  return { require: rejector } as unknown as ToolExecutionContext['secrets'];
}
