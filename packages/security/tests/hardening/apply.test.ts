import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  _resetHardeningStatusForTesting,
  applyProcessHardening,
  getHardeningStatus,
} from '../../src/hardening/apply.js';
import { RefuseToRunAsRootError } from '../../src/hardening/errors.js';

const originalGeteuid = process.geteuid;

describe('applyProcessHardening', () => {
  let originalUmask: number;
  beforeEach(() => {
    _resetHardeningStatusForTesting();
    originalUmask = process.umask();
  });
  afterEach(() => {
    _resetHardeningStatusForTesting();
    process.umask(originalUmask);
    if (originalGeteuid) {
      Object.defineProperty(process, 'geteuid', { configurable: true, value: originalGeteuid });
    }
  });

  it('sets the desired umask and records the previous value', () => {
    const status = applyProcessHardening({ umask: 0o077 });
    expect(status.applied).toBe(true);
    expect(status.umask).toBe(0o077);
    expect(getHardeningStatus()).toBe(status);
    // Verify the umask actually changed (peek-without-set returns the current).
    const current = process.umask(originalUmask);
    expect(current).toBe(0o077);
  });

  it('refuses to run as root by default on POSIX with the systemd User= hint', () => {
    if (process.platform === 'win32') {
      // Windows has no POSIX uids; skip.
      return;
    }
    Object.defineProperty(process, 'geteuid', {
      configurable: true,
      value: () => 0,
    });
    let captured: RefuseToRunAsRootError | undefined;
    try {
      applyProcessHardening();
    } catch (error) {
      if (error instanceof RefuseToRunAsRootError) captured = error;
      else throw error;
    }
    expect(captured).toBeInstanceOf(RefuseToRunAsRootError);
    expect(captured?.kind).toBe('refuse-to-run-as-root');
    // The error MUST steer the operator at the systemd User= directive
    // per DEC-135; the hint additionally mentions Docker USER and k8s
    // securityContext.runAsUser as alternative deployment vectors.
    expect(captured?.message).toContain('systemd User= directive');
    expect(captured?.hint).toContain('DEC-135');
  });

  it('honours allowRoot: true after WARN', () => {
    if (process.platform === 'win32') return;
    Object.defineProperty(process, 'geteuid', {
      configurable: true,
      value: () => 0,
    });
    const warn = vi.fn();
    const status = applyProcessHardening({ allowRoot: true, warn });
    expect(status.applied).toBe(true);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('is idempotent: subsequent calls return the same status', () => {
    const a = applyProcessHardening({ umask: 0o077 });
    const b = applyProcessHardening({ umask: 0o002 });
    expect(b).toBe(a);
    expect(b.umask).toBe(0o077);
  });
});
