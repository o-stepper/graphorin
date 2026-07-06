import { describe, expect, it } from 'vitest';
import {
  createMemory,
  defaultLocaleHeuristicStrategy,
  defineAutoRecallStrategy,
  defineContextLocalePack,
  enLocalePack,
  resolveLocalePack,
} from '../src/index.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

describe('context-engine - auto-recall heuristic (Phase 10d)', () => {
  it('English defaults match the documented trigger phrases', () => {
    const strategy = defaultLocaleHeuristicStrategy(enLocalePack);
    expect(
      strategy({ locale: 'en', lastUserMessage: 'do you remember my dog?' }).factsTriggered,
    ).toBe(true);
    expect(
      strategy({ locale: 'en', lastUserMessage: 'what did we discuss last time' }).factsTriggered,
    ).toBe(true);
    expect(
      strategy({ locale: 'en', lastUserMessage: 'You mentioned the deadline' }).factsTriggered,
    ).toBe(true);
    expect(strategy({ locale: 'en', lastUserMessage: 'hello there' }).factsTriggered).toBe(false);
    expect(strategy({ locale: 'en', lastUserMessage: '' }).factsTriggered).toBe(false);
  });

  it('custom locale heuristic plugs in via defineContextLocalePack', () => {
    const customPack = resolveLocalePack(
      defineContextLocalePack({
        id: 'fr-test',
        autoRecallTriggers: {
          factTriggers: [/te souviens-tu/i],
        },
      }),
      { silent: true },
    );
    const strategy = defaultLocaleHeuristicStrategy(customPack);
    expect(
      strategy({ locale: 'fr-test', lastUserMessage: 'Te souviens-tu de mon chien?' })
        .factsTriggered,
    ).toBe(true);
    expect(strategy({ locale: 'fr-test', lastUserMessage: 'unrelated text' }).factsTriggered).toBe(
      false,
    );
  });

  it('defineAutoRecallStrategy returns a tagged strategy object', () => {
    const custom = defineAutoRecallStrategy({
      id: 'custom-strategy',
      evaluate: () => ({ factsTriggered: true, reason: 'always-on' }),
    });
    expect(custom.id).toBe('custom-strategy');
    const out = custom({ locale: 'en', lastUserMessage: 'anything' });
    expect(out.factsTriggered).toBe(true);
    expect(out.reason).toBe('always-on');
  });

  it('rejects malformed defineAutoRecallStrategy input', () => {
    expect(() =>
      defineAutoRecallStrategy({
        id: '',
        evaluate: () => ({ factsTriggered: false }),
      }),
    ).toThrow(/non-empty/);
    expect(() =>
      defineAutoRecallStrategy({ id: 'x', evaluate: undefined as unknown as never }),
    ).toThrow(/function/);
  });

  it('factsAutoRecall trigger injects matching facts above threshold into Layer 6', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      contextEngine: {
        // The in-memory fixture's hybrid search returns RRF-fused scores in
        // the [0, 0.05] band; the threshold knob is set to 0 so any non-empty
        // result list passes through.
        factsAutoRecall: { topK: 3, threshold: 0 },
        privacy: { providerTrust: 'loopback' },
      },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    await memory.semantic.remember(scope, {
      text: 'do you remember user lives in Tbilisi',
    });
    await memory.semantic.remember(scope, { text: 'prefers tea over coffee' });
    // The in-memory fixture's BM25 substring matcher needs the query to
    // appear inside the fact text (case-insensitive substring).
    const out = await memory.contextEngine.assemble(memory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
      lastUserMessage: 'do you remember',
    });
    expect(out.autoRecall.factsTriggered).toBe(true);
    expect(out.systemMessage.content).toContain('<auto_recalled_facts>');
    expect(out.systemMessage.content).toContain('Tbilisi');
  });

  it('factsAutoRecall injects facts at the DEFAULT threshold (CE-4)', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      contextEngine: {
        // No explicit `threshold` ⇒ the default. RRF-fused scores top out near
        // 0.033, so the old 0.7 default silently dropped every hit; the default
        // must let the topK list through (rank-based topK bounds the volume).
        factsAutoRecall: { topK: 3 },
        privacy: { providerTrust: 'loopback' },
      },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    await memory.semantic.remember(scope, { text: 'do you remember user lives in Tbilisi' });
    const out = await memory.contextEngine.assemble(memory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
      lastUserMessage: 'do you remember',
    });
    expect(out.autoRecall.factsTriggered).toBe(true);
    expect(out.systemMessage.content).toContain('<auto_recalled_facts>');
    expect(out.systemMessage.content).toContain('Tbilisi');
  });

  it('W-086: auto-recall inherits createMemory searchDefaults (multi-query fan-out)', async () => {
    let expansions = 0;
    const provider = {
      name: 'expander',
      modelId: 'expander:test',
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
      async generate() {
        expansions += 1;
        return {
          text: JSON.stringify(['prefers tea over coffee']),
          usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
          finishReason: 'stop' as const,
        };
      },
      stream() {
        throw new Error('not implemented');
      },
    };
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      queryTransform: { provider },
      searchDefaults: { multiQuery: 2 },
      contextEngine: {
        factsAutoRecall: { topK: 3, threshold: 0 },
        privacy: { providerTrust: 'loopback' },
      },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    await memory.semantic.remember(scope, { text: 'do you remember user lives in Tbilisi' });
    await memory.semantic.remember(scope, { text: 'prefers tea over coffee' });
    const out = await memory.contextEngine.assemble(memory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
      lastUserMessage: 'do you remember',
    });
    expect(out.autoRecall.factsTriggered).toBe(true);
    // The tea fact does not contain the query substring - it is only
    // reachable through the fanned-out variant, so its presence proves
    // auto-recall inherited the construction-time default.
    expect(expansions).toBe(1);
    expect(out.systemMessage.content).toContain('Tbilisi');
    expect(out.systemMessage.content).toContain('tea over coffee');
  });

  it('does NOT inject auto-recall when the trigger phrase is absent', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      contextEngine: {
        factsAutoRecall: { topK: 3, threshold: 0.5 },
        privacy: { providerTrust: 'loopback' },
      },
    });
    const scope = { userId: 'u1', sessionId: 's1', agentId: 'a1' };
    await memory.semantic.remember(scope, { text: 'lives in Tbilisi' });
    const out = await memory.contextEngine.assemble(memory, {
      scope,
      runId: 'r',
      sessionId: 's1',
      agentId: 'a1',
      lastUserMessage: 'hello there',
    });
    expect(out.autoRecall.factsTriggered).toBe(false);
    expect(out.systemMessage.content).not.toContain('<auto_recalled_facts>');
  });
});
