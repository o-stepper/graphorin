import { describe, expect, it } from 'vitest';

import {
  ScopeParseError,
  TokenFormatError,
  TokenLockedOutError,
  TokenVerifyOverloadError,
  WeakPepperError,
} from '../../src/auth/errors.js';

describe('@graphorin/security/auth - error classes', () => {
  it('TokenFormatError carries the input length but never the input itself', () => {
    const err = new TokenFormatError('wrong-prefix', 'bad prefix', 64);
    expect(err.kind).toBe('wrong-prefix');
    expect(err.inputLength).toBe(64);
    expect(err.message).toBe('bad prefix');
  });

  it('ScopeParseError records the original input', () => {
    const err = new ScopeParseError('Bad:Scope', 'invalid resource');
    expect(err.kind).toBe('scope-parse-error');
    expect(err.input).toBe('Bad:Scope');
  });

  it('TokenVerifyOverloadError exposes the cap', () => {
    const err = new TokenVerifyOverloadError(101, 100);
    expect(err.kind).toBe('token-verify-overload');
    expect(err.inFlight).toBe(101);
    expect(err.cap).toBe(100);
  });

  it('TokenLockedOutError differentiates ip vs token sources', () => {
    const ip = new TokenLockedOutError('ip', '10.0.0.1', 5_000);
    expect(ip.source).toBe('ip');
    expect(ip.identifier).toBe('10.0.0.1');
    expect(ip.retryAfterMs).toBe(5_000);

    const token = new TokenLockedOutError('token', 'tok-1', 0);
    expect(token.source).toBe('token');
    expect(token.identifier).toBe('tok-1');
  });

  it('WeakPepperError reports the provided byte count', () => {
    const err = new WeakPepperError(8);
    expect(err.kind).toBe('weak-pepper');
    expect(err.providedBytes).toBe(8);
  });
});
