/**
 * SOTA-4: reclaim-floor (anti-thrash). A compaction whose predicted reclaim —
 * the older, compactable portion — is below `minReclaimTokens` is deferred, so
 * the engine does not pay a summarizer call to reclaim a handful of tokens near
 * the threshold (compact-thrash). Opt-in: unset ⇒ byte-identical to today.
 */

import type { Message } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { type CompactionSummarizer, createContextEngine } from '../src/index.js';

const STUB_SUMMARIZER: CompactionSummarizer = {
  id: 'stub',
  async summarize() {
    return { text: '## 1. Session goal\nx', usageTokens: 8 };
  },
};

function big(count: number, chars: number): Message[] {
  return Array.from({ length: count }, (_, i) => ({
    role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
    content: 'X'.repeat(chars),
  }));
}

const PRESERVE = 6;

function engine(trigger: { thresholdTokens: number; minReclaimTokens?: number }) {
  return createContextEngine({
    providerContextWindow: 200_000,
    privacy: { providerTrust: 'public-tls' },
    compaction: {
      trigger,
      strategy: { kind: 'summarize-old-preserve-recent', preserveRecentTurns: PRESERVE },
    },
    summarizer: STUB_SUMMARIZER,
  });
}

describe('SOTA-4: reclaim-floor anti-thrash', () => {
  it('defers compaction when the older (compactable) portion is below the floor', async () => {
    // 2 tiny older messages + 6 large preserved-recent messages: total crosses
    // the threshold, but reclaiming only the 2 tiny older ones is not worth it.
    const messages: Message[] = [
      { role: 'user', content: 'a' },
      { role: 'assistant', content: 'b' },
      ...big(PRESERVE, 400),
    ];
    const e = engine({ thresholdTokens: 50, minReclaimTokens: 1000 });
    expect(await e.shouldCompact(messages)).toBe(false);
  });

  it('fires when the older portion meets the reclaim floor', async () => {
    // 10 large messages → older portion (10 − 6 = 4 × ~1000 tokens) ≫ floor.
    const messages = big(10, 4000);
    const e = engine({ thresholdTokens: 50, minReclaimTokens: 1000 });
    expect(await e.shouldCompact(messages)).toBe(true);
  });

  it('is unchanged (fires) when minReclaimTokens is unset — opt-in default', async () => {
    const messages: Message[] = [
      { role: 'user', content: 'a' },
      { role: 'assistant', content: 'b' },
      ...big(PRESERVE, 400),
    ];
    const e = engine({ thresholdTokens: 50 }); // no floor
    expect(await e.shouldCompact(messages)).toBe(true);
  });
});
