import { describe, expect, it } from 'vitest';

import { migrateFrontmatter, sortKeysAnthropicFirst } from '../src/migration/index.js';

describe('migrateFrontmatter', () => {
  it('dry-run: reports rewrites without mutating bytes', () => {
    const skillMd = [
      '---',
      'name: t',
      'description: d',
      'graphorin-allowed-tools:',
      '  - read_file',
      '---',
      'BODY',
    ].join('\n');
    const result = migrateFrontmatter(skillMd);
    expect(result.changed).toBe(false);
    expect(result.migratedSkillMd).toBe(skillMd);
    const rewrite = result.rewrites.find((r) => r.fromField === 'graphorin-allowed-tools');
    expect(rewrite?.applied).toBe(false);
    expect(rewrite?.toField).toBe('allowed-tools');
  });

  it('apply: rewrites graphorin-* fields onto the upstream equivalent', () => {
    const skillMd = [
      '---',
      'name: t',
      'description: d',
      'graphorin-allowed-tools:',
      '  - read_file',
      '---',
      'BODY',
    ].join('\n');
    const result = migrateFrontmatter(skillMd, { apply: true });
    expect(result.changed).toBe(true);
    expect(result.migratedSkillMd).not.toBe(skillMd);
    expect(result.migratedSkillMd).toContain('allowed-tools:');
    expect(result.migratedSkillMd).not.toContain('graphorin-allowed-tools:');
    const rewrite = result.rewrites.find((r) => r.fromField === 'graphorin-allowed-tools');
    expect(rewrite?.applied).toBe(true);
  });

  it('idempotent: re-running on a migrated SKILL.md returns changed: false', () => {
    const skillMd = [
      '---',
      'name: t',
      'description: d',
      'graphorin-allowed-tools:',
      '  - read_file',
      '---',
      'BODY',
    ].join('\n');
    const first = migrateFrontmatter(skillMd, { apply: true });
    const second = migrateFrontmatter(first.migratedSkillMd, { apply: true });
    expect(second.changed).toBe(false);
    expect(second.migratedSkillMd).toBe(first.migratedSkillMd);
  });

  it('does not overwrite an already-set Anthropic-base field', () => {
    const skillMd = [
      '---',
      'name: t',
      'description: d',
      'allowed-tools: [read_file]',
      'graphorin-allowed-tools: [legacy_tool]',
      '---',
    ].join('\n');
    const result = migrateFrontmatter(skillMd, { apply: true });
    // Migrator must not silently overwrite — operator is expected to
    // remove the redundant graphorin-* field manually.
    expect(result.migratedSkillMd).toContain('graphorin-allowed-tools');
    expect(result.migratedSkillMd).toContain('allowed-tools: [read_file]');
    const rewrite = result.rewrites.find((r) => r.fromField === 'graphorin-allowed-tools');
    expect(rewrite?.applied).toBe(false);
  });
});

describe('sortKeysAnthropicFirst', () => {
  it('orders Anthropic-base keys first, then metadata, then graphorin-*', () => {
    const result = sortKeysAnthropicFirst({
      'graphorin-trust-level': 'trusted',
      description: 'd',
      name: 'n',
      metadata: { version: '1.0' },
      'mystery-field': 1,
    });
    expect(Object.keys(result)).toEqual([
      'name',
      'description',
      'metadata',
      'mystery-field',
      'graphorin-trust-level',
    ]);
  });
});
