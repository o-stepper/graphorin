import { describe, expect, it } from 'vitest';

import { exactMatch, jsonPath, predicate, regexMatch } from '../src/scorers/index.js';

const noopCase = (input: unknown, expected?: unknown) => ({
  input,
  ...(expected !== undefined ? { expected } : {}),
});

describe('exactMatch', () => {
  it('passes when output deeply equals expected', async () => {
    const scorer = exactMatch();
    const r = await scorer.score({
      case: noopCase('q', 'apple') as never,
      output: 'apple' as never,
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
    expect(r.score).toBe(1);
  });

  it('fails when expected is missing', async () => {
    const scorer = exactMatch();
    const r = await scorer.score({
      case: noopCase('q') as never,
      output: 'apple' as never,
      durationMs: 0,
    });
    expect(r.pass).toBe(false);
  });

  it('honours caseInsensitive + trim', async () => {
    const scorer = exactMatch({ caseInsensitive: true, trim: true });
    const r = await scorer.score({
      case: noopCase('q', '  Apple  ') as never,
      output: 'apple' as never,
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
  });

  it('deep-equals nested objects', async () => {
    const scorer = exactMatch();
    const r = await scorer.score({
      case: noopCase('q', { a: 1, b: [2, 3] }) as never,
      output: { b: [2, 3], a: 1 } as never,
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
  });

  it('reports the diff in the reason field on failure', async () => {
    const scorer = exactMatch();
    const r = await scorer.score({
      case: noopCase('q', 'expected') as never,
      output: 'received' as never,
      durationMs: 0,
    });
    expect(r.pass).toBe(false);
    expect(r.reason).toMatch(/expected/);
  });
});

describe('regexMatch', () => {
  it('passes when the output matches the pattern', async () => {
    const scorer = regexMatch({ pattern: /lisbon/i });
    const r = await scorer.score({
      case: noopCase('q') as never,
      output: 'best restaurants in Lisbon' as never,
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
  });

  it('fails when the pattern does not match', async () => {
    const scorer = regexMatch({ pattern: /lisbon/i });
    const r = await scorer.score({
      case: noopCase('q') as never,
      output: 'best restaurants in Porto' as never,
      durationMs: 0,
    });
    expect(r.pass).toBe(false);
    expect(r.reason).toMatch(/match/);
  });

  it('stringifies non-string outputs', async () => {
    const scorer = regexMatch({ pattern: /value/ });
    const r = await scorer.score({
      case: noopCase('q') as never,
      output: { value: 1 } as never,
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
  });
});

describe('jsonPath', () => {
  it('passes when the value at the path equals the expected value', async () => {
    const scorer = jsonPath({ path: 'data.user.id', equals: 42 });
    const r = await scorer.score({
      case: noopCase('q') as never,
      output: { data: { user: { id: 42, name: 'a' } } } as never,
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
  });

  it('navigates array indices via dot notation', async () => {
    const scorer = jsonPath({ path: 'items.0.name', equals: 'first' });
    const r = await scorer.score({
      case: noopCase('q') as never,
      output: { items: [{ name: 'first' }, { name: 'second' }] } as never,
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
  });

  it('fails cleanly when the path is missing', async () => {
    const scorer = jsonPath({ path: 'data.user.id', equals: 42 });
    const r = await scorer.score({
      case: noopCase('q') as never,
      output: { data: { user: {} } } as never,
      durationMs: 0,
    });
    expect(r.pass).toBe(false);
  });
});

describe('predicate', () => {
  it('passes when the predicate returns true', async () => {
    const scorer = predicate({
      name: 'positive',
      check: ({ output }) => (output as number) > 0,
    });
    const r = await scorer.score({
      case: noopCase('q') as never,
      output: 7 as never,
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
  });

  it('returns the predicate result verbatim when it returns a ScoreResult', async () => {
    const scorer = predicate({
      name: 'custom',
      check: () => ({ pass: false, score: 0.3, reason: 'too low' }),
    });
    const r = await scorer.score({
      case: noopCase('q') as never,
      output: 7 as never,
      durationMs: 0,
    });
    expect(r.pass).toBe(false);
    expect(r.score).toBe(0.3);
    expect(r.reason).toBe('too low');
  });
});
