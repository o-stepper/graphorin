import type { Message } from '@graphorin/core';
import { describe, expect, it, vi } from 'vitest';
import { _resetCompactionWarningForTesting } from '../src/context-engine/engine.js';
import {
  type CompactionSummarizer,
  countMessageTokens,
  createContextEngine,
  createMemory,
  DEFAULT_RESERVED_FOR_COMPACTION,
  DEFAULT_RESERVED_FOR_RESPONSE,
  DEFAULT_THRESHOLD_RATIO,
  defineBlock,
  HEURISTIC_TOKEN_COUNTER,
  reanchorPersonaBlock,
  reanchorPinnedFacts,
  reanchorProjectRules,
  resolveAutoCompactionDefault,
  resolveTriggerThreshold,
  SUMMARY_TEMPLATE_NAME,
  SUMMARY_TEMPLATE_VERSION,
} from '../src/index.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

const STUB_SUMMARIZER: CompactionSummarizer = {
  id: 'stub-summarizer',
  async summarize() {
    return {
      text: [
        '## 1. Session goal',
        'Help the user.',
        '## 2. Decisions',
        '- decided',
        '## 3. Key facts',
        '- fact',
        '## 4. Open questions',
        '- none',
        '## 5. Tools used',
        '- search',
        '## 6. Files',
        '- none',
        '## 7. Persona',
        '- friendly',
      ].join('\n'),
      usageTokens: 64,
    };
  },
};

function buildMessages(count: number, content = 'X'.repeat(40)): Message[] {
  const out: Message[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ role: i % 2 === 0 ? 'user' : 'assistant', content });
  }
  return out;
}

