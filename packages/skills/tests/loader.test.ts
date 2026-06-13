import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { SkillRuntimeCompatError } from '../src/errors/index.js';
import { loadSkillFromSource, loadSkills } from '../src/loader/index.js';
import { stampSkillToolFromMetadata } from '../src/registry/bridge.js';

let tmpRoot: string;

beforeAll(async () => {
  tmpRoot = await mkdir(join(tmpdir(), `graphorin-skills-tests-${Date.now()}`), {
    recursive: true,
  }).then(async (path) => path ?? join(tmpdir(), `graphorin-skills-tests-${Date.now()}`));
});

afterAll(async () => {
  if (tmpRoot !== undefined) {
    await rm(tmpRoot, { recursive: true, force: true });
  }
});

async function makeSkillDir(
  name: string,
  manifest: string,
  resources: ReadonlyArray<{ path: string; content: string }> = [],
): Promise<string> {
  const dir = join(tmpRoot, name);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'SKILL.md'), manifest, 'utf8');
  for (const r of resources) {
    const target = join(dir, r.path);
    await mkdir(join(target, '..'), { recursive: true });
    await writeFile(target, r.content, 'utf8');
  }
  return dir;
}

describe('loadSkillFromSource — folder', () => {
  it('parses a minimal Anthropic-base skill verbatim', async () => {
    const dir = await makeSkillDir(
      'minimal',
      [
        '---',
        'name: minimal',
        'description: A minimal skill that loads with zero graphorin-specific changes.',
        '---',
        'BODY',
      ].join('\n'),
    );
    const skill = await loadSkillFromSource({ kind: 'folder', path: dir });
    expect(skill.metadata.name).toBe('minimal');
    expect(skill.metadata.disableModelInvocation).toBe(false);
    // Skills that did not declare graphorin-trust-level resolve to
    // 'unknown' per Phase 08 § Risks & mitigations.
    expect(skill.metadata.graphorinTrustLevel).toBe('unknown');
    expect(skill.metadata.graphorinSignaturePresent).toBe(false);
  });

  it('three-tier loading: metadata available without reading body / resources', async () => {
    const dir = await makeSkillDir(
      'three-tier',
      [
        '---',
        'name: three-tier',
        'description: Demonstrates three-tier progressive disclosure.',
        '---',
        'BODY',
      ].join('\n'),
      [{ path: 'examples/example.txt', content: 'example content' }],
    );
    const skill = await loadSkillFromSource({ kind: 'folder', path: dir });
    // Tier 1 — metadata is parsed at load time.
    expect(skill.metadata.name).toBe('three-tier');
    // Tier 2 — body is resolved lazily and cached.
    const body1 = await skill.body();
    expect(body1.trim()).toBe('BODY');
    const body2 = await skill.body();
    expect(body2).toBe(body1);
    // Tier 3 — resources are listed lazily; bytes are only read on
    // explicit `read()`.
    const resources = await skill.resources();
    expect(resources.map((r) => r.relativePath)).toContain('examples/example.txt');
    const example = resources.find((r) => r.relativePath === 'examples/example.txt');
    expect(example).toBeDefined();
    const text = await example?.readText();
    expect(text).toBe('example content');
  });

  it('extended skill: untrusted trust level + handoff filter declaration are surfaced', async () => {
    const dir = await makeSkillDir(
      'extended',
      [
        '---',
        'name: extended',
        'description: Untrusted skill with a declared handoff input filter.',
        'graphorin-trust-level: untrusted',
        'graphorin-handoff-input-filter: lastUser',
        'graphorin-tools:',
        '  - name: read_file',
        '  - name: write_file',
        '---',
        'BODY',
      ].join('\n'),
    );
    const skill = await loadSkillFromSource({ kind: 'folder', path: dir });
    expect(skill.metadata.graphorinTrustLevel).toBe('untrusted');
    expect(skill.metadata.graphorinHandoffInputFilter).toEqual({ kind: 'lastUser' });
    expect(skill.toolDeclarations()).toEqual([{ name: 'read_file' }, { name: 'write_file' }]);
  });

  it('RP-9: a folder skill cannot self-promote to trusted without an operator override', async () => {
    const dir = await makeSkillDir(
      'self-trusted',
      [
        '---',
        'name: self-trusted',
        'description: A downloaded folder that self-declares a trusted level.',
        'graphorin-trust-level: trusted',
        '---',
        'BODY',
      ].join('\n'),
    );
    const skill = await loadSkillFromSource({ kind: 'folder', path: dir });
    // Artifact self-declaration is capped at 'unknown' — trust is granted by
    // the integrator, never the downloaded folder.
    expect(skill.metadata.graphorinTrustLevel).toBe('unknown');
    const stamped = stampSkillToolFromMetadata(
      {
        name: 'risky',
        description: 'tool',
        inputSchema: z.object({}),
        sandboxPolicy: 'none',
        async execute() {
          return {};
        },
      },
      skill.metadata,
    );
    expect(stamped.source).toEqual({
      kind: 'skill',
      skillName: 'self-trusted',
      trustLevel: 'untrusted',
    });
    expect(stamped.tool.inboundSanitization).toBe('detect-and-strip-and-wrap');
    expect(stamped.resolvedSandbox.kind).toBe('worker-threads');
  });

  it('RP-9: an explicit operator trustLevel override on a folder source wins', async () => {
    const dir = await makeSkillDir(
      'operator-trusted',
      [
        '---',
        'name: operator-trusted',
        'description: A folder the operator explicitly elects to trust.',
        'graphorin-trust-level: unknown',
        '---',
        'BODY',
      ].join('\n'),
    );
    const skill = await loadSkillFromSource({ kind: 'folder', path: dir, trustLevel: 'trusted' });
    expect(skill.metadata.graphorinTrustLevel).toBe('trusted');
    const stamped = stampSkillToolFromMetadata(
      {
        name: 'safe',
        description: 'tool',
        inputSchema: z.object({}),
        sandboxPolicy: 'none',
        async execute() {
          return {};
        },
      },
      skill.metadata,
    );
    expect(stamped.source).toEqual({
      kind: 'skill',
      skillName: 'operator-trusted',
      trustLevel: 'trusted',
    });
  });

  it('untrusted + missing handoff filter triggers a warn diagnostic', async () => {
    const dir = await makeSkillDir(
      'untrusted-no-filter',
      [
        '---',
        'name: untrusted-no-filter',
        'description: An untrusted skill without a declared handoff input filter.',
        'graphorin-trust-level: untrusted',
        '---',
      ].join('\n'),
    );
    const skill = await loadSkillFromSource({ kind: 'folder', path: dir });
    const diag = skill.diagnostics().find((d) => d.kind === 'untrusted-handoff-filter-required');
    expect(diag?.severity).toBe('warn');
  });

  it('RP-11(b): conflictPolicy:error throws SkillRuntimeCompatError on an incompatible runtime-compat', async () => {
    const dir = await makeSkillDir(
      'rc-incompatible',
      [
        '---',
        'name: rc-incompatible',
        'description: declares a runtime range the installed version cannot satisfy.',
        'graphorin-runtime-compat: ">=9.0.0"',
        '---',
        'BODY',
      ].join('\n'),
    );
    await expect(
      loadSkillFromSource(
        { kind: 'folder', path: dir },
        { runtimeVersion: '0.5.0', conflictPolicy: 'error' },
      ),
    ).rejects.toBeInstanceOf(SkillRuntimeCompatError);
    // Default (warn) policy keeps it a diagnostic — the load still succeeds.
    const skill = await loadSkillFromSource(
      { kind: 'folder', path: dir },
      { runtimeVersion: '0.5.0' },
    );
    expect(skill.diagnostics().some((d) => d.kind === 'invalid-runtime-compat')).toBe(true);
  });

  it('RP-11(d): a malformed graphorin-tools value surfaces an invalid-field-type diagnostic', async () => {
    const dir = await makeSkillDir(
      'bad-tools',
      [
        '---',
        'name: bad-tools',
        'description: graphorin-tools is a scalar, not a list.',
        'graphorin-tools: 42',
        '---',
        'BODY',
      ].join('\n'),
    );
    const skill = await loadSkillFromSource({ kind: 'folder', path: dir });
    expect(
      skill
        .diagnostics()
        .some((d) => d.kind === 'invalid-field-type' && d.field === 'graphorin-tools'),
    ).toBe(true);
  });

  it('throws when SKILL.md is missing', async () => {
    const dir = join(tmpRoot, 'missing-skill');
    await mkdir(dir, { recursive: true });
    await expect(loadSkillFromSource({ kind: 'folder', path: dir })).rejects.toThrowError(
      /SKILL.md is missing/u,
    );
  });

  it('throws when required field is missing', async () => {
    const dir = await makeSkillDir(
      'no-name',
      ['---', 'description: missing name', '---'].join('\n'),
    );
    await expect(loadSkillFromSource({ kind: 'folder', path: dir })).rejects.toThrowError(
      /required field 'name'/u,
    );
  });
});

