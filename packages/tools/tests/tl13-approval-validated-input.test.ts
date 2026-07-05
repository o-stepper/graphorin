/**
 * TL-13 (tools-02) regression: the approval flow runs AFTER validation +
 * repair and evaluates the validated input.
 *
 * Pre-fix the gate ran first on raw `call.args`: a human could approve
 * invalid args X, the repair hook then rewrote them into schema-valid Y,
 * and Y executed without re-gating - a TOCTOU on a security control.
 * Predicates also received raw pre-coercion values their typed signature
 * never promised.
 */
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { tool } from '../src/builder/index.js';
import { type ApprovalGate, createToolExecutor } from '../src/executor/index.js';
import { createToolRegistry } from '../src/registry/index.js';
import { makeRunContext } from './fixtures.js';

describe('TL-13: approval evaluates validated input, after repair', () => {
  it('the approval record carries the POST-REPAIR args a human actually vets', async () => {
    const registry = createToolRegistry();
    const executed: unknown[] = [];
    registry.register(
      tool({
        name: 'refund',
        description: 'refund an order',
        inputSchema: z.object({ amountUsd: z.number() }),
        needsApproval: true,
        sideEffectClass: 'external-stateful',
        async execute(input) {
          executed.push(input);
          return 'refunded';
        },
      }),
    );
    const seenByGate: unknown[] = [];
    const gate: ApprovalGate = {
      request: async (_call, approval) => {
        seenByGate.push(approval.args);
        return { granted: true };
      },
    };
    const repair = {
      repair: vi.fn(async () => ({ amountUsd: 42 })),
    };
    const executor = createToolExecutor({ registry, approvalGate: gate, repair });

    const completed = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'refund', args: { amountUsd: 'not-a-number' } }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });

    expect(repair.repair).toHaveBeenCalledTimes(1);
    // The gate saw the repaired args - the exact payload that executed -
    // never the invalid originals.
    expect(seenByGate).toEqual([{ amountUsd: 42 }]);
    expect(executed).toEqual([{ amountUsd: 42 }]);
    expect('output' in completed[0]!.outcome).toBe(true);
  });

  it('a function-form predicate receives the VALIDATED (transformed) input', async () => {
    const registry = createToolRegistry();
    const predicateSaw: unknown[] = [];
    registry.register(
      tool({
        name: 'post_message',
        description: 'post',
        // Transform: the validated input differs structurally from raw args.
        inputSchema: z.object({ body: z.string().transform((s) => s.trim()) }),
        needsApproval: (input) => {
          predicateSaw.push(input);
          return false; // no approval needed - we only probe what it saw
        },
        sideEffectClass: 'side-effecting',
        async execute(input) {
          return input.body;
        },
      }),
    );
    const executor = createToolExecutor({ registry });
    const completed = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'post_message', args: { body: '  hi  ' } }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect(predicateSaw).toEqual([{ body: 'hi' }]);
    const outcome = completed[0]!.outcome;
    expect('output' in outcome && outcome.output).toBe('hi');
  });

  it('invalid args fail as invalid_input BEFORE any approval interaction', async () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'strict_gated',
        description: 'strict',
        inputSchema: z.object({ n: z.number() }),
        needsApproval: true,
        sideEffectClass: 'external-stateful',
        async execute({ n }) {
          return n;
        },
      }),
    );
    const gate: ApprovalGate = { request: vi.fn(async () => ({ granted: true })) };
    const executor = createToolExecutor({ registry, approvalGate: gate });
    const completed = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'strict_gated', args: { n: 'x' } }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    const outcome = completed[0]!.outcome;
    expect('kind' in outcome && outcome.kind).toBe('invalid_input');
    // No human was bothered with args that cannot run.
    expect(gate.request).not.toHaveBeenCalled();
  });

  it('disableRepair: a pre-approved batch fails invalid_input instead of repairing', async () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'wire',
        description: 'wire funds',
        inputSchema: z.object({ amountUsd: z.number() }),
        sideEffectClass: 'external-stateful',
        async execute(input) {
          return input.amountUsd;
        },
      }),
    );
    const repair = { repair: vi.fn(async () => ({ amountUsd: 7 })) };
    const executor = createToolExecutor({ registry, repair });
    const completed = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'wire', args: { amountUsd: 'zzz' } }],
      runContext: makeRunContext(),
      stepNumber: 1,
      disableRepair: true,
    });
    const outcome = completed[0]!.outcome;
    expect('kind' in outcome && outcome.kind).toBe('invalid_input');
    // The repair hook must never rewrite a pre-approved payload.
    expect(repair.repair).not.toHaveBeenCalled();
  });
});
