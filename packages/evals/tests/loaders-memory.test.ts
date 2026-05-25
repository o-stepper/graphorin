import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  type Dataset,
  loadDmrDataset,
  loadLocomoDataset,
  loadLongMemEvalDataset,
  type MemoryEvalInput,
  parseDmr,
  parseLocomo,
  parseLongMemEval,
} from '../src/index.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

describe('loadLongMemEvalDataset', () => {
  it('maps questions, abilities, sessions and reference answers', async () => {
    const ds = await loadLongMemEvalDataset({
      path: join(FIXTURES, 'longmemeval.sample.json'),
      variant: 'S',
    });
    expect(ds.metadata?.name).toBe('longmemeval_s');
    expect(ds.cases).toHaveLength(5);

    const ie = ds.cases[0];
    expect(ie?.id).toBe('lme_ie_1');
    expect(ie?.input.ability).toBe('info-extraction');
    expect(ie?.input.question).toContain('cat');
    expect(ie?.expected).toBe('Mochi');
    expect(ie?.input.askedAt).toBe('2023/06/01 (Thu) 09:00');
    expect(ie?.input.haystackSessions).toHaveLength(2);
    expect(ie?.input.haystackSessions[0]?.id).toBe('s1');
    expect(ie?.input.haystackSessions[0]?.turns[0]?.timestamp).toBe('2023/05/15 (Mon) 10:00');
    expect(ie?.input.haystackSessions[0]?.turns[1]?.role).toBe('assistant');
    expect(ie?.metadata?.datasetName).toBe('longmemeval');

    expect(ds.cases[1]?.input.ability).toBe('temporal');
    expect(ds.cases[2]?.input.ability).toBe('abstention');
    expect(ds.cases[2]?.metadata?.ability).toBe('abstention');
    expect(ds.cases[3]?.input.ability).toBe('knowledge-update');
    expect(ds.cases[4]?.input.ability).toBe('multi-session');
  });

  it('filters by ability', async () => {
    const ds = await loadLongMemEvalDataset({
      path: join(FIXTURES, 'longmemeval.sample.json'),
      abilities: ['temporal'],
    });
    expect(ds.cases).toHaveLength(1);
    expect(ds.cases[0]?.input.ability).toBe('temporal');
  });

  it('rejects non-array input and rows without a question', () => {
    expect(() => parseLongMemEval('{"not":"an array"}')).toThrow(/must be a JSON array/);
    expect(() => parseLongMemEval('[42]')).toThrow(/row 0 is not an object/);
    expect(() => parseLongMemEval('[{"answer":"x"}]')).toThrow(/missing a 'question'/);
  });
});

describe('loadLocomoDataset', () => {
  it('expands one sample into one case per QA pair with mapped abilities', async () => {
    const ds = await loadLocomoDataset({ path: join(FIXTURES, 'locomo.sample.json') });
    expect(ds.metadata?.name).toBe('locomo');
    expect(ds.cases).toHaveLength(4);

    const singleHop = ds.cases[0];
    expect(singleHop?.id).toBe('conv-1-q0');
    expect(singleHop?.input.ability).toBe('info-extraction');
    expect(singleHop?.expected).toBe('the violin');
    expect(singleHop?.input.haystackSessions).toHaveLength(2);
    // speaker_a → user, other speakers → assistant
    expect(singleHop?.input.haystackSessions[0]?.turns[0]?.role).toBe('user');
    expect(singleHop?.input.haystackSessions[0]?.turns[1]?.role).toBe('assistant');
    expect(singleHop?.input.haystackSessions[0]?.turns[0]?.timestamp).toBe(
      '1:56 pm on 8 May, 2023',
    );
    expect(singleHop?.metadata?.evidence).toEqual(['D1:1']);

    expect(ds.cases[1]?.input.ability).toBe('temporal');
    const adversarial = ds.cases[2];
    expect(adversarial?.input.ability).toBe('abstention');
    expect(adversarial?.expected).toBe('Not mentioned in the conversation.');
    expect(adversarial?.metadata?.category).toBe(5);
    expect(ds.cases[3]?.input.ability).toBe('multi-session');
  });

  it('rejects non-array input', () => {
    expect(() => parseLocomo('42')).toThrow(/must be a JSON array/);
    expect(() => parseLocomo('[1]')).toThrow(/sample 0 is not an object/);
  });
});

describe('loadDmrDataset', () => {
  it('tolerates mixed session shapes and defaults to multi-session', async () => {
    const ds = await loadDmrDataset({ path: join(FIXTURES, 'dmr.sample.json') });
    expect(ds.cases).toHaveLength(2);

    const sister = ds.cases[0];
    expect(sister?.id).toBe('dmr-sister');
    expect(sister?.input.ability).toBe('multi-session');
    expect(sister?.expected).toBe('Anna');
    expect(sister?.input.haystackSessions).toHaveLength(3);
    // object-with-turns
    expect(sister?.input.haystackSessions[0]?.id).toBe('s1');
    expect(sister?.input.haystackSessions[0]?.turns[0]?.content).toContain('Anna');
    // bare array of { speaker, text }
    expect(sister?.input.haystackSessions[1]?.turns[0]?.role).toBe('user');
    // object-with-dialog + timestamp
    expect(sister?.input.haystackSessions[2]?.turns[0]?.timestamp).toBe('2023-07-01T10:00:00Z');

    const work = ds.cases[1];
    expect(work?.id).toBe('dmr-1'); // auto-assigned
    expect(work?.input.haystackSessions[0]?.turns[0]?.content).toContain('hospital'); // messages key
  });

  it('rejects non-array input and items without a question', () => {
    expect(() => parseDmr('{}')).toThrow(/must be a JSON array/);
    expect(() => parseDmr('[1]')).toThrow(/item 0 is not an object/);
    expect(() => parseDmr('[{"answer":"x"}]')).toThrow(/missing a 'question'/);
  });
});

describe('memory-eval loader types', () => {
  it('every loader resolves to Dataset<MemoryEvalInput, string>', () => {
    expectTypeOf(loadLongMemEvalDataset).returns.resolves.toEqualTypeOf<
      Dataset<MemoryEvalInput, string>
    >();
    expectTypeOf(loadLocomoDataset).returns.resolves.toEqualTypeOf<
      Dataset<MemoryEvalInput, string>
    >();
    expectTypeOf(loadDmrDataset).returns.resolves.toEqualTypeOf<Dataset<MemoryEvalInput, string>>();
  });

  it('MemoryEvalInput exposes the system-under-test contract', () => {
    expectTypeOf<MemoryEvalInput>().toHaveProperty('haystackSessions');
    expectTypeOf<MemoryEvalInput>().toHaveProperty('question');
    expectTypeOf<MemoryEvalInput['ability']>().toEqualTypeOf<
      | 'info-extraction'
      | 'multi-session'
      | 'temporal'
      | 'knowledge-update'
      | 'abstention'
      | undefined
    >();
  });
});
