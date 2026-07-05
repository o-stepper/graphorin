/**
 * Cross-helper integration tests for the hardening subsystem. Each
 * test exercises an end-to-end flow that the Phase 03c DoD calls out
 * as a single line item ("umask 0o077 applied; new files created in
 * fixture directory have mode 0600 after ensureFileMode"); they
 * deliberately combine several primitives so a regression in any
 * one of them surfaces here.
 */

import { mkdtempSync, writeFileSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _resetHardeningStatusForTesting,
  applyProcessHardening,
} from '../../src/hardening/apply.js';
import { ensureFileMode, verifyFileMode } from '../../src/hardening/file-modes.js';

const isPosix = process.platform !== 'win32';

describe('hardening - applyProcessHardening + ensureFileMode integration', () => {
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
    workDir = mkdtempSync(join(tmpdir(), 'graphorin-hardening-int-'));
  });

  afterEach(() => {
    _resetHardeningStatusForTesting();
    process.umask(originalUmask);
  });

  it('umask 0o077 → new files inherit mode 0600 without explicit chmod', async () => {
    applyProcessHardening({ umask: 0o077 });
    const path = join(workDir, 'data.db');
    // Default Node mode for new files is 0o666; with umask 0o077 the
    // OS strips group/other bits, so the file lands at 0o600.
    writeFileSync(path, '');
    const stats = await stat(path);
    expect(stats.mode & 0o777).toBe(0o600);
  });

  it('ensureFileMode tightens 0o644 → 0o600 and verifyFileMode confirms it', async () => {
    applyProcessHardening({ umask: 0o077 });
    const path = join(workDir, 'config.json');
    writeFileSync(path, '{}', { mode: 0o644 });
    await ensureFileMode(path, 0o600);
    const verify = await verifyFileMode(path, 0o600);
    expect(verify.ok).toBe(true);
    expect(verify.actual).toBe(0o600);
  });
});