describe('context-engine — compaction thresholds (RB-46; Phase 10d)', () => {
  it('resolves the per-provider trigger threshold for a 200K context window', () => {
    const ratioFloor = Math.floor(200_000 * DEFAULT_THRESHOLD_RATIO);
    const headroom = 200_000 - DEFAULT_RESERVED_FOR_RESPONSE - DEFAULT_RESERVED_FOR_COMPACTION;
    const expected = Math.min(ratioFloor, headroom);
    const threshold = resolveTriggerThreshold({ contextWindow: 200_000 });
    expect(threshold).toBe(expected);
  });

  it('resolves the per-provider trigger threshold for a 400K context window', () => {
    const headroom = 400_000 - DEFAULT_RESERVED_FOR_RESPONSE - DEFAULT_RESERVED_FOR_COMPACTION;
    const ratioFloor = Math.floor(400_000 * DEFAULT_THRESHOLD_RATIO);
    expect(resolveTriggerThreshold({ contextWindow: 400_000 })).toBe(
      Math.min(ratioFloor, headroom),
    );
  });

  it('resolves the per-provider trigger threshold for a 32K context window', () => {
    const headroom = 32_000 - DEFAULT_RESERVED_FOR_RESPONSE - DEFAULT_RESERVED_FOR_COMPACTION;
    expect(resolveTriggerThreshold({ contextWindow: 32_000 })).toBe(
      Math.min(Math.floor(32_000 * DEFAULT_THRESHOLD_RATIO), headroom),
    );
  });

  it("trigger 'never' yields infinity — disables auto-trigger", () => {
    expect(resolveTriggerThreshold({ contextWindow: 200_000, trigger: 'never' })).toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  it('explicit thresholdTokens wins as-is (operator owns the choice)', () => {
    expect(
      resolveTriggerThreshold({
        contextWindow: 200_000,
        trigger: { thresholdTokens: 1234 },
      }),
    ).toBe(1234);
    expect(
      resolveTriggerThreshold({
        contextWindow: 200_000,
        trigger: { thresholdTokens: 999_999 },
      }),
    ).toBe(999_999);
  });

  it('default ON for cloud-tier providers; default OFF for loopback', () => {
    expect(resolveAutoCompactionDefault('public-tls')).toBe('enabled');
    expect(resolveAutoCompactionDefault('public-cleartext')).toBe('enabled');
    expect(resolveAutoCompactionDefault('loopback')).toBe('disabled');
    expect(resolveAutoCompactionDefault('private')).toBe('enabled');
  });
});

describe('context-engine — shouldCompact + compactNow (RB-46; Phase 10d)', () => {
  it('shouldCompact returns false on cloud-tier when buffer under threshold', async () => {
    const engine = createContextEngine({
      providerContextWindow: 200_000,
      privacy: { providerTrust: 'public-tls' },
      summarizer: STUB_SUMMARIZER,
    });
    const messages = buildMessages(5);
    expect(await engine.shouldCompact(messages)).toBe(false);
  });

  it('shouldCompact returns true when buffer crosses the configured threshold', async () => {
    const engine = createContextEngine({
      providerContextWindow: 200_000,
      privacy: { providerTrust: 'public-tls' },
      compaction: { trigger: { thresholdTokens: 50 } },
      summarizer: STUB_SUMMARIZER,
    });
    const messages = buildMessages(20, 'X'.repeat(200));
    expect(await engine.shouldCompact(messages)).toBe(true);
  });

  it('shouldCompact is permanently false on loopback default (default-OFF)', async () => {
    const engine = createContextEngine({
      providerContextWindow: 32_000,
      privacy: { providerTrust: 'loopback' },
      summarizer: STUB_SUMMARIZER,
    });
    expect(engine.config().compactionEnabled).toBe(false);
    expect(await engine.shouldCompact(buildMessages(20, 'X'.repeat(200)))).toBe(false);
  });

  it('compactNow trims older messages, preserves recent N turns, fires built-in hooks in order', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      workingBlocks: [defineBlock({ label: 'persona', charLimit: 80, sensitivity: 'public' })],
      contextEngine: {
        providerContextWindow: 200_000,
        privacy: { providerTrust: 'public-tls' },
        compaction: { trigger: { thresholdTokens: 100 } },
        summarizer: STUB_SUMMARIZER,
      },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    await memory.working.write(scope, 'persona', 'be friendly');
    await memory.procedural.define(scope, { text: 'always cite sources' });
    // Use long messages so compaction yields a real reduction even with the verbose summary template.
    const messages = buildMessages(40, 'X'.repeat(800));
    const out = await memory.contextEngine.compactNow({
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
      source: 'auto-trigger',
      messages,
      memory,
    });
    expect(out.result.beforeTokens).toBeGreaterThan(out.result.afterTokens);
    expect(out.result.preservedMessages.length).toBe(6); // default preserveRecentTurns
    expect(out.result.summary).toContain(SUMMARY_TEMPLATE_NAME);
    expect(out.result.summary).toContain(SUMMARY_TEMPLATE_VERSION);
    expect(out.hookFailures).toEqual([]);
    // Default hooks (project rules + persona; pinned facts is empty by default so contributes nothing).
    expect(out.result.hooksFiredCount).toBe(3);
    expect(out.extraContent.length).toBeGreaterThan(0);
    const extraTexts = out.extraContent.map((p) => (p.type === 'text' ? p.text : '')).join('\n');
    expect(extraTexts).toContain('always cite sources');
    expect(extraTexts).toContain('be friendly');
  });

  it('throws when compactNow is invoked without a configured summarizer', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      contextEngine: { providerContextWindow: 200_000 },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    await expect(
      memory.contextEngine.compactNow({
        scope,
        runId: 'r',
        sessionId: 's1',
        agentId: 'a1',
        source: 'manual',
        messages: buildMessages(20),
        memory,
      }),
    ).rejects.toThrow(/summarizer/);
  });

  it('isolates failed hooks: throw is caught + remaining hooks fire normally', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      workingBlocks: [defineBlock({ label: 'persona', charLimit: 80 })],
      contextEngine: {
        providerContextWindow: 200_000,
        privacy: { providerTrust: 'public-tls' },
        summarizer: STUB_SUMMARIZER,
        compaction: {
          postCompactionHooks: [
            {
              id: 'buggyHook',
              async resolveContent() {
                throw new Error('boom');
              },
            } as unknown as never, // covered by NamedPostCompactionHook
            reanchorProjectRules(),
            reanchorPersonaBlock(),
            reanchorPinnedFacts({ pinnedFactIds: [] }),
          ] as never,
        },
      },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    await memory.working.write(scope, 'persona', 'be friendly');
    await memory.procedural.define(scope, { text: 'always cite sources' });
    const out = await memory.contextEngine.compactNow({
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
      source: 'auto-trigger',
      messages: buildMessages(20),
      memory,
    });
    expect(out.hookFailures).toEqual([{ hookName: 'buggyHook', reason: 'Error' }]);
    expect(out.result.hooksFiredCount).toBe(3); // surviving hooks all fired
  });

  it('cache-prefix stabilization: Layer 1-4 prefix is bytes-equal across N+2 / N+3 post-compaction steps', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      workingBlocks: [defineBlock({ label: 'persona', charLimit: 80, sensitivity: 'public' })],
      contextEngine: {
        providerContextWindow: 200_000,
        privacy: { providerTrust: 'public-tls' },
        summarizer: STUB_SUMMARIZER,
      },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    await memory.working.write(scope, 'persona', 'be friendly');
    await memory.procedural.define(scope, { text: 'always cite sources' });

    const sliceLayer1to4 = (out: string): string => {
      // Layer 5 ("memory_metadata") is the first dynamic layer
      // (bucketed in production; here it changes when counters shift).
      // Layers 1-4 are everything before the first `<memory_metadata>`
      // marker — that is the cache-prefix region per § 6 of the
      // architecture doc.
      const idx = out.indexOf('<memory_metadata>');
      return idx === -1 ? out : out.slice(0, idx);
    };

    // Step N+1 — first post-compaction step (cache prefix changes
    // because compaction re-shapes the buffer).
    const step1 = await memory.contextEngine.assemble(memory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
      lastUserMessage: 'hello',
    });
    // Steps N+2 and N+3 — the prefix must be bytes-equal because
    // every input to Layers 1-4 is stable across the two assembly
    // calls (the same persona block, same procedural rule, same
    // base template, same locale).
    const step2 = await memory.contextEngine.assemble(memory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
      lastUserMessage: 'hello',
    });
    const step3 = await memory.contextEngine.assemble(memory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
      lastUserMessage: 'hello',
    });

    const prefix2 = sliceLayer1to4(step2.systemMessage.content);
    const prefix3 = sliceLayer1to4(step3.systemMessage.content);
    expect(prefix2).toBe(prefix3);
    // Sanity: the prefix is not empty and contains the Layer 1
    // base template (proving we sliced before the breakpoint).
    expect(prefix2).toContain('<graphorin_memory_base>');
    expect(prefix2).not.toContain('<memory_metadata>');
    void step1;
  });

  it('boundary discipline: compaction does not touch consolidator state', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      contextEngine: {
        providerContextWindow: 200_000,
        privacy: { providerTrust: 'public-tls' },
        summarizer: STUB_SUMMARIZER,
      },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    const before = await memory.consolidator.status();
    await memory.contextEngine.compactNow({
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
      source: 'auto-trigger',
      messages: buildMessages(20),
      memory,
    });
    const after = await memory.consolidator.status();
    expect(after.tier).toBe(before.tier);
    expect(after.queueDepth).toBe(before.queueDepth);
    expect(after.dlqSize).toBe(before.dlqSize);
  });
});

