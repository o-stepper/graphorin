import { mkdtempSync, rmSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  _resetFileResolverWarningsForTesting,
  fileResolver,
  resolveSecret,
  SecretResolutionError,
} from '../../src/secrets/index.js';

let workDir: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'graphorin-file-res-'));
  _resetFileResolverWarningsForTesting();
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
  delete process.env.GRAPHORIN_QUIET_RELATIVE_FILE_REFS;
});

describe('file: resolver', () => {
  it('rejects empty path', async () => {
    await expect(
      fileResolver.resolve({ raw: 'file:', scheme: 'file', path: '', query: {} }, undefined),
    ).rejects.toThrow(SecretResolutionError);
  });

  it('warns once on permissive modes', async () => {
    if (process.platform === 'win32') return;
    const path = join(workDir, 'open-secret.txt');
    await writeFile(path, 'hello', { mode: 0o644 });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const value = await resolveSecret(`file://${path}`);
      expect(value.reveal()).toBe('hello');
      expect(warn).toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('opts out of permission warnings via ?warnOnPermissions=0', async () => {
    if (process.platform === 'win32') return;
    const path = join(workDir, 'open-secret.txt');
    await writeFile(path, 'hello', { mode: 0o644 });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await resolveSecret(`file://${path}?warnOnPermissions=0`);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('warns when resolving relative paths', async () => {
    const dir = join(workDir, 'sub');
    await mkdir(dir);
    const path = join(dir, 'secret.txt');
    await writeFile(path, 'rel', { mode: 0o600 });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const prevCwd = process.cwd();
    try {
      process.chdir(dir);
      await resolveSecret('file:./secret.txt');
      expect(warn).toHaveBeenCalled();
    } finally {
      process.chdir(prevCwd);
      warn.mockRestore();
    }
  });

  it('honours base64 encoding', async () => {
    const path = join(workDir, 'b64.txt');
    await writeFile(path, Buffer.from('hello').toString('base64'), { mode: 0o600 });
    const value = await resolveSecret(`file://${path}?encoding=base64&warnOnPermissions=0`);
    expect(value.reveal()).toBe('hello');
  });
});
