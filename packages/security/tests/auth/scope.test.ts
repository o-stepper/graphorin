import { describe, expect, it } from 'vitest';

import { ScopeParseError } from '../../src/auth/errors.js';
import {
  parseScope,
  SCOPE_CATALOGUE,
  scopeMatches,
  scopeSetMatches,
  tryParseScope,
  validateScopeSet,
} from '../../src/auth/scope.js';

describe('@graphorin/security/auth — scope grammar', () => {
  it('parses two-segment scopes', () => {
    const parsed = parseScope('agents:read');
    expect(parsed.kind).toBe('two-segment');
    expect(parsed.resource).toBe('agents');
    expect(parsed.action).toBe('read');
  });

  it('parses three-segment scopes with a glob target', () => {
    const parsed = parseScope('workflows:resume:*');
    expect(parsed.kind).toBe('three-segment');
    if (parsed.kind === 'three-segment') {
      expect(parsed.target).toBe('*');
    }
  });

  it('parses three-segment scopes with a slug target', () => {
    const parsed = parseScope('agents:invoke:agent-01H9');
    if (parsed.kind === 'three-segment') {
      expect(parsed.target).toBe('agent-01H9');
    } else {
      throw new Error('expected three-segment');
    }
  });

  it('rejects empty inputs', () => {
    expect(() => parseScope('')).toThrowError(ScopeParseError);
  });

  it('rejects single-segment inputs', () => {
    expect(() => parseScope('agents')).toThrowError(ScopeParseError);
  });

  it('rejects four-segment inputs', () => {
    expect(() => parseScope('agents:read:foo:bar')).toThrowError(ScopeParseError);
  });

  it('rejects invalid resource characters', () => {
    expect(() => parseScope('Agents:read')).toThrowError(ScopeParseError);
  });

  it('rejects invalid action characters', () => {
    expect(() => parseScope('agents:Read')).toThrowError(ScopeParseError);
  });

  it('rejects invalid target characters', () => {
    expect(() => parseScope('agents:read:hello world')).toThrowError(ScopeParseError);
  });

  it('tryParseScope returns undefined for invalid input', () => {
    expect(tryParseScope('not a scope')).toBeUndefined();
  });

  it('validateScopeSet collects every error', () => {
    const errors = validateScopeSet(['agents:read', 'BAD', 'memory:write']);
    expect(errors.length).toBe(1);
    expect(errors[0]).toBeInstanceOf(ScopeParseError);
  });

  describe('scopeMatches', () => {
    it('admin:* satisfies every scope', () => {
      const granted = parseScope('admin:*');
      expect(scopeMatches(granted, parseScope('agents:read'))).toBe(true);
      expect(scopeMatches(granted, parseScope('memory:write:user-1'))).toBe(true);
    });

    it('exact two-segment match', () => {
      expect(scopeMatches(parseScope('agents:read'), parseScope('agents:read'))).toBe(true);
    });

    it('different resource never matches', () => {
      expect(scopeMatches(parseScope('agents:read'), parseScope('memory:read'))).toBe(false);
    });

    it('action wildcard matches', () => {
      expect(scopeMatches(parseScope('agents:*'), parseScope('agents:read'))).toBe(true);
    });

    it('two-segment grant satisfies three-segment requirement', () => {
      expect(scopeMatches(parseScope('agents:read'), parseScope('agents:read:agent-1'))).toBe(true);
    });

    it('three-segment grant with glob target matches any target', () => {
      expect(
        scopeMatches(parseScope('workflows:resume:*'), parseScope('workflows:resume:run-7')),
      ).toBe(true);
    });

    it('three-segment grant requires three-segment match on target', () => {
      expect(
        scopeMatches(parseScope('agents:invoke:agent-1'), parseScope('agents:invoke:agent-2')),
      ).toBe(false);
    });

    it('three-segment grant does not match two-segment requirement when target is concrete', () => {
      expect(scopeMatches(parseScope('agents:invoke:agent-1'), parseScope('agents:invoke'))).toBe(
        false,
      );
    });

    it('three-segment grant with glob target matches two-segment requirement', () => {
      expect(scopeMatches(parseScope('agents:invoke:*'), parseScope('agents:invoke'))).toBe(true);
    });
  });

  describe('scopeSetMatches', () => {
    it('returns true when at least one entry matches', () => {
      expect(scopeSetMatches(['agents:read', 'memory:write'], 'agents:read')).toBe(true);
    });

    it('returns false when no entry matches', () => {
      expect(scopeSetMatches(['agents:read'], 'memory:read')).toBe(false);
    });

    it('skips invalid grants without throwing', () => {
      expect(scopeSetMatches(['BAD', 'agents:read'], 'agents:read')).toBe(true);
    });
  });

  it('SCOPE_CATALOGUE entries are all parseable', () => {
    for (const scope of SCOPE_CATALOGUE) {
      expect(() => parseScope(scope)).not.toThrow();
    }
  });
});
