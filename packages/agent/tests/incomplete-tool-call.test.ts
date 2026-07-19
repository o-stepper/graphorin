/**
 * Deep-retest 0.13.1 P1: a provider stream that finishes (typically
 * `finishReason: 'length'` at the output-token ceiling) while a tool
 * call is still streaming its argument JSON must NOT complete the run.
 * The pre-fix loop dropped the unclosed accumulator, saw zero final
 * calls, and reported `status: 'completed'` with an empty output - a
 * silent success for a side effect that never executed.
 */
import type { AgentEvent, ProviderEvent, Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import {
  createMockProvider,
  type MockProviderScript,
  textOnlyScript,
  toolCallScript,
} from './fixtures/mock-provider.js';

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

function makeCountingTool(counter: { executions: number }): Tool<unknown, unknown, unknown> {
  return {
    name: 'remember_probe',
    description: 'Persist one text value.',
    inputSchema: passthroughSchema,
    sideEffectClass: 'side-effecting',
    execute: async (args: unknown) => {
      counter.executions += 1;
      return args;
    },
  } as Tool<unknown, unknown, unknown>;
}

/** A stream that starts a tool call but ends before its `tool-call-end`. */
function truncatedToolCallScript(finishReason: 'length' | 'stop'): MockProviderScript {
  const events: ProviderEvent[] = [
    { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'mock' } },
    { type: 'tool-call-start', toolCallId: 'partial-1', toolName: 'remember_probe' },
    { type: 'tool-call-input-delta', toolCallId: 'partial-1', argsDelta: '{"text":"unfinished' },
    {
      type: 'finish',
      finishReason,
      usage: { promptTokens: 10, completionTokens: 8, totalTokens: 18 },
    },
  ];
  return { events };
}

async function collectEvents(
  scripts: ReadonlyArray<MockProviderScript>,
  counter: { executions: number },
): Promise<AgentEvent[]> {
  const agent = createAgent({
    name: 'truncated-tool-repro',
    instructions: 'Call remember_probe.',
    provider: createMockProvider({ modelId: 'mock', scripts }),
    tools: [makeCountingTool(counter)],
  });
  const events: AgentEvent[] = [];
  for await (const event of agent.stream('Go.')) events.push(event);
  return events;
}

function agentEndOf(events: AgentEvent[]) {
  const end = events.find((event) => event.type === 'agent.end');
  if (end?.type !== 'agent.end') throw new Error('expected an agent.end event');
  return end;
}

describe('incomplete tool call at stream finish', () => {
  it("fails the run with 'incomplete-tool-call' when the stream ends 'length' mid tool call", async () => {
    const counter = { executions: 0 };
    const events = await collectEvents([truncatedToolCallScript('length')], counter);
    const end = agentEndOf(events);

    expect(end.result.status).toBe('failed');
    expect(end.result.error?.code).toBe('incomplete-tool-call');
    expect(end.result.error?.message).toContain('remember_probe');
    expect(end.result.output).toBe('');
    expect(counter.executions).toBe(0);

    const incomplete = events.find((event) => event.type === 'tool.call.incomplete');
    if (incomplete?.type !== 'tool.call.incomplete') {
      throw new Error('expected a tool.call.incomplete event');
    }
    expect(incomplete.toolCallId).toBe('partial-1');
    expect(incomplete.toolName).toBe('remember_probe');
    expect(incomplete.finishReason).toBe('length');
    expect(incomplete.argsPrefix).toBe('{"text":"unfinished');

    const types = events.map((event) => event.type);
    expect(types).not.toContain('tool.call.end');
    expect(types).not.toContain('tool.execute.start');
    expect(types).not.toContain('tool.execute.end');
    const error = events.find((event) => event.type === 'agent.error');
    if (error?.type !== 'agent.error') throw new Error('expected an agent.error event');
    expect(error.error.code).toBe('incomplete-tool-call');
  });

  it("still accounts the truncated call's token usage on the failed state", async () => {
    const events = await collectEvents([truncatedToolCallScript('length')], { executions: 0 });
    const end = agentEndOf(events);

    expect(end.result.state.usage.promptTokens).toBe(10);
    expect(end.result.state.usage.completionTokens).toBe(8);
    expect(end.result.state.usage.totalTokens).toBe(18);
    expect(end.result.state.usageByModel?.mock?.attemptCount).toBe(1);
  });

  it("fails on an unclosed call even when the finish reason is 'stop'", async () => {
    const counter = { executions: 0 };
    const events = await collectEvents([truncatedToolCallScript('stop')], counter);
    const end = agentEndOf(events);

    expect(end.result.status).toBe('failed');
    expect(end.result.error?.code).toBe('incomplete-tool-call');
    expect(counter.executions).toBe(0);
    const incomplete = events.find((event) => event.type === 'tool.call.incomplete');
    if (incomplete?.type !== 'tool.call.incomplete') {
      throw new Error('expected a tool.call.incomplete event');
    }
    expect(incomplete.finishReason).toBe('stop');
  });

  it("completes a 'length'-truncated TEXT step and records finishReason on the step", async () => {
    const script: MockProviderScript = {
      events: [
        { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'mock' } },
        { type: 'text-delta', delta: 'partial answer' },
        {
          type: 'finish',
          finishReason: 'length',
          usage: { promptTokens: 5, completionTokens: 4, totalTokens: 9 },
        },
      ],
    };
    const events = await collectEvents([script], { executions: 0 });
    const end = agentEndOf(events);

    expect(end.result.status).toBe('completed');
    expect(end.result.output).toBe('partial answer');
    expect(end.result.state.steps[0]?.finishReason).toBe('length');
  });

  it('records finishReason on ordinary tool and text steps', async () => {
    const counter = { executions: 0 };
    const events = await collectEvents(
      [
        toolCallScript({
          toolCallId: 'c1',
          toolName: 'remember_probe',
          args: { text: 'done' },
        }),
        textOnlyScript('saved'),
      ],
      counter,
    );
    const end = agentEndOf(events);

    expect(end.result.status).toBe('completed');
    expect(counter.executions).toBe(1);
    expect(end.result.state.steps[0]?.finishReason).toBe('tool-calls');
    expect(end.result.state.steps[1]?.finishReason).toBe('stop');
  });
});
