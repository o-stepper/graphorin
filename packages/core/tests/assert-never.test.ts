import { describe, expect, it } from 'vitest';

import type { AgentEvent } from '../src/types/agent-event.js';
import type { MemoryKind } from '../src/types/memory.js';
import type { MessageContent } from '../src/types/message.js';
import type { ToolErrorKind } from '../src/types/tool.js';
import type { WorkflowEvent } from '../src/types/workflow-event.js';
import { assertNever } from '../src/utils/assert-never.js';

describe('assertNever', () => {
  it('throws with the supplied message', () => {
    expect(() => assertNever('x' as never, 'unhandled')).toThrowError(/unhandled/);
  });

  it('throws with the default message when none is supplied', () => {
    expect(() => assertNever('x' as never)).toThrow(/unhandled discriminated-union variant/);
  });
});

/* ------------------------------------------------------------------ *
 * Compile-time exhaustiveness checks for our discriminated unions.
 *
 * If any of these switches misses a variant, `assertNever` becomes a
 * type error at compile time. The runtime cases are unreachable; the
 * test exists so a future refactor that adds a new variant breaks the
 * build instead of silently introducing a hole.
 * ------------------------------------------------------------------ */

function describeAgentEvent(e: AgentEvent): string {
  switch (e.type) {
    case 'agent.start':
      return e.runId;
    case 'step.start':
      return String(e.stepNumber);
    case 'text.delta':
      return e.delta;
    case 'text.complete':
      return e.text;
    case 'reasoning.delta':
      return e.delta;
    case 'tool.call.start':
      return e.toolCallId;
    case 'tool.call.delta':
      return e.argsDelta;
    case 'tool.call.end':
      return e.toolCallId;
    case 'tool.execute.start':
      return e.toolCallId;
    case 'tool.execute.progress':
      return e.toolCallId;
    case 'tool.execute.partial':
      return e.toolCallId;
    case 'tool.execute.end':
      return e.toolCallId;
    case 'tool.execute.error':
      return e.error.message;
    case 'tool.approval.requested':
      return e.toolCallId;
    case 'tool.approval.granted':
      return e.toolCallId;
    case 'tool.approval.denied':
      return e.toolCallId;
    case 'context.compacted':
      return e.runId;
    case 'handoff':
      return e.toAgentId;
    case 'agent.steered':
      return e.runId;
    case 'agent.followup.queued':
      return e.runId;
    case 'agent.cancelling':
      return e.runId;
    case 'agent.model.fellback':
      return `${e.from}->${e.to}`;
    case 'agent.fanout.spawned':
      return e.fanOutId;
    case 'agent.fanout.merged':
      return e.fanOutId;
    case 'agent.evaluator.iteration':
      return String(e.iteration);
    case 'agent.evaluator.converged':
      return e.terminationReason;
    case 'agent.progress.written':
      return e.ref.path;
    case 'agent.progress.read':
      return e.queriedRunId;
    case 'agent.lateral-leak.detected':
      return e.vector;
    case 'file.generated':
      return e.mimeType;
    case 'source.cited':
      return e.uri;
    case 'step.end':
      return String(e.stepNumber);
    case 'guardrail.tripped':
      return e.guardrailName;
    case 'verifier.result':
      return e.verifierId;
    case 'subagent.event':
      return e.agentName;
    case 'agent.end':
      return e.runId;
    case 'agent.error':
      return e.error.message;
    default:
      return assertNever(e);
  }
}

function describeWorkflowEvent(e: WorkflowEvent): string {
  switch (e.type) {
    case 'workflow.start':
      return e.threadId;
    case 'workflow.step.start':
      return String(e.stepNumber);
    case 'workflow.step.end':
      return String(e.stepNumber);
    case 'workflow.task.start':
      return e.taskId;
    case 'workflow.task.end':
      return e.taskId;
    case 'workflow.channel.update':
      return e.channel;
    case 'workflow.checkpoint.written':
      return e.checkpointId;
    case 'workflow.suspended':
      return e.threadId;
    case 'workflow.resumed':
      return e.threadId;
    case 'workflow.end':
      return e.threadId;
    case 'workflow.error':
      return e.error.message;
    case 'workflow.custom':
      return e.name;
    default:
      return assertNever(e);
  }
}

function describeMessageContent(c: MessageContent): string {
  switch (c.type) {
    case 'text':
      return c.text;
    case 'image':
      return c.mimeType ?? '';
    case 'audio':
      return c.mimeType ?? '';
    case 'file':
      return c.mimeType;
    case 'reasoning':
      return c.text;
    default:
      return assertNever(c);
  }
}

function describeMemoryKind(k: MemoryKind): string {
  switch (k) {
    case 'working':
    case 'session':
    case 'episodic':
    case 'semantic':
    case 'procedural':
    case 'shared':
    case 'insight':
      return k;
    default:
      return assertNever(k);
  }
}

function describeToolErrorKind(k: ToolErrorKind): string {
  switch (k) {
    case 'approval_denied':
    case 'sandbox_violation':
    case 'timeout':
    case 'invalid_input':
    case 'invalid_output':
    case 'execution_failed':
    case 'unknown_tool':
    case 'aborted':
    case 'inbound_sanitization_blocked':
    case 'rate_limited':
    case 'dataflow_policy_blocked':
    case 'capability_blocked':
      return k;
    default:
      return assertNever(k);
  }
}

describe('discriminated-union exhaustiveness', () => {
  it('describeAgentEvent compiles for every variant', () => {
    expect(typeof describeAgentEvent).toBe('function');
  });
  it('describeWorkflowEvent compiles for every variant', () => {
    expect(typeof describeWorkflowEvent).toBe('function');
  });
  it('describeMessageContent compiles for every variant', () => {
    expect(typeof describeMessageContent).toBe('function');
  });
  it('describeMemoryKind compiles for every variant', () => {
    expect(typeof describeMemoryKind).toBe('function');
  });
  it('describeToolErrorKind compiles for every variant', () => {
    expect(typeof describeToolErrorKind).toBe('function');
  });
});
