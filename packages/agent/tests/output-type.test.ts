import type { AgentEvent, Provider, ProviderRequest } from '@graphorin/core';
import { defineOutputGuardrail } from '@graphorin/security/guardrails';
import { describe, expect, it } from 'vitest';
import { createAgent, InvalidAgentConfigError } from '../src/index.js';
import { createMockProvider, textOnlyScript } from './fixtures/mock-provider.js';

interface Answer {
  readonly answer: string;
  readonly confidence: number;
}

const answerSchema = {
  parse(value: unknown): Answer {
    const v = value as { answer?: unknown; confidence?: unknown };
    if (typeof v?.answer !== 'string' || typeof v?.confidence !== 'number') {
      throw new Error('schema mismatch: expected { answer: string; confidence: number }');
    }
    return { answer: v.answer, confidence: v.confidence };
  },
};

const answerJsonSchema = {
  type: 'object',
  properties: { answer: { type: 'string' }, confidence: { type: 'number' } },
  required: ['answer', 'confidence'],
} as const;

function capturingProvider(base: ReturnType<typeof createMockProvider>): {
  readonly provider: Provider;
  readonly requests: ProviderRequest[];
} {
  const requests: ProviderRequest[] = [];
  const provider: Provider = {
    ...base,
    stream(req: ProviderRequest) {
      requests.push(req);
      return base.stream(req);
    },
  };
  return { provider, requests };
}

describe('AgentConfig.outputType - structured output (AG-3)', () => {
  it('valid JSON output is parsed through the schema into result.output', async () => {
    const base = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('{"answer":"42","confidence":0.9}', 8)],
    });
    const agent = createAgent<unknown, Answer>({
      name: 'structured',
      instructions: 'answer as JSON',
      provider: base,
      outputType: { kind: 'structured', schema: answerSchema, jsonSchema: answerJsonSchema },
    });
    const result = await agent.run('question');
    expect(result.status).toBe('completed');
    expect(result.output).toEqual({ answer: '42', confidence: 0.9 });
  });

  it('fenced JSON output is unwrapped before parsing', async () => {
    const base = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('```json\n{"answer":"ok","confidence":1}\n```', 8)],
    });
    const agent = createAgent<unknown, Answer>({
      name: 'structured',
      instructions: 'answer as JSON',
      provider: base,
      outputType: { kind: 'structured', schema: answerSchema },
    });
    const result = await agent.run('q');
    expect(result.status).toBe('completed');
    expect(result.output).toEqual({ answer: 'ok', confidence: 1 });
  });

  it('invalid output fails the run with output-validation-failed (no silent cast)', async () => {
    const base = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('sorry, plain prose', 6)],
    });
    const agent = createAgent<unknown, Answer>({
      name: 'structured',
      instructions: 'answer as JSON',
      provider: base,
      outputType: { kind: 'structured', schema: answerSchema },
    });
    const events: AgentEvent<Answer>[] = [];
    for await (const ev of agent.stream('q')) {
      events.push(ev);
    }
    const err = events.find((e) => e.type === 'agent.error');
    expect(err).toBeDefined();
    if (err?.type === 'agent.error') {
      expect(err.error.code).toBe('output-validation-failed');
    }
    const end = events.at(-1);
    if (end?.type === 'agent.end') {
      expect(end.result.status).toBe('failed');
      expect(end.result.error?.code).toBe('output-validation-failed');
    }
  });

  it('the schema reaches the wire: ProviderRequest.outputType + trailing JSON instruction', async () => {
    const base = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('{"answer":"x","confidence":0}', 6)],
    });
    const { provider, requests } = capturingProvider(base);
    const agent = createAgent<unknown, Answer>({
      name: 'structured',
      instructions: 'answer as JSON',
      provider,
      outputType: {
        kind: 'structured',
        schema: answerSchema,
        jsonSchema: answerJsonSchema,
        description: 'The final answer envelope.',
      },
    });
    await agent.run('q');
    expect(requests.length).toBe(1);
    const req = requests[0];
    expect(req?.outputType?.kind).toBe('structured');
    expect(req?.outputType?.jsonSchema).toEqual(answerJsonSchema);
    // Fallback contract: a single trailing system message instructs
    // JSON-only output and embeds the schema (until adapters consume
    // ProviderRequest.outputType natively - PS-24).
    const last = req?.messages.at(-1);
    expect(last?.role).toBe('system');
    expect(typeof last?.content === 'string' && last.content).toContain('JSON');
    expect(typeof last?.content === 'string' && last.content).toContain('"confidence"');
  });

  it('output guardrails run on the PARSED value, not the raw text', async () => {
    const base = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('{"answer":"blocked-term","confidence":1}', 6)],
    });
    const seen: unknown[] = [];
    const agent = createAgent<unknown, Answer>({
      name: 'structured',
      instructions: 'answer as JSON',
      provider: base,
      outputType: { kind: 'structured', schema: answerSchema },
      guardrails: {
        output: [
          defineOutputGuardrail<Answer>({
            name: 'inspect',
            check: (value) => {
              seen.push(value);
              return { ok: true };
            },
          }),
        ],
      },
    });
    const result = await agent.run('q');
    expect(result.status).toBe('completed');
    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({ answer: 'blocked-term', confidence: 1 });
  });

  it("outputType.kind 'text' with a schema is rejected at createAgent", () => {
    const base = createMockProvider({ modelId: 'mock', scripts: [] });
    expect(() =>
      createAgent<unknown, Answer>({
        name: 'bad',
        instructions: 'x',
        provider: base,
        outputType: { kind: 'text', schema: answerSchema },
      }),
    ).toThrow(InvalidAgentConfigError);
  });
});
