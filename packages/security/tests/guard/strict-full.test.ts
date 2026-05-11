import { afterEach, describe, expect, it } from 'vitest';

import {
  _resetMemoryGuardAuditListenersForTesting,
  type MemoryGuardAuditEvent,
  onMemoryGuardAudit,
} from '../../src/guard/audit-emitter.js';
import {
  createStrictFullGuard,
  MemoryGuardBudgetExceededError,
} from '../../src/guard/strict-full-guard.js';
import { createReader } from './_helpers.js';

describe('createStrictFullGuard', () => {
  afterEach(() => _resetMemoryGuardAuditListenersForTesting());

  it('returns ok=false on mismatch (so the runtime can roll back)', async () => {
    const captured: MemoryGuardAuditEvent[] = [];
    onMemoryGuardAudit((e) => captured.push(e));
    const guard = createStrictFullGuard();
    const { reader, set } = createReader({ session: 'a', semantic: 'b' });
    const snap = await guard.snapshot(reader);
    set('session', 'tampered');
    const verify = await guard.verify(snap, reader);
    expect(verify.ok).toBe(false);
    if (!verify.ok) expect(verify.mismatched).toEqual(['session']);
    const actions = captured.map((e) => e.action);
    expect(actions).toContain('memory:guard:mismatch');
    expect(captured.find((e) => e.action === 'memory:guard:mismatch')?.decision).toBe('denied');
  });

  it('returns ok=true when nothing changed', async () => {
    const guard = createStrictFullGuard();
    const { reader } = createReader({ a: 'A', b: 'B' });
    const snap = await guard.snapshot(reader);
    const verify = await guard.verify(snap, reader);
    expect(verify.ok).toBe(true);
  });

  it('emits canonical memory:modification:before and :after entries on rollback path', async () => {
    const captured: MemoryGuardAuditEvent[] = [];
    onMemoryGuardAudit((e) => captured.push(e));
    const guard = createStrictFullGuard();
    const { reader, set } = createReader({ session: 'a' });
    const snap = await guard.snapshot(reader);
    set('session', 'tampered');
    await guard.verify(snap, reader);
    const before = captured.filter((e) => e.action === 'memory:modification:before');
    const after = captured.filter((e) => e.action === 'memory:modification:after');
    expect(before).toHaveLength(1);
    expect(after).toHaveLength(1);
    // When STRICT_FULL detects a mutation it rolls back, so the
    // canonical "after" row carries decision='denied'.
    expect(after[0]?.decision).toBe('denied');
    expect(after[0]?.tier).toBe('untrusted');
  });

  it('throws MemoryGuardBudgetExceededError when the snapshot exceeds the budget', async () => {
    const guard = createStrictFullGuard({ maxMemoryBytes: 100 });
    const { reader } = createReader({ a: 'x'.repeat(150) });
    await expect(guard.snapshot(reader)).rejects.toBeInstanceOf(MemoryGuardBudgetExceededError);
  });

  it('emits an exceeded-budget audit event', async () => {
    const captured: MemoryGuardAuditEvent[] = [];
    onMemoryGuardAudit((e) => captured.push(e));
    const guard = createStrictFullGuard({ maxMemoryBytes: 16 });
    const { reader } = createReader({ a: 'x'.repeat(64) });
    await expect(guard.snapshot(reader)).rejects.toBeInstanceOf(MemoryGuardBudgetExceededError);
    expect(captured.find((e) => e.action === 'memory:guard:exceeded-budget')).toBeDefined();
  });
});
