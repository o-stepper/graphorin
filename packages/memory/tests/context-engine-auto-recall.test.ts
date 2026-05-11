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

describe('context-engine — auto-recall heuristic (Phase 10d)', () => {
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

  it('English defaults match the documented episode trigger phrases', () => {
    const strategy = defaultLocaleHeuristicStrategy(enLocalePack);
    expect(
      strategy({ locale: 'en', lastUserMessage: 'recap of the meeting please' }).episodesTriggered,
    ).toBe(true);
    expect(
      strategy({ locale: 'en', lastUserMessage: 'catch me up on yesterday' }).episodesTriggered,
    ).toBe(true);
  });

  it('custom locale heuristic plugs in via defineContextLocalePack', () => {
    const customPack = resolveLocalePack(
      defineContextLocalePack({
        id: 'fr-test',
        autoRecallTriggers: {
          factTriggers: [/te souviens-tu/i],
          episodeTriggers: [/résumé de/i],
        },
      }),
      { silent: true },
    );
    const strategy = defaultLocaleHeuristicStrategy(customPack);
    expect(
      strategy({ locale: 'fr-test', lastUserMessage: 'Te souviens-tu de mon chien?' })
        .factsTriggered,
    ).toBe(true);
    expect(
      strategy({ locale: 'fr-test', lastUserMessage: 'résumé de la réunion' }).episodesTriggered,
    ).toBe(true);
  });

  it('defineAutoRecallStrategy returns a tagged strategy object', () => {
    const custom = defineAutoRecallStrategy({
      id: 'custom-strategy',
      evaluate: () => ({ factsTriggered: true, episodesTriggered: false, reason: 'always-on' }),
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
        evaluate: () => ({ factsTriggered: false, episodesTriggered: false }),
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
