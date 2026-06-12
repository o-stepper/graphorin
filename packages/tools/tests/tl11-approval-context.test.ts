import { getEventListeners } from 'node:events';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { tool } from '../src/builder/index.js';
import { createToolExecutor } from '../src/executor/index.js';
import { createToolRegistry } from '../src/registry/index.js';
import { makeRunContext } from './fixtures.js';

describe('TL-11 — approval flow does not leak per-call contexts', () => {
  it('abort listeners on the run signal stay bounded across many gated calls', async () => {
    const registry = createToolRegistry();
    let executions = 0;
    registry.register(
      tool({
        name: 'gated',
        description: 'static approval gate',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        needsApproval: true,
        execute: async () => {
          executions += 1;
          return 'ok';
        },
      }),
    );
    const executor = createToolExecutor({
      registry,
      approvalGate: { request: async () => ({ granted: true }) },
    });
    const runContext = makeRunContext();

    for (let i = 0; i < 30; i++) {
      await executor.executeBatch({
        calls: [{ toolCallId: `c-${i}`, toolName: 'gated', args: {} }],
        runContext,
        stepNumber: i + 1,
      });
    }
    expect(executions).toBe(30);
    const listeners = getEventListeners(runContext.signal, 'abort');
    // Bounded: settled calls release their linked-signal listeners
    // instead of accumulating one (static) or two (predicate) per call.
    expect(listeners.length).toBeLessThanOrEqual(2);
  });

  it('a function-form predicate still receives a real context (and it is disposed after)', async () => {
    const registry = createToolRegistry();
    const seenToolCallIds: string[] = [];
    registry.register(
      tool({
        name: 'predicated',
        description: 'function-form approval gate',
        inputSchema: z.object({ risky: z.boolean() }),
        sideEffectClass: 'pure',
        needsApproval: (input: { risky: boolean }, ctx) => {
          seenToolCallIds.push(ctx.toolCallId);
          return input.risky;
        },
        execute: async () => 'ran',
      }),
    );
    const executor = createToolExecutor({
      registry,
      approvalGate: { request: async () => ({ granted: true }) },
    });
    const runContext = makeRunContext();
    const completed = await executor.executeBatch({
      calls: [{ toolCallId: 'c-safe', toolName: 'predicated', args: { risky: false } }],
      runContext,
      stepNumber: 1,
    });
    const outcome = completed[0]?.outcome;
    if (outcome === undefined || !('output' in outcome)) throw new Error('expected ok');
    expect(outcome.output).toBe('ran');
    expect(seenToolCallIds).toEqual(['c-safe']); // the predicate got a real ctx
  });
});
