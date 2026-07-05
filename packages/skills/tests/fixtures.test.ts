import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { loadSkillFromSource } from '../src/loader/index.js';
import {
  createSkillRegistry,
  parseActivationTrigger,
  stampSkillToolFromMetadata,
} from '../src/registry/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURE_ROOT = resolve(__dirname, '__fixtures__');

describe('fixtures - reference skills', () => {
  it('canonical pdf-processing skill loads with zero graphorin-specific changes', async () => {
    const skill = await loadSkillFromSource({
      kind: 'folder',
      path: resolve(FIXTURE_ROOT, 'pdf-processing'),
    });
    expect(skill.metadata.name).toBe('pdf-processing');
    expect(skill.metadata.description).toMatch(/Extract text and tables/u);
    expect(skill.metadata.license).toBe('MIT');
    expect(skill.metadata.disableModelInvocation).toBe(false);
    // Reference skill ships zero graphorin-* extensions, so the
    // loader infers 'unknown' (default-deny posture) and surfaces no
    // signature.
    expect(skill.metadata.graphorinTrustLevel).toBe('unknown');
    expect(skill.metadata.graphorinSignaturePresent).toBe(false);
    // Tier 2 - body resolved lazily and cached.
    const body = await skill.body();
    expect(body).toMatch(/# PDF Processing/u);
    // Tier 3 - resources lazy-listed; bytes only on demand.
    const resources = await skill.resources();
    expect(resources.map((r) => r.relativePath)).toContain('examples/sample-form.txt');
    // Skill ships a `metadata.version` field - recorded but not
    // confused with `graphorin-runtime-compat`.
    expect(skill.metadata.metadata?.version).toBe('1.2.0');
    expect(skill.metadata.graphorinRuntimeCompat).toBeUndefined();
  });

  it('extended skill (untrusted + handoff filter) loads and exposes the declaration', async () => {
    const skill = await loadSkillFromSource({
      kind: 'folder',
      path: resolve(FIXTURE_ROOT, 'extended-skill'),
    });
    expect(skill.metadata.name).toBe('research-helper');
    expect(skill.metadata.graphorinTrustLevel).toBe('untrusted');
    expect(skill.metadata.graphorinHandoffInputFilter).toEqual({ kind: 'lastUser' });
    expect(skill.metadata.graphorinRuntimeCompat).toBe('^0.1.0');
    expect(skill.toolDeclarations()).toEqual([
      { name: 'search_web', description: 'Look up a query on the public web.', tags: ['research'] },
      { name: 'extract_url', description: 'Extract the readable text from a URL.' },
    ]);

    // Stamp a sample tool - sandbox tier must be forced to
    // worker-threads + no-net + no-fs even if the operator's policy
    // says otherwise.
    const stamped = stampSkillToolFromMetadata(
      {
        name: 'search_web',
        description: 'sample',
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
    expect(stamped.sandboxForced).toBe(true);
    expect(stamped.tool.inboundSanitization).toBe('detect-and-strip-and-wrap');
  });

  it('registry surfaces metadata, auto-activation block, and search', async () => {
    const skill = await loadSkillFromSource({
      kind: 'folder',
      path: resolve(FIXTURE_ROOT, 'pdf-processing'),
    });
    const registry = createSkillRegistry();
    registry.register(skill);
    const block = registry.getMetadataBlock();
    expect(block).toContain('# Available skills');
    expect(block).toContain('## pdf-processing');
    expect(block).toContain('Extract text and tables');
    // Search returns the skill when triggered by a token in the
    // description.
    const matches = registry.search(['pdf']);
    expect(matches.map((s) => s.metadata.name)).toEqual(['pdf-processing']);
    // Bare-name auto trigger resolves; slash command resolves; both
    // honour `disable-model-invocation`.
    expect(parseActivationTrigger('pdf-processing').activationKind).toBe('auto');
    expect(parseActivationTrigger('/skill:pdf-processing').activationKind).toBe('slash-command');
  });
});
