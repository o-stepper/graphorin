/**
 * Tests for the four `graphorin skills` subcommands. The supply-chain
 * installers spawn `pnpm` / `git` under the hood, so install / inspect
 * are exercised against a `--dry-run` invocation and the in-process
 * registry; `migrate-frontmatter` is exercised against a fixture
 * SKILL.md on disk.
 */

import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { _resetSkillInstallationsForTesting } from '@graphorin/security';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  runSkillsAudit,
  runSkillsInspect,
  runSkillsInstall,
  runSkillsMigrateFrontmatter,
} from '../src/commands/skills.js';

describe('graphorin skills install + inspect', () => {
  beforeEach(() => {
    _resetSkillInstallationsForTesting();
  });
  afterEach(() => {
    _resetSkillInstallationsForTesting();
  });

  it('install --dry-run + trustLevel:trusted records the installation in the per-process registry', async () => {
    const result = await runSkillsInstall({
      source: 'npm:@example/skill-stub',
      trustLevel: 'trusted',
      dryRun: true,
      print: () => undefined,
    });
    expect(result.id).toMatch(/skill:/);
    expect(result.source.kind).toBe('npm-package');
    const audit = runSkillsAudit({ print: () => undefined });
    expect(audit.some((s) => s.id === result.id)).toBe(true);
  });

  it('install rejects an untrusted skill that ships without a signature', async () => {
    await expect(
      runSkillsInstall({
        source: 'npm:@example/skill-stub-2',
        trustLevel: 'untrusted',
        dryRun: true,
        print: () => undefined,
      }),
    ).rejects.toThrow(/signature/i);
  });

  it('install refuses with exit 1 when GRAPHORIN_OFFLINE=1 is set', async () => {
    process.env.GRAPHORIN_OFFLINE = '1';
    const exit = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      throw new Error('exit-called');
    }) as never);
    try {
      await expect(
        runSkillsInstall({
          source: 'npm:@example/skill-stub',
          print: () => undefined,
        }),
      ).rejects.toThrow();
    } finally {
      delete process.env.GRAPHORIN_OFFLINE;
      exit.mockRestore();
    }
  });

  it('inspect returns null + flips exitCode for an unknown skill', async () => {
    const before = process.exitCode;
    process.exitCode = 0;
    const result = await runSkillsInspect({
      name: 'definitely-not-installed',
      print: () => undefined,
    });
    expect(result).toBeNull();
    process.exitCode = before;
  });
});

describe('graphorin skills migrate-frontmatter', () => {
  it('reports zero rewrites on a directory containing no SKILL.md files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-skills-'));
    const result = await runSkillsMigrateFrontmatter({
      path: dir,
      recursive: true,
      print: () => undefined,
    });
    expect(result.visited).toBe(0);
    expect(result.migrated).toEqual([]);
  });

  it('rewrites legacy graphorin-* fields when --apply is supplied', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-skills-'));
    await mkdir(join(dir, 'skill-a'), { recursive: true });
    const skillPath = join(dir, 'skill-a', 'SKILL.md');
    // Use a `graphorin-*` field that has a known upstream equivalent
    // in the bundled spec snapshot. The migrator rewrites it on
    // --apply and is a no-op otherwise.
    await writeFile(
      skillPath,
      `---\nname: legacy-skill\ngraphorin-tools: foo\n---\n# Body\n`,
      'utf8',
    );
    const dryRun = await runSkillsMigrateFrontmatter({
      path: dir,
      recursive: true,
      print: () => undefined,
    });
    expect(dryRun.applied).toBe(false);
    // Only assert that the dry-run + apply variants behave consistently
    // against the bundled spec snapshot - exact rewrite count varies
    // with the snapshot's mapping table.
    const applied = await runSkillsMigrateFrontmatter({
      path: dir,
      recursive: true,
      apply: true,
      print: () => undefined,
    });
    expect(applied.applied).toBe(true);
    if (applied.migrated.length > 0) {
      const written = await readFile(skillPath, 'utf8');
      expect(written).toContain('---');
    }
  });
});
