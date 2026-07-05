import type { Fact, MemoryHit } from '@graphorin/core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { enLocalePack } from '../src/conflict/locale-packs/index.js';
import { stage1ExactDedup } from '../src/conflict/stages/stage1-exact-dedup.js';
import { stage2EmbeddingThreeZone } from '../src/conflict/stages/stage2-embedding-three-zone.js';
import { stage3HeuristicRegex } from '../src/conflict/stages/stage3-heuristic-regex.js';
import { stage4SubjectPredicate } from '../src/conflict/stages/stage4-subject-predicate.js';
import { stage5DeferToDeep } from '../src/conflict/stages/stage5-defer-to-deep.js';
import { DEFAULT_CONFLICT_THRESHOLDS, type StageContext } from '../src/conflict/types.js';

const NOW = '2026-05-07T12:00:00.000Z';

function fact(id: string, text: string, overrides: Partial<Fact> = {}): Fact {
  return {
    id,
    kind: 'semantic',
    userId: 'alex',
    sensitivity: 'internal',
    text,
    createdAt: NOW,
    updatedAt: NOW,
    validFrom: NOW,
    ...overrides,
  } as Fact;
}

function hit(text: string, score: number, id = `f-${text.length}`): MemoryHit<Fact> {
  return { record: fact(id, text), score };
}

function ctx(candidate: Fact, hits: ReadonlyArray<MemoryHit<Fact>>): StageContext {
  return {
    candidate,
    existing: hits,
    localePack: enLocalePack,
    thresholds: DEFAULT_CONFLICT_THRESHOLDS,
  };
}

describe('@graphorin/memory - conflict stage 1 (exact dedup)', () => {
  it('returns dedup when an existing hit shares the canonical body', async () => {
    const candidate = fact('cand', '  Lives in Boston. ');
    const out = await stage1ExactDedup.evaluate(ctx(candidate, [hit('lives in boston.', 0.5)]));
    expect(out.kind).toBe('dedup');
    if (out.kind === 'dedup') {
      expect(out.similarity).toBe(1);
    }
  });

  it('continues on no existing hits', async () => {
    const out = await stage1ExactDedup.evaluate(ctx(fact('c', 'hello'), []));
    expect(out.kind).toBe('continue');
  });

  it('continues when no hit matches', async () => {
    const out = await stage1ExactDedup.evaluate(
      ctx(fact('c', 'hello world'), [hit('a different thing', 0.3)]),
    );
    expect(out.kind).toBe('continue');
  });

  it('property: dedup is idempotent under whitespace + case permutations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 80 }),
        fc.array(fc.constantFrom(' ', '  ', '\n', '\t'), { minLength: 1, maxLength: 4 }),
        async (raw, separators) => {
          // Skip generated strings dominated by control characters.
          if (raw.trim().length === 0) return;
          const padded = `${separators.join('')}${raw.toUpperCase()}${separators.join('')}`;
          const candidate = fact('candidate', padded);
          const existing = hit(raw.toLowerCase(), 0.5, 'existing');
          const out = await stage1ExactDedup.evaluate(ctx(candidate, [existing]));
          expect(out.kind).toBe('dedup');
          if (out.kind === 'dedup') {
            expect(out.existingId).toBe('existing');
          }
        },
      ),
      { numRuns: 30 },
    );
  });
});

describe('@graphorin/memory - conflict stage 2 (embedding three-zone)', () => {
  const candidate = fact('cand', 'lives in Boston');

  it('admits when no candidates were found', async () => {
    const out = await stage2EmbeddingThreeZone.evaluate(ctx(candidate, []));
    expect(out.kind).toBe('admit');
  });

  it('dedups in the HOT zone', async () => {
    const out = await stage2EmbeddingThreeZone.evaluate(
      ctx(candidate, [hit('lives in Boston', 0.97)]),
    );
    expect(out.kind).toBe('dedup');
    if (out.kind === 'dedup') {
      expect(out.reason).toBe('embedding-hot-zone');
      expect(out.similarity).toBeCloseTo(0.97);
    }
  });

  it('dedups in the NEAR-DUP zone', async () => {
    const out = await stage2EmbeddingThreeZone.evaluate(
      ctx(candidate, [hit('Boston is where they live', 0.88)]),
    );
    expect(out.kind).toBe('dedup');
    if (out.kind === 'dedup') {
      expect(out.reason).toBe('embedding-near-dup-zone');
    }
  });

  it('continues in the CONFLICT-CHECK zone', async () => {
    const out = await stage2EmbeddingThreeZone.evaluate(
      ctx(candidate, [hit('used to live in Boston', 0.6)]),
    );
    expect(out.kind).toBe('continue');
  });

  it('admits in the COLD zone', async () => {
    const out = await stage2EmbeddingThreeZone.evaluate(
      ctx(candidate, [hit('totally unrelated', 0.2)]),
    );
    expect(out.kind).toBe('admit');
    if (out.kind === 'admit') {
      expect(out.reason).toBe('embedding-cold-zone');
    }
  });
});

