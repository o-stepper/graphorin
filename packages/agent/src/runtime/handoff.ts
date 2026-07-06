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
import type { Agent, AgentCallOptions, AgentConfig, SubagentForwardPolicy } from '../types.js';
import type { SubAgentFoldTaint } from './agent-to-tool.js';
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
  /** W-036: which child events forward into the parent stream. */
  readonly forwardEvents?: SubagentForwardPolicy | undefined;
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
  /**
   * W-036: live read of the parent's current step span, the parent for
   * a sub-agent's `agent.run` span (one trace tree).
   */
  readonly getCurrentStepSpan?: () => import('@graphorin/core').AISpan | undefined;
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
): AsyncGenerator<AgentEvent<TOutput>, { readonly suspendRequested: boolean }, void> {
  const { config, options, state, messages, sessionId, agentId, signal } = env;
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
  // W-034: `currentAgentId` identifies the agent whose model drives the
  // NEXT step - the parent resumes driving once the child returns, so
  // the transfer is scoped to the child observation and restored in
  // `finally` (every branch, including the W-001 park, and on generator
  // teardown). The child's identity is durably recorded by the
  // HandoffRecord + handoff event.
  const previousAgentId = state.currentAgentId;
  state.currentAgentId = targetId;
  const subAgent = handoff.agent;
  try {
    // AG-22: the sub-agent inherits the parent's abort signal,
    // deps, and sessionId; its terminal `agent.end` is observed
    // so a failed/aborted sub-run surfaces as a TOOL ERROR -
    // never an empty-string success with durationMs 0.
    const parentSpan = env.getCurrentStepSpan?.();
    const subStream = subAgent.stream(filtered as Message[], {
      signal,
      ...(options.deps !== undefined || config.deps !== undefined
        ? { deps: (options.deps ?? config.deps) as TDeps }
        : {}),
      sessionId,
      // W-036: one trace tree - the child's run span parents here.
      ...(parentSpan !== undefined ? { parentSpan } : {}),
    });
    return yield* runSubAgentCall<TDeps, TOutput>(
      env,
      call,
      {
        agentName: handoff.agent.config.name,
        subStream: subStream as AsyncIterable<AgentEvent<unknown>>,
        errorLabel: `handoff to '${targetId}'`,
        renderCompleted: (_subResult, turns) => ({ output: turns.join('') }),
        ...(handoff.forwardEvents !== undefined ? { forwardEvents: handoff.forwardEvents } : {}),
      },
      stepNumber,
    );
  } finally {
    state.currentAgentId = previousAgentId;
  }
}

/** Branch-specific spec for the shared sub-run seam (W-001). */
export interface SubRunSpec {
  /** The child agent's configured name (parking + usage folding). */
  readonly agentName: string;
  readonly subStream: AsyncIterable<AgentEvent<unknown>>;
  /** Prefix for the failed/aborted tool-error message. */
  readonly errorLabel: string;
  /** Shape a completed child into the tool-message payload. */
  readonly renderCompleted: (
    subResult: AgentResult<unknown>,
    turns: ReadonlyArray<string>,
  ) => { readonly output: unknown; readonly taint?: SubAgentFoldTaint };
  /** Optional taint sink (the inline toTool path records D2 folds). */
  readonly recordTaint?: (taint: SubAgentFoldTaint, renderedText: string) => void;
  /** W-036: forwarding policy (default `'lifecycle'`). */
  readonly forwardEvents?: SubagentForwardPolicy;
}

/**
 * W-036: the `'lifecycle'` forwarding whitelist - load-bearing child
 * events, never the high-frequency text/reasoning deltas.
 */
const LIFECYCLE_FORWARD_TYPES: ReadonlySet<string> = new Set([
  'tool.execute.start',
  'tool.execute.progress',
  'tool.execute.partial',
  'tool.execute.end',
  'tool.execute.error',
  'tool.approval.requested',
  'tool.approval.granted',
  'tool.approval.denied',
  'guardrail.tripped',
  'agent.lateral-leak.detected',
  'context.compacted',
  'agent.error',
]);

function shouldForwardSubagentEvent(policy: SubagentForwardPolicy, eventType: string): boolean {
  if (policy === 'none') return false;
  if (policy === 'all') return true;
  return LIFECYCLE_FORWARD_TYPES.has(eventType);
}

/**
 * W-001: compose the sub-run routing path. An approval mirrored from a
 * child that itself parked a grandchild already carries the CHILD-level
 * routing; prefixing this level's park key keeps the full path intact
 * (`<parentCallId>/<childCallId>/...`), so each resume level strips one
 * segment and routes the remainder down. Park-key toolCallIds must not
 * contain `/` (provider call ids do not).
 */
export function composeSubRunPath(parkKey: string, nested: string | undefined): string {
  return nested === undefined ? parkKey : `${parkKey}/${nested}`;
}

