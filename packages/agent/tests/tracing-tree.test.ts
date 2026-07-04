/**
 * C7 (periphery-04) — the run's spans form ONE tree: agent.run is the
 * root, each agent.step parents under it, and tool.execute parents under
 * the current step. Attributes follow the OTel GenAI conventions.
 */
import type {
  AISpan,
  Provider,
  ProviderEvent,
  ProviderRequest,
  SpanType,
  StartSpanOptions,
  Tool,
  Tracer,
} from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import {
  type MockProviderScript,
  textOnlyScript,
  toolCallScript,
} from './fixtures/mock-provider.js';

interface RecordedSpan {
  readonly id: string;
  readonly type: SpanType;
  readonly parentId?: string;
  readonly attrs: Record<string, unknown>;
  ended: boolean;
  status?: string;
}

function recordingTracer(): { tracer: Tracer; spans: RecordedSpan[] } {
  const spans: RecordedSpan[] = [];
  let seq = 0;
  function startSpan<T extends SpanType>(opts: StartSpanOptions<T>): AISpan<T> {
    seq += 1;
    const id = `s-${seq}`;
    const record: RecordedSpan = {
      id,
      type: opts.type,
      ...(opts.parent !== undefined ? { parentId: opts.parent.id } : {}),
      attrs: { ...(opts.attrs ?? {}) },
      ended: false,
    };
    spans.push(record);
    return {
      type: opts.type,
      id,
      traceId: opts.parent?.traceId ?? `t-${id}`,
      ...(opts.parent !== undefined ? { parentId: opts.parent.id } : {}),
      setAttributes(attrs) {
        Object.assign(record.attrs, attrs);
      },
      addEvent() {},
      recordException() {},
      setStatus(status) {
        record.status = status;
      },
      end() {
        record.ended = true;
      },
    };
  }
  const tracer: Tracer = {
    startSpan,
    async span(opts, fn) {
      const s = startSpan(opts);
      try {
        return await fn(s);
      } finally {
        s.end();
      }
    },
    async shutdown() {},
  };
  return { tracer, spans };
}

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
};

function mockProvider(scripts: ReadonlyArray<MockProviderScript>): Provider {
  let cursor = 0;
  return {
    name: 'mock',
    modelId: 'mock',
    capabilities: {
      streaming: true,
      toolCalling: true,
      parallelToolCalls: true,
      multimodal: false,
      structuredOutput: true,
      reasoning: false,
      contextWindow: 200000,
      maxOutput: 8192,
    },
    async *stream(_req: ProviderRequest): AsyncIterable<ProviderEvent> {
      const script = scripts[cursor++];
      if (script === undefined) {
        yield { type: 'error', error: { kind: 'unknown', message: 'no script' } };
        return;
      }
      for (const ev of script.events) yield ev;
    },
    async generate() {
      throw new Error('use stream()');
    },
  };
}

describe('C7 — agent.run / agent.step / tool.execute form one trace tree', () => {
  it('parents every span correctly and closes them all', async () => {
    const { tracer, spans } = recordingTracer();
    const agent = createAgent({
      name: 'traced',
      instructions: 'noop',
      provider: mockProvider([
        toolCallScript({ toolCallId: 'tc-1', toolName: 'echo', args: {} }),
        textOnlyScript('done', 4),
      ]),
      tools: [
        {
          name: 'echo',
          description: 'echo tool',
          inputSchema: passthroughSchema,
          sideEffectClass: 'read-only',
          execute: async () => 'ok',
        } as Tool<unknown, unknown, unknown>,
      ],
      tracer,
    });
    for await (const _ev of agent.stream('go')) {
      /* drain */
    }

    const runs = spans.filter((s) => s.type === 'agent.run');
    const steps = spans.filter((s) => s.type === 'agent.step');
    const tools = spans.filter((s) => s.type === 'tool.execute');
    expect(runs).toHaveLength(1);
    const run = runs[0];
    if (run === undefined) throw new Error('no run span');
    expect(run.parentId).toBeUndefined();
    expect(run.attrs['gen_ai.operation.name']).toBe('invoke_agent');
    expect(run.attrs['gen_ai.agent.name']).toBe('traced');
    expect(run.status).toBe('ok');
    expect(run.ended).toBe(true);
    // Run-level usage attrs stamped at close.
    expect(typeof run.attrs['gen_ai.usage.input_tokens']).toBe('number');

    expect(steps).toHaveLength(2);
    for (const step of steps) {
      expect(step.parentId).toBe(run.id);
      expect(step.ended).toBe(true);
    }
    expect(steps[0]?.attrs['graphorin.step.number']).toBe(1);

    expect(tools).toHaveLength(1);
    expect(tools[0]?.parentId).toBe(steps[0]?.id);
    expect(tools[0]?.attrs['gen_ai.tool.name']).toBe('echo');
  });
});
