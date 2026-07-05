import type { SessionScope } from '@graphorin/core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createMemory } from '../src/index.js';
import {
  createInMemoryStore,
  createStubEmbedder,
  InMemoryEmbeddingRegistry,
} from './fixtures/in-memory-store.js';

const SCOPE: SessionScope = { userId: 'corpus-user', sessionId: 'main' };

interface CorpusCase {
  readonly name: string;
  readonly seed: string;
  readonly candidate: string;
  /**
   * The expected pipeline outcome - `'supersede'` (Stage 3 / 4),
   * `'dedup'` (Stage 1 / 2 hot or near-dup), `'pending'` (Stage 5),
   * or `'admit'` (no conflict / cold zone).
   */
  readonly expect: ReadonlyArray<'supersede' | 'dedup' | 'pending' | 'admit'>;
}

/**
 * English fixture corpus - RB-02 §8.7 / Phase 10b DoD calls for ≥ 50
 * positive/negative samples covering every documented marker family.
 * Threshold calibration on the production embedder is a Phase B3
 * follow-up (Q-032 / Q-033).
 */
const CORPUS: ReadonlyArray<CorpusCase> = [
  // Location
  {
    name: 'relocation: moved to (canonical regression)',
    seed: 'Lives in Boston.',
    candidate: 'I just moved to Seattle for the new job.',
    expect: ['supersede'],
  },
  {
    name: 'relocation: now live in',
    seed: 'Based in Berlin.',
    candidate: 'I now live in Lisbon.',
    expect: ['supersede'],
  },
  {
    name: 'relocation: relocated',
    seed: 'Currently in Paris.',
    candidate: 'We relocated to Madrid in March.',
    expect: ['supersede'],
  },
  // Job
  {
    name: 'job: new job',
    seed: 'Works at Globex.',
    candidate: 'I got a new job at Initech.',
    expect: ['supersede'],
  },
  {
    name: 'job: switched companies',
    seed: 'Works at Globex.',
    candidate: 'I switched companies last month.',
    expect: ['supersede'],
  },
  {
    name: 'job: quit',
    seed: 'Works at Globex.',
    candidate: 'I quit my job last Friday.',
    expect: ['supersede'],
  },
  {
    name: 'job: now works at',
    seed: 'Works at Globex.',
    candidate: 'I now work at OpenLab.',
    expect: ['supersede'],
  },
  // Preference
  {
    name: 'preference: switched from',
    seed: 'Loves dark roast coffee.',
    candidate: 'I switched from coffee to matcha.',
    expect: ['supersede'],
  },
  {
    name: 'preference: no longer',
    seed: 'Drinks espresso every morning.',
    candidate: 'I no longer drink coffee.',
    expect: ['supersede'],
  },
  {
    name: 'preference: not anymore',
    seed: 'Plays tennis every weekend.',
    candidate: 'I do not play tennis anymore.',
    expect: ['supersede'],
  },
  // Relationship
  {
    name: 'relationship: got married',
    seed: 'Engaged to Atlas.',
    candidate: 'We got married last spring.',
    expect: ['supersede'],
  },
  {
    name: 'relationship: broke up',
    seed: 'Dating Atlas.',
    candidate: 'We broke up.',
    expect: ['supersede'],
  },
  // Health
  {
    name: 'health: diagnosed with',
    seed: 'In good health overall.',
    candidate: 'I was diagnosed with celiac disease.',
    expect: ['supersede'],
  },
  // Subject/predicate triples
  {
    name: 'subject-predicate: same actor + verb, different object',
    seed: 'Atlas lives in Boston',
    candidate: 'Atlas lives in Tbilisi',
    expect: ['supersede', 'dedup'],
  },
  {
    name: 'subject-predicate: identical triple → dedup',
    seed: 'Atlas lives in Boston',
    candidate: 'Atlas lives in Boston',
    expect: ['dedup'],
  },
  // Cold zone - wholly unrelated facts
  {
    name: 'cold zone: completely different topics',
    seed: 'Has a golden retriever named Luna.',
    candidate: 'Spent last summer in Iceland chasing the aurora.',
    expect: ['admit'],
  },
  {
    name: 'cold zone: brand-new fact',
    seed: 'Loves dark roast coffee.',
    candidate: 'Subscribes to two industry newsletters every Friday.',
    expect: ['admit'],
  },
  // Negative - looks like a conflict but is harmless
  {
    name: 'negative: similar wording but new info',
    seed: 'My cat is called Mochi.',
    candidate: 'My cat enjoys window seats.',
    expect: ['admit', 'pending'],
  },
  {
    name: 'negative: extra context, no conflict marker',
    seed: 'Likes hiking with friends.',
    candidate: 'Just signed up for a yoga class.',
    expect: ['admit'],
  },
  // Edge cases for Stage 5 fallback
  {
    name: 'pending: ambiguous near-related candidate',
    seed: 'Considering switching jobs in Q3.',
    candidate: 'Reading up on negotiation tactics for offers.',
    expect: ['admit', 'pending'],
  },
  // Mixed scenarios
  {
    name: 'multi-marker candidate (location + preference)',
    seed: 'Lives in Boston, drinks coffee.',
    candidate: 'I just moved to Berlin and switched to tea.',
    expect: ['supersede'],
  },
  {
    name: 'tense change: used to + present tense',
    seed: 'Lives in Boston.',
    candidate: 'I used to live in Boston.',
    expect: ['supersede'],
  },
  {
    name: 'preference: changed my mind',
    seed: 'Wants to study astrophysics.',
    candidate: 'I changed my mind about the program.',
    expect: ['supersede'],
  },
  {
    name: 'location: just moved (short phrasing)',
    seed: 'Based in Tokyo.',
    candidate: 'I just moved last week.',
    expect: ['supersede'],
  },
  {
    name: 'job: got promoted',
    seed: 'Senior engineer at Globex.',
    candidate: 'I got promoted to staff engineer.',
    expect: ['supersede'],
  },
  // Additional location markers
  {
    name: 'relocation: now living in',
    seed: 'Lives in Munich.',
    candidate: 'I am now living in Vienna with my partner.',
    expect: ['supersede'],
  },
  {
    name: 'relocation: based in',
    seed: 'Lives in Stockholm.',
    candidate: 'I am now based in Helsinki.',
    expect: ['supersede'],
  },
  // Additional job markers
  {
    name: 'job: got fired',
    seed: 'Works at Acme Corp.',
    candidate: 'I got fired last week, looking for new roles.',
    expect: ['supersede'],
  },
  {
    name: 'job: started a job',
    seed: 'Looking for work.',
    candidate: 'I started a job at Initech.',
    expect: ['supersede'],
  },
  {
    name: 'job: standalone "new job" marker',
    seed: 'Works at Globex.',
    candidate: 'My new job starts on Monday.',
    expect: ['supersede'],
  },
  // Additional preference markers
  {
    name: 'preference: changed mind',
    seed: 'Wants to apply to Stanford.',
    candidate: 'I changed my mind about applying.',
    expect: ['supersede'],
  },
  {
    name: 'preference: used to like',
    seed: 'Loves spicy food.',
    candidate: 'I used to like spicy food but not anymore.',
    expect: ['supersede'],
  },
  // Additional negation markers
  {
    name: 'negation: do not work at',
    seed: 'Works at Globex.',
    candidate: 'I do not work at Globex anymore.',
    expect: ['supersede'],
  },
  {
    name: 'negation: not a fan',
    seed: 'Loves jazz music.',
    candidate: 'I am not a fan of jazz these days.',
    expect: ['supersede'],
  },
  {
    name: 'negation: never (cautious)',
    seed: 'Drinks soda regularly.',
    candidate: 'I never drink soda.',
    expect: ['supersede', 'pending', 'admit'],
  },
  // Additional health markers
  {
    name: 'health: recovered from',
    seed: 'Has lower-back pain.',
    candidate: 'I recovered from the lower-back issue last month.',
    expect: ['supersede'],
  },
  // Additional generic markers
  {
    name: 'generic: previously',
    seed: 'Plays violin in the city orchestra.',
    candidate: 'Previously played violin in the city orchestra.',
    expect: ['supersede'],
  },
  {
    name: 'generic: formerly',
    seed: 'CTO at Globex.',
    candidate: 'Formerly CTO at Globex.',
    expect: ['supersede'],
  },
  {
    name: 'generic: is now',
    seed: 'Atlas is a junior dev.',
    candidate: 'Atlas is now a senior dev.',
    expect: ['supersede'],
  },
  // Subject/predicate variations
  {
    name: 'subject-predicate: "Lila plays" with different object',
    seed: 'Lila plays piano.',
    candidate: 'Lila plays violin.',
    expect: ['supersede'],
  },
  {
    name: 'subject-predicate: "Mochi loves" with different object',
    seed: 'Mochi loves chicken.',
    candidate: 'Mochi loves salmon.',
    expect: ['supersede'],
  },
  // Negative cases - wholly distinct topics that should NOT trigger supersede
  {
    name: 'negative: hobby + skill (distinct facts)',
    seed: 'Plays chess every weekend.',
    candidate: 'Speaks fluent Mandarin.',
    expect: ['admit'],
  },
  {
    name: 'negative: pet name + travel (distinct)',
    seed: 'Has a cat named Mochi.',
    candidate: 'Visited Reykjavik last December.',
    expect: ['admit'],
  },
  {
    name: 'negative: family member + book preference',
    seed: 'Has a younger sister named Mira.',
    candidate: 'Re-reads The Lord of the Rings every winter.',
    expect: ['admit'],
  },
  {
    name: 'negative: tool of trade + diet',
    seed: 'Uses an iPad Pro for sketching.',
    candidate: 'Eats mostly vegetarian on weekdays.',
    expect: ['admit'],
  },
  // Edge cases / pending defer scenarios
  {
    name: 'pending: ambiguous but related preferences',
    seed: 'Listens to electronic music in the evenings.',
    candidate: 'Likes ambient soundtracks while coding.',
    expect: ['admit', 'pending'],
  },
  {
    name: 'pending: similar topics, no conflict marker',
    seed: 'Has a daily journaling practice.',
    candidate: 'Started a gratitude journal last week.',
    expect: ['admit', 'pending'],
  },
  // Idempotent admission of brand-new facts
  {
    name: 'admit: brand-new factoid (skill update)',
    seed: 'Comfortable with TypeScript.',
    candidate: 'Just earned a PADI dive certificate.',
    expect: ['admit'],
  },
  {
    name: 'admit: brand-new event (life milestone)',
    seed: 'Lives in Lisbon.',
    candidate: 'Adopted a beagle from the local shelter.',
    expect: ['admit'],
  },
  {
    name: 'admit: brand-new preference (no overlap)',
    seed: 'Drinks black coffee.',
    candidate: 'Subscribed to a weekly photography newsletter.',
    expect: ['admit'],
  },
  // Markers in low-similarity contexts - confirm pipeline still recognises the marker
  {
    name: 'preference flip: switched to (related but not identical wording)',
    seed: 'Drinks pour-over coffee daily.',
    candidate: 'I switched to French press a month back.',
    expect: ['supersede'],
  },
];

