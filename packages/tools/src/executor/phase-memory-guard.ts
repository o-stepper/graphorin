/**
 * Memory-modification guard phase: snapshot the configured memory
 * regions before the tool runs; verify them afterwards and audit any
 * mismatch. The guard factory returns `null` when the configured tier
 * is `'pure'` / `'side-effecting-no-memory'` / when no factory is
 * configured; the snapshot/verify dance is then skipped.
 *
 * @packageDocumentation
 */

import type { AISpan, ResolvedTool, RunContext, ToolCall } from '@graphorin/core';
import type { MemoryModificationGuard } from '@graphorin/security/guard';

import { incrementCounter } from '../audit/index.js';
import type { ExecutorRuntime } from './types.js';

/** State carried from the pre-execution snapshot to the post-execution verify. */
export interface MemoryGuardState {
  readonly guard: MemoryModificationGuard | null;
  readonly guardTier: NonNullable<ResolvedTool['memoryGuardTier']>;
  readonly preSnapshot: Awaited<ReturnType<MemoryModificationGuard['snapshot']>> | null;
}

// Memory-modification guard - snapshot before; verify after.
export async function snapshotMemoryGuard(
  rt: ExecutorRuntime,
  tool: ResolvedTool,
): Promise<MemoryGuardState> {
  const guardTier = tool.memoryGuardTier ?? 'unknown';
  const guard = rt.memoryGuardFactory(guardTier);
  let preSnapshot: Awaited<ReturnType<MemoryModificationGuard['snapshot']>> | null = null;
  if (guard !== null && rt.memoryRegionReader !== undefined) {
    try {
      preSnapshot = await guard.snapshot(rt.memoryRegionReader);
    } catch {
      preSnapshot = null;
    }
  }
  return { guard, guardTier, preSnapshot };
}

// Post-execute memory-modification guard verification.
export async function verifyMemoryGuard(
  rt: ExecutorRuntime,
  input: {
    readonly call: ToolCall;
    readonly tool: ResolvedTool;
    readonly runContext: RunContext;
    readonly stepNumber: number;
    readonly span: AISpan<'tool.execute'>;
    readonly state: MemoryGuardState;
    readonly executeError: unknown;
  },
): Promise<void> {
  const { call, tool, runContext, stepNumber, span, state, executeError } = input;
  const { guard, guardTier, preSnapshot } = state;
  if (
    guard !== null &&
    preSnapshot !== null &&
    rt.memoryRegionReader !== undefined &&
    executeError === undefined
  ) {
    try {
      const verify = await guard.verify(preSnapshot, rt.memoryRegionReader);
      span.setAttributes({
        'graphorin.tool.memory_guard.verify.ok': verify.ok,
        'graphorin.tool.memory_guard.verify.duration_us': verify.verifyDurationUs,
      });
      if (!verify.ok) {
        rt.emit({
          action: 'tool:execute:error',
          actor: { kind: 'tool', id: tool.name },
          target: tool.name,
          decision: 'error',
          ts: Date.now(),
          context: { runId: runContext.runId, stepNumber, toolCallId: call.toolCallId },
          metadata: {
            kind: 'memory-guard-mismatch',
            regions: [...verify.mismatched],
            tier: guardTier,
          },
        });
        incrementCounter('tool.executor.memory_guard.mismatch.total', {
          toolName: tool.name,
          tier: guardTier,
        });
      }
    } catch {
      // Guard failures never tear down the tool execution path.
    }
  }
}
