import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { onToolAudit, type ToolAuditEvent } from '../src/audit/index.js';
import { tool } from '../src/builder/index.js';
import {
  createToolExecutor,
  type DataFlowGuard,
  type DataFlowInspectInput,
  type DataFlowRecordInput,
  type DataFlowVerdict,
} from '../src/executor/index.js';
import { createToolRegistry } from '../src/registry/index.js';
import { makeRunContext } from './fixtures.js';

function makeFakeGuard(verdicts: Record<string, DataFlowVerdict> = {}): {
  guard: DataFlowGuard;
  inspected: DataFlowInspectInput[];
  recorded: DataFlowRecordInput[];
} {
  const inspected: DataFlowInspectInput[] = [];
  const recorded: DataFlowRecordInput[] = [];
  const guard: DataFlowGuard = {
    inspect(input) {
      inspected.push(input);
      return verdicts[input.toolName] ?? { action: 'allow' };
    },
    record(input) {
      recorded.push(input);
    },
  };
  return { guard, inspected, recorded };
}

function captureAudit(): { events: ToolAuditEvent[]; stop: () => void } {
  const events: ToolAuditEvent[] = [];
  const stop = onToolAudit((e) => events.push(e));
  return { events, stop };
}

describe('ToolExecutor - data-flow provenance gate (WI-12 / P1-3)', () => {
  const teardowns: Array<() => void> = [];
  afterEach(() => {
    for (const t of teardowns.splice(0)) t();
  });

  it('inspects only sinks, never read-only / pure tools', async () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'reader',
        description: 'read-only',
        inputSchema: z.object({}),
        sideEffectClass: 'read-only',
        async execute() {
          return 'read';
        },
      }),
    );
    registry.register(
      tool({
        name: 'sink',
        description: 'external sink',
        inputSchema: z.object({}),
        sideEffectClass: 'external-stateful',
        async execute() {
          return 'sent';
        },
      }),
    );
    const { guard, inspected, recorded } = makeFakeGuard();
    const executor = createToolExecutor({ registry, dataFlowGuard: guard });
    await executor.executeBatch({
      calls: [
        { toolCallId: 'c1', toolName: 'reader', args: {} },
        { toolCallId: 'c2', toolName: 'sink', args: {} },
      ],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect(inspected.map((i) => i.toolName)).toEqual(['sink']);
    // Both successful outputs are recorded for downstream taint checks.
    expect(recorded.map((r) => r.toolName).sort()).toEqual(['reader', 'sink']);
  });

  it('blocks a sink on a "block" verdict - execute never runs', async () => {
    const registry = createToolRegistry();
    let executed = false;
    registry.register(
      tool({
        name: 'send',
        description: 'external sink',
        inputSchema: z.object({}),
        sideEffectClass: 'external-stateful',
        async execute() {
          executed = true;
          return 'sent';
        },
      }),
    );
    const { guard } = makeFakeGuard({
      send: {
        action: 'block',
        flow: 'untrusted-to-sink',
        reason: 'tainted',
        sourceKinds: ['web-search'],
      },
    });
    const { events, stop } = captureAudit();
    teardowns.push(stop);
    const executor = createToolExecutor({ registry, dataFlowGuard: guard });
    const [completed] = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'send', args: {} }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect(executed).toBe(false);
    expect('kind' in completed!.outcome).toBe(true);
    if ('kind' in completed!.outcome) {
      expect(completed!.outcome.kind).toBe('dataflow_policy_blocked');
      expect(completed!.outcome.message).toContain('tainted');
    }
    expect(events.some((e) => e.action === 'tool:dataflow:blocked')).toBe(true);
  });

  it('proceeds (and audits) on a "flag" verdict - shadow mode', async () => {
    const registry = createToolRegistry();
    let executed = false;
    registry.register(
      tool({
        name: 'send',
        description: 'external sink',
        inputSchema: z.object({}),
        sideEffectClass: 'external-stateful',
        async execute() {
          executed = true;
          return 'sent';
        },
      }),
    );
    const { guard } = makeFakeGuard({
      send: { action: 'flag', flow: 'lethal-trifecta', reason: 'shadow', sourceKinds: ['mcp'] },
    });
    const { events, stop } = captureAudit();
    teardowns.push(stop);
    const executor = createToolExecutor({ registry, dataFlowGuard: guard });
    const [completed] = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'send', args: {} }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect(executed).toBe(true);
    expect('output' in completed!.outcome).toBe(true);
    expect(events.some((e) => e.action === 'tool:dataflow:flagged')).toBe(true);
    expect(events.some((e) => e.action === 'tool:dataflow:blocked')).toBe(false);
  });

  it('proceeds (and audits) on a "declassify" verdict', async () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'send',
        description: 'external sink',
        inputSchema: z.object({}),
        sideEffectClass: 'external-stateful',
        async execute() {
          return 'sent';
        },
      }),
    );
    const { guard } = makeFakeGuard({
      send: {
        action: 'declassify',
        flow: 'untrusted-to-sink',
        reason: 'operator',
        sourceKinds: [],
      },
    });
    const { events, stop } = captureAudit();
    teardowns.push(stop);
    const executor = createToolExecutor({ registry, dataFlowGuard: guard });
    const [completed] = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'send', args: {} }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect('output' in completed!.outcome).toBe(true);
    expect(events.some((e) => e.action === 'tool:dataflow:declassified')).toBe(true);
  });

  it('records the sanitized output text + provenance for a successful call', async () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'producer',
        description: 'produces content',
        inputSchema: z.object({}),
        sideEffectClass: 'read-only',
        async execute() {
          return 'hello-output-marker';
        },
      }),
    );
    const { guard, recorded } = makeFakeGuard();
    const executor = createToolExecutor({ registry, dataFlowGuard: guard });
    await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'producer', args: {} }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect(recorded).toHaveLength(1);
    expect(recorded[0]!.outputText).toContain('hello-output-marker');
    expect(typeof recorded[0]!.trustClass).toBe('string');
    expect(recorded[0]!.source).toBeDefined();
  });

  it('is inert when no guard is configured', async () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'send',
        description: 'external sink',
        inputSchema: z.object({}),
        sideEffectClass: 'external-stateful',
        async execute() {
          return 'sent';
        },
      }),
    );
    const executor = createToolExecutor({ registry });
    const [completed] = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'send', args: {} }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect('output' in completed!.outcome).toBe(true);
  });

  it('W-118: the guard inspects POST-REPAIR args, not the raw call.args', async () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'send',
        description: 'external sink',
        inputSchema: z.object({ message: z.string() }),
        sideEffectClass: 'external-stateful',
        async execute() {
          return 'sent';
        },
      }),
    );
    const { guard, inspected } = makeFakeGuard();
    const executor = createToolExecutor({
      registry,
      dataFlowGuard: guard,
      repair: {
        async repair() {
          // Fix the invalid args by introducing a string the raw args
          // never carried - the gate must see it.
          return { message: 'repair-introduced-untrusted-span' };
        },
      },
    });
    const [completed] = await executor.executeBatch({
      // Invalid against the schema (message missing) - triggers repair.
      calls: [{ toolCallId: 'c1', toolName: 'send', args: { wrong: true } }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect('output' in completed!.outcome).toBe(true);
    expect(inspected).toHaveLength(1);
    expect(inspected[0]!.args).toEqual({ message: 'repair-introduced-untrusted-span' });
    expect(inspected[0]!.args).not.toEqual({ wrong: true });
  });

  it('W-118 regression: without repair the inspected args are the raw call.args', async () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'send',
        description: 'external sink',
        inputSchema: z.object({ message: z.string() }),
        sideEffectClass: 'external-stateful',
        async execute() {
          return 'sent';
        },
      }),
    );
    const { guard, inspected } = makeFakeGuard();
    const executor = createToolExecutor({ registry, dataFlowGuard: guard });
    const args = { message: 'plain valid args' };
    await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'send', args }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect(inspected).toHaveLength(1);
    expect(inspected[0]!.args).toEqual(args);
  });
});
