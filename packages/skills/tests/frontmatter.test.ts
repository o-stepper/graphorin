import { describe, expect, it } from 'vitest';

import {
  parseAllowedToolsValue,
  parseFrontmatterYaml,
  parseHandoffInputFilter,
  parseToolsField,
  resolveSkillField,
  splitSkillMd,
  validateFrontmatter,
} from '../src/frontmatter/index.js';

describe('splitSkillMd', () => {
  it('splits frontmatter and body', () => {
    const skill = '---\nname: t\ndescription: d\n---\nbody';
    const { frontmatter, body } = splitSkillMd(skill);
    expect(frontmatter).toBe('name: t\ndescription: d');
    expect(body).toBe('body');
  });

  it('throws when frontmatter delimiter is missing', () => {
    expect(() => splitSkillMd('no-frontmatter\nhere')).toThrowError(/YAML frontmatter block/u);
  });

  it('strips a UTF-8 BOM and normalises CRLF', () => {
    const input = '\uFEFF---\r\nname: t\r\ndescription: d\r\n---\r\nbody';
    const { frontmatter, body } = splitSkillMd(input);
    expect(frontmatter).toBe('name: t\ndescription: d');
    expect(body).toBe('body');
  });
});

describe('parseFrontmatterYaml', () => {
  it('returns {} for an empty block', () => {
    expect(parseFrontmatterYaml('')).toEqual({});
    expect(parseFrontmatterYaml('   \n  ')).toEqual({});
  });

  it('throws on invalid YAML', () => {
    expect(() => parseFrontmatterYaml(': not:\nvalid: ::')).toThrow(/not valid YAML/u);
  });

  it('rejects non-object top-level YAML', () => {
    expect(() => parseFrontmatterYaml('- one\n- two')).toThrowError(/object/u);
  });
});

describe('resolveSkillField (ADR-043 algorithm)', () => {
  it('Anthropic-base wins over metadata.graphorin.* and graphorin-* legacy', () => {
    const fm = {
      'allowed-tools': ['a'],
      metadata: { 'graphorin.allowed-tools': ['b'] },
      'graphorin-allowed-tools': ['c'],
    };
    const r = resolveSkillField<unknown>(fm, 'allowed-tools');
    expect(r.value).toEqual(['a']);
    expect(r.source).toBe('anthropic-base');
    expect(r.conflicting).toBe(true);
    expect(r.conflictingSources).toContain('allowed-tools');
    expect(r.conflictingSources).toContain('metadata.graphorin.allowed-tools');
    expect(r.conflictingSources).toContain('graphorin-allowed-tools');
  });

  it('metadata.graphorin.* wins over graphorin-* legacy when Anthropic-base is missing', () => {
    const fm = {
      metadata: { 'graphorin.allowed-tools': ['b'] },
      'graphorin-allowed-tools': ['c'],
    };
    const r = resolveSkillField<unknown>(fm, 'allowed-tools');
    expect(r.value).toEqual(['b']);
    expect(r.source).toBe('metadata-graphorin');
    expect(r.conflicting).toBe(true);
  });

  it('graphorin-* legacy wins when only it is present', () => {
    const fm = { 'graphorin-allowed-tools': ['c'] };
    const r = resolveSkillField<unknown>(fm, 'allowed-tools');
    expect(r.value).toEqual(['c']);
    expect(r.source).toBe('graphorin-prefix');
    expect(r.conflicting).toBe(false);
  });

  it('returns the fallback when nothing is present', () => {
    const r = resolveSkillField<string>({}, 'allowed-tools', 'fallback');
    expect(r.value).toBe('fallback');
    expect(r.source).toBe('fallback');
  });
});

describe('validateFrontmatter — conflict policy', () => {
  const conflictFm = {
    name: 'finance',
    description: 'A finance skill.',
    'allowed-tools': ['a'],
    'graphorin-allowed-tools': ['b'],
  };

  it("'warn' (default) emits a warn-severity diagnostic", () => {
    const v = validateFrontmatter(conflictFm);
    const diag = v.diagnostics.find((d) => d.kind === 'conflict' && d.field === 'allowed-tools');
    expect(diag).toBeDefined();
    expect(diag?.severity).toBe('warn');
  });

  it("'error' emits an error-severity diagnostic", () => {
    const v = validateFrontmatter(conflictFm, { conflictPolicy: 'error' });
    const diag = v.diagnostics.find((d) => d.kind === 'conflict' && d.field === 'allowed-tools');
    expect(diag).toBeDefined();
    expect(diag?.severity).toBe('error');
  });

  it("'silent' emits no conflict diagnostic", () => {
    const v = validateFrontmatter(conflictFm, { conflictPolicy: 'silent' });
    const diag = v.diagnostics.find((d) => d.kind === 'conflict');
    expect(diag).toBeUndefined();
  });
});

describe('validateFrontmatter — required-field detection', () => {
  it('reports missing name', () => {
    const v = validateFrontmatter({ description: 'd' });
    const diag = v.diagnostics.find(
      (d) => d.kind === 'missing-required-field' && d.field === 'name',
    );
    expect(diag?.severity).toBe('error');
  });

  it('reports missing description', () => {
    const v = validateFrontmatter({ name: 'n' });
    const diag = v.diagnostics.find(
      (d) => d.kind === 'missing-required-field' && d.field === 'description',
    );
    expect(diag?.severity).toBe('error');
  });
});

