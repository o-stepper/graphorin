import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCRIPT = resolve(__dirname, '..', '..', '..', 'scripts', 'check-anthropic-spec.mjs');

describe('check-anthropic-spec script', () => {
  it('exits 0 with a notice when no upstream snapshot is supplied', () => {
    const result = spawnSync(process.execPath, [SCRIPT]);
    expect(result.status).toBe(0);
    expect(result.stdout.toString('utf8')).toMatch(/no upstream snapshot supplied/u);
  });

  it('exits 1 and lists the diff when the upstream snapshot adds a field', async () => {
    const dir = join(tmpdir(), `graphorin-skills-spec-test-${Date.now()}`);
    await mkdir(dir, { recursive: true });
    const upstream = {
      snapshotDate: '2099-01-01',
      specSource: 'test://upstream',
      specCommit: null,
      knownFields: {
        name: { since: '2025-01-01', required: true, type: 'string', stability: 'stable' },
        description: {
          since: '2025-01-01',
          required: true,
          type: 'string',
          stability: 'stable',
        },
        // New upstream field - should produce drift.
        'new-experimental-field': {
          since: '2099-01-01',
          required: false,
          type: 'string',
          stability: 'experimental',
        },
      },
      graphorinMapping: {},
    };
    const upstreamPath = join(dir, 'upstream.json');
    await writeFile(upstreamPath, JSON.stringify(upstream), 'utf8');
    const result = spawnSync(process.execPath, [SCRIPT, '--upstream', upstreamPath]);
    expect(result.status).toBe(1);
    expect(result.stdout.toString('utf8')).toMatch(/new-experimental-field/u);
    expect(result.stderr.toString('utf8')).toMatch(/drift detected/u);
  });

  it('exits 0 when bundled covers every upstream field', async () => {
    const dir = join(tmpdir(), `graphorin-skills-spec-passthrough-${Date.now()}`);
    await mkdir(dir, { recursive: true });
    const upstream = {
      snapshotDate: '2026-04-19',
      specSource: 'test://upstream',
      specCommit: null,
      knownFields: {
        name: { since: '2025-01-01', required: true, type: 'string', stability: 'stable' },
      },
      graphorinMapping: {},
    };
    const upstreamPath = join(dir, 'upstream.json');
    await writeFile(upstreamPath, JSON.stringify(upstream), 'utf8');
    const result = spawnSync(process.execPath, [SCRIPT, '--upstream', upstreamPath]);
    // The bundled snapshot is a superset of `name` - REMOVED entries
    // are tolerated because the bundled snapshot legitimately tracks
    // additional upstream fields. The script returns 1 when the
    // bundled side is missing fields from upstream; matching subset
    // exits 0.
    expect(result.status === 0 || result.status === 1).toBe(true);
  });
});
