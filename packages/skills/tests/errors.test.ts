import { describe, expect, it } from 'vitest';

import {
  GraphorinSkillsError,
  InputFilterRequiredError,
  SkillFrontmatterConflictError,
  SkillLoadError,
  SkillManifestParseError,
  SkillNameCollisionError,
  SkillRequiredFieldMissingError,
  SkillRuntimeCompatError,
  SlashCommandParseError,
} from '../src/errors/index.js';

describe('errors', () => {
  it('SkillFrontmatterConflictError carries skill name + field + sources', () => {
    const err = new SkillFrontmatterConflictError(
      'finance',
      'allowed-tools',
      ['allowed-tools', 'graphorin-allowed-tools'],
      { hint: 'remove graphorin- prefix' },
    );
    expect(err.kind).toBe('frontmatter:conflict');
    expect(err.skillName).toBe('finance');
    expect(err.field).toBe('allowed-tools');
    expect(err.conflictingFields).toEqual(['allowed-tools', 'graphorin-allowed-tools']);
    expect(err.message).toMatch(/conflict on 'allowed-tools'/u);
    expect(err.hint).toBe('remove graphorin- prefix');
    expect(err).toBeInstanceOf(GraphorinSkillsError);
  });

  it('SkillManifestParseError preserves cause chain', () => {
    const cause = new Error('underlying');
    const err = new SkillManifestParseError('oops', { cause });
    expect(err.kind).toBe('manifest:parse');
    expect(err.cause).toBe(cause);
  });

  it('SkillRuntimeCompatError exposes declared / installed', () => {
    const err = new SkillRuntimeCompatError('finance', '^0.2.0', '0.1.0');
    expect(err.kind).toBe('runtime-compat:mismatch');
    expect(err.declared).toBe('^0.2.0');
    expect(err.installed).toBe('0.1.0');
  });

  it('SkillRequiredFieldMissingError carries the missing field', () => {
    const err = new SkillRequiredFieldMissingError('description');
    expect(err.kind).toBe('frontmatter:missing-required');
    expect(err.field).toBe('description');
  });

  it('InputFilterRequiredError emits a structured hint', () => {
    const err = new InputFilterRequiredError('risky-skill');
    expect(err.kind).toBe('handoff:input-filter-required');
    expect(err.skillName).toBe('risky-skill');
    expect(err.hint).toMatch(/graphorin-handoff-input-filter/u);
  });

  it('InputFilterRequiredError honours an operator-supplied hint override', () => {
    const err = new InputFilterRequiredError('risky-skill', { hint: 'override' });
    expect(err.hint).toBe('override');
  });

  it('SkillLoadError preserves cause chain', () => {
    const err = new SkillLoadError('npm:foo', 'cannot install', {
      cause: new Error('network'),
    });
    expect(err.kind).toBe('load:failed');
    expect(err.source).toBe('npm:foo');
    expect((err.cause as Error).message).toBe('network');
  });

  it('SkillNameCollisionError emits a stable hint', () => {
    const err = new SkillNameCollisionError('dup');
    expect(err.kind).toBe('registry:name-collision');
    expect(err.hint).toMatch(/registry.unregister/u);
  });

  it('SlashCommandParseError carries the raw body', () => {
    const err = new SlashCommandParseError('/skill:bad', 'why');
    expect(err.kind).toBe('slash:parse');
    expect(err.raw).toBe('/skill:bad');
  });
});
