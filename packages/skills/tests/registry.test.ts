import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { SkillNameCollisionError } from '../src/errors/index.js';
import { loadSkillFromSource } from '../src/loader/index.js';
import {
  createSkillRegistry,
  parseActivationTrigger,
  stampSkillToolFromMetadata,
} from '../src/registry/index.js';

async function inlineSkill(
  name: string,
  manifestExtras: string[] = [],
): Promise<Awaited<ReturnType<typeof loadSkillFromSource>>> {
  const manifest = [
    '---',
    `name: ${name}`,
    `description: ${name} skill`,
    ...manifestExtras,
    '---',
    'BODY',
  ].join('\n');
  return loadSkillFromSource({ kind: 'inline', skill: { skillMd: manifest } });
}

describe('createSkillRegistry', () => {
  it('register / list / unregister', async () => {
    const registry = createSkillRegistry();
    const skill = await inlineSkill('a');
    registry.register(skill);
    expect(registry.size()).toBe(1);
    expect(registry.has('a')).toBe(true);
    expect(registry.list().map((s) => s.metadata.name)).toEqual(['a']);
    expect(registry.unregister('a')).toBe(true);
    expect(registry.unregister('a')).toBe(false);
  });

  it('throws on duplicate registration', async () => {
    const registry = createSkillRegistry();
    const skill = await inlineSkill('a');
    registry.register(skill);
    expect(() => registry.register(skill)).toThrowError(SkillNameCollisionError);
  });

  it('getAutoActivationMetadata excludes disable-model-invocation skills', async () => {
    const registry = createSkillRegistry();
    const auto = await inlineSkill('auto');
    const explicit = await inlineSkill('explicit-only', ['disable-model-invocation: true']);
    registry.register(auto);
    registry.register(explicit);
    const meta = registry.getAutoActivationMetadata();
    expect(meta.map((m) => m.name)).toEqual(['auto']);
  });

  it('resolveTrigger honours slash-command override of disable-model-invocation', async () => {
    const registry = createSkillRegistry();
    const explicit = await inlineSkill('explicit-only', ['disable-model-invocation: true']);
    registry.register(explicit);
    expect(registry.resolveTrigger('explicit-only')).toBeNull();
    const slash = registry.resolveTrigger('/skill:explicit-only');
    expect(slash?.activationKind).toBe('slash-command');
    expect(slash?.skill.metadata.name).toBe('explicit-only');
  });

  it('parseActivationTrigger discriminates auto vs slash', async () => {
    expect(parseActivationTrigger('finance').activationKind).toBe('auto');
    expect(parseActivationTrigger('/skill:finance').activationKind).toBe('slash-command');
    expect(() => parseActivationTrigger('   ')).toThrow();
  });

  it('toolDeclarations carry the owning skill + trust level', async () => {
    const registry = createSkillRegistry();
    const skill = await inlineSkill('with-tools', [
      'graphorin-trust-level: untrusted',
      'graphorin-handoff-input-filter: lastUser',
      'graphorin-tools:',
      '  - name: read_file',
    ]);
    registry.register(skill);
    const decls = registry.toolDeclarations();
    expect(decls).toEqual([
      { name: 'read_file', skillName: 'with-tools', trustLevel: 'untrusted' },
    ]);
  });

  it('eager activation resolves body + resources', async () => {
    const registry = createSkillRegistry({ activationStrategy: 'eager' });
    registry.register(await inlineSkill('eager-skill'));
    const activated = await registry.activate(['eager-skill']);
    expect(activated[0]?.body).toContain('BODY');
  });
});

