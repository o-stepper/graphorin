import { afterEach, describe, expect, it } from 'vitest';

import {
  _setSpecSnapshotForTesting,
  compareAuthorSpecHint,
  getGraphorinMapping,
  getKnownField,
  getSpecSnapshot,
} from '../src/spec/index.js';

describe('getSpecSnapshot', () => {
  it('returns the bundled snapshot with the expected shape', () => {
    const s = getSpecSnapshot();
    expect(typeof s.snapshotDate).toBe('string');
    expect(s.knownFields.name?.required).toBe(true);
    expect(s.graphorinMapping['graphorin-allowed-tools']?.policy).toBe(
      'deprecate-graphorin-prefix',
    );
  });

  it('exposes typed accessors', () => {
    expect(getKnownField('name')).toBeDefined();
    expect(getGraphorinMapping('graphorin-trust-level')?.policy).toBe('graphorin-only');
  });
});

// Regression guard for e2e finding N-03/20 (E-22): the bundled snapshot
// drifted from the live agentskills.io specification, claiming
// disable-model-invocation as a stable upstream field and allowed-tools
// as string-or-array.
describe('bundled snapshot tracks the live agentskills.io specification', () => {
  it('lists exactly the six public spec fields', () => {
    expect(Object.keys(getSpecSnapshot().knownFields)).toEqual([
      'name',
      'description',
      'license',
      'compatibility',
      'metadata',
      'allowed-tools',
    ]);
  });

  it('records allowed-tools as a space-separated string (the spec defines no array form)', () => {
    const entry = getKnownField('allowed-tools');
    expect(entry?.type).toBe('string');
    expect(entry?.stability).toBe('experimental');
  });

  it('does not claim disable-model-invocation as an upstream field', () => {
    expect(getKnownField('disable-model-invocation')).toBeUndefined();
  });

  it('tags both disable-model-invocation spellings as graphorin-only extensions', () => {
    const prefixed = getGraphorinMapping('graphorin-disable-model-invocation');
    expect(prefixed?.policy).toBe('graphorin-only');
    expect(prefixed?.anthropicEquivalent).toBeNull();
    const bare = getGraphorinMapping('disable-model-invocation');
    expect(bare?.policy).toBe('graphorin-only');
    expect(bare?.anthropicEquivalent).toBeNull();
  });
});

describe('compareAuthorSpecHint', () => {
  afterEach(() => {
    _setSpecSnapshotForTesting(null);
  });

  it('returns same / older / newer / unparseable correctly', () => {
    _setSpecSnapshotForTesting({
      snapshotDate: '2026-04-19',
      specSource: 'test://',
      specCommit: null,
      knownFields: {},
      graphorinMapping: {},
    });
    expect(compareAuthorSpecHint('2026-04-19')).toBe('same');
    expect(compareAuthorSpecHint('2025-12-01')).toBe('older');
    expect(compareAuthorSpecHint('2099-01-01')).toBe('newer');
    expect(compareAuthorSpecHint('not-a-date')).toBe('unparseable');
  });
});
