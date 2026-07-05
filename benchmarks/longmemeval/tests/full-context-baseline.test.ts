/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * SOTA-1: the runner must offer a full-context baseline (inline the WHOLE
 * haystack, no retrieval) that the memory pipeline is scored against, and report
 * the honest cost axis - tokens/query - alongside accuracy/latency. ConvoMem
 * shows full-context beats memory systems below ~150 conversations; the baseline
 * is how Graphorin tells that truth on small corpora. Fully offline: providers
 * are stubs, only the plumbing (mode selection, inlining, metering) is asserted.
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { MemoryEvalInput, MemoryEvalSession } from '@graphorin/evals';
import { describe, expect, it } from 'vitest';

import {
  buildResultsHeader,
  createBenchMeter,
  createFullContextAgent,
  runLongMemEvalBenchmark,
} from '../src/runner.js';
import { createDefaultStubProvider, createStubProvider } from '../src/stub-provider.js';

const fixture = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'fixture.json');

/** A stub provider whose responses carry a fixed `usage.totalTokens`. */
function usageStub(totalTokens: number) {
  return {
    name: 'usage-stub',
    modelId: 'usage-stub',
    capabilities: {
      streaming: false,
      toolCalling: false,
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
    async generate() {
      return {
        text: 'ok',
        usage: { promptTokens: 0, completionTokens: totalTokens, totalTokens },
        finishReason: 'stop' as const,
      };
    },
  };
}

describe('SOTA-1: full-context baseline', () => {
  it('inlines the ENTIRE haystack into the prompt (no retrieval window)', async () => {
    const turns = Array.from({ length: 30 }, (_, i) => ({
      role: 'user' as const,
      content: `fact number ${i} about topic ${i}`,
    }));
    turns.push({ role: 'user' as const, content: 'NEEDLE the vault code is 7741' });
    const sessions: MemoryEvalSession[] = [{ id: 's1', turns }];

    let seenContext = '';
    const agent = createFullContextAgent({
      provider: createStubProvider((req) => {
        seenContext = JSON.stringify(req.messages);
        return 'ok';
      }),
    });
    const input: MemoryEvalInput = {
      haystackSessions: sessions,
      question: 'vault code',
      ability: 'info-extraction',
    };
    await agent.run(input);

    // The full haystack reaches the model - the needle AND the very first turn,
    // which a top-K memory recall could legitimately drop.
    expect(seenContext).toContain('NEEDLE the vault code is 7741');
    expect(seenContext).toContain('fact number 0 about topic 0');
  });

  it('W-022: dataset-native speaker names reach the inlined context (LOCOMO-style turns)', async () => {
    const sessions: MemoryEvalSession[] = [
      {
        id: 's1',
        turns: [
          { role: 'user', content: 'I started marathon training.', speaker: 'Melanie' },
          { role: 'assistant', content: 'Congrats on the plan!', speaker: 'Caroline' },
          { role: 'user', content: 'turn without a native speaker name' },
        ],
      },
    ];
    let seenContext = '';
    const agent = createFullContextAgent({
      provider: createStubProvider((req) => {
        seenContext = JSON.stringify(req.messages);
        return 'ok';
      }),
    });
    await agent.run({
      haystackSessions: sessions,
      question: 'When did Melanie start marathon training?',
      ability: 'temporal',
    });
    // Named turns render as `<name>: ...` so name-referencing questions
    // have textual support; unnamed turns keep the role fallback.
    expect(seenContext).toContain('Melanie: I started marathon training.');
    expect(seenContext).toContain('Caroline: Congrats on the plan!');
    expect(seenContext).toContain('user: turn without a native speaker name');
  });

  it('meters tokens and query count across a run', async () => {
    const meter = createBenchMeter();
    const sessions: MemoryEvalSession[] = [{ id: 's1', turns: [{ role: 'user', content: 'hi' }] }];
    const agent = createFullContextAgent({ meter, provider: usageStub(13) });
    const base: MemoryEvalInput = {
      haystackSessions: sessions,
      question: '',
      ability: 'info-extraction',
    };
    await agent.run({ ...base, question: 'q1' });
    await agent.run({ ...base, question: 'q2' });
    expect(meter.queries).toBe(2);
    expect(meter.totalTokens).toBe(26);
  });

  it('runs full-context mode end-to-end via runLongMemEvalBenchmark', async () => {
    const report = await runLongMemEvalBenchmark({
      datasetPath: fixture,
      mode: 'full-context',
      provider: createDefaultStubProvider(),
    });
    expect(report.summary.total).toBe(3);
  });
});

describe('SOTA-1: multi-dimensional RESULTS header', () => {
  it('stamps mode and tokens/query alongside the provider', () => {
    const header = buildResultsHeader('ollama:llama3.1', {
      mode: 'full-context',
      tokensPerQuery: 4096,
    });
    expect(header).toContain('**Provider:** ollama:llama3.1');
    expect(header).toContain('**Mode:** full-context');
    expect(header).toContain('**Tokens/query:** 4096');
  });
});
