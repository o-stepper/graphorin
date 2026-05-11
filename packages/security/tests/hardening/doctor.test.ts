import { mkdtempSync, writeFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _resetAuditDbBindingsForTesting,
  registerAuditDbBinding,
} from '../../src/audit/audit-db.js';
import {
  checkEncryption,
  checkPerms,
  checkSecrets,
  checkSystemd,
  parseSystemdScore,
} from '../../src/hardening/doctor.js';
import { _resetSecretsFactoryForTesting, createSecretsStore } from '../../src/secrets/factory.js';

import { createMemoryAuditDbBinding } from '../audit/_helpers.js';

describe('hardening/doctor', () => {
  describe('checkPerms', () => {
    if (process.platform === 'win32') {
      it('returns a single skip row on Windows', async () => {
        const r = await checkPerms({ expected: { 'C:\\nope': 0o600 } });
        expect(r[0]?.status).toBe('skip');
      });
      return;
    }
    let workDir: string;
    beforeEach(() => {
      workDir = mkdtempSync(join(tmpdir(), 'graphorin-doctor-'));
    });
    afterEach(async () => {
      await rm(workDir, { recursive: true, force: true });
    });

    it('reports ok when modes match', async () => {
      const path = join(workDir, 'data.db');
      writeFileSync(path, '', { mode: 0o600 });
      const result = await checkPerms({ expected: { [path]: 0o600 } });
      expect(result[0]?.status).toBe('ok');
    });

    it('reports fail when modes drift', async () => {
      const path = join(workDir, 'config.json');
      writeFileSync(path, '{}', { mode: 0o644 });
      const result = await checkPerms({ expected: { [path]: 0o600 } });
      expect(result[0]?.status).toBe('fail');
      expect(result[0]?.message).toContain('600');
    });

    it('reports warn when the file does not exist yet', async () => {
      const result = await checkPerms({
        expected: { [join(workDir, 'no-such-file')]: 0o600 },
      });
      expect(result[0]?.status).toBe('warn');
    });
  });

  describe('checkSecrets', () => {
    afterEach(() => _resetSecretsFactoryForTesting());

    it('warns when the factory has not run yet', () => {
      const r = checkSecrets();
      expect(r[0]?.status).toBe('warn');
    });

    it('returns ok with the active store when the factory has run', async () => {
      await createSecretsStore({ kind: 'env' });
      const r = checkSecrets();
      expect(r[0]?.status).toBe('ok');
      expect(r[0]?.message).toContain('env');
    });
  });

  describe('checkEncryption', () => {
    afterEach(() => _resetAuditDbBindingsForTesting());

    it('fails when no audit-db binding is registered', () => {
      const r = checkEncryption();
      expect(r[0]?.status).toBe('fail');
    });

    it('returns ok when at least one binding is registered', () => {
      registerAuditDbBinding(createMemoryAuditDbBinding());
      const r = checkEncryption();
      expect(r[0]?.status).toBe('ok');
    });
  });

  describe('checkSystemd', () => {
    it('skips when not on Linux or no unit configured', async () => {
      const r = await checkSystemd({});
      expect(r[0]?.status).toBe('skip');
    });

    it('parses the systemd-analyze score when invoked on Linux', async () => {
      if (process.platform !== 'linux') return;
      const r = await checkSystemd({
        unit: 'graphorin.service',
        run: async () => '→ Overall exposure level for graphorin.service: 4.2 OK',
      });
      expect(r[0]?.status).toBe('ok');
      expect(r[0]?.message).toContain('4.2');
    });
  });

  describe('parseSystemdScore', () => {
    it('extracts the score from the canonical output', () => {
      const score = parseSystemdScore('→ Overall exposure level for x.service: 7.3 EXPOSED');
      expect(score).toBeCloseTo(7.3, 1);
    });
    it('returns undefined for unrecognised output', () => {
      expect(parseSystemdScore('something else')).toBeUndefined();
    });
  });
});
