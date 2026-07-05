import type { AgentEvent, Tool } from '@graphorin/core';
import { isStepCount } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { createMockProvider, textOnlyScript, toolCallScript } from './fixtures/mock-provider.js';

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

const noopTool: Tool<unknown, unknown, unknown> = {
  name: 'noop',
  description: 'noop',
  inputSchema: passthroughSchema,
  sideEffectClass: 'pure',
  execute: async () => 'ok',
} as Tool<unknown, unknown, unknown>;

describe('AG-24 - a stop-condition cut is distinguishable from clean completion', () => {
  it('a run cut by the step cap mid-task fails with code stop-condition', async () => {
    const provider = createMockProvider({
      modelId: 'm',
      scripts: [
        toolCallScript({ toolCallId: 'tc-1', toolName: 'noop', args: {} }),
        toolCallScript({ toolCallId: 'tc-2', toolName: 'noop', args: {} }),
        textOnlyScript('never reached', 4),
      ],
    });
    const agent = createAgent({
      name: 'capped',
      instructions: 'noop',
      provider,
      tools: [noopTool],
      stopWhen: isStepCount(2), // cut while tool work is still pending
    });
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('go')) events.push(ev);

    const endEv = events.find((e) => e.type === 'agent.end');
    if (endEv?.type !== 'agent.end') throw new Error('expected agent.end');
    expect(endEv.result.status).toBe('failed');
    expect(endEv.result.error?.code).toBe('stop-condition');
    expect(endEv.result.error?.message).toContain('step >= 2');
    expect(events.some((e) => e.type === 'agent.error')).toBe(true);
  });

  it('a naturally completed run is untouched', async () => {
    const provider = createMockProvider({ modelId: 'm', scripts: [textOnlyScript('done', 4)] });
    const agent = createAgent({
      name: 'natural',
      instructions: 'noop',
      provider,
      stopWhen: isStepCount(5),
    });
    const result = await agent.run('go');
    expect(result.status).toBe('completed');
    expect(result.error).toBeUndefined();
  });
});

describe('AG-26 - ghost tool-call-end dropped; file/source surfaced', () => {
  it('drops a tool-call-end that has no matching tool-call-start instead of dispatching a nameless tool', async () => {
    const provider = createMockProvider({
      modelId: 'm',
      scripts: [
        {
          events: [
            { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'm' } },
            { type: 'tool-call-end', toolCallId: 'ghost-1', finalArgs: {} },
            { type: 'text-delta', delta: 'recovered' },
            {
              type: 'finish',
              finishReason: 'stop',
              usage: { promptTokens: 2, completionTokens: 2, totalTokens: 4 },
            },
          ],
        },
      ],
    });
    const agent = createAgent({ name: 'ghost', instructions: 'noop', provider, tools: [noopTool] });
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('go')) events.push(ev);

    expect(events.some((e) => e.type === 'tool.call.end')).toBe(false);
    expect(events.some((e) => e.type === 'tool.execute.start')).toBe(false);
    const endEv = events.find((e) => e.type === 'agent.end');
    if (endEv?.type !== 'agent.end') throw new Error('expected agent.end');
    expect(endEv.result.status).toBe('completed');
  });

  it('surfaces provider file/source events as file.generated / source.cited', async () => {
    const data = new Uint8Array([1, 2, 3]);
    const provider = createMockProvider({
      modelId: 'm',
      scripts: [
        {
          events: [
            { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'm' } },
            { type: 'file', mimeType: 'application/pdf', data },
            { type: 'source', uri: 'https://example.com/doc', title: 'Example Doc' },
            { type: 'text-delta', delta: 'cited' },
            {
              type: 'finish',
              finishReason: 'stop',
              usage: { promptTokens: 2, completionTokens: 2, totalTokens: 4 },
            },
          ],
        },
      ],
    });
    const agent = createAgent({ name: 'multimodal', instructions: 'noop', provider });
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('go')) events.push(ev);

    const fileEv = events.find((e) => e.type === 'file.generated');
    if (fileEv?.type !== 'file.generated') throw new Error('expected file.generated');
    expect(fileEv.mimeType).toBe('application/pdf');
    expect(fileEv.data).toBe(data);

    const sourceEv = events.find((e) => e.type === 'source.cited');
    if (sourceEv?.type !== 'source.cited') throw new Error('expected source.cited');
    expect(sourceEv.uri).toBe('https://example.com/doc');
    expect(sourceEv.title).toBe('Example Doc');
  });
});
