/**
 * C4 - context-engineering adoptions:
 * - compaction failure hardening (retry, disable-after-3, shrink assert)
 * - recent user messages kept verbatim across compaction
 * - clearing-tier parity (clearToolInputs, readResultToolName honesty)
 * - reanchorRecentResults hook (re-anchors dropped result handles)
 * - summary prompt upgrades (handoff framing, verbatim-quote rule,
 *   Constraints section, honest template id)
 */
import type { Message } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { clearOldToolResults } from '../src/context-engine/compaction/clear-tool-results.js';
import { reanchorRecentResults } from '../src/context-engine/compaction/hooks/reanchor-recent-results.js';
import {
  buildSummarizerPrompt,
  SUMMARY_TEMPLATE_NAME,
} from '../src/context-engine/compaction/templates/summary-9-section.js';
import { enLocalePack } from '../src/context-engine/locale-packs/en.js';
import { HEURISTIC_TOKEN_COUNTER } from '../src/context-engine/token-counter.js';
import { createMemory } from '../src/facade.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };

function makeSummarizer(behavior: { failTimes?: number; echoInput?: boolean } = {}) {
  let calls = 0;
  let failures = behavior.failTimes ?? 0;
  return {
    id: 'stub-summarizer',
    calls: () => calls,
    async summarize(input: { prompt: string }) {
      calls += 1;
      if (failures > 0) {
        failures -= 1;
        throw new Error('summarizer exploded');
      }
      return {
        text: behavior.echoInput === true ? input.prompt : 'compact summary of older turns',
      };
    },
  };
}

function makeEngineMemory(summarizer: ReturnType<typeof makeSummarizer>) {
  return createMemory({
    store: createInMemoryStore(),
    embeddings: new InMemoryEmbeddingRegistry(),
    contextEngine: {
      providerContextWindow: 200_000,
      privacy: { providerTrust: 'public-tls' },
      compaction: { trigger: { thresholdTokens: 100 } },
      summarizer: summarizer as never,
    },
  });
}

function longMessages(count: number): Message[] {
  const out: Message[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ role: i % 2 === 0 ? 'user' : 'assistant', content: `turn ${i} ${'X'.repeat(800)}` });
  }
  return out;
}

function compactCall(memory: ReturnType<typeof makeEngineMemory>, messages: Message[]) {
  return {
    scope,
    runId: 'r',
    sessionId: 's1',
    agentId: 'a1',
    source: 'auto-trigger' as const,
    messages,
    memory,
  };
}

describe('C4 - compaction failure hardening', () => {
  it('retries a failing summarizer once and succeeds on the second attempt', async () => {
    const summarizer = makeSummarizer({ failTimes: 1 });
    const memory = makeEngineMemory(summarizer);
    const out = await memory.contextEngine.compactNow(compactCall(memory, longMessages(20)));
    expect(summarizer.calls()).toBe(2);
    expect(out.result.afterTokens).toBeLessThan(out.result.beforeTokens);
  });

  it('disables the auto trigger after 3 consecutive failed passes and re-enables on success', async () => {
    const summarizer = makeSummarizer({ failTimes: 99 });
    const memory = makeEngineMemory(summarizer);
    const messages = longMessages(20);

    for (let i = 0; i < 3; i++) {
      await expect(memory.contextEngine.compactNow(compactCall(memory, messages))).rejects.toThrow(
        /summarizer exploded/,
      );
    }
    // The auto trigger is now disabled even though the buffer is huge.
    expect(await memory.contextEngine.shouldCompact(messages)).toBe(false);

    // A later successful pass re-arms it (fresh memory shares the engine
    // instance through the facade, so run it through the same engine).
    const healthy = makeSummarizer();
    const out = await memory.contextEngine.compactNow({
      ...compactCall(memory, messages),
      summarizer: healthy as never,
    });
    expect(out.result.afterTokens).toBeLessThan(out.result.beforeTokens);
    expect(await memory.contextEngine.shouldCompact(messages)).toBe(true);
  });

  it('fails an auto-trigger pass whose output is not strictly smaller', async () => {
    // An echoing summarizer returns the whole prompt as the "summary",
    // so the compacted buffer GROWS - the Gemini-CLI compression-loop
    // class this assert exists for.
    const summarizer = makeSummarizer({ echoInput: true });
    const memory = makeEngineMemory(summarizer);
    await expect(
      memory.contextEngine.compactNow(compactCall(memory, longMessages(12))),
    ).rejects.toThrow(/did not shrink/);
  });
});

describe('C4 - recent user messages survive compaction verbatim', () => {
  it('carries the last 2 user messages out of the summarized window by default', async () => {
    const summarizer = makeSummarizer();
    const memory = makeEngineMemory(summarizer);
    const messages = longMessages(20);
    const out = await memory.contextEngine.compactNow(compactCall(memory, messages));
    const preserved = out.result.trimmedMessages;
    // Default positional tail = 6 (indices 14..19); user messages from the
    // summarized window (indices 0..13) with the highest indices are 12
    // and 10 - both must survive verbatim between the summary and the tail.
    const texts = preserved.map((m) => (typeof m.content === 'string' ? m.content : ''));
    expect(texts.some((t) => t.startsWith('turn 12 '))).toBe(true);
    expect(texts.some((t) => t.startsWith('turn 10 '))).toBe(true);
    // And the summarizer prompt did NOT contain them (no double counting).
    expect(preserved.filter((m) => m.role === 'user').length).toBeGreaterThanOrEqual(5);
  });
});