describe('loadSkillFromSource — inline', () => {
  it('loads an inline skill without touching the filesystem', async () => {
    const skill = await loadSkillFromSource({
      kind: 'inline',
      skill: {
        skillMd: [
          '---',
          'name: inline-skill',
          'description: An inline skill used by tests.',
          '---',
          'INLINE BODY',
        ].join('\n'),
        resources: [{ path: 'doc.txt', content: 'inline-resource' }],
      },
    });
    expect(skill.metadata.name).toBe('inline-skill');
    expect(await skill.body()).toContain('INLINE BODY');
    const resources = await skill.resources();
    expect(resources.map((r) => r.relativePath)).toEqual(['doc.txt']);
    expect(resources[0]).toBeDefined();
    expect(await resources[0]?.readText()).toBe('inline-resource');
  });
});

describe('loadSkills', () => {
  it('logs and continues when a single source fails (default)', async () => {
    const goodDir = await makeSkillDir(
      'good',
      ['---', 'name: good', 'description: ok', '---'].join('\n'),
    );
    const skills = await loadSkills([
      { kind: 'folder', path: goodDir },
      { kind: 'folder', path: join(tmpRoot, 'does-not-exist') },
    ]);
    expect(skills.map((s) => s.metadata.name)).toEqual(['good']);
  });

  it('throws on the first failure when throwOnSourceError is true', async () => {
    await expect(
      loadSkills([{ kind: 'folder', path: join(tmpRoot, 'definitely-missing') }], {
        throwOnSourceError: true,
      }),
    ).rejects.toThrowError();
  });

  it('RP-11(c): loads multiple sources and preserves input order', async () => {
    const a = await makeSkillDir('c-a', ['---', 'name: c-a', 'description: a', '---'].join('\n'));
    const b = await makeSkillDir('c-b', ['---', 'name: c-b', 'description: b', '---'].join('\n'));
    const skills = await loadSkills([
      { kind: 'folder', path: a },
      { kind: 'folder', path: b },
    ]);
    expect(skills.map((s) => s.metadata.name)).toEqual(['c-a', 'c-b']);
  });
});
