import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  type Dataset,
  loadHaluMemDataset,
  type MemoryOperationsEvalInput,
  type MemoryOperationsObservation,
  parseHaluMem,
} from '../src/index.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const SAMPLE = join(FIXTURES, 'halumem.sample.json');

describe('loadHaluMemDataset - operations stage', () => {
  it('expands one case per sample carrying the gold memory points', async () => {
    const ds = await loadHaluMemDataset({ path: SAMPLE, stage: 'operations' });
    expect(ds.metadata?.name).toBe('halumem-operations');
    expect(ds.cases).toHaveLength(3);

    const u1 = ds.cases[0];
    expect(u1?.id).toBe('u1');
    expect(u1?.input.goldPoints).toHaveLength(3);
    expect(u1?.input.goldPoints[2]).toEqual({
      kind: 'update',
      content: 'User lives in Kyiv',
      previous: 'User lives in Berlin',
      sessionId: 's2',
    });
    expect(u1?.input.haystackSessions).toHaveLength(2);
    expect(u1?.input.haystackSessions[0]?.turns[0]?.timestamp).toBe('2025-11-02T10:00:00Z');
    expect(u1?.input.haystackSessions[0]?.turns[1]?.role).toBe('assistant');
    // operations cases carry no question
    expect(u1?.input.question).toBeUndefined();
    expect(u1?.input.ability).toBe('knowledge-update');
    expect(u1?.metadata?.stage).toBe('operations');

    // delete-only sample is knowledge-update; extract-only is info-extraction
    expect(ds.cases[1]?.input.ability).toBe('knowledge-update');
    expect(ds.cases[2]?.input.ability).toBe('info-extraction');
  });
});

describe('loadHaluMemDataset - qa stage', () => {
  it('expands one case per probe question with reference / unanswerable flags', async () => {
    const ds = await loadHaluMemDataset({ path: SAMPLE, stage: 'qa' });
    expect(ds.metadata?.name).toBe('halumem-qa');
    // u1 has two questions; u2 has an empty list; u3 has none.
    expect(ds.cases).toHaveLength(2);

    const answerable = ds.cases[0];
    expect(answerable?.id).toBe('u1-q0');
    expect(answerable?.input.question).toBe('Where does the user live now?');
    expect(answerable?.input.referenceAnswer).toBe('Kyiv');
    expect(answerable?.input.unanswerable).toBe(false);
    expect(answerable?.input.askedAt).toBe('2026-01-05T09:00:00Z');
    expect(answerable?.input.goldPoints).toHaveLength(3);

    const abstention = ds.cases[1];
    expect(abstention?.id).toBe('u1-q1');
    expect(abstention?.input.unanswerable).toBe(true);
    expect(abstention?.input.ability).toBe('abstention');
    expect(abstention?.input.referenceAnswer).toBeUndefined();
  });
});

describe('parseHaluMem - validation', () => {
  it('rejects structural problems with [graphorin/evals]-prefixed errors', () => {
    expect(() => parseHaluMem('{"not":"an array"}', 'operations')).toThrow(/must be a JSON array/);
    expect(() => parseHaluMem('[42]', 'operations')).toThrow(/sample 0 is not an object/);
    expect(() => parseHaluMem('[{"sessions":[1]}]', 'operations')).toThrow(
      /session 0 is not an object/,
    );
    expect(() =>
      parseHaluMem('[{"memory_points":[{"kind":"merge","content":"x"}]}]', 'operations'),
    ).toThrow(/unknown 'kind'/);
    expect(() => parseHaluMem('[{"memory_points":[{"kind":"extract"}]}]', 'operations')).toThrow(
      /missing 'content'/,
    );
    expect(() => parseHaluMem('[{"questions":[{"answer":"x"}]}]', 'qa')).toThrow(
      /has no 'question'/,
    );
    expect(() => parseHaluMem('[]', 'both' as never)).toThrow(/Unknown HaluMem stage/);
  });

  it('tolerates malformed turns the way the QA loaders do', () => {
    const cases = parseHaluMem(
      JSON.stringify([
        {
          sessions: [
            { id: 's1', turns: [null, { role: 'user' }, { role: 'user', content: 'ok' }] },
          ],
          memory_points: [],
        },
      ]),
      'operations',
    );
    expect(cases[0]?.input.haystackSessions[0]?.turns).toHaveLength(1);
    expect(cases[0]?.id).toBe('halumem-0');
  });
});

describe('halumem loader types', () => {
  it('resolves to Dataset<MemoryOperationsEvalInput, MemoryOperationsObservation>', () => {
    expectTypeOf(loadHaluMemDataset).returns.resolves.toEqualTypeOf<
      Dataset<MemoryOperationsEvalInput, MemoryOperationsObservation>
    >();
    expectTypeOf<MemoryOperationsObservation>().toHaveProperty('memoryPoints');
    expectTypeOf<MemoryOperationsEvalInput['goldPoints'][number]['kind']>().toEqualTypeOf<
      'extract' | 'update' | 'delete'
    >();
  });
});
