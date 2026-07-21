/**
 * deep-retest-0.13.11 P2: golden regression for the `diet` update case.
 *
 * The live OpenAI operations smoke keeps failing `diet` on update
 * omission. This golden proves the HARNESS is not the reason: with a
 * well-behaved scripted provider (extracts the two diet facts verbatim
 * and reconciles the change as an `update`), the conflict-pipeline-on
 * leg passes update omission on `diet` - so a live failure is model
 * extraction/reconcile behaviour, not scorer or pipeline plumbing.
 *
 * A second leg proves metric SENSITIVITY: a lazy provider that refuses
 * to link the change (reconcile always answers `add`) leaves the stale
 * "vegetarian" fact active and the scorer flags the omission.
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Provider, ProviderRequest, ProviderResponse } from '@graphorin/core';
import { memoryUpdateOmission } from '@graphorin/evals';
import { describe, expect, it } from 'vitest';

import { createOperationsAgent } from '../src/runner.js';

const FIXTURE = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'fixtures',
  'halumem.synthetic.json',
);

interface RawCase {
  readonly case_id: string;
  readonly sessions: ReadonlyArray<{
    readonly id: string;
    readonly turns: ReadonlyArray<{ role: 'user'; content: string; timestamp?: string }>;
  }>;
  readonly memory_points: ReadonlyArray<{
    readonly kind: string;
    readonly content: string;
    readonly previous?: string;
  }>;
}

async function loadDietCase(): Promise<RawCase> {
  const { readFile } = await import('node:fs/promises');
  const cases = JSON.parse(await readFile(FIXTURE, 'utf8')) as RawCase[];
  const diet = cases.find((c) => c.case_id === 'diet');
  if (diet === undefined) throw new Error('diet case missing from the synthetic fixture');
  return diet;
}

function flatten(req: ProviderRequest): string {
  return req.messages
    .map((m) =>
      typeof m.content === 'string'
        ? m.content
        : m.content.map((p) => ('text' in p ? p.text : '')).join('\n'),
    )
    .join('\n');
}

/**
 * Scripted provider: extraction returns the gold diet fact for each
 * session; reconcile links the change per `reconcileAction`.
 */
function buildScriptedProvider(reconcileAction: 'update' | 'add'): Provider {
  return {
    name: 'scripted',
    modelId: 'scripted-diet',
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
      const content = flatten(req);
      let text: string;
      if (system.includes('memory-extraction')) {
        if (content.includes('pescatarian')) {
          text = JSON.stringify({ facts: [{ text: 'User is pescatarian' }] });
        } else if (content.includes('vegetarian')) {
          text = JSON.stringify({ facts: [{ text: 'User is vegetarian' }] });
        } else {
          text = JSON.stringify({ facts: [] });
        }
      } else if (system.includes('reconcile')) {
        const target = /\[id:\s*([^\]]+)\]/.exec(content)?.[1];
        text =
          reconcileAction === 'update' && target !== undefined
            ? JSON.stringify({
                action: 'update',
                targetId: target.trim(),
                reason: 'diet changed from vegetarian to pescatarian',
              })
            : JSON.stringify({ action: 'add', reason: 'scripted-lazy' });
      } else if (system.includes('episode-summarization')) {
        text = JSON.stringify({ summary: 'Scripted episode summary.' });
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
      throw new Error('scripted provider does not stream');
    },
  };
}

async function runDiet(reconcileAction: 'update' | 'add') {
  const diet = await loadDietCase();
  const agent = createOperationsAgent({
    provider: buildScriptedProvider(reconcileAction),
    conflictPipeline: 'on',
    embedder: 'fake',
  });
  const input = {
    haystackSessions: diet.sessions.map((s) => ({
      id: s.id,
      turns: s.turns.map((t) => ({
        role: t.role,
        content: t.content,
        ...(t.timestamp !== undefined ? { timestamp: t.timestamp } : {}),
      })),
    })),
    goldPoints: diet.memory_points.map((p) => ({
      kind: p.kind as 'extract' | 'update' | 'delete',
      content: p.content,
      ...(p.previous !== undefined ? { previous: p.previous } : {}),
    })),
  };
  const observation = await agent.run(input as never);
  const scorer = memoryUpdateOmission();
  const result = await scorer.score({
    case: { input: input as never },
    output: observation as never,
    durationMs: 0,
  } as never);
  return { observation, result };
}

describe('diet update-omission golden (conflict pipeline on, fake embedder)', () => {
  it('a well-behaved provider passes: the stale vegetarian fact is superseded', async () => {
    const { observation, result } = await runDiet('update');
    expect(observation.memoryPoints).toContain('User is pescatarian');
    // The old fact must no longer be recall-eligible.
    expect(observation.memoryPoints).not.toContain('User is vegetarian');
    expect(result.pass).toBe(true);
    expect((result.metadata as { omissionRate: number }).omissionRate).toBe(0);
  });

  it('a lazy provider (reconcile always add) is FLAGGED by the scorer', async () => {
    const { observation, result } = await runDiet('add');
    // Both facts stay active - exactly the live failure signature.
    expect(observation.memoryPoints).toContain('User is vegetarian');
    expect(result.pass).toBe(false);
    expect((result.metadata as { omissionRate: number }).omissionRate).toBeGreaterThan(0.5);
  });
});
