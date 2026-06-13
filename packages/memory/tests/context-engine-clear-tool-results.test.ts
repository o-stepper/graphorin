/**
 * SOTA-1: `clear-old-tool-results` — a zero-LLM pre-compaction tier (Anthropic
 * `clear_tool_uses` pattern). Old tool results are replaced by compact
 * placeholders BEFORE any summarizer call; the LLM compactor runs only if
 * clearing did not reclaim enough. Fully offline, mechanical, testable.
 */

import type { Message } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import {
  type CompactionResult,
  type CompactionStrategy,
  type CompactionSummarizer,
  countMessageTokens,
  enLocalePack,
  executeCompaction,
  HEURISTIC_TOKEN_COUNTER,
} from '../src/index.js';

const scope = { userId: 'u', sessionId: 's', agentId: 'a' };
const BIG = 'RESULT-PAYLOAD '.repeat(200); // ~3kB tool output

/** Records calls and throws if ever invoked — proves the zero-LLM path. */
function neverSummarizer(): CompactionSummarizer & { calls: number } {
  const s = {
    id: 'never',
    calls: 0,
    async summarize(): Promise<{ text: string; usageTokens?: number }> {
      s.calls += 1;
      throw new Error('summarizer must not be called on the clearing path');
    },
  };
  return s;
}

/** user → (assistant search → tool t1) → (assistant fetch → tool t2) → (assistant search → tool t3) → user. */
function toolHeavyBuffer(): Message[] {
  return [
    { role: 'user', content: 'do things' },
    {
      role: 'assistant',
      content: '',
      toolCalls: [{ toolCallId: 't1', toolName: 'search', args: {} }],
    },
    { role: 'tool', toolCallId: 't1', content: BIG },
    {
      role: 'assistant',
      content: '',
      toolCalls: [{ toolCallId: 't2', toolName: 'fetch', args: {} }],
    },
    { role: 'tool', toolCallId: 't2', content: BIG },
    {
      role: 'assistant',
      content: '',
      toolCalls: [{ toolCallId: 't3', toolName: 'search', args: {} }],
    },
    { role: 'tool', toolCallId: 't3', content: BIG },
    { role: 'user', content: 'and now answer' },
  ];
}

function run(
  strategy: CompactionStrategy,
  messages: Message[],
  summarizer: CompactionSummarizer,
  thresholdTokens: number,
): Promise<CompactionResult> {
  return executeCompaction({
    messages,
    source: 'auto-trigger',
    strategy,
    localePack: enLocalePack,
    summarizer,
    tokenCounter: HEURISTIC_TOKEN_COUNTER,
    thresholdTokens,
    runId: 'r',
    sessionId: 's',
    agentId: 'a',
    scope,
  });
}

describe('SOTA-1: clear-old-tool-results (zero-LLM pre-compaction tier)', () => {
  it('reclaims tokens by clearing old tool results WITHOUT calling the summarizer', async () => {
    const messages = toolHeavyBuffer();
    const before = await countMessageTokens(messages, HEURISTIC_TOKEN_COUNTER);
    const summarizer = neverSummarizer();
    const result = await run(
      { kind: 'clear-old-tool-results', keepToolUses: 1, summarizeFallback: false },
      messages,
      summarizer,
      1_000_000, // cleared buffer well under threshold → no fallback
    );
    expect(summarizer.calls).toBe(0); // zero-LLM
    expect(result.afterTokens).toBeLessThan(before);
    expect(result.summary).toBe(''); // no LLM summary produced
    expect(result.droppedMessageIndices.length).toBeGreaterThan(0);
  });

  it('keeps the most recent N tool results verbatim', async () => {
    const messages = toolHeavyBuffer(); // tool results at idx 2, 4, 6
    const result = await run(
      { kind: 'clear-old-tool-results', keepToolUses: 1, summarizeFallback: false },
      messages,
      neverSummarizer(),
      1_000_000,
    );
    expect(result.droppedMessageIndices).toContain(2);
    expect(result.droppedMessageIndices).toContain(4);
    expect(result.droppedMessageIndices).not.toContain(6); // most recent kept
    expect(result.trimmedMessages[6]).toEqual(messages[6]); // unchanged
  });

  it('never clears an excluded tool', async () => {
    const messages = toolHeavyBuffer();
    const result = await run(
      {
        kind: 'clear-old-tool-results',
        keepToolUses: 0,
        excludeTools: ['fetch'],
        summarizeFallback: false,
      },
      messages,
      neverSummarizer(),
      1_000_000,
    );
    expect(result.droppedMessageIndices).not.toContain(4); // 'fetch' excluded
    expect(result.droppedMessageIndices).toContain(2); // 'search' still cleared
  });

  it('skips clearing entirely when reclaimable < clearAtLeast (not worth it)', async () => {
    const messages = toolHeavyBuffer();
    const result = await run(
      {
        kind: 'clear-old-tool-results',
        keepToolUses: 0,
        clearAtLeast: 10_000_000,
        summarizeFallback: false,
      },
      messages,
      neverSummarizer(),
      1_000_000,
    );
    expect(result.droppedMessageIndices.length).toBe(0);
    expect(result.afterTokens).toBe(result.beforeTokens);
  });

  it('falls back to the summarizer only when clearing leaves the buffer over threshold', async () => {
    const messages = toolHeavyBuffer();
    let calls = 0;
    const summarizer: CompactionSummarizer = {
      id: 'stub',
      async summarize() {
        calls += 1;
        return { text: '## 1. Session goal\nx', usageTokens: 8 };
      },
    };
    const result = await run(
      { kind: 'clear-old-tool-results', keepToolUses: 1 }, // fallback default ON
      messages,
      summarizer,
      1, // even after clearing the buffer is over 1 token → fallback fires
    );
    expect(calls).toBe(1); // summarizer ran on the already-cleared buffer
    expect(result.summary).not.toBe('');
  });
});
