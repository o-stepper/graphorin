import { afterEach, describe, expect, it } from 'vitest';

import {
  _resetMemoryGuardAuditListenersForTesting,
  type MemoryGuardAuditEvent,
  onMemoryGuardAudit,
} from '../../src/guard/audit-emitter.js';
import { createAuditOnlyGuard } from '../../src/guard/audit-only-guard.js';
import { createReader } from './_helpers.js';

describe('createAuditOnlyGuard', () => {
  afterEach(() => _resetMemoryGuardAuditListenersForTesting());

  it('returns ok=true even when regions changed (audit-only)', async () => {
    const captured: MemoryGuardAuditEvent[] = [];
    onMemoryGuardAudit((e) => captured.push(e));
    const guard = createAuditOnlyGuard();
    const { reader, set } = createReader({ session: 'a', semantic: 'b' });
    const snap = await guard.snapshot(reader);
    set('session', 'a-changed');
    const verify = await guard.verify(snap, reader);
    expect(verify.ok).toBe(true);
    const actions = captured.map((e) => e.action);
    expect(actions).toContain('memory:guard:snapshot');
    expect(actions).toContain('memory:guard:mismatch');
  });

  it('emits canonical memory:modification:before and :after audit entries (DEC-153)', async () => {
    const captured: MemoryGuardAuditEvent[] = [];
    onMemoryGuardAudit((e) => captured.push(e));
    const guard = createAuditOnlyGuard();
    const { reader, set } = createReader({ session: 'a', semantic: 'b' });
    const snap = await guard.snapshot(reader);
    set('session', 'a-changed');
    await guard.verify(snap, reader);
    const before = captured.filter((e) => e.action === 'memory:modification:before');
    const after = captured.filter((e) => e.action === 'memory:modification:after');
    expect(before).toHaveLength(1);
    expect(after).toHaveLength(1);
    expect(before[0]?.tier).toBe('unknown');
    expect(after[0]?.regions).toEqual(['session']);
    // Snapshot row records the regions hashed.
    expect(before[0]?.metadata).toMatchObject({ regionCount: 2 });
    // Verify row records the mismatch count.
    expect(after[0]?.metadata).toMatchObject({ mismatchCount: 1 });
  });

  it('emits a clean before/after pair when nothing changed', async () => {
    const captured: MemoryGuardAuditEvent[] = [];
    onMemoryGuardAudit((e) => captured.push(e));
    const guard = createAuditOnlyGuard();
    const { reader } = createReader({ session: 'a' });
    const snap = await guard.snapshot(reader);
    await guard.verify(snap, reader);
    const before = captured.filter((e) => e.action === 'memory:modification:before');
    const after = captured.filter((e) => e.action === 'memory:modification:after');
    expect(before).toHaveLength(1);
    expect(after).toHaveLength(1);
    expect(after[0]?.decision).toBe('success');
    expect(after[0]?.regions).toBeUndefined();
  });

  it('produces matching digests when no region changed', async () => {
    const captured: MemoryGuardAuditEvent[] = [];
    onMemoryGuardAudit((e) => captured.push(e));
    const guard = createAuditOnlyGuard();
    const { reader } = createReader({ session: 'a', semantic: 'b' });
    const snap = await guard.snapshot(reader);
    const verify = await guard.verify(snap, reader);
    expect(verify.ok).toBe(true);
    const actions = captured.map((e) => e.action);
    expect(actions).toContain('memory:guard:verified');
  });

  it('hashes the region content via xxhash', async () => {
    const guard = createAuditOnlyGuard();
    const { reader } = createReader({ a: 'hello' });
    const snap = await guard.snapshot(reader);
    expect(snap.digest[0]?.region).toBe('a');
    expect(snap.digest[0]?.hash).toMatch(/^[0-9a-f]{8}$/);
  });

  // Same reasoning as verify-perf.test.ts: instrumentation makes the
  // p95 canary meaningless - the CI coverage leg skips it.
  it.skipIf(process.env.GRAPHORIN_COVERAGE === '1')(
    'snapshot + verify hold p95 <= 200 us/call on a 10 KB region',
    async () => {
      // DEC-153 design target is ≤ 50 µs per phase on 10 KB state with a
      // native xxhash binding. The v0.1 framework ships the pure-JS
      // XXH32 helper from `@graphorin/core` (no native peer) so the
      // realistic typical-case is ~30 µs/call on commodity hardware;
      // we assert p95 ≤ 200 µs (matching the `verify-perf.test.ts`
      // idiom in the same package) so a single GC/scheduler pause
      // does not flake the suite while obvious regressions still trip.
      // The tighter 50 µs target is deferred to the optional native
      // binding follow-up (post-MVP - DEC-153 perf-budget commentary).
      const big = 'x'.repeat(10_000);
      const guard = createAuditOnlyGuard();
      const { reader } = createReader({ a: big });

      // Warm-up: prime the JIT.
      for (let i = 0; i < 50; i += 1) await guard.snapshot(reader);

      const N = 200;
      const snapshotSamples = new Array<number>(N);
      const verifySamples = new Array<number>(N);
      let lastSnap: Awaited<ReturnType<typeof guard.snapshot>> | undefined;
      for (let i = 0; i < N; i += 1) {
        const snap = await guard.snapshot(reader);
        snapshotSamples[i] = snap.durationUs;
        lastSnap = snap;
        const verify = await guard.verify(snap, reader);
        verifySamples[i] = verify.verifyDurationUs;
      }
      snapshotSamples.sort((a, b) => a - b);
      verifySamples.sort((a, b) => a - b);
      const p95Index = Math.floor(N * 0.95);
      const p95SnapshotUs = snapshotSamples[p95Index] ?? snapshotSamples[N - 1] ?? 0;
      const p95VerifyUs = verifySamples[p95Index] ?? verifySamples[N - 1] ?? 0;
      // Quiet machines (local M1 / dedicated runner): the p95 is well
      // below 200 µs and the 200 µs gate catches obvious regressions.
      // Shared GitHub-hosted runners suffer wild noise on µs-scale
      // microbenchmarks - this assertion has measured 1.1 ms, ~3.0 ms,
      // and (2026-07-05, the flake that retired the 5 ms budget) 5.1 ms
      // per call while the median sample on the same job stayed ~30 µs.
      // Under `CI=true` the gate is therefore catastrophic-only
      // (20 000 µs = 100x the local budget): it still fails on a real
      // algorithmic regression but no scheduler / GC pause can trip it.
      // The strict perf gate lives in `pnpm run benchmark:ci` on a
      // quiescent fixture.
      const P95_BUDGET_US = process.env.CI === 'true' ? 20_000 : 200;
      expect(p95SnapshotUs).toBeLessThan(P95_BUDGET_US);
      expect(p95VerifyUs).toBeLessThan(P95_BUDGET_US);
      expect(lastSnap?.digest[0]?.region).toBe('a');
    },
  );
});