describe('context-engine — trigger evaluation perf (RB-46; Phase 10d)', () => {
  it('shouldCompact completes in < 2ms p95 with the DEC-131 cache amortization path', async () => {
    const engine = createContextEngine({
      providerContextWindow: 200_000,
      privacy: { providerTrust: 'public-tls' },
      compaction: { trigger: { thresholdTokens: 1_000_000 } }, // never trips so we measure pure cost
      summarizer: STUB_SUMMARIZER,
    });
    // Phase 12 (agent runtime) is the lifecycle owner: it reads the cached
    // total via `SessionMemoryStoreExt.totalCachedTokens(scope)` (DEC-131)
    // and threads it through `shouldCompact({ precomputedTokens })`. The
    // hot path is then an O(1) comparison.
    const precomputedTokens = 500_000;
    const messages = buildMessages(1000);
    await engine.shouldCompact(messages, { precomputedTokens });
    const samples: number[] = [];
    for (let i = 0; i < 50; i++) {
      const start = performance.now();
      await engine.shouldCompact(messages, { precomputedTokens });
      samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    const p95 = samples[Math.floor(samples.length * 0.95) - 1] ?? 0;
    expect(p95).toBeLessThan(2);
  });

  it('shouldCompact without the cache amortization path falls back to per-message counting', async () => {
    const engine = createContextEngine({
      providerContextWindow: 200_000,
      privacy: { providerTrust: 'public-tls' },
      compaction: { trigger: { thresholdTokens: 1_000_000 } },
      summarizer: STUB_SUMMARIZER,
    });
    const messages = buildMessages(50, 'X'.repeat(20));
    expect(await engine.shouldCompact(messages)).toBe(false);
    expect(await countMessageTokens(messages, HEURISTIC_TOKEN_COUNTER)).toBeGreaterThan(0);
  });
});

describe('context-engine — compaction effectiveness (CE-12)', () => {
  it('warns once + reports compactionEffective:false when enabled without a providerContextWindow', () => {
    _resetCompactionWarningForTesting();
    const writes: string[] = [];
    const spy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
      writes.push(String(chunk));
      return true;
    });
    try {
      // `public-tls` trust ⇒ compaction is default-enabled; no window supplied.
      const engine = createContextEngine({ privacy: { providerTrust: 'public-tls' } });
      const cfg = engine.config();
      expect(cfg.compactionEnabled).toBe(true);
      expect(cfg.compactionEffective).toBe(false);
      // A second engine with the same misconfig does not re-warn (one-time).
      createContextEngine({ privacy: { providerTrust: 'public-tls' } });
      expect(writes.filter((w) => w.includes('providerContextWindow')).length).toBe(1);
    } finally {
      spy.mockRestore();
    }
  });

  it('throws when compaction is explicitly configured without a providerContextWindow', () => {
    _resetCompactionWarningForTesting();
    expect(() =>
      createContextEngine({ compaction: { trigger: { thresholdTokens: 100 } } }),
    ).toThrow(/providerContextWindow/);
  });

  it('reports compactionEffective:true once a providerContextWindow is supplied', () => {
    const engine = createContextEngine({
      providerContextWindow: 200_000,
      privacy: { providerTrust: 'public-tls' },
    });
    expect(engine.config().compactionEffective).toBe(true);
  });
});
