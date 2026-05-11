import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  _getMemoryGuardAuditListenerCountForTesting,
  _resetMemoryGuardAuditListenersForTesting,
  emitMemoryGuardAudit,
  onMemoryGuardAudit,
} from '../../src/guard/audit-emitter.js';

describe('memoryGuardAuditEmitter', () => {
  afterEach(() => _resetMemoryGuardAuditListenersForTesting());

  it('forwards events to every subscriber', () => {
    const a = vi.fn();
    const b = vi.fn();
    onMemoryGuardAudit(a);
    onMemoryGuardAudit(b);
    emitMemoryGuardAudit({
      action: 'memory:guard:snapshot',
      decision: 'success',
      ts: 1_700_000_000_000,
      tier: 'unknown',
    });
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it('isolates listener errors', () => {
    const good = vi.fn();
    onMemoryGuardAudit(() => {
      throw new Error('listener boom');
    });
    onMemoryGuardAudit(good);
    expect(() =>
      emitMemoryGuardAudit({
        action: 'memory:guard:verified',
        decision: 'success',
        ts: 1_700_000_000_000,
        tier: 'memory-aware',
      }),
    ).not.toThrow();
    expect(good).toHaveBeenCalledOnce();
  });

  it('returns an unsubscribe function', () => {
    const fn = vi.fn();
    const off = onMemoryGuardAudit(fn);
    expect(_getMemoryGuardAuditListenerCountForTesting()).toBe(1);
    off();
    expect(_getMemoryGuardAuditListenerCountForTesting()).toBe(0);
  });
});
