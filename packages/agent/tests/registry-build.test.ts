import type { Tool } from '@graphorin/core';
import { describe, expect, it, vi } from 'vitest';

import type { SkillsRegistryLike } from '../src/index.js';
import { buildToolRegistry } from '../src/tooling/registry-build.js';

// --- shared fakes -----------------------------------------------------------

/** Minimal valid `Tool` (no zod / builder dep in `@graphorin/agent`). */
function makeTool(
  name: string,
  extra: Record<string, unknown> = {},
): Tool<unknown, unknown, unknown> {
  return {
    name,
    description: `${name} tool`,
    inputSchema: {
      safeParse: (v: unknown) => ({ success: true as const, data: v }),
    } as Tool<unknown, unknown, unknown>['inputSchema'],
    sideEffectClass: 'pure',
    async execute() {
      return undefined;
    },
    ...extra,
  } as Tool<unknown, unknown, unknown>;
}

/** A `SkillLike` entry: just `metadata` + `tools()`, the members the builder reads. */
function fakeSkill(
  name: string,
  trustLevel: 'trusted' | 'untrusted' | 'unknown',
  toolNames: ReadonlyArray<string>,
): unknown {
  return {
    metadata: { name, graphorinTrustLevel: trustLevel },
    tools: () => toolNames.map((t) => makeTool(t)),
  };
}

const skillsFrom = (entries: ReadonlyArray<unknown>): SkillsRegistryLike => ({
  list: () => entries,
});

// --- sources & counts -------------------------------------------------------

describe('buildToolRegistry — sources & counts', () => {
  it('builds an empty registry with no sources', () => {
    const { registry, resolutions, registered, skippedSkillEntries } = buildToolRegistry();
    expect(registry.size()).toBe(0);
    expect(resolutions).toEqual([]);
    expect(registered).toBe(0);
    expect(skippedSkillEntries).toBe(0);
  });

  it('registers first-party tools as first-party-user-defined', () => {
    const { registry, registered } = buildToolRegistry({
      tools: [makeTool('alpha'), makeTool('beta')],
    });
    expect(registered).toBe(2);
    expect(registry.size()).toBe(2);
    expect(registry.get('alpha')?.__trustClass).toBe('first-party-user-defined');
    expect(registry.get('alpha')?.__source).toEqual({ kind: 'first-party' });
  });

  it('registers first-party tools + inline skill tools across sources', () => {
    const { registry, registered } = buildToolRegistry({
      tools: [makeTool('alpha')],
      skills: skillsFrom([fakeSkill('pdf', 'trusted', ['extract', 'render'])]),
    });
    expect(registered).toBe(3);
    expect(registry.size()).toBe(3);
    expect(registry.get('extract')?.__trustClass).toBe('skill-trusted');
    expect(registry.get('extract')?.__source).toMatchObject({ kind: 'skill', skillName: 'pdf' });
  });
});

// --- collision resolution ---------------------------------------------------

