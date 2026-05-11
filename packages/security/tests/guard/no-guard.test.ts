import { describe, expect, it } from 'vitest';

import { createNoGuard } from '../../src/guard/no-guard.js';
import { createReader } from './_helpers.js';

describe('createNoGuard', () => {
  it('returns an empty digest for both tier values', async () => {
    const pure = createNoGuard('pure');
    const sideOnly = createNoGuard('side-effecting-no-memory');
    const { reader, set } = createReader({ a: 'A', b: 'B' });
    const before = await pure.snapshot(reader);
    set('a', 'A!');
    const after = await pure.verify(before, reader);
    expect(after.ok).toBe(true);
    expect(before.digest).toEqual([]);
    expect(after.tier).toBe('pure');
    expect((await sideOnly.snapshot(reader)).digest).toEqual([]);
  });

  it('reports zero overhead', async () => {
    const guard = createNoGuard('pure');
    const { reader } = createReader({ a: '0123456789' });
    const snap = await guard.snapshot(reader);
    expect(snap.durationUs).toBe(0);
    const verify = await guard.verify(snap, reader);
    expect(verify.verifyDurationUs).toBe(0);
  });
});
