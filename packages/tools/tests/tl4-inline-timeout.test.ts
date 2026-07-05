import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { tool } from '../src/builder/index.js';
import { createToolExecutor } from '../src/executor/index.js';
import { createToolRegistry } from '../src/registry/index.js';
import { makeRunContext } from './fixtures.js';

describe('TL-4 - inline tools get an enforced wall-clock timeout', () => {
  it('a hanging signal-ignoring inline tool fails with kind "timeout"; the run continues', async () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'hang',
        description: 'never settles, ignores ctx.signal',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        execute: () => new Promise(() => {}),
      }),
    );
    registry.register(
      tool({
        name: 'after',
        description: 'still runs after the hang times out',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        execute: async () => 'alive',
      }),
    );
    const executor = createToolExecutor({ registry, inlineToolTimeoutMs: 60 });

    const started = Date.now();
    const completed = await executor.executeBatch({
      calls: [
        { toolCallId: 'c1', toolName: 'hang', args: {} },
        { toolCallId: 'c2', toolName: 'after', args: {} },
      ],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect(Date.now() - started).toBeLessThan(3_000); // bounded, not hung

    const hangOutcome = completed.find((c) => c.call.toolCallId === 'c1')?.outcome;
    if (hangOutcome === undefined || !('kind' in hangOutcome)) {
      throw new Error('expected a ToolError for the hanging tool');
    }
    expect(hangOutcome.kind).toBe('timeout'); // first real producer of this kind
    expect(hangOutcome.message).toContain('60');

    const afterOutcome = completed.find((c) => c.call.toolCallId === 'c2')?.outcome;
    if (afterOutcome === undefined || !('output' in afterOutcome)) {
      throw new Error('expected the second tool to succeed');
    }
    expect(afterOutcome.output).toBe('alive');
  });

  it('W-031: the tool observes ctx.signal aborting at timeout; kind stays "timeout"', async () => {
    const registry = createToolRegistry();
    let sawAbort = false;
    registry.register(
      tool({
        name: 'well_behaved_slow',
        description: 'slow but listens to ctx.signal',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        execute: (_input, ctx) =>
          new Promise((_resolve, reject) => {
            ctx.signal?.addEventListener('abort', () => {
              sawAbort = true;
              reject(new Error('stopped by abort'));
            });
          }),
      }),
    );
    const executor = createToolExecutor({ registry, inlineToolTimeoutMs: 50 });
    const [completed] = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'well_behaved_slow', args: {} }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    // Give the microtask queue a beat: the abort listener fires when the
    // timer trips, before/with the rejection.
    await new Promise((r) => setTimeout(r, 20));
    expect(sawAbort).toBe(true);
    const outcome = completed?.outcome;
    if (outcome === undefined || !('kind' in outcome)) throw new Error('expected ToolError');
    // NOT masked as 'aborted' - the linked signal fired because of the
    // timer, and the parent run signal never aborted.
    expect(outcome.kind).toBe('timeout');
  });

  it('W-031 regression: a REAL parent cancellation still classifies as aborted', async () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'hang2',
        description: 'never settles',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        execute: () => new Promise(() => {}),
      }),
    );
    const executor = createToolExecutor({ registry, inlineToolTimeoutMs: 5_000 });
    const controller = new AbortController();
    const runContext = { ...makeRunContext(), signal: controller.signal };
    const pending = executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'hang2', args: {} }],
      runContext,
      stepNumber: 1,
    });
    setTimeout(() => controller.abort(), 30);
    const [completed] = await pending;
    const outcome = completed?.outcome;
    if (outcome === undefined || !('kind' in outcome)) throw new Error('expected ToolError');
    expect(outcome.kind).toBe('aborted');
  });

  it('a fast tool is unaffected by the timeout', async () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'quick',
        description: 'fast',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        execute: async () => 'done',
      }),
    );
    const executor = createToolExecutor({ registry, inlineToolTimeoutMs: 5_000 });
    const completed = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'quick', args: {} }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    const outcome = completed[0]?.outcome;
    if (outcome === undefined || !('output' in outcome)) throw new Error('expected ok');
    expect(outcome.output).toBe('done');
  });
});
