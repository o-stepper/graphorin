/**
 * Tests for auto-importance scoring + episode formation (P1-2) — both
 * the pure parse/normalize helpers and the end-to-end behaviour driven
 * through the consolidator standard phase against the in-memory
 * fixture. A branching provider serves the extraction response and the
 * episode-summary response on the same `generate` surface, keyed off
 * the distinctive `episode-summarization` system prompt.
 */

import type { Provider, ProviderRequest, ProviderResponse, SessionScope } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { normalizeImportance, parseEpisode } from '../src/consolidator/phases/standard.js';
import { createMemory } from '../src/index.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

const SCOPE: SessionScope = { userId: 'alex', sessionId: 's1' };

describe('parseEpisode — defensive episode-summary parsing (P1-2)', () => {
  it('parses a well-formed { summary, importance } object', () => {
    expect(parseEpisode('{"summary":"They planned a trip.","importance":7}')).toEqual({
      summary: 'They planned a trip.',
      importance: 7,
    });
  });

  it('parses a summary with no importance', () => {
    expect(parseEpisode('{"summary":"A quiet chat."}')).toEqual({ summary: 'A quiet chat.' });
  });

  it('tolerates fenced + chatty output and an { episode: {...} } wrapper', () => {
    const fenced = 'Sure!\n```json\n{"summary":"Fenced summary.","importance":3}\n```\n';
    expect(parseEpisode(fenced)).toEqual({ summary: 'Fenced summary.', importance: 3 });
    expect(parseEpisode('{"episode":{"summary":"Wrapped.","importance":5}}')).toEqual({
      summary: 'Wrapped.',
      importance: 5,
    });
  });

  it('returns null for an extraction-shaped payload, empty, or unparseable text', () => {
    // The fact-extraction response must never be mistaken for an episode.
    expect(parseEpisode('{"facts":[{"text":"x"}]}')).toBeNull();
    expect(parseEpisode('{"summary":"   "}')).toBeNull();
    expect(parseEpisode('not json at all')).toBeNull();
    expect(parseEpisode(undefined)).toBeNull();
    expect(parseEpisode('')).toBeNull();
  });
});

describe('normalizeImportance — [1,10] poignancy → [0,1] (P1-2)', () => {
  it('maps the mid + endpoints and clamps out-of-range values into [0,1]', () => {
    expect(normalizeImportance(5)).toBeCloseTo(0.5, 10);
    expect(normalizeImportance(10)).toBe(1);
    expect(normalizeImportance(1)).toBeCloseTo(0.1, 10);
    // Out of range → clamped to [1,10] before scaling (never escapes [0,1]).
    expect(normalizeImportance(15)).toBe(1);
    expect(normalizeImportance(0)).toBeCloseTo(0.1, 10);
    expect(normalizeImportance(-4)).toBeCloseTo(0.1, 10);
  });

  it('returns undefined for non-finite / missing scores', () => {
    expect(normalizeImportance(undefined)).toBeUndefined();
    expect(normalizeImportance(Number.NaN)).toBeUndefined();
    expect(normalizeImportance(Number.POSITIVE_INFINITY)).toBeUndefined();
  });
});

/**
 * Provider that returns the episode-summary payload on the
 * episode-summarization prompt and the extraction payload otherwise,
 * recording every request so call counts can be asserted.
 */
function episodeProvider(opts: {
  facts: ReadonlyArray<Record<string, unknown>>;
  episode?: Record<string, unknown>;
}): Provider & { readonly calls: ReadonlyArray<ProviderRequest> } {
  const calls: ProviderRequest[] = [];
  return {
    name: 'fake',
    modelId: 'fake:test',
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
      calls.push(req);
      const sys = req.systemMessage ?? '';
      if (sys.includes('episode-summarization')) {
        const body = opts.episode ?? { summary: 'The user discussed their plans.', importance: 6 };
        return {
          text: JSON.stringify(body),
          usage: { promptTokens: 8, completionTokens: 4, totalTokens: 12 },
          finishReason: 'stop',
        };
      }
      return {
        text: JSON.stringify({ facts: opts.facts }),
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        finishReason: 'stop',
      };
    },
    stream: () => {
      throw new Error('not implemented');
    },
    get calls() {
      return calls;
    },
  };
}

async function setup(opts: {
  provider: Provider;
  consolidatorExtra?: Record<string, unknown>;
}): Promise<ReturnType<typeof createMemory>> {
  const store = createInMemoryStore({ withConflictStore: true, withConsolidatorStore: true });
  const memory = createMemory({
    store,
    embeddings: new InMemoryEmbeddingRegistry(),
    // No embedder: the reconcile pre-filter sees no neighbours, so the
    // only LLM calls are extraction (+ the episode summary), keeping
    // the provider call count deterministic.
    consolidator: {
      tier: 'standard',
      provider: opts.provider,
      defaultScope: SCOPE,
      ...(opts.consolidatorExtra ?? {}),
    },
  });
  await memory.consolidator.start();
  return memory;
}

