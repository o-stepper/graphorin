import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApiBoundaryGuard } from '../../src/guard/api-boundary-guard.js';
import {
  _resetMemoryGuardAuditListenersForTesting,
  type MemoryGuardAuditEvent,
  onMemoryGuardAudit,
} from '../../src/guard/audit-emitter.js';
import { createReader } from './_helpers.js';

describe('createApiBoundaryGuard', () => {
  afterEach(() => _resetMemoryGuardAuditListenersForTesting());

  it('succeeds when every observed op is in the allowlist', async () => {
    const captured: MemoryGuardAuditEvent[] = [];
    onMemoryGuardAudit((e) => captured.push(e));
    const observed = vi.fn().mockReturnValue(['session.append', 'semantic.upsert']);
    const guard = createApiBoundaryGuard({
      allowedOps: ['session.append', 'semantic.upsert'],
      observedOps: observed,
    });
    const { reader } = createReader({});
    const snap = await guard.snapshot(reader);
    const verify = await guard.verify(snap, reader);
    expect(verify.ok).toBe(true);
    expect(captured.map((e) => e.action)).toEqual([
      'memory:guard:snapshot',
      'memory:guard:verified',
    ]);
  });

  it('flags violations when an unexpected op appears', async () => {
    const captured: MemoryGuardAuditEvent[] = [];
    onMemoryGuardAudit((e) => captured.push(e));
    const guard = createApiBoundaryGuard({
      allowedOps: ['session.append'],
      observedOps: () => ['session.append', 'episodic.upsert'],
    });
    const { reader } = createReader({});
    const snap = await guard.snapshot(reader);
    const verify = await guard.verify(snap, reader);
    expect(verify.ok).toBe(false);
    if (!verify.ok) expect(verify.mismatched).toEqual(['episodic.upsert']);
    expect(captured.map((e) => e.action)).toEqual([
      'memory:guard:snapshot',
      'memory:guard:mismatch',
    ]);
  });

  it('honours the actor pointer in audit events', async () => {
    const captured: MemoryGuardAuditEvent[] = [];
    onMemoryGuardAudit((e) => captured.push(e));
    const guard = createApiBoundaryGuard({
      allowedOps: [],
      observedOps: () => [],
      actor: { kind: 'tool', toolName: 'remember', runId: 'r1' },
    });
    const { reader } = createReader({});
    await guard.snapshot(reader);
    expect(captured[0]?.actor).toMatchObject({ kind: 'tool', toolName: 'remember', runId: 'r1' });
  });
});