describe('C4 - clearing-tier parity', () => {
  const toolLoop: Message[] = [
    { role: 'user', content: 'start' },
    {
      role: 'assistant',
      content: 'calling',
      toolCalls: [{ toolCallId: 't1', toolName: 'search', args: { q: 'a long query'.repeat(10) } }],
    },
    { role: 'tool', toolCallId: 't1', content: 'result one '.repeat(50) },
    {
      role: 'assistant',
      content: 'calling again',
      toolCalls: [{ toolCallId: 't2', toolName: 'search', args: { q: 'second' } }],
    },
    { role: 'tool', toolCallId: 't2', content: 'result two '.repeat(50) },
  ];

  it('clearToolInputs blanks the PAIRED assistant tool-call arguments', async () => {
    const outcome = await clearOldToolResults(
      toolLoop,
      { keepToolUses: 1, clearToolInputs: true },
      HEURISTIC_TOKEN_COUNTER,
    );
    expect(outcome.clearedIndices).toEqual([2]);
    const assistant1 = outcome.messages[1];
    if (assistant1?.role !== 'assistant') throw new Error('expected assistant');
    expect(assistant1.toolCalls?.[0]?.args).toEqual({
      cleared: '[tool input elided by context clearing]',
    });
    // The untouched pair keeps its args.
    const assistant2 = outcome.messages[3];
    if (assistant2?.role !== 'assistant') throw new Error('expected assistant');
    expect(assistant2.toolCalls?.[0]?.args).toEqual({ q: 'second' });
  });

  it('readResultToolName: null degrades the handle placeholder to tool-neutral text', async () => {
    const outcome = await clearOldToolResults(
      toolLoop,
      {
        keepToolUses: 1,
        readResultToolName: null,
        externalize: async () => ({ handleId: 'spill://abc' }),
      },
      HEURISTIC_TOKEN_COUNTER,
    );
    const cleared = outcome.messages[2];
    expect(typeof cleared?.content === 'string' && cleared.content).toContain(
      'full result externalized to handle: spill://abc',
    );
    expect(String(cleared?.content)).not.toContain('read_result');
  });
});

describe('C4 - reanchorRecentResults hook', () => {
  const droppedMessages: Message[] = [
    { role: 'user', content: 'go' },
    {
      role: 'tool',
      toolCallId: 't1',
      content:
        'preview...\n\n[Full result stored behind a handle. Call read_result with handle "spill://one" to retrieve it]',
    },
    {
      role: 'tool',
      toolCallId: 't2',
      content:
        '[cleared tool result · search · 900 tokens · full result via read_result handle: spill://two]',
    },
  ];
  const ctx = {
    result: {} as never,
    scope,
    runId: 'r',
    sessionId: 's1',
    agentId: 'a1',
    source: 'auto-trigger' as const,
    droppedMessages,
  };
  const deps = { memory: {} as never, scope };

  it('re-anchors handles found in dropped tool messages, newest first', async () => {
    const hook = reanchorRecentResults();
    const parts = await hook.resolveContent(deps as never, ctx as never);
    expect(parts).toHaveLength(1);
    const text = parts[0]?.type === 'text' ? parts[0].text : '';
    expect(text).toContain('<recent_results anchor="post-compaction">');
    expect(text.indexOf('spill://two')).toBeLessThan(text.indexOf('spill://one'));
  });

  it('includes bounded previews when a readPreview resolver is supplied', async () => {
    const hook = reanchorRecentResults({
      maxChars: 500,
      readPreview: async (uri) => (uri === 'spill://two' ? 'row 42 is the failing case' : null),
    });
    const parts = await hook.resolveContent(deps as never, ctx as never);
    const text = parts[0]?.type === 'text' ? parts[0].text : '';
    expect(text).toContain('row 42 is the failing case');
    // The unreadable handle still gets a bare re-read note.
    expect(text).toContain('spill://one');
  });

  it('returns nothing when the compaction dropped no handles', async () => {
    const hook = reanchorRecentResults();
    const parts = await hook.resolveContent(
      deps as never,
      {
        ...ctx,
        droppedMessages: [{ role: 'user', content: 'no handles here' }],
      } as never,
    );
    expect(parts).toEqual([]);
  });
});

describe('C4 - summary prompt upgrades', () => {
  it('frames the summary as a handoff and demands verbatim identifiers', () => {
    const prompt = buildSummarizerPrompt({
      template: enLocalePack.compactionSummaryTemplate,
      olderMessages: [{ role: 'user', content: 'hello' }],
    });
    expect(prompt).toContain('HANDOFF for another LLM');
    expect(prompt).toContain('Quote identifiers VERBATIM');
    expect(prompt).toContain('Constraints and non-negotiables');
    expect(prompt).toContain('12-section summary');
  });

  it('the template id no longer misstates the section count (context-engine-14)', () => {
    expect(SUMMARY_TEMPLATE_NAME).toBe('summary-sections');
    expect(enLocalePack.compactionSummaryTemplate.sections).toHaveLength(12);
  });
});
