/**
 * context-engine-10: drive the REAL `@graphorin/memory` context engine
 * through the agent loop — tool loops (assistant toolCalls + tool
 * messages) crossing the compaction threshold with a realistic system
 * prefix. Pre-existing coverage only exercised a scripted fake engine
 * with text-only turns, which is exactly the seam where the
 * orphan-pair / guard / prefix bugs lived.
 *
 * The mock provider's transcript well-formedness assertion (default ON)
 * validates EVERY post-compaction request: each assistant tool call has
 * its tool result, no orphan tool messages — the structural contract
 * OpenAI-shaped providers enforce one step later in production.
 */
import type { AgentEvent, Tool } from '@graphorin/core';
import type { Memory } from '@graphorin/memory';
import { createContextEngine } from '@graphorin/memory';
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

/** A tool with a big output so two rounds cross the threshold. */
const bigTool: Tool<unknown, unknown, unknown> = {
  name: 'fetch_report',
  description: 'fetch a large report',
  inputSchema: passthroughSchema,
  sideEffectClass: 'pure',
  execute: async () => `report line. ${'data '.repeat(500)}`,
} as Tool<unknown, unknown, unknown>;

function toolRounds(n: number): MockProviderScript[] {
  return Array.from({ length: n }, (_, i) =>
    toolCallScript({ toolCallId: `tc-${i}`, toolName: 'fetch_report', args: {} }),
  );
}

describe('context-engine-10 — REAL engine through the agent loop', () => {
  it('compacts a tool-looping run and every post-compaction request stays well-formed', async () => {
    const engine = createContextEngine({
      providerContextWindow: 10_000,
      compaction: {
        // Two ~640-token tool rounds cross this once; the run then ends,
        // so exactly ONE compaction is expected.
        trigger: { thresholdTokens: 1_200 },
        strategy: { kind: 'summarize-old-preserve-recent', preserveRecentTurns: 2 },
      },
      summarizer: {
        id: 'stub',
        summarize: async () => ({ text: 'stub summary of the older window' }),
      },
    });
    const memory = { contextEngine: engine } as unknown as Memory;
    const provider = createMockProvider({
      modelId: 'mock',
      // assertWellFormed defaults ON: every request (incl. the
      // post-compaction ones) is structurally validated.
      scripts: [...toolRounds(2), textOnlyScript('final answer')],
    });
    const agent = createAgent({
      name: 'real-engine',
      instructions: 'INSTRUCTIONS: be terse',
      provider,
      memory,
      tools: [bigTool],
    });

    const events: AgentEvent<string>[] = [];
    for await (const ev of agent.stream('go')) events.push(ev);
    const end = events.find((e) => e.type === 'agent.end');
    if (end?.type !== 'agent.end') throw new Error('expected agent.end');

    // The run finished cleanly through the compaction.
    expect(end.result.status).toBe('completed');
    expect(end.result.output).toBe('final answer');

    // Compaction actually happened, exactly once (the anti-thrash guard
    // suppresses an immediate re-trigger on the next step).
    const compactions = events.filter((e) => e.type === 'context.compacted');
    expect(compactions).toHaveLength(1);
    const compacted = compactions[0];
    if (compacted?.type !== 'context.compacted') throw new Error('unreachable');
    expect(compacted.beforeTokens).toBeGreaterThan(compacted.afterTokens);

    // The final buffer: pinned instructions first, the REAL summary
    // message present (marker intact), and no dangling tool pair — the
    // last provider call already consumed it via the mock's validator.
    const finalMessages = end.result.state.messages;
    expect(finalMessages[0]?.role).toBe('system');
    expect(finalMessages[0]?.content).toBe('INSTRUCTIONS: be terse');
    const summaryMessage = finalMessages.find(
      (m) =>
        m.role === 'system' &&
        typeof m.content === 'string' &&
        m.content.startsWith('<graphorin_compaction_summary>'),
    );
    expect(summaryMessage).toBeDefined();
    // The summary is NOT the first message — it stays outside the
    // pinned prefix, so a later compaction can re-compact it
    // (context-engine-05).
    expect(finalMessages.indexOf(summaryMessage as (typeof finalMessages)[number])).toBeGreaterThan(
      0,
    );
  });
});
