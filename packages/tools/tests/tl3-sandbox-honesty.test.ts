import type { AISpan, SpanType, StartSpanOptions, Tracer } from '@graphorin/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { getCounterForTesting, resetCountersForTesting } from '../src/audit/index.js';
import { tool } from '../src/builder/index.js';
import { createToolExecutor } from '../src/executor/index.js';
import { createToolRegistry } from '../src/registry/index.js';
import { makeRunContext } from './fixtures.js';

interface RecordedSpan {
  type: SpanType;
  attrs: Record<string, unknown>;
}

function recordingTracer(): { tracer: Tracer; spans: RecordedSpan[] } {
  const spans: RecordedSpan[] = [];
  const tracer: Tracer = {
    startSpan<T extends SpanType>(opts: StartSpanOptions<T>): AISpan<T> {
      const record: RecordedSpan = { type: opts.type, attrs: { ...(opts.attrs ?? {}) } };
      spans.push(record);
      return {
        type: opts.type,
        id: `s-${spans.length}`,
        traceId: 't-1',
        setAttributes(attrs) {
          Object.assign(record.attrs, attrs);
        },
        addEvent() {},
        recordException() {},
        setStatus() {},
        end() {},
      };
    },
    async span<T extends SpanType, R>(
      opts: StartSpanOptions<T>,
      fn: (span: AISpan<T>) => R | Promise<R>,
    ): Promise<R> {
      const span = this.startSpan(opts);
      try {
        return await fn(span);
      } finally {
        span.end();
      }
    },
    async shutdown() {},
  };
  return { tracer, spans };
}

function sandboxedTool(name: string) {
  return tool({
    name,
    description: 'declares isolation it will not get inline',
    inputSchema: z.object({}),
    sideEffectClass: 'pure',
    sandboxPolicy: 'sandboxed',
    execute: async () => 'ok',
  });
}

describe('TL-3 — sandboxPolicy honesty for inline tools', () => {
  beforeEach(() => resetCountersForTesting());

  it('warns once per inline tool that declares a non-none sandboxPolicy', async () => {
    const registry = createToolRegistry();
    registry.register(sandboxedTool('isolated-wannabe'));
    expect(
      getCounterForTesting('tool.sandbox.advisory.total', { toolName: 'isolated-wannabe' }),
    ).toBe(1);
  });

  it('does not warn for module-loadable (mcp/skill) sources', async () => {
    const registry = createToolRegistry();
    registry.register(sandboxedTool('mcp-tool'), { kind: 'mcp', serverIdentity: 'srv' });
    expect(getCounterForTesting('tool.sandbox.advisory.total', { toolName: 'mcp-tool' }) ?? 0).toBe(
      0,
    );
  });

  it('the tool.execute span carries sandbox.enforced=false when a non-none policy runs in-process', async () => {
    const { tracer, spans } = recordingTracer();
    const registry = createToolRegistry();
    registry.register(sandboxedTool('inline-sandboxed'));
    const executor = createToolExecutor({ registry });
    await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'inline-sandboxed', args: {} }],
      runContext: makeRunContext({ tracer }),
      stepNumber: 1,
    });
    const execSpan = spans.find((s) => s.type === 'tool.execute');
    expect(execSpan).toBeDefined();
    expect(execSpan?.attrs['graphorin.tool.sandbox.enforced']).toBe(false);
  });

  it("a 'none'-policy tool is enforced by definition (in-process IS the policy)", async () => {
    const { tracer, spans } = recordingTracer();
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'plain',
        description: 'no isolation requested',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        sandboxPolicy: 'none',
        execute: async () => 'ok',
      }),
    );
    const executor = createToolExecutor({ registry });
    await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'plain', args: {} }],
      runContext: makeRunContext({ tracer }),
      stepNumber: 1,
    });
    const execSpan = spans.find((s) => s.type === 'tool.execute');
    expect(execSpan?.attrs['graphorin.tool.sandbox.enforced']).toBe(true);
  });
});