describe('stampSkillToolFromMetadata — sandbox tier propagation', () => {
  it('untrusted skill forces worker-threads + no-net + no-fs regardless of override', async () => {
    const skill = await inlineSkill('untrusted', [
      'graphorin-trust-level: untrusted',
      'graphorin-handoff-input-filter: lastUser',
    ]);
    const stamped = stampSkillToolFromMetadata(
      {
        name: 'risky',
        description: 'tool',
        inputSchema: z.object({ a: z.string() }),
        sandboxPolicy: 'none',
        async execute() {
          return {};
        },
      },
      skill.metadata,
    );
    expect(stamped.resolvedSandbox.kind).toBe('worker-threads');
    expect(stamped.resolvedSandbox.noNetwork).toBe(true);
    expect(stamped.resolvedSandbox.noFilesystem).toBe(true);
    expect(stamped.sandboxForced).toBe(true);
    expect(stamped.tool.sandboxPolicy).toBe('sandboxed');
    expect(stamped.tool.inboundSanitization).toBe('detect-and-strip-and-wrap');
    expect(stamped.source).toEqual({
      kind: 'skill',
      skillName: 'untrusted',
      trustLevel: 'untrusted',
    });
  });

  it('trusted skill honours operator override', async () => {
    const skill = await inlineSkill('trusted', ['graphorin-trust-level: trusted']);
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
    expect(stamped.resolvedSandbox.kind).toBe('none');
    expect(stamped.tool.sandboxPolicy).toBe('none');
    expect(stamped.sandboxForced).toBe(false);
  });

  it("'unknown' trust level inherits the strict sandbox policy of 'untrusted'", async () => {
    const skill = await inlineSkill('unknown-trust', ['graphorin-trust-level: unknown']);
    const stamped = stampSkillToolFromMetadata(
      {
        name: 'unknown-tool',
        description: 'tool',
        inputSchema: z.object({}),
        sandboxPolicy: 'none',
        async execute() {
          return {};
        },
      },
      skill.metadata,
    );
    expect(stamped.resolvedSandbox.kind).toBe('worker-threads');
    expect(stamped.resolvedSandbox.noNetwork).toBe(true);
    expect(stamped.resolvedSandbox.noFilesystem).toBe(true);
    expect(stamped.tool.inboundSanitization).toBe('detect-and-strip-and-wrap');
    expect(stamped.source).toEqual({
      kind: 'skill',
      skillName: 'unknown-trust',
      trustLevel: 'untrusted',
    });
  });
});

describe('SkillRegistry — getMetadataBlock + search + tools', () => {
  it('getMetadataBlock excludes disable-model-invocation skills + emits empty for empty registry', async () => {
    const registry = createSkillRegistry();
    expect(registry.getMetadataBlock()).toBe('');
    registry.register(await inlineSkill('a-public', ['graphorin-sensitivity: public']));
    registry.register(
      await inlineSkill('a-private', [
        'disable-model-invocation: true',
        'graphorin-sensitivity: secret',
      ]),
    );
    const block = registry.getMetadataBlock();
    expect(block).toContain('## a-public');
    expect(block).not.toContain('## a-private');
  });

  it('search() matches both name and description tokens', async () => {
    const registry = createSkillRegistry();
    registry.register(await inlineSkill('finance-helper'));
    registry.register(await inlineSkill('weather-bot'));
    expect(registry.search(['finance']).map((s) => s.metadata.name)).toEqual(['finance-helper']);
    // Token must hit both name and description (description includes
    // the manifest's description text).
    expect(registry.search(['weather', 'skill']).map((s) => s.metadata.name)).toEqual([
      'weather-bot',
    ]);
    expect(registry.search([])).toEqual([]);
    expect(registry.search(['no-match'])).toEqual([]);
  });

  it('tools() returns deduplicated pre-built tools and warns once on collision', async () => {
    const tool = (name: string) => ({
      name,
      description: 'fixture',
      inputSchema: z.object({}),
      async execute() {
        return {};
      },
    });
    const registry = createSkillRegistry();
    registry.register(
      await loadSkillFromSource({
        kind: 'inline',
        skill: {
          skillMd: '---\nname: a\ndescription: a\n---\n',
          tools: [tool('shared'), tool('a-only')],
        },
      }),
    );
    registry.register(
      await loadSkillFromSource({
        kind: 'inline',
        skill: {
          skillMd: '---\nname: b\ndescription: b\n---\n',
          tools: [tool('shared'), tool('b-only')],
        },
      }),
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const out = registry.tools().map((t) => t.name);
      expect(out).toEqual(['shared', 'a-only', 'b-only']);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0]?.[0]).toMatch(/'shared'/u);
    } finally {
      warnSpy.mockRestore();
    }
  });
});
