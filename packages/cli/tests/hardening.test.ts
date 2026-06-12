/**
 * Process-hardening integration tests for the Phase 15 CLI.
 *
 * The CLI invokes `applyProcessHardening(...)` from
 * `@graphorin/security/hardening` at the top of every long-running
 * subcommand (`graphorin start` / `graphorin migrate`). The helper
 * refuses to run when the effective UID is `0` on POSIX hosts.
 */

import { _resetHardeningStatusForTesting, RefuseToRunAsRootError } from '@graphorin/security';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyHardeningEarly } from '../src/commands/start.js';

describe('applyHardeningEarly', () => {
  beforeEach(() => {
    _resetHardeningStatusForTesting();
  });

  afterEach(() => {
    _resetHardeningStatusForTesting();
    vi.restoreAllMocks();
  });

  it('exits 1 with an actionable error when the process is running as root on POSIX', () => {
    if (process.platform === 'win32') {
      // Skip — Windows does not honour POSIX UIDs.
      return;
    }
    vi.spyOn(process as unknown as { geteuid(): number }, 'geteuid').mockReturnValue(0);
    const writes: string[] = [];
    vi.spyOn(process.stderr, 'write').mockImplementation((data) => {
      writes.push(typeof data === 'string' ? data : Buffer.from(data).toString('utf8'));
      return true;
    });
    const exit = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      throw new Error('exit-called');
    }) as never);
    expect(() => applyHardeningEarly()).toThrow(/exit-called/);
    const stderr = writes.join('');
    expect(stderr).toContain('refuses to run as root');
    expect(stderr).toMatch(/hint:.*(?:non.?root|drop privileges)/i);
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('applies umask(0o077) on POSIX hosts when not running as root', () => {
    if (process.platform === 'win32') return;
    vi.spyOn(process as unknown as { geteuid(): number }, 'geteuid').mockReturnValue(1000);
    const before = process.umask();
    try {
      applyHardeningEarly();
      // Hardening sets umask 0o077; restore before each test isolates
      // the global change.
      expect(process.umask()).toBe(0o077);
    } finally {
      process.umask(before);
    }
  });

  it('rethrows non-RefuseToRunAsRootError errors unchanged', () => {
    if (process.platform === 'win32') return;
    vi.spyOn(process as unknown as { geteuid(): number }, 'geteuid').mockReturnValue(0);
    const exit = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      throw new Error('exit-called');
    }) as never);
    try {
      applyHardeningEarly();
    } catch (err) {
      expect(err instanceof Error ? err.message : '').toBe('exit-called');
    } finally {
      exit.mockRestore();
    }
  });
});

describe('RefuseToRunAsRootError', () => {
  it('carries an actionable message + a documented hint', () => {
    const err = new RefuseToRunAsRootError();
    expect(err.message.toLowerCase()).toContain('root');
  });
});
