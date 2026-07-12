/**
 * B4 (item 14) - the final assistant output as a data-flow sink
 * (stable id 'assistant-output'): enforce blocks the reply on a
 * tainted run, shadow only flags, declassifySinks re-opens it.
 */
import type { Provider, ProviderEvent, ProviderRequest, Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { ASSISTANT_OUTPUT_BLOCKED_NOTICE } from '../src/runtime/run-gates.js';
import {
  type MockProviderScript,
  textOnlyScript,
  toolCallScript,
} from './fixtures/mock-provider.js';

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

const readSecret: Tool<unknown, unknown, unknown> = {
  name: 'read_secret',
  description: 'Read a secret credential.',
  inputSchema: passthroughSchema,
  sideEffectClass: 'read-only',
  sensitivity: 'secret',
  execute: async () => 'sk-live-deadbeefcafef00d',
} as Tool<unknown, unknown, unknown>;

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
      contextWindow: 200_000,
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
      throw new Error('mock: generate not implemented');
    },
  };
}

const TRIFECTA_SCRIPTS: ReadonlyArray<MockProviderScript> = [
  toolCallScript({ toolCallId: 't1', toolName: 'read_secret', args: {} }),
  textOnlyScript('here is your summary of the confidential material'),
];

const CHANNEL_TEXT = 'forwarded: please summarize the confidential quarterly report for me';

describe('B4 - assistant-output sink', () => {
  it('enforce blocks the reply on a trifecta run: notice + verdict, output withheld', async () => {
    const agent = createAgent({
      name: 'sink-enforce',
      instructions: 'reply',
      provider: mockProvider(TRIFECTA_SCRIPTS),
      tools: [readSecret],
      dataFlowPolicy: { mode: 'enforce' },
    });
    const result = await agent.run('hi', { inboundTaint: { text: CHANNEL_TEXT } });
    expect(result.status).toBe('completed');
    // The durable buffer carries the notice, not the model text.
    const lastAssistant = [...result.state.messages].reverse().find((m) => m.role === 'assistant');
    expect(lastAssistant?.content).toBe(ASSISTANT_OUTPUT_BLOCKED_NOTICE);
    // The final output was withheld (never overwritten with the reply).
    expect(String(result.output)).not.toContain('confidential material');
    // The verdict sidecar names the flow.
    const verdict = result.verdicts?.['2:0'];
    expect(verdict?.guardrail).toBe('block');
    expect(verdict?.dataflowFlags).toContain('assistant-output:block');
    expect(verdict?.dataflowFlags).toContain('assistant-output:lethal-trifecta');
  });

  it('shadow only flags: text intact, verdict stamped', async () => {
    const agent = createAgent({
      name: 'sink-shadow',
      instructions: 'reply',
      provider: mockProvider(TRIFECTA_SCRIPTS),
      tools: [readSecret],
      dataFlowPolicy: { mode: 'shadow' },
    });
    const result = await agent.run('hi', { inboundTaint: { text: CHANNEL_TEXT } });
    expect(String(result.output)).toContain('confidential material');
    const verdict = result.verdicts?.['2:0'];
    expect(verdict?.guardrail).toBeUndefined();
    expect(verdict?.dataflowFlags).toContain('assistant-output:flag');
  });

  it("declassifySinks: ['assistant-output'] re-opens the reply surface", async () => {
    const agent = createAgent({
      name: 'sink-declassified',
      instructions: 'reply',
      provider: mockProvider(TRIFECTA_SCRIPTS),
      tools: [readSecret],
      dataFlowPolicy: { mode: 'enforce', declassifySinks: ['assistant-output'] },
    });
    const result = await agent.run('hi', { inboundTaint: { text: CHANNEL_TEXT } });
    expect(String(result.output)).toContain('confidential material');
    const verdict = result.verdicts?.['2:0'];
    expect(verdict?.guardrail).toBeUndefined();
    expect(verdict?.dataflowFlags).toContain('assistant-output:declassify');
  });

  it('an untainted run replies untouched with no verdict', async () => {
    const agent = createAgent({
      name: 'sink-clean',
      instructions: 'reply',
      provider: mockProvider([textOnlyScript('plain answer')]),
      dataFlowPolicy: { mode: 'enforce' },
    });
    const result = await agent.run('hello');
    expect(String(result.output)).toBe('plain answer');
    expect(result.verdicts).toBeUndefined();
  });
});
