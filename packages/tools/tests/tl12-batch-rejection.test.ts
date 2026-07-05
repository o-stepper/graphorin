/**
 * TL-12 (tools-07) regression: a rejected `executeOne` must not SHRINK
 * the batch.
 *
 * `executeOne` is designed not to throw, but a user-supplied hook that
 * does - the canonical example is a throwing `runContext.tracer.span` -
 * used to be swallowed by the parallel pump's empty `.catch(() => {})`
 * plus the final `filter(r => r !== undefined)`, so the completed batch
 * came back SHORTER than the call list. Downstream, the agent then
 * pushed no `role:'tool'` message for the missing id, leaving a dangling
 * `tool_use` that OpenAI-shaped providers reject one step later - a
 * confusing, far-from-cause failure. Both dispatch paths (sequential and
 * parallel) must instead synthesize an `execution_failed` outcome for
 * the affected slot.
 */
import type { AISpan, SpanType, StartSpanOptions, Tracer } from '@graphorin/core';
import { NOOP_TRACER, zeroUsage } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { tool } from '../src/builder/index.js';
import { createToolExecutor } from '../src/executor/index.js';
import { createToolRegistry } from '../src/registry/index.js';
import { makeRunContext } from './fixtures.js';

/** Tracer whose `span` throws for one specific tool call id. */
function throwingTracerFor(badCallId: string): Tracer {
  return {
    ...NOOP_TRACER,
    span<T extends SpanType, R>(
      opts: StartSpanOptions<T>,
      fn: (span: AISpan<T>) => R | Promise<R>,
    ): Promise<R> {
      if (opts.attrs?.['graphorin.tool.call_id'] === badCallId) {
        throw new Error('tracing backend exploded');
      }
      return NOOP_TRACER.span(opts, fn);
    },
  };
}

function buildRegistry() {
  const registry = createToolRegistry();
  registry.register(
    tool({
      name: 'echo',
      description: 'echo',
      inputSchema: z.object({ x: z.string() }),
      sideEffectClass: 'pure',
      async execute({ x }) {
        return { y: x };
      },
    }),
  );
  registry.register(
    tool({
      name: 'echo_seq',
      description: 'echo, sequential dispatch',
      inputSchema: z.object({ x: z.string() }),
      sideEffectClass: 'side-effecting',
      async execute({ x }) {
        return { y: x };
      },
    }),
  );
  return registry;
}

describe('TL-12: executeBatch never drops a slot when executeOne rejects', () => {
  it('parallel path: synthesizes execution_failed instead of shrinking the batch', async () => {
    const executor = createToolExecutor({ registry: buildRegistry() });
    const runContext = {
      ...makeRunContext(),
      tracer: throwingTracerFor('c-bad'),
      usage: {
        total: zeroUsage(),
        byModel: new Map(),
        add() {},
        reset() {},
        snapshot() {
          return Object.freeze({ total: zeroUsage(), byModel: [] });
        },
      },
    };
    const completed = await executor.executeBatch({
      calls: [
        { toolCallId: 'c-ok-1', toolName: 'echo', args: { x: 'a' } },
        { toolCallId: 'c-bad', toolName: 'echo', args: { x: 'b' } },
        { toolCallId: 'c-ok-2', toolName: 'echo', args: { x: 'c' } },
      ],
      runContext,
      stepNumber: 1,
    });

    // The batch keeps its length and order - no silent drop.
    expect(completed.map((c) => c.call.toolCallId)).toEqual(['c-ok-1', 'c-bad', 'c-ok-2']);
    const bad = completed[1]!.outcome;
    expect('kind' in bad && bad.kind).toBe('execution_failed');
    if ('message' in bad) expect(bad.message).toContain('tracing backend exploded');
    for (const idx of [0, 2]) {
      expect('output' in completed[idx]!.outcome).toBe(true);
    }
  });

  it('sequential path: a throwing span becomes execution_failed, later calls still run', async () => {
    const executor = createToolExecutor({ registry: buildRegistry() });
    const runContext = {
      ...makeRunContext(),
      tracer: throwingTracerFor('c-bad-seq'),
    };
    // `echo_seq` is side-effecting ⇒ dispatched on the sequential path.
    const completed = await executor.executeBatch({
      calls: [
        { toolCallId: 'c-bad-seq', toolName: 'echo_seq', args: { x: 'a' } },
        { toolCallId: 'c-after', toolName: 'echo_seq', args: { x: 'b' } },
      ],
      runContext,
      stepNumber: 1,
    });
    expect(completed.map((c) => c.call.toolCallId)).toEqual(['c-bad-seq', 'c-after']);
    const bad = completed[0]!.outcome;
    expect('kind' in bad && bad.kind).toBe('execution_failed');
    expect('output' in completed[1]!.outcome).toBe(true);
  });
});
