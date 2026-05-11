import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { runAuditVerify } from '../src/commands/audit.js';

async function fixtureWithoutAudit(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-audit-'));
  const cfg = join(dir, 'graphorin.config.json');
  await writeFile(
    cfg,
    JSON.stringify({
      storage: { path: join(dir, 'data.db'), mode: 'lib' },
      auth: { kind: 'none' },
    }),
    'utf8',
  );
  return cfg;
}

describe('graphorin audit verify', () => {
  it('refuses when audit.enabled is false in the resolved config', async () => {
    const cfg = await fixtureWithoutAudit();
    await expect(runAuditVerify({ config: cfg, print: () => undefined })).rejects.toThrow(
      /audit\.enabled/,
    );
  });
});
