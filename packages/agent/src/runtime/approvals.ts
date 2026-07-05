/**
 * Durable HITL approval handling for the agent runtime: the
 * pre-execution `needsApproval` probe (with its rejecting secrets
 * accessor), gated-args validation at the pre-screen, resume-directive
 * processing (grant / deny decisions against persisted pending
 * approvals), and the exactly-once dispatch of resumed approved calls
 * with write-ahead intent checkpoints. Extracted verbatim from
 * `factory.ts` (issue #23).
 *
 * @packageDocumentation
 */

import type {
  AgentEvent,
  Message,
  RunContext,
  RunState,
  Tool,
  ToolApproval,
  ToolCall,
  ToolExecutionContext,
} from '@graphorin/core';
import { NOOP_LOGGER, zeroUsage } from '@graphorin/core';
import type { ToolExecutor } from '@graphorin/tools/executor';
import { serializeRunState } from '../run-state/index.js';
import type { AgentConfig, ResumeDirective } from '../types.js';
import type { DispatchBatchFn } from './dispatch.js';
import type { MutableRunState } from './run-input.js';

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
export async function invokeNeedsApproval(
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

/**
 * tools-02: validate an approval-gated call's args at the pre-screen so
 * the gate decision - and what a human is asked to approve - is the input
 * that will actually execute. Structural + defensive: `undefined` when
 * the tool exposes no callable `safeParse` (nothing to validate here; the
 * executor still validates at dispatch); a throwing schema counts as a
 * validation failure rather than crashing the loop.
 */
export function safeParseGatedArgs(
  tool: { readonly inputSchema?: unknown },
  args: unknown,
):
  | { readonly success: true; readonly data: unknown }
  | { readonly success: false; readonly message: string }
  | undefined {
  const schema = tool.inputSchema as { safeParse?: (value: unknown) => unknown } | null | undefined;
  const safeParse = schema?.safeParse;
  if (typeof safeParse !== 'function') return undefined;
  try {
    const parsed = safeParse.call(schema, args) as {
      readonly success?: boolean;
      readonly data?: unknown;
      readonly error?: { readonly message?: string };
    };
    if (parsed.success === true) return { success: true, data: parsed.data };
    return {
      success: false,
      message: parsed.error?.message ?? 'schema validation failed',
    };
  } catch (cause) {
    return {
      success: false,
      message: cause instanceof Error ? cause.message : String(cause),
    };
  }
}

/** The run-scoped context the resume-directive pass operates on. */
export interface ResumeRunEnv {
  readonly state: MutableRunState & RunState;
  readonly messages: Message[];
}

/**
 * Process resume directive - apply approval decisions to any
 * pending approvals captured in the previous suspend.
 *
 * Fills `resumedApprovedCalls` / `grantedApprovals` in place (they are
 * declared by the run loop, which dispatches the granted subset next).
 */
export async function* processResumeDirective<TOutput>(
  env: ResumeRunEnv,
  approvals: NonNullable<ResumeDirective['approvals']>,
  resumedApprovedCalls: ToolCall[],
  grantedApprovals: ToolApproval[],
): AsyncGenerator<AgentEvent<TOutput>, void, void> {
  const { state, messages } = env;
  // Step-journal: tool calls already completed on a prior resume are recorded
  // in the journal (`state.steps`); a re-resume must not run their side effects
  // again. Collect their ids so an approved call already journaled is replayed,
  // not re-executed (exactly-once; AG-1).
  const journaledCallIds = new Set<string>();
  for (const step of state.steps) {
    for (const completed of step.toolCalls) journaledCallIds.add(completed.call.toolCallId);
  }

  const decisions = new Map(approvals.map((d) => [d.toolCallId, d]));
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
      // Step-journal: if this approved call already ran on a prior resume -
      // journaled in `state.steps` with its result still in the message
      // buffer - replay it instead of running the side effect again
      // (exactly-once across re-resumes). If the journal entry exists but its
      // result message was lost, fall through to a single re-execution (the
      // documented "at most one re-execution" bound).
      if (
        journaledCallIds.has(approval.toolCallId) &&
        messages.some((m) => m.role === 'tool' && m.toolCallId === approval.toolCallId)
      ) {
        continue;
      }
      // AG-1: queue the approved call for REAL execution (dispatched
      // below). It runs through the same ToolExecutor as any other tool
      // call - taint / audit / result recording - instead of pushing a
      // "[not actually executed]" placeholder that left the gated side
      // effect unreachable.
      resumedApprovedCalls.push({
        toolCallId: approval.toolCallId,
        toolName: approval.toolName,
        args: approval.args,
      });
      grantedApprovals.push(approval);
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
}

/** What the resumed-approval dispatch needs from the run loop's scope. */
export interface ResumedDispatchEnv<TDeps, TOutput> {
  readonly config: Pick<AgentConfig<TDeps, TOutput>, 'checkpointStore'>;
  readonly state: MutableRunState & RunState;
  readonly messages: Message[];
  readonly runContextBase: RunContext<TDeps>;
  readonly toolExecutor: ToolExecutor;
  readonly dispatchBatch: DispatchBatchFn<TDeps, TOutput>;
}

/**
 * AG-1: execute the approved gated calls for REAL before the provider
 * loop - the model sees their genuine results on the first step. They
 * run through the shared ToolExecutor (taint / audit) and record
 * CompletedToolCalls in a resume step. Dispatching here (outside the
 * loop's approval pre-screen) also means the gated call never
 * re-suspends, so there is no livelock.
 *
 * agent-07: this dispatch runs even when OTHER approvals remain
 * pending. A granted call has already been removed from
 * `pendingApprovals`, so skipping it (as the old order did - the
 * suspended-guard returned before the dispatch) stranded it
 * unrunnable forever; the run re-suspends with the remainder below.
 */
export async function* dispatchResumedApprovals<TDeps, TOutput>(
  env: ResumedDispatchEnv<TDeps, TOutput>,
  resumedApprovedCalls: ToolCall[],
  grantedApprovals: ToolApproval[],
): AsyncGenerator<AgentEvent<TOutput>, void, void> {
  const { config, state, messages, runContextBase, toolExecutor, dispatchBatch } = env;
  // agent-02 write-ahead intent: persist a checkpoint equivalent to
  // the pre-dispatch suspended state (granted approvals re-attached
  // to `pendingApprovals`) BEFORE any side effect runs. A crash-retry
  // against this checkpoint re-resumes with the same directive and
  // re-dispatches - the documented at-most-one-re-execution bound -
  // and its nodeName records that a grant arrived and dispatch was in
  // flight.
  if (config.checkpointStore !== undefined) {
    const prevStatus = state.status;
    state.status = 'awaiting_approval';
    state.pendingApprovals.unshift(...grantedApprovals);
    const intentState = serializeRunState(state, { stripTracingApiKey: true });
    state.pendingApprovals.splice(0, grantedApprovals.length);
    state.status = prevStatus;
    await config.checkpointStore.put(
      state.id,
      'agent',
      {
        id: state.id,
        threadId: state.id,
        namespace: 'agent',
        state: intentState,
        channelVersions: {},
        stepNumber: 0,
        createdAt: new Date().toISOString(),
      },
      { source: 'sync', status: 'suspended', nodeName: 'agent.resume.intent' },
    );
  }
  state.steps.push({
    stepNumber: 0,
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    usage: zeroUsage(),
    toolCalls: [],
    agentId: state.currentAgentId,
  });
  // tools-02: a human granted exactly `approval.args` - the repair
  // hook must not rewrite a pre-approved payload behind the grant, so
  // a (should-be-impossible) validation failure surfaces as
  // `invalid_input` instead of executing args nobody saw.
  yield* dispatchBatch(
    resumedApprovedCalls,
    toolExecutor,
    { ...runContextBase, stepNumber: 0, messages },
    0,
    { disableRepair: true },
  );
  // agent-02: persist the journaled post-dispatch state. From THIS
  // checkpoint a re-delivered resume is exactly-once: the granted ids
  // are no longer pending and their journal entries + tool messages
  // are present, so nothing re-dispatches. (For the manual JSON flow,
  // the same state is returned as `result.state` - persist it after
  // every resume to get the same guarantee.)
  if (config.checkpointStore !== undefined) {
    await config.checkpointStore.put(
      state.id,
      'agent',
      {
        id: state.id,
        threadId: state.id,
        namespace: 'agent',
        state: serializeRunState(state, { stripTracingApiKey: true }),
        channelVersions: {},
        stepNumber: 0,
        createdAt: new Date().toISOString(),
      },
      {
        source: 'sync',
        status: state.status === 'awaiting_approval' ? 'suspended' : 'running',
        nodeName: 'agent.resume.dispatched',
      },
    );
  }
}