describe('consolidator standard phase — episode formation (P1-2)', () => {
  it('auto-forms one quarantined episode with a normalized importance score', async () => {
    const provider = episodeProvider({
      facts: [{ text: 'The user is training for a marathon' }],
      episode: { summary: 'The user shared their marathon training plans.', importance: 8 },
    });
    const memory = await setup({ provider });
    await memory.session.push(SCOPE, {
      role: 'user',
      content: 'I am training for a marathon this fall.',
    });
    await memory.session.push(SCOPE, { role: 'assistant', content: 'That is a great goal!' });

    const outcome = await memory.consolidator.fireNow('standard', SCOPE);
    expect(outcome?.episodesFormed).toBe(1);
    // Exactly two LLM calls: one extraction + one episode summary
    // (no embedder ⇒ no reconcile calls).
    expect(provider.calls.length).toBe(2);

    // The episode is quarantined (P1-4): excluded from default recall...
    expect((await memory.episodic.search(SCOPE, 'marathon')).length).toBe(0);
    // ...but visible on the inspector path, carrying importance + provenance.
    const surfaced = await memory.episodic.search(SCOPE, 'marathon', {
      includeQuarantined: true,
    });
    expect(surfaced).toHaveLength(1);
    const ep = surfaced[0]?.record;
    expect(ep?.provenance).toBe('extraction');
    expect(ep?.status).toBe('quarantined');
    expect(ep?.importance).toBeCloseTo(0.8, 10); // 8 / 10
    expect(Date.parse(ep?.startedAt ?? '')).toBeLessThanOrEqual(Date.parse(ep?.endedAt ?? ''));
  });

  it('extraction fills per-fact importance, normalized 1-10 → [0.1, 1] (MCON-12)', async () => {
    const provider = episodeProvider({
      facts: [
        { text: 'The user is training for a marathon', importance: 8 },
        { text: 'The user mentioned the weather', importance: 1 },
        { text: 'The user works as a designer' }, // unscored ⇒ no signal
      ],
    });
    const memory = await setup({ provider, consolidatorExtra: { formEpisodes: false } });
    await memory.session.push(SCOPE, {
      role: 'user',
      content: 'I am training for a marathon this fall. I work as a designer.',
    });
    await memory.consolidator.fireNow('standard', SCOPE);

    const rows = (await memory.semantic.search(SCOPE, 'user', { includeQuarantined: true })).map(
      (h) => h.record,
    );
    const byText = (needle: string) => rows.find((r) => (r.text ?? '').includes(needle));
    expect(byText('marathon')?.importance).toBeCloseTo(0.8, 10);
    expect(byText('weather')?.importance).toBeCloseTo(0.1, 10);
    expect(byText('designer')?.importance).toBeUndefined();
  });

  it('every consolidator LLM request carries a per-call maxTokens cap (MCON-14)', async () => {
    const provider = episodeProvider({
      facts: [{ text: 'The user is training for a marathon' }],
      episode: { summary: 'Marathon plans.', importance: 5 },
    });
    const memory = await setup({ provider });
    await memory.session.push(SCOPE, { role: 'user', content: 'Training for a marathon.' });
    await memory.consolidator.fireNow('standard', SCOPE);
    // Extraction + episode summary: both must be output-capped so a
    // degenerate response cannot blow through the daily ceiling in one
    // call (budget.record only runs AFTER generate returns).
    expect(provider.calls.length).toBe(2);
    for (const req of provider.calls) {
      expect(typeof req.maxTokens).toBe('number');
      expect(req.maxTokens ?? 0).toBeGreaterThan(0);
    }
  });

  it('forms no episode and makes no extra LLM call when formEpisodes is off', async () => {
    const provider = episodeProvider({
      facts: [{ text: 'The user likes green tea' }],
      episode: { summary: 'A chat about tea.', importance: 4 },
    });
    const memory = await setup({ provider, consolidatorExtra: { formEpisodes: false } });
    await memory.session.push(SCOPE, { role: 'user', content: 'I love green tea.' });

    const outcome = await memory.consolidator.fireNow('standard', SCOPE);
    expect(outcome?.episodesFormed).toBe(0);
    expect(provider.calls.length).toBe(1); // extraction only — no episode summary call
    expect((await memory.episodic.search(SCOPE, 'tea', { includeQuarantined: true })).length).toBe(
      0,
    );
  });

  it('forms an episode with no importance signal when importanceScoring is off', async () => {
    const provider = episodeProvider({
      facts: [],
      episode: { summary: 'A casual exchange about the weather.' },
    });
    const memory = await setup({ provider, consolidatorExtra: { importanceScoring: false } });
    await memory.session.push(SCOPE, { role: 'user', content: 'Nice weather lately.' });

    const outcome = await memory.consolidator.fireNow('standard', SCOPE);
    expect(outcome?.episodesFormed).toBe(1);
    const surfaced = await memory.episodic.search(SCOPE, 'weather', { includeQuarantined: true });
    expect(surfaced[0]?.record.importance).toBeUndefined();
    // The episode-summary prompt did not request an importance score.
    const episodeCall = provider.calls.find((c) =>
      (c.systemMessage ?? '').includes('episode-summarization'),
    );
    expect(episodeCall?.systemMessage).not.toContain('importance');
  });

  it('skips episode formation (degrades to fact-only) when the budget is exhausted', async () => {
    const provider = episodeProvider({
      facts: [{ text: 'The user moved to Porto' }],
      episode: { summary: 'A relocation update.', importance: 9 },
    });
    // A ceiling small enough that the extraction call alone breaches it;
    // under `onExceed: 'pause'` the budget pauses mid-run, so the episode
    // summary call is never made.
    const memory = await setup({
      provider,
      consolidatorExtra: { onExceed: 'pause', ceilings: { maxTokensPerDay: 12, maxCostPerDay: 1 } },
    });
    await memory.session.push(SCOPE, { role: 'user', content: 'I just moved to Porto.' });

    const outcome = await memory.consolidator.fireNow('standard', SCOPE);
    expect(outcome?.episodesFormed).toBe(0);
    expect(provider.calls.length).toBe(1); // extraction only; episode skipped
    const status = await memory.consolidator.status();
    expect(status.paused).toBe(true);
  });
});
