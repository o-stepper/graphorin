/**
 * tools-01 regression: a tool declared with a **plain Zod schema** (the
 * documented way, and what every first-party tool does) must reach the
 * provider as real JSON Schema `parameters`.
 *
 * Pre-fix, `projectSchema` only honoured `toJSON()` — which no Zod schema
 * has — and passed the raw schema object through, so OpenAI-shaped /
 * Ollama / vercel adapters serialised `{"_def":...}` internals (and MCP
 * validators serialised `{}`) as the function-calling schema. The fixture
 * suite masked it by hand-crafting `toJSON` on every test schema; this
 * file deliberately uses real `zod`.
 */
import type {
  Provider,
  ProviderEvent,
  ProviderRequest,
  ProviderResponse,
  Tool,
  ToolDefinition,
} from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createAgent } from '../src/index.js';
import { textOnlyScript } from './fixtures/mock-provider.js';

/** Provider that records the `ToolDefinition[]` advertised per step. */
function createRecordingProvider(): {
  readonly provider: Provider;
  readonly toolDefsPerStep: ToolDefinition[][];
} {
  const toolDefsPerStep: ToolDefinition[][] = [];
  const provider: Provider = {
    name: 'recording',
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
    async *stream(req: ProviderRequest): AsyncIterable<ProviderEvent> {
      toolDefsPerStep.push([...(req.tools ?? [])]);
      for (const ev of textOnlyScript('done', 4).events) yield ev;
    },
    async generate(_req: ProviderRequest): Promise<ProviderResponse> {
      throw new Error('recording provider: generate(...) not implemented; use stream(...).');
    },
  };
  return { provider, toolDefsPerStep };
}

describe('tools-01: plain-Zod tool schemas project to JSON Schema on the wire', () => {
  it('advertises populated `parameters` for a z.object(...) tool', async () => {
    const { provider, toolDefsPerStep } = createRecordingProvider();
    const refundTool: Tool<unknown, unknown, unknown> = {
      name: 'refund_order',
      description: 'Refund an order.',
      inputSchema: z.object({
        orderId: z.string().describe('the order to refund'),
        amountUsd: z.number().min(0),
        reason: z.enum(['damaged', 'late', 'other']).optional(),
      }) as unknown as Tool<unknown, unknown, unknown>['inputSchema'],
      outputSchema: z.object({
        refundId: z.string(),
      }) as unknown as NonNullable<Tool<unknown, unknown, unknown>['outputSchema']>,
      sideEffectClass: 'side-effecting',
      execute: async () => ({ refundId: 'r-1' }),
    };

    const agent = createAgent({
      name: 'zod-schema-projection',
      instructions: 'noop',
      provider,
      tools: [refundTool],
    });
    for await (const _ev of agent.stream('go')) {
      /* drain */
    }

    const def = toolDefsPerStep[0]?.find((d) => d.name === 'refund_order');
    expect(def).toBeDefined();
    // The definition is what the adapters ship verbatim as `parameters` /
    // `input_schema` — it must be JSON Schema, not Zod internals.
    expect(def?.inputSchema).toMatchObject({
      type: 'object',
      required: ['orderId', 'amountUsd'],
      properties: {
        orderId: { type: 'string', description: 'the order to refund' },
        amountUsd: { type: 'number', minimum: 0 },
        reason: { type: 'string', enum: ['damaged', 'late', 'other'] },
      },
    });
    expect(def?.outputSchema).toMatchObject({
      type: 'object',
      properties: { refundId: { type: 'string' } },
      required: ['refundId'],
    });
    const wire = JSON.stringify(def);
    expect(wire).not.toContain('_def');
    expect(wire).not.toContain('~standard');
  });
});