describe('validateFrontmatter — experimental + spec hints', () => {
  it('flags allowed-tools as experimental', () => {
    const v = validateFrontmatter({
      name: 'n',
      description: 'd',
      'allowed-tools': ['read'],
    });
    const diag = v.diagnostics.find((d) => d.kind === 'experimental-field');
    expect(diag).toBeDefined();
  });

  it('parses an unparseable spec hint', () => {
    const v = validateFrontmatter({
      name: 'n',
      description: 'd',
      'graphorin-anthropic-spec': 'not-a-date',
    });
    const diag = v.diagnostics.find((d) => d.field === 'anthropic-spec');
    expect(diag?.kind).toBe('invalid-field-type');
  });

  it('flags an older author spec hint as info', () => {
    const v = validateFrontmatter({
      name: 'n',
      description: 'd',
      'graphorin-anthropic-spec': '2024-01-01',
    });
    const diag = v.diagnostics.find((d) => d.field === 'anthropic-spec');
    expect(diag?.kind).toBe('spec-older-than-loader');
  });

  it('flags a newer author spec hint as warn', () => {
    const v = validateFrontmatter({
      name: 'n',
      description: 'd',
      'graphorin-anthropic-spec': '2099-01-01',
    });
    const diag = v.diagnostics.find((d) => d.field === 'anthropic-spec');
    expect(diag?.kind).toBe('spec-newer-than-loader');
    expect(diag?.severity).toBe('warn');
  });
});

describe('validateFrontmatter — runtime-compat', () => {
  it('passes when the runtime version satisfies the declared range', () => {
    const v = validateFrontmatter(
      {
        name: 'n',
        description: 'd',
        'graphorin-runtime-compat': '^0.1.0',
      },
      { runtimeVersion: '0.1.5' },
    );
    expect(v.diagnostics.find((d) => d.kind === 'invalid-runtime-compat')).toBeUndefined();
  });

  it('fails when the runtime version does not satisfy the declared range', () => {
    const v = validateFrontmatter(
      {
        name: 'n',
        description: 'd',
        'graphorin-runtime-compat': '^0.2.0',
      },
      { runtimeVersion: '0.1.0' },
    );
    const diag = v.diagnostics.find((d) => d.kind === 'invalid-runtime-compat');
    expect(diag?.severity).toBe('error');
  });
});

describe('validateFrontmatter — unknown-field policy', () => {
  it("'preserve' (default) emits no diagnostic for unrecognised fields", () => {
    const v = validateFrontmatter({ name: 'n', description: 'd', 'mystery-field': 1 });
    expect(v.diagnostics.find((d) => d.kind === 'unknown-field')).toBeUndefined();
  });

  it("'warn' emits a warn-severity diagnostic", () => {
    const v = validateFrontmatter(
      { name: 'n', description: 'd', 'mystery-field': 1 },
      { unknownFieldPolicy: 'warn' },
    );
    const diag = v.diagnostics.find((d) => d.kind === 'unknown-field');
    expect(diag?.severity).toBe('warn');
  });

  it("'reject' emits an error-severity diagnostic", () => {
    const v = validateFrontmatter(
      { name: 'n', description: 'd', 'mystery-field': 1 },
      { unknownFieldPolicy: 'reject' },
    );
    const diag = v.diagnostics.find((d) => d.kind === 'unknown-field');
    expect(diag?.severity).toBe('error');
  });
});

describe('parseAllowedToolsValue', () => {
  it('parses an array shape', () => {
    expect(parseAllowedToolsValue(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('parses a whitespace-delimited string shape', () => {
    expect(parseAllowedToolsValue('a b\tc')).toEqual(['a', 'b', 'c']);
  });

  it('returns null for unsupported shapes', () => {
    expect(parseAllowedToolsValue(123)).toBeNull();
    expect(parseAllowedToolsValue([1, 2])).toBeNull();
    expect(parseAllowedToolsValue(null)).toBeNull();
  });
});

describe('parseHandoffInputFilter', () => {
  it('parses lastUser', () => {
    expect(parseHandoffInputFilter('lastUser')).toEqual({ kind: 'lastUser' });
  });

  it('parses lastN-3', () => {
    expect(parseHandoffInputFilter('lastN-3')).toEqual({ kind: 'lastN', n: 3 });
  });

  it('rejects lastN-0', () => {
    expect(parseHandoffInputFilter('lastN-0')).toBeNull();
  });

  it('parses a compose declaration', () => {
    const r = parseHandoffInputFilter({
      compose: [{ lastN: 5 }, { stripSensitiveOutputs: { keepTier: 'public' } }, 'stripReasoning'],
    });
    expect(r).toEqual({
      kind: 'compose',
      steps: [
        { kind: 'lastN', n: 5 },
        { kind: 'stripSensitiveOutputs', keepTier: 'public' },
        { kind: 'stripReasoning' },
      ],
    });
  });
});

describe('parseToolsField', () => {
  it('parses string entries', () => {
    expect(parseToolsField(['a', 'b'])).toEqual([{ name: 'a' }, { name: 'b' }]);
  });

  it('parses object entries with optional fields', () => {
    const r = parseToolsField([{ name: 'a', module: './a.ts', tags: ['x'] }]);
    expect(r).toEqual([{ name: 'a', module: './a.ts', tags: ['x'] }]);
  });

  it('returns null on malformed entries', () => {
    expect(parseToolsField('not-an-array')).toBeNull();
    expect(parseToolsField([1])).toBeNull();
    expect(parseToolsField([{ name: '' }])).toBeNull();
  });
});
