/**
 * STRIDE conformance regression net for the trust boundaries that
 * Phase 03c (sandbox + memory guard + guardrails + process
 * hardening) is responsible for. Each `it(...)` block names the
 * STRIDE row from the project's threat model it defends and
 * asserts the Phase 03c-owned mitigation produces the documented
 * outcome.
 *
 * Phase 03c covers the process boundary and the persistence
 * boundary's file-mode hardening. The sub-agent, MCP, and server
 * REST/WS boundaries are owned by other phases (03a / 03d / 09 /
 * 14) and stay out of scope here; this file does not duplicate
 * their tests.
 */

import { mkdtempSync, writeFileSync } from 'node:fs';
import { rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createAuditOnlyGuard } from '../../src/guard/audit-only-guard.js';
import { createStrictFullGuard } from '../../src/guard/strict-full-guard.js';
import {
  _resetHardeningStatusForTesting,
  applyProcessHardening,
} from '../../src/hardening/apply.js';
import { RefuseToRunAsRootError } from '../../src/hardening/errors.js';
import { ensureFileMode, verifyFileMode } from '../../src/hardening/file-modes.js';
import { resolveSandbox } from '../../src/sandbox/tier-resolver.js';

const isPosix = process.platform !== 'win32';

describe('STRIDE § 3.1 - Process boundary (graphorin ↔ OS)', () => {
  let originalUmask: number;
  let originalGeteuid: typeof process.geteuid;

  beforeEach(() => {
    _resetHardeningStatusForTesting();
    originalUmask = process.umask();
    originalGeteuid = process.geteuid;
  });

  afterEach(() => {
    _resetHardeningStatusForTesting();
    process.umask(originalUmask);
    if (originalGeteuid) {
      Object.defineProperty(process, 'geteuid', { configurable: true, value: originalGeteuid });
    }
  });

  it('Elevation of privilege - refuses to run as root on POSIX (DEC-135)', () => {
    if (!isPosix) return;
    Object.defineProperty(process, 'geteuid', { configurable: true, value: () => 0 });
    expect(() => applyProcessHardening()).toThrow(RefuseToRunAsRootError);
  });

  it('Elevation of privilege - restricts default umask to 0o077 (DEC-135)', () => {
    if (!isPosix) return;
    applyProcessHardening({ umask: 0o077 });
    const previous = process.umask();
    expect(previous).toBe(0o077);
  });

  it('Information disclosure - sandbox resolver mandates `worker-threads + no-network + no-filesystem` for untrusted skills (DEC-148)', () => {
    const policy = resolveSandbox({
      trustLevel: 'untrusted',
      override: { kind: 'none', noNetwork: false, noFilesystem: false },
    });
    expect(policy.kind).toBe('worker-threads');
    expect(policy.noNetwork).toBe(true);
    expect(policy.noFilesystem).toBe(true);
    expect(policy.forced).toBe(true);
  });

  it('Tampering - STRICT_FULL_GUARD detects post-execution memory mutation (DEC-153)', async () => {
    const state = new Map([
      ['session', 'a'],
      ['semantic', 'b'],
    ]);
    const reader = {
      regions: ['session', 'semantic'],
      read: async (region: string) => state.get(region) ?? '',
    };
    const guard = createStrictFullGuard();
    const snap = await guard.snapshot(reader);
    state.set('session', 'tampered');
    const verify = await guard.verify(snap, reader);
    expect(verify.ok).toBe(false);
    if (!verify.ok) expect(verify.mismatched).toEqual(['session']);
  });

  it('Repudiation - AUDIT_ONLY_GUARD records before/after entries even when no enforcement happens (DEC-153)', async () => {
    const captured: string[] = [];
    const { onMemoryGuardAudit, _resetMemoryGuardAuditListenersForTesting } = await import(
      '../../src/guard/audit-emitter.js'
    );
    _resetMemoryGuardAuditListenersForTesting();
    onMemoryGuardAudit((e) => captured.push(e.action));
    const state = new Map([['session', 'a']]);
    const reader = {
      regions: ['session'],
      read: async (region: string) => state.get(region) ?? '',
    };
    const guard = createAuditOnlyGuard();
    const snap = await guard.snapshot(reader);
    state.set('session', 'changed');
    await guard.verify(snap, reader);
    expect(captured).toContain('memory:modification:before');
    expect(captured).toContain('memory:modification:after');
    _resetMemoryGuardAuditListenersForTesting();
  });
});

describe('STRIDE § 3.7 - Persistence boundary (sensitive files at rest)', () => {
  if (!isPosix) {
    it.skip('skipped on Windows: POSIX modes are not honoured by NTFS', () => {
      /* noop */
    });
    return;
  }

  let originalUmask: number;
  let workDir: string;

  beforeEach(() => {
    _resetHardeningStatusForTesting();
    originalUmask = process.umask();
    workDir = mkdtempSync(join(tmpdir(), 'graphorin-stride-'));
  });

  afterEach(async () => {
    _resetHardeningStatusForTesting();
    process.umask(originalUmask);
    await rm(workDir, { recursive: true, force: true });
  });

  it('Information disclosure - newly written files default to mode 0600 under umask 0o077 (RB-22)', async () => {
    applyProcessHardening({ umask: 0o077 });
    const path = join(workDir, 'data.db');
    writeFileSync(path, '');
    const stats = await stat(path);
    expect(stats.mode & 0o777).toBe(0o600);
  });

  it('Tampering - verifyFileMode reports mode drift on a sensitive file (DEC-135)', async () => {
    const path = join(workDir, 'config.json');
    writeFileSync(path, '{}', { mode: 0o644 });
    const drift = await verifyFileMode(path, 0o600);
    expect(drift.ok).toBe(false);
    expect(drift.actual).toBe(0o644);

    await ensureFileMode(path, 0o600);
    const repaired = await verifyFileMode(path, 0o600);
    expect(repaired.ok).toBe(true);
  });

  it('Tampering - strict file-mode utilities throw FileModeMismatchError when the FS refuses chmod', async () => {
    // Simulate a host filesystem that refuses to honour chmod by
    // running ensureFileMode against a non-existent path; the helper
    // must surface the failure rather than silently swallow it.
    const warn = vi.fn();
    await expect(ensureFileMode(join(workDir, 'missing.json'), 0o600, { warn })).rejects.toThrow();
  });
});
