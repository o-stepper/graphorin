import { describe, expect, it } from 'vitest';

import { defaultPassageExtractor } from '../src/text-extraction.js';

describe('defaultPassageExtractor', () => {
  it('prefers `text` when present', () => {
    expect(
      defaultPassageExtractor({
        id: 'r1',
        kind: 'semantic',
        userId: 'u1',
        sensitivity: 'public',
        createdAt: '2026-01-01T00:00:00.000Z',
        text: 'this is the fact',
      } as never),
    ).toBe('this is the fact');
  });

  it('falls back to `summary` for episodes', () => {
    expect(
      defaultPassageExtractor({
        id: 'r2',
        kind: 'episodic',
        userId: 'u1',
        sensitivity: 'public',
        createdAt: '2026-01-01T00:00:00.000Z',
        summary: 'episode summary',
        startedAt: '2026-01-01T00:00:00.000Z',
        endedAt: '2026-01-01T00:01:00.000Z',
      } as never),
    ).toBe('episode summary');
  });

  it('falls back to `value` for working blocks', () => {
    expect(
      defaultPassageExtractor({
        id: 'r3',
        kind: 'working',
        userId: 'u1',
        sensitivity: 'public',
        createdAt: '2026-01-01T00:00:00.000Z',
        label: 'preferences',
        value: 'block value',
        charLimit: 1024,
      } as never),
    ).toBe('block value');
  });

  it('falls back to `label` when present and no text/summary/value', () => {
    expect(
      defaultPassageExtractor({
        id: 'r4',
        kind: 'working',
        userId: 'u1',
        sensitivity: 'public',
        createdAt: '2026-01-01T00:00:00.000Z',
        label: 'just-a-label',
        value: '',
        charLimit: 1024,
      } as never),
    ).toBe('just-a-label');
  });

  it('falls back to id as the last resort', () => {
    expect(
      defaultPassageExtractor({
        id: 'last-resort-id',
        kind: 'semantic',
        userId: 'u1',
        sensitivity: 'public',
        createdAt: '2026-01-01T00:00:00.000Z',
      } as never),
    ).toBe('last-resort-id');
  });
});
