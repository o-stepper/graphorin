import { mkdtempSync, writeFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ensureDirMode, ensureFileMode, verifyFileMode } from '../../src/hardening/file-modes.js';

const isPosix = process.platform !== 'win32';

describe('file-mode utilities', () => {
  if (!isPosix) {
    it.skip('skipped on Windows: POSIX modes are not honoured by NTFS', () => {
      /* noop */
    });
    return;
  }

  let workDir: string;
  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 'graphorin-hardening-'));
  });
  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it('ensureFileMode chmods the file to 0600', async () => {
    const path = join(workDir, 'config.json');
    writeFileSync(path, '{}', { mode: 0o644 });
    await ensureFileMode(path, 0o600);
    const verify = await verifyFileMode(path, 0o600);
    expect(verify.ok).toBe(true);
  });

  it('ensureDirMode creates a directory at 0700', async () => {
    const path = join(workDir, 'inner');
    await ensureDirMode(path, 0o700);
    const verify = await verifyFileMode(path, 0o700);
    expect(verify.ok).toBe(true);
  });

  it('verifyFileMode returns the actual mode on drift', async () => {
    const path = join(workDir, 'data.db');
    writeFileSync(path, '', { mode: 0o644 });
    const verify = await verifyFileMode(path, 0o600);
    expect(verify.ok).toBe(false);
    expect(verify.actual).toBe(0o644);
  });
});
