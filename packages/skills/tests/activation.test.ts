import { describe, expect, it } from 'vitest';

import { isSlashCommand, parseSlashCommand } from '../src/activation/index.js';
import { SlashCommandParseError } from '../src/errors/index.js';

describe('parseSlashCommand', () => {
  it('parses a bare slash command', () => {
    const r = parseSlashCommand('/skill:finance-helper');
    expect(r).toEqual({ name: 'finance-helper', args: '', raw: '/skill:finance-helper' });
  });

  it('parses a slash command with free-form arguments', () => {
    const r = parseSlashCommand('/skill:finance-helper run-quarterly Q3');
    expect(r.name).toBe('finance-helper');
    expect(r.args).toBe('run-quarterly Q3');
  });

  it('tolerates leading whitespace', () => {
    const r = parseSlashCommand('   /skill:finance-helper');
    expect(r.name).toBe('finance-helper');
  });

  it('rejects bodies without /skill: prefix', () => {
    expect(() => parseSlashCommand('finance-helper')).toThrowError(SlashCommandParseError);
  });

  it('rejects names with disallowed characters', () => {
    expect(() => parseSlashCommand('/skill:bad name')).not.toThrow();
    expect(() => parseSlashCommand('/skill:bad/name')).toThrowError(SlashCommandParseError);
    expect(() => parseSlashCommand('/skill:')).toThrowError(SlashCommandParseError);
  });

  it('isSlashCommand is true for valid bodies, false otherwise', () => {
    expect(isSlashCommand('/skill:foo')).toBe(true);
    expect(isSlashCommand('foo')).toBe(false);
  });
});