describe('@graphorin/memory - conflict stage 3 (heuristic regex)', () => {
  it('marks supersede when the candidate has a supersede marker', async () => {
    const out = await stage3HeuristicRegex.evaluate(
      ctx(fact('c', 'I just moved to Tbilisi.'), [hit('lives in Boston', 0.55)]),
    );
    expect(out.kind).toBe('supersede');
    if (out.kind === 'supersede') {
      expect(out.reason).toContain('regex-supersede-marker');
      expect(out.reason).toContain('kind=location');
    }
  });

  it('marks supersede when the candidate has a negation marker', async () => {
    const out = await stage3HeuristicRegex.evaluate(
      ctx(fact('c', 'I no longer drink coffee.'), [hit('drinks espresso every morning', 0.55)]),
    );
    expect(out.kind).toBe('supersede');
    if (out.kind === 'supersede') {
      expect(out.reason).toContain('regex-negation');
    }
  });

  it('continues for plain factual statements', async () => {
    const out = await stage3HeuristicRegex.evaluate(
      ctx(fact('c', 'My favourite book is Dune.'), [hit('reads science fiction', 0.55)]),
    );
    expect(out.kind).toBe('continue');
  });

  it('continues when there are no existing hits', async () => {
    const out = await stage3HeuristicRegex.evaluate(ctx(fact('c', 'I just moved.'), []));
    expect(out.kind).toBe('continue');
  });
});

describe('@graphorin/memory - conflict stage 4 (subject/predicate)', () => {
  it('marks supersede when subject + predicate match but object differs', async () => {
    const out = await stage4SubjectPredicate.evaluate(
      ctx(fact('c', 'Atlas lives in Tbilisi'), [hit('Atlas lives in Boston', 0.55)]),
    );
    expect(out.kind).toBe('supersede');
    if (out.kind === 'supersede') {
      expect(out.reason).toContain('subject-predicate-match');
    }
  });

  it('marks dedup when subject + predicate + object all match', async () => {
    const out = await stage4SubjectPredicate.evaluate(
      ctx(fact('c', 'Atlas lives in Boston'), [hit('Atlas lives in Boston', 0.55)]),
    );
    expect(out.kind).toBe('dedup');
  });

  it('continues when no triple can be parsed', async () => {
    const out = await stage4SubjectPredicate.evaluate(
      ctx(fact('c', 'just words'), [hit('Atlas lives in Boston', 0.55)]),
    );
    expect(out.kind).toBe('continue');
  });

  it('continues when subject differs', async () => {
    const out = await stage4SubjectPredicate.evaluate(
      ctx(fact('c', 'Atlas lives in Tbilisi'), [hit('Lila lives in Boston', 0.55)]),
    );
    expect(out.kind).toBe('continue');
  });
});

describe('@graphorin/memory - conflict stage 5 (defer-to-deep)', () => {
  it('returns pending with every CONFLICT-CHECK candidate id', async () => {
    const out = await stage5DeferToDeep.evaluate(
      ctx(fact('c', 'I love hiking', { id: 'cand-1' }), [
        hit('I enjoy walking', 0.7, 'old-1'),
        hit('I prefer running', 0.65, 'old-2'),
      ]),
    );
    expect(out.kind).toBe('pending');
    if (out.kind === 'pending') {
      expect([...out.conflictingIds]).toEqual(['old-1', 'old-2']);
      expect(out.similarity).toBeCloseTo(0.7);
    }
  });

  it('admits when there are no candidates', async () => {
    const out = await stage5DeferToDeep.evaluate(ctx(fact('c', 'hello'), []));
    expect(out.kind).toBe('admit');
  });
});