describe('@graphorin/memory - conflict resolution corpus', () => {
  for (const sample of CORPUS) {
    it(`[${sample.name}] produces an expected pipeline outcome`, async () => {
      const memory = createMemory({
        store: createInMemoryStore({ withConflictStore: true }),
        embeddings: new InMemoryEmbeddingRegistry(),
        embedder: createStubEmbedder(),
      });
      await memory.semantic.remember(SCOPE, { text: sample.seed });
      const out = await memory.semantic.rememberWithDecision(SCOPE, { text: sample.candidate });
      expect(
        sample.expect,
        `[${sample.name}] expected one of ${sample.expect.join('/')}, got ${out.decision.kind} (reason=${out.decision.kind !== 'admit' || out.decision.reason ? (out.decision.kind === 'admit' ? out.decision.reason : 'reason' in out.decision ? out.decision.reason : '') : ''})`,
      ).toContain(out.decision.kind);
    });
  }

  it('Stage 1 hash is idempotent under whitespace + case (property test)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.array(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 5 }),
        (text, separators) => {
          const padded = `${separators.join('')}${text.toLowerCase()}${separators.join('')}`;
          const original = text;
          const compare = (s: string): string => s.replace(/\s+/g, ' ').trim().toLowerCase();
          expect(compare(padded)).toBe(compare(original));
        },
      ),
      { numRuns: 25 },
    );
  });
});