describe('buildToolRegistry — collision resolution', () => {
  it('auto-prefixes the non-first-party loser and keeps first-party un-prefixed', () => {
    const { registry, resolutions } = buildToolRegistry({
      tools: [
        makeTool('dup'),
        makeTool('dup', { __source: { kind: 'mcp', serverIdentity: 'srv' } }),
      ],
    });

    // First-party keeps the bare name; the MCP entry is namespaced.
    expect(registry.get('dup')?.__trustClass).toBe('first-party-user-defined');
    expect(registry.get('srv.dup')?.__trustClass).toBe('mcp-derived');

    const applied = resolutions.find((r) => r.action === 'auto-prefix-applied');
    expect(applied).toBeDefined();
    if (applied?.action === 'auto-prefix-applied') {
      expect(applied.renamed).toMatchObject({ from: 'dup', to: 'srv.dup' });
    }
  });

  it('preserves an explicit MCP __source stamp through the registry (Adapter F)', () => {
    // MCP tools are NOT auto-stamped by adaptMCPTools — the source is
    // honoured only when present on the tool. A non-colliding stamped
    // tool keeps its name + derived trust class.
    const { registry } = buildToolRegistry({
      tools: [makeTool('search', { __source: { kind: 'mcp', serverIdentity: 'linear' } })],
    });
    expect(registry.get('search')?.__trustClass).toBe('mcp-derived');
    expect(registry.get('search')?.__source).toMatchObject({
      kind: 'mcp',
      serverIdentity: 'linear',
    });
  });

  it('respects the trust ladder: first-party beats a colliding skill tool', () => {
    const { registry } = buildToolRegistry({
      tools: [makeTool('summarize')],
      skills: skillsFrom([fakeSkill('writer', 'untrusted', ['summarize'])]),
    });
    expect(registry.get('summarize')?.__trustClass).toBe('first-party-user-defined');
    // The skill loser is namespaced under its skill name.
    expect(registry.get('writer.summarize')?.__trustClass).toBe('skill-untrusted');
  });

  it('emits collision audit events through the supplied sink', () => {
    const emitAudit = vi.fn();
    buildToolRegistry({
      tools: [
        makeTool('dup'),
        makeTool('dup', { __source: { kind: 'mcp', serverIdentity: 'srv' } }),
      ],
      emitAudit,
    });
    const actions = emitAudit.mock.calls.map(([event]) => (event as { action: string }).action);
    expect(actions).toContain('tool:collision:detected');
    expect(actions).toContain('tool:collision:auto-prefix-applied');
  });
});

// --- skills -----------------------------------------------------------------

describe('buildToolRegistry — skills', () => {
  it('derives skill-trusted vs skill-untrusted from the skill trust level', () => {
    const { registry } = buildToolRegistry({
      skills: skillsFrom([
        fakeSkill('a', 'trusted', ['ta']),
        fakeSkill('b', 'untrusted', ['tb']),
        fakeSkill('c', 'unknown', ['tc']),
      ]),
    });
    expect(registry.get('ta')?.__trustClass).toBe('skill-trusted');
    expect(registry.get('tb')?.__trustClass).toBe('skill-untrusted');
    // 'unknown' inherits the untrusted posture (stampSkillTool).
    expect(registry.get('tc')?.__trustClass).toBe('skill-untrusted');
  });

  it('skips list() entries that do not match the Skill surface', () => {
    const { registry, registered, skippedSkillEntries } = buildToolRegistry({
      skills: skillsFrom([
        null,
        42,
        {},
        { metadata: { name: 'x' } }, // no graphorinTrustLevel, no tools()
        fakeSkill('real', 'trusted', ['only']),
      ]),
    });
    expect(skippedSkillEntries).toBe(4);
    expect(registered).toBe(1);
    expect(registry.get('only')?.__trustClass).toBe('skill-trusted');
  });

  it('tolerates a skills registry without a list() method', () => {
    const { registry, registered } = buildToolRegistry({ skills: {} });
    expect(registry.size()).toBe(0);
    expect(registered).toBe(0);
  });
});

// --- options passthrough ----------------------------------------------------

describe('buildToolRegistry — options', () => {
  it('honours a non-default collision strategy + context', () => {
    // 'priority' drops the loser instead of renaming it.
    const { registry, resolutions } = buildToolRegistry({
      tools: [
        makeTool('dup'),
        makeTool('dup', { __source: { kind: 'mcp', serverIdentity: 'srv' } }),
      ],
      collisionStrategy: 'priority',
      collisionContext: { source: { kind: 'first-party' } },
    });
    expect(registry.get('dup')?.__trustClass).toBe('first-party-user-defined');
    expect(registry.get('srv.dup')).toBeUndefined();
    expect(resolutions.length).toBeGreaterThan(0);
  });

  it('accepts an embedder + semanticScoreThreshold passthrough (WI-05)', () => {
    const embedder = {
      id: () => 'fake',
      dim: () => 3,
      embed: async (texts: ReadonlyArray<string>) => texts.map(() => new Float32Array([0, 0, 0])),
    };
    const { registered } = buildToolRegistry({
      tools: [makeTool('alpha')],
      embedder,
      semanticScoreThreshold: 0.7,
    });
    expect(registered).toBe(1);
  });
});