/** Split one routing segment off a composed sub-run path (W-001). */
export function splitSubRunPath(path: string): {
  readonly head: string;
  readonly rest: string | undefined;
} {
  const idx = path.indexOf('/');
  if (idx === -1) return { head: path, rest: undefined };
  return { head: path.slice(0, idx), rest: path.slice(idx + 1) };
}

/** Park (or refresh) a suspended child on the parent state (W-001). */
function parkSubRun(
  state: MutableRunState & RunState,
  call: ToolCall,
  agentName: string,
  childState: RunState,
): void {
  const entry = {
    toolCallId: call.toolCallId,
    toolName: call.toolName,
    targetAgentName: agentName,
    state: childState,
  };
  const subs = state.pendingSubRuns;
  if (subs === undefined) {
    state.pendingSubRuns = [entry];
    return;
  }
  const idx = subs.findIndex((s) => s.toolCallId === call.toolCallId);
  if (idx === -1) subs.push(entry);
  else subs[idx] = entry;
}

/**
 * W-001: the shared sub-run seam behind handoff and inline `toTool`
 * execution. Observes the child stream and settles the outcome:
 *
 * - `awaiting_approval`: the child PARKS on `state.pendingSubRuns`, its
 *   pending approvals mirror onto the parent's `pendingApprovals` with
 *   `subRunToolCallId` set, and the walk suspends the parent once per
 *   step. The parked toolCallId keeps NO tool message - exactly like a
 *   directly-gated call - and the resume guard keeps it out of the
 *   provider loop.
 * - terminal failure: a typed tool error (the pre-W-001 behavior).
 * - completed: the branch-shaped output becomes the tool message.
 *
 * Usage folds on terminal outcomes only - the child's cumulative usage
 * folds exactly once when it finally completes or fails, never at a
 * park (a park would double-count the pre-suspend tokens on resume).
 */
export async function* runSubAgentCall<TDeps, TOutput>(
  env: HandoffRunEnv<TDeps, TOutput>,
  call: ToolCall,
  spec: SubRunSpec,
  stepNumber: number,
): AsyncGenerator<AgentEvent<TOutput>, { readonly suspendRequested: boolean }, void> {
  const { state, messages, usageAcc } = env;
  const subStart = Date.now();
  const turns: string[] = [];
  const forwardPolicy = spec.forwardEvents ?? 'lifecycle';
  let subResult: AgentResult<unknown> | undefined;
  for await (const subEv of spec.subStream) {
    if (subEv.type === 'text.complete') turns.push(subEv.text);
    else if (subEv.type === 'agent.end') {
      subResult = subEv.result as AgentResult<unknown>;
    }
    // W-036: surface the child's load-bearing events in the parent
    // stream, wrapped so they never alias the parent's own lifecycle.
    if (shouldForwardSubagentEvent(forwardPolicy, subEv.type)) {
      yield {
        type: 'subagent.event',
        toolCallId: call.toolCallId,
        agentName: spec.agentName,
        event: subEv as AgentEvent<unknown>,
      } as AgentEvent<TOutput>;
    }
  }
  const subDurationMs = Date.now() - subStart;

  if (subResult !== undefined && subResult.status === 'awaiting_approval') {
    parkSubRun(state, call, spec.agentName, subResult.state);
    for (const approval of subResult.state.pendingApprovals) {
      state.pendingApprovals.push({
        ...approval,
        subRunToolCallId: composeSubRunPath(call.toolCallId, approval.subRunToolCallId),
      });
      yield {
        type: 'tool.approval.requested',
        toolCallId: approval.toolCallId,
        ...(approval.reason !== undefined ? { reason: approval.reason } : {}),
      };
    }
    return { suspendRequested: true };
  }

  // W-033: fold the child's usage into the parent's accounting on every
  // TERMINAL outcome - tokens were spent whether it completed or failed.
  if (subResult !== undefined) {
    foldChildRunUsage(state, usageAcc, subResult.state, spec.agentName);
  }
  const stepEntry = state.steps[state.steps.length - 1];
  if (subResult !== undefined && subResult.status !== 'completed') {
    const toolError: ToolError = {
      toolCallId: call.toolCallId,
      toolName: call.toolName,
      kind: subResult.status === 'aborted' ? 'aborted' : 'execution_failed',
      message: `${spec.errorLabel} ${subResult.status}${
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
    return { suspendRequested: false };
  }
  const shaped =
    subResult !== undefined ? spec.renderCompleted(subResult, turns) : { output: turns.join('') };
  const result =
    typeof shaped.output === 'string' ? shaped.output : (JSON.stringify(shaped.output) ?? '');
  if ('taint' in shaped && shaped.taint !== undefined) {
    spec.recordTaint?.(shaped.taint, result);
  }
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
  return { suspendRequested: false };
}
