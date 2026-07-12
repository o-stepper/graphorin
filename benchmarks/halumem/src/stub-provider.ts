/**
 * Deterministic offline stub provider for the HaluMem-format benchmark.
 * Plumbing-only: it answers the three request shapes the ingest
 * pipeline + QA stage produce, without any model quality:
 *
 *  - memory-extraction requests -> every `user:` transcript line comes
 *    back as one fact (raw-turn extraction);
 *  - conflict-pipeline reconcile requests -> always `{ action: 'add' }`
 *    (so a stub run exercises the pipeline-on plumbing without
 *    pretending to judge conflicts);
 *  - QA answer requests -> a fixed abstention sentence.
 *
 * Scores from a stub run are meaningless as memory quality - the smoke
 * suite only asserts determinism and report shape.
 */

import type { Provider, ProviderRequest, ProviderResponse } from '@graphorin/core';

export function createHaluMemStubProvider(): Provider {
  return {
    name: 'stub',
    modelId: 'stub-halumem',
    capabilities: {
      streaming: false,
      toolCalling: false,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: true,
      reasoning: false,
      contextWindow: 32_000,
      maxOutput: 4_000,
    },
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      const system = req.systemMessage ?? '';
      const content = flattenContent(req);
      let text: string;
      if (system.includes('memory-extraction')) {
        // Transcript lines look like `[1] (2026-01-01T00:00:00Z) user: text`.
        const facts = content
          .split('\n')
          .map((line) => /^\[\d+\]\s*(?:\([^)]*\)\s*)?user:\s*(.+)$/i.exec(line.trim())?.[1])
          .filter((factText): factText is string => factText !== undefined && factText.length > 0)
          .map((factText) => ({ text: factText }));
        text = JSON.stringify({ facts });
      } else if (system.includes('reconcile')) {
        text = JSON.stringify({ action: 'add', reason: 'stub-default' });
      } else if (system.includes('episode-summarization')) {
        text = JSON.stringify({ summary: 'Stub episode summary.' });
      } else {
        text = 'I do not have that information.';
      }
      return {
        text,
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        finishReason: 'stop',
      };
    },
    stream(): AsyncIterable<never> {
      throw new Error('[benchmark-halumem] the stub provider does not stream');
    },
  };
}

function flattenContent(req: ProviderRequest): string {
  const parts: string[] = [];
  for (const message of req.messages) {
    const content = message.content;
    if (typeof content === 'string') {
      parts.push(content);
      continue;
    }
    if (Array.isArray(content)) {
      for (const part of content) {
        if (typeof part === 'object' && part !== null && 'text' in part) {
          const text = (part as { text?: unknown }).text;
          if (typeof text === 'string') parts.push(text);
        }
      }
    }
  }
  return parts.join('\n');
}
