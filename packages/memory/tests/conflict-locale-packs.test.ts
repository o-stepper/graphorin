import { describe, expect, it } from 'vitest';
import {
  defineLocalePack,
  enLocalePack,
  evaluateMarkers,
  type LocalePack,
} from '../src/conflict/locale-packs/index.js';

describe('@graphorin/memory - bundled English locale pack', () => {
  it('matches every documented relocation marker', () => {
    const cases = [
      'I just moved to Berlin last week.',
      'I now live in Tbilisi.',
      'We relocated to Lisbon for the warmer winters.',
      'I just moved last month.',
    ];
    for (const text of cases) {
      const match = evaluateMarkers(text, enLocalePack.supersedeMarkers);
      expect(match.matched, `expected "${text}" to match`).toBe(true);
      expect(match.kind).toBe('location');
    }
  });

  it('matches job change markers', () => {
    const cases = [
      'I got a new job at a fintech startup.',
      'I quit my job last Friday.',
      'I switched companies in March.',
      'I now work at OpenLab.',
    ];
    for (const text of cases) {
      const match = evaluateMarkers(text, enLocalePack.supersedeMarkers);
      expect(match.matched, `expected "${text}" to match`).toBe(true);
      expect(match.kind).toBe('job');
    }
  });

  it('matches preference + relationship + health markers', () => {
    const cases: ReadonlyArray<{ text: string; kind: string }> = [
      { text: 'I switched from coffee to tea.', kind: 'preference' },
      { text: 'We got married last spring.', kind: 'relationship' },
      { text: 'I was diagnosed with celiac disease.', kind: 'health' },
    ];
    for (const c of cases) {
      const match = evaluateMarkers(c.text, enLocalePack.supersedeMarkers);
      expect(match.matched, `expected "${c.text}" to match`).toBe(true);
      expect(match.kind).toBe(c.kind);
    }
  });

  it('flags negation markers separately from supersede markers', () => {
    expect(evaluateMarkers('I no longer drink coffee.', enLocalePack.negationMarkers).matched).toBe(
      true,
    );
    expect(
      evaluateMarkers('I do not work at Globex anymore.', enLocalePack.negationMarkers).matched,
    ).toBe(true);
  });

  it('returns matched: false for plain factual statements', () => {
    const cases = [
      'I love mountain hiking.',
      'My dog is called Atlas.',
      'I always pick window seats.',
    ];
    for (const text of cases) {
      expect(evaluateMarkers(text, enLocalePack.supersedeMarkers).matched).toBe(false);
    }
  });

  it('defineLocalePack freezes inputs', () => {
    const pack: LocalePack = defineLocalePack({
      id: 'fr',
      supersedeMarkers: [{ regex: /\bdéménagé\b/i, kind: 'location' }],
      negationMarkers: [{ regex: /\bne\b/i }],
      predicateNormalisers: ['est', 'suis', 'sommes'],
      subjectStopWords: ['le', 'la', 'les'],
    });
    expect(pack.id).toBe('fr');
    expect(Object.isFrozen(pack)).toBe(true);
    expect(Object.isFrozen(pack.supersedeMarkers)).toBe(true);
    expect(Object.isFrozen(pack.negationMarkers)).toBe(true);
  });

  it('evaluateMarkers picks the highest confidence match across multiple regex hits', () => {
    const text = 'I no longer drink coffee, and I just moved to Tbilisi.';
    const supersede = evaluateMarkers(text, enLocalePack.supersedeMarkers);
    expect(supersede.matched).toBe(true);
    expect(supersede.kind).toBe('location');
    expect((supersede.confidence ?? 0) >= 0.85).toBe(true);
  });
});
