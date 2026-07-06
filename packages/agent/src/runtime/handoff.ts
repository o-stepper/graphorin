/**
 * Multi-agent handoff support for the agent runtime: the synthetic
 * `transfer_to_<name>` tool advertised per step, the `DescribedFilter`
 * structural check, and the inline execution of a handoff call (the
 * sub-agent stream observation that surfaces a failed / aborted sub-run
 * as a tool error). Extracted verbatim from `factory.ts` (issue #23).
 *
 * @packageDocumentation
 */

import type {
  AgentEvent,
  AgentResult,
  CompletedToolCall,
  HandoffRecord,
  Message,
  RunState,
  Tool,
  ToolCall,
  ToolError,
  UsageAccumulator,
} from '@graphorin/core';
import { type DescribedFilter, filters as filterLib } from '../filters/index.js';
import type { Agent, AgentCallOptions, AgentConfig } from '../types.js';
import { foldChildRunUsage, renderToolErrorMessage } from './messages.js';
import type { MutableRunState } from './run-input.js';

export const HANDOFF_TOOL_PREFIX = 'transfer_to_';

export const PASSTHROUGH_SCHEMA = {
  parse: <T>(value: unknown): T => value as T,
  safeParse: <T>(value: unknown) => ({ success: true as const, data: value as T }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as const;

export function isDescribedFilter(value: unknown): value is DescribedFilter {
  return (
    typeof value === 'function' &&
    'descriptor' in value &&
    typeof (value as DescribedFilter).descriptor === 'object'
  );
}

export function buildHandoffTool<TDeps>(
  target: Agent<TDeps, unknown>,
): Tool<unknown, unknown, TDeps> {
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

/**
 * A handoff child's seed must be a well-formed transcript in its own
 * right: the parent history it is cut from ends with the in-flight
 * handoff call itself (a dangling tool_use), and `lastN`-style filters
 * can orphan tool results whose assistant partner was cut. Real
 * providers reject both shapes with `invalid-request`, so strip
 * unresolved tool calls (dropping the assistant message when nothing
 * remains) and orphan tool messages before seeding the child.
 */
export function sanitizeHandoffSeed(messages: ReadonlyArray<Message>): Message[] {
  const announcedSoFar = new Set<string>();
  const resolved = new Set<string>();
  for (const m of messages) {
    if (m.role === 'assistant' && m.toolCalls !== undefined) {
      for (const c of m.toolCalls) announcedSoFar.add(c.toolCallId);
    } else if (m.role === 'tool' && announcedSoFar.has(m.toolCallId)) {
      resolved.add(m.toolCallId);
    }
  }
  const out: Message[] = [];
  const keptAnnounced = new Set<string>();
  for (const m of messages) {
    if (m.role === 'tool') {
      if (!keptAnnounced.has(m.toolCallId)) continue;
      out.push(m);
      continue;
    }
    if (m.role === 'assistant' && m.toolCalls !== undefined) {
      const kept = m.toolCalls.filter((c) => resolved.has(c.toolCallId));
      for (const c of kept) keptAnnounced.add(c.toolCallId);
      if (kept.length === m.toolCalls.length) {
        out.push(m);
        continue;
      }
      const { toolCalls: _dropped, ...rest } = m;
      const hasContent =
        typeof rest.content === 'string'
          ? rest.content.length > 0
          : Array.isArray(rest.content) && rest.content.length > 0;
      if (kept.length === 0 && !hasContent) continue;
      out.push(kept.length > 0 ? { ...rest, toolCalls: kept } : rest);
      continue;
    }
    out.push(m);
  }
  return out;
}

/** One resolved handoff target (the factory's `handoffMap` values). */
export interface HandoffEntry<TDeps> {
  readonly agent: Agent<TDeps, unknown>;
  readonly filter: DescribedFilter | undefined;
}

/** The run-scoped context a handoff execution operates on. */
export interface HandoffRunEnv<TDeps, TOutput> {
  readonly config: Pick<AgentConfig<TDeps, TOutput>, 'deps'>;
  readonly options: AgentCallOptions<TDeps>;
  readonly state: MutableRunState & RunState;
  readonly messages: Message[];
  readonly sessionId: string;
  readonly agentId: string;
  readonly signal: AbortSignal;
  /** The run's usage accumulator - child-run usage folds into it (W-033). */
  readonly usageAcc: UsageAccumulator;
}

/**
 * Execute one handoff tool call inline (handoffs are special-cased by
 * the tool-call walk, ≤1 per step, and never routed through the
 * executor): record the {@link HandoffRecord}, transfer
 * `currentAgentId`, stream the sub-agent over the filtered history, and
 * surface its outcome as the long-standing `tool.execute.*` events +
 * tool message.
 */
export async function* executeHandoffToolCall<TDeps, TOutput>(
  env: HandoffRunEnv<TDeps, TOutput>,
  call: ToolCall,
  handoff: HandoffEntry<TDeps>,
  stepNumber: number,
): AsyncGenerator<AgentEvent<TOutput>, void, void> {
  const { config, options, state, messages, sessionId, agentId, signal, usageAcc } = env;
  yield { type: 'tool.execute.start', toolCallId: call.toolCallId };
  const filter = (handoff.filter ?? filterLib.defaultHandoffFilter()) as DescribedFilter;
  const filtered = sanitizeHandoffSeed(filter(messages) as Message[]);
  const targetId = handoff.agent.id;
  // The secrets fields record the structural reality: no
  // inheritance mechanism exists at this boundary, so the
  // target receives nothing - an empty allowlist is the
  // factually-true provenance (AG-17).
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
  // AG-22: the sub-agent inherits the parent's abort signal,
  // deps, and sessionId; its terminal `agent.end` is observed
  // so a failed/aborted sub-run surfaces as a TOOL ERROR -
  // never an empty-string success with durationMs 0.
  const subStart = Date.now();
  const subOutputs: string[] = [];
  let subResult: AgentResult<unknown> | undefined;
  const subStream = subAgent.stream(filtered as Message[], {
    signal,
    ...(options.deps !== undefined || config.deps !== undefined
      ? { deps: (options.deps ?? config.deps) as TDeps }
      : {}),
    sessionId,
  });
  for await (const subEv of subStream) {
    if (subEv.type === 'text.complete') subOutputs.push(subEv.text);
    else if (subEv.type === 'agent.end') {
      subResult = subEv.result as AgentResult<unknown>;
    }
  }
  const subDurationMs = Date.now() - subStart;
  // W-033: fold the child's usage into the parent's accounting on EVERY
  // outcome - tokens were spent whether the child completed or failed.
  if (subResult !== undefined) {
    foldChildRunUsage(state, usageAcc, subResult.state, handoff.agent.config.name);
  }
  const stepEntry = state.steps[state.steps.length - 1];
  if (subResult !== undefined && subResult.status !== 'completed') {
    const toolError: ToolError = {
      toolCallId: call.toolCallId,
      toolName: call.toolName,
      kind: subResult.status === 'aborted' ? 'aborted' : 'execution_failed',
      message: `handoff to '${targetId}' ${subResult.status}${
        subResult.error !== undefined ? `: ${subResult.error.message}` : ''
      }`,
    };
    if (stepEntry !== undefined) {
      (stepEntry.toolCalls as CompletedToolCall[]).push({
        call,
        outcome: toolError,
        stepNumber,
      });
    }
    yield {
      type: 'tool.execute.error',
      toolCallId: call.toolCallId,
      error: toolError,
    };
    const text = renderToolErrorMessage(toolError);
    messages.push({ role: 'tool', toolCallId: call.toolCallId, content: text });
    state.messages.push({ role: 'tool', toolCallId: call.toolCallId, content: text });
    return;
  }
  const result = subOutputs.join('');
  const completed: CompletedToolCall = {
    call,
    outcome: {
      toolCallId: call.toolCallId,
      toolName: call.toolName,
      output: result,
      durationMs: subDurationMs,
    },
    stepNumber,
  };
  if (stepEntry !== undefined) {
    (stepEntry.toolCalls as CompletedToolCall[]).push(completed);
  }
  yield {
    type: 'tool.execute.end',
    toolCallId: call.toolCallId,
    result,
    durationMs: subDurationMs,
  };
  messages.push({ role: 'tool', toolCallId: call.toolCallId, content: result });
  state.messages.push({
    role: 'tool',
    toolCallId: call.toolCallId,
    content: result,
  });
}
