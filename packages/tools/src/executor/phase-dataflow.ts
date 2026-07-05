/**
 * Data-flow provenance sink-gate phase (WI-12 / P1-3): consult the
 * optional `DataFlowGuard` before running a `side-effecting` /
 * `external-stateful` tool, audit the verdict, and enforce a `'block'`.
 * (Provenance *recording* of successful outputs happens in the
 * result-assembly phase, after sanitization.)
 *
 * @packageDocumentation
 */

import type { CompletedToolCall, ResolvedTool, RunContext, ToolCall } from '@graphorin/core';

import { incrementCounter } from '../audit/index.js';
import { failWith } from './outcome.js';
import type { ExecutorRuntime } from './types.js';

// Data-flow provenance gate (WI-12 / P1-3). Sinks only: untrusted
// content must not reach an exfiltration / mutation sink without an
// operator declassification. The guard decides + tracks taint; the
// executor audits the verdict and blocks the call when told to. Read
// tools are never gated (they cannot exfiltrate), so the common path
// pays nothing.
export function runDataFlowSinkGate(
  rt: ExecutorRuntime,
  input: {
    readonly call: ToolCall;
    readonly tool: ResolvedTool;
    readonly runContext: RunContext;
    readonly stepNumber: number;
    /**
     * Raw-shaped post-repair arguments from the validate phase (W-118)
     * - the same payload the approval gate saw and the payload the
     * executed `validatedInput` is deterministically derived from.
     * Bytes-equal to `call.args` when no repair ran.
     */
    readonly effectiveArgs: unknown;
  },
): CompletedToolCall | null {
  const { call, tool, runContext, stepNumber, effectiveArgs } = input;
  if (
    rt.options.dataFlowGuard === undefined ||
    (tool.__sideEffectClass !== 'side-effecting' && tool.__sideEffectClass !== 'external-stateful')
  ) {
    return null;
  }
  const verdict = rt.options.dataFlowGuard.inspect({
    toolName: tool.name,
    sideEffectClass: tool.__sideEffectClass,
    trustClass: tool.__trustClass,
    ...(tool.sensitivity !== undefined ? { sensitivity: tool.sensitivity } : {}),
    source: tool.__source,
    args: effectiveArgs,
    runContext,
  });
  if (verdict.action !== 'allow') {
    const auditAction =
      verdict.action === 'block'
        ? 'tool:dataflow:blocked'
        : verdict.action === 'declassify'
          ? 'tool:dataflow:declassified'
          : 'tool:dataflow:flagged';
    rt.emit({
      action: auditAction,
      actor: { kind: 'tool', id: tool.name },
      target: tool.name,
      decision: verdict.action === 'block' ? 'denied' : 'success',
      ts: Date.now(),
      context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
      metadata: {
        flow: verdict.flow,
        reason: verdict.reason,
        sourceKinds: [...verdict.sourceKinds],
        sideEffectClass: tool.__sideEffectClass,
        decision: verdict.action,
      },
    });
    incrementCounter('tool.dataflow.decision.total', {
      toolName: tool.name,
      decision: verdict.action,
      flow: verdict.flow,
    });
    if (verdict.action === 'block') {
      return failWith(
        rt,
        call,
        tool,
        'dataflow_policy_blocked',
        verdict.reason,
        runContext,
        stepNumber,
      );
    }
  }
  return null;
}
