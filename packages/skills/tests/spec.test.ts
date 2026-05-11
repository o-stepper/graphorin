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
