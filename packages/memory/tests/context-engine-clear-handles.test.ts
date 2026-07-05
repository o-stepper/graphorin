/**
 * A6 / SOTA-2: recoverable clearing. The zero-LLM clear-old-tool-results tier
 * (SOTA-1) drops content behind a bare placeholder. With an `externalize` seam
 * wired to a spill / read_result registry, the cleared content is instead saved
 * behind a handle and the placeholder references it - so the model can re-fetch
 * the full result via `read_result` instead of losing it. Opt-in: omitted ⇒
 * byte-identical bare placeholder. The spill never fires for a clearing the
 * `clearAtLeast` floor rejects.
 */

import type { Message } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { clearOldToolResults, HEURISTIC_TOKEN_COUNTER } from '../src/index.js';

const BIG = 'RESULT-PAYLOAD '.repeat(200);

function buffer(): Message[] {
  return [
    {
      role: 'assistant',
      content: '',
      toolCalls: [{ toolCallId: 't1', toolName: 'search', args: {} }],
    },
    { role: 'tool', toolCallId: 't1', content: BIG },
    {
      role: 'assistant',
      content: '',
      toolCalls: [{ toolCallId: 't2', toolName: 'search', args: {} }],
    },
    { role: 'tool', toolCallId: 't2', content: BIG },
  ];
}

const contentOf = (m: Message | undefined): string =>
  typeof m?.content === 'string' ? m.content : '';

describe('A6: recoverable clearing via externalize handles', () => {
  it('externalizes cleared content and references the read_result handle', async () => {
    const spilled: string[] = [];
    const outcome = await clearOldToolResults(
      buffer(),
      {
        keepToolUses: 1,
        externalize: async (content, info) => {
          spilled.push(info.toolCallId);
          expect(content).toContain('RESULT-PAYLOAD'); // the ORIGINAL content
          return { handleId: `handle-${info.toolCallId}`, preview: 'RESULT-PAYLOAD …' };
        },
      },
      HEURISTIC_TOKEN_COUNTER,
    );
    expect(outcome.clearedIndices).toContain(1); // t1 (oldest) cleared
    expect(spilled).toContain('t1');
    expect(contentOf(outcome.messages[1])).toContain('handle-t1');
    expect(contentOf(outcome.messages[1])).toContain('read_result');
  });

  it('falls back to a bare placeholder when externalize is not wired', async () => {
    const outcome = await clearOldToolResults(
      buffer(),
      { keepToolUses: 1 },
      HEURISTIC_TOKEN_COUNTER,
    );
    expect(contentOf(outcome.messages[1])).not.toContain('read_result');
  });

  it('never spills when clearAtLeast rejects the clearing (no wasted side effect)', async () => {
    let spills = 0;
    const outcome = await clearOldToolResults(
      buffer(),
      {
        keepToolUses: 1,
        clearAtLeast: 10_000_000,
        externalize: async () => {
          spills += 1;
          return { handleId: 'h' };
        },
      },
      HEURISTIC_TOKEN_COUNTER,
    );
    expect(outcome.clearedIndices.length).toBe(0);
    expect(spills).toBe(0);
  });
});
