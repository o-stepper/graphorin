/**
 * Per-call context preparation phase: resolves the sandbox policy for
 * the tool, links a per-call `AbortSignal` to the run signal (TL-11),
 * opens the streaming channel, and builds the `ToolExecutionContext`
 * handed to the tool (and to `needsApproval` predicates).
 *
 * @packageDocumentation
 */

import type { ResolvedTool, RunContext, ToolCall, ToolExecutionContext } from '@graphorin/core';
import type { ResolvedSandboxPolicy, SandboxTrustLevel } from '@graphorin/security/sandbox';
import { resolveSandbox } from '@graphorin/security/sandbox';

import { createStreamingChannel, type StreamingChannel } from '../streaming/channel.js';
import { buildToolExecutionContext } from './tool-context.js';
import type { ExecutorRuntime } from './types.js';

/** Per-call abort handle linked to the run signal. */
export interface LinkedAbort {
  readonly signal: AbortSignal;
  readonly abort: () => void;
  /** TL-11: detach from the parent - settled calls must not accumulate listeners. */
  readonly release: () => void;
}

export function linkSignal(parent: AbortSignal): LinkedAbort {
  const ac = new AbortController();
  let release: () => void = () => {};
  if (parent.aborted) {
    ac.abort();
  } else {
    const onAbort = (): void => ac.abort();
    parent.addEventListener('abort', onAbort, { once: true });
    release = () => parent.removeEventListener('abort', onAbort);
  }
  return { signal: ac.signal, abort: () => ac.abort(), release };
}

/** Everything a single tool invocation needs to run. */
export interface PreparedCallContext {
  readonly ctx: ToolExecutionContext;
  readonly channel: StreamingChannel;
  readonly linkedAbort: LinkedAbort;
  readonly sandbox: ResolvedSandboxPolicy;
  readonly input: unknown;
}

export async function prepareCallContext(
  rt: ExecutorRuntime,
  call: ToolCall,
  tool: ResolvedTool,
  runContext: RunContext,
  stepNumber: number,
  trustLevel: SandboxTrustLevel,
  inputMaybe?: unknown,
): Promise<PreparedCallContext> {
  const sandbox = resolveSandbox({
    trustLevel,
    toolName: tool.name,
    ...(tool.sandboxPolicy !== undefined
      ? { override: { kind: mapSandboxPolicy(tool.sandboxPolicy) } }
      : {}),
  });
  const linkedAbort = linkSignal(runContext.signal);
  const sink = rt.options.streamingSink;
  const channel = createStreamingChannel({
    toolName: tool.name,
    toolCallId: call.toolCallId,
    stepNumber,
    eventQueueDepth: rt.streamingEventQueueDepth,
    maxBufferBytes: rt.streamingMaxBufferBytes,
    streamingHint: tool.__streamingHint,
    ...(sink !== undefined ? { sink: (event) => sink(event) } : {}),
  });
  const ctx = buildToolExecutionContext({
    tool,
    toolCallId: call.toolCallId,
    runContext,
    signal: linkedAbort.signal,
    streamingChannel: channel,
    ...(rt.options.secretResolver !== undefined
      ? { secretResolver: rt.options.secretResolver }
      : {}),
  });
  return { ctx, channel, linkedAbort, sandbox, input: inputMaybe ?? call.args };
}

function mapSandboxPolicy(
  policy: NonNullable<ResolvedTool['sandboxPolicy']>,
): ResolvedSandboxPolicy['kind'] {
  switch (policy) {
    case 'none':
      return 'none';
    case 'sandboxed':
      return 'worker-threads';
    case 'isolated':
      return 'isolated-vm';
    case 'docker':
      return 'docker';
  }
}
