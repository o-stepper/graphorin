/**
 * A1: fold `ToolDefinition.examples` into the model-facing tool description.
 * The wire contract already carries worked examples (the agent projects them
 * from `Tool.examples`), but no adapter rendered them, so the model never saw
 * them. `foldToolExamples` appends a compact Examples section to the description
 * — Anthropic reports complex-parameter accuracy 72% → 90% from this.
 */

import type { Provider, ProviderRequest, ProviderResponse, ToolDefinition } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createProvider, foldToolExamples } from '../src/index.js';

const withExamples: ToolDefinition = {
  name: 'fact_remember',
  description: 'Store a subject-predicate-object fact.',
  inputSchema: { type: 'object' },
  examples: [
    {
      input: { subject: 'Alice', predicate: 'likes', object: 'green tea' },
      output: { id: 'f1' },
      comment: 's/p/o form',
    },
  ],
};

const noExamples: ToolDefinition = {
  name: 'ping',
  description: 'Health check.',
  inputSchema: { type: 'object' },
};

describe('A1: foldToolExamples', () => {
  it('appends an Examples section carrying each example input/output/comment', () => {
    const folded = foldToolExamples([withExamples]);
    const tool = folded[0];
    expect(tool?.description).toContain('Examples:');
    expect(tool?.description).toContain('Alice');
    expect(tool?.description).toContain('green tea');
    expect(tool?.description).toContain('s/p/o form'); // the comment
    expect(tool?.description).toContain('Store a subject-predicate-object fact.'); // original kept
    // Folded into text ⇒ the structured field is dropped from the wire output.
    expect(tool?.examples).toBeUndefined();
  });

  it('returns the SAME array reference when no tool has examples (byte-identical)', () => {
    const input = [noExamples];
    expect(foldToolExamples(input)).toBe(input);
  });

  it('only rewrites tools that have examples; leaves the rest untouched', () => {
    const folded = foldToolExamples([noExamples, withExamples]);
    expect(folded[0]).toBe(noExamples); // unchanged reference
    expect(folded[1]?.description).toContain('Examples:');
  });
});

describe('A1: createProvider folds examples before the adapter sees the request', () => {
  it('the adapter receives a tool description carrying the examples', async () => {
    let seen: ProviderRequest | undefined;
    const adapter: Provider = {
      name: 'capture',
      modelId: 'capture',
      capabilities: {
        streaming: false,
        toolCalling: true,
        parallelToolCalls: false,
        multimodal: false,
        structuredOutput: false,
        reasoning: false,
        contextWindow: 8192,
        maxOutput: 1024,
      },
      stream() {
        throw new Error('unused');
      },
      async generate(req: ProviderRequest): Promise<ProviderResponse> {
        seen = req;
        return {
          text: 'ok',
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          finishReason: 'stop',
        };
      },
    };
    const provider = createProvider(adapter);
    await provider.generate({
      messages: [{ role: 'user', content: 'hi' }],
      tools: [withExamples],
    });
    expect(seen?.tools?.[0]?.description).toContain('Examples:');
    expect(seen?.tools?.[0]?.description).toContain('green tea');
    expect(seen?.tools?.[0]?.examples).toBeUndefined();
  });
});
