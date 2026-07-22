/**
 * Coverage for the shared retryability surface: the
 * `isRetryableProviderFailure` predicate both `withRetry` and
 * `withFallback` delegate to, the `readRetryAfterMs` hint reader, and
 * the first-class `ProviderHttpError.retryAfterMs` stamp.
 */
import { describe, expect, it } from 'vitest';

import { ProviderHttpError } from '../../src/errors/errors.js';
import { isRetryableProviderFailure, readRetryAfterMs } from '../../src/errors/retryability.js';

function abortError(): Error {
  const err = new Error('The operation was aborted');
  err.name = 'AbortError';
  return err;
}

describe('isRetryableProviderFailure', () => {
  it('retries the transient kind family on either kind field', () => {
    for (const kind of ['transient', 'rate-limit', 'rate-limit-exceeded', 'capacity']) {
      expect(isRetryableProviderFailure({ kind })).toBe(true);
      expect(isRetryableProviderFailure({ errorKind: kind })).toBe(true);
    }
  });

  it('never retries the terminal kind family, even with a retryable status', () => {
    for (const kind of ['unauthorized', 'invalid-request', 'context-length', 'content-filter']) {
      expect(isRetryableProviderFailure({ errorKind: kind })).toBe(false);
      expect(isRetryableProviderFailure({ errorKind: kind, status: 503 })).toBe(false);
    }
  });

  it('falls back to HTTP status for unrecognised kinds', () => {
    expect(isRetryableProviderFailure({ status: 429 })).toBe(true);
    expect(isRetryableProviderFailure({ status: 500 })).toBe(true);
    expect(isRetryableProviderFailure({ status: 599 })).toBe(true);
    expect(isRetryableProviderFailure({ status: 0 })).toBe(true);
    expect(isRetryableProviderFailure({ status: 400 })).toBe(false);
    expect(isRetryableProviderFailure({ status: 600 })).toBe(false);
  });

  it('excludes aborts independently of status (PS-2)', () => {
    expect(isRetryableProviderFailure(abortError())).toBe(false);
    expect(isRetryableProviderFailure(Object.assign(abortError(), { status: 0 }))).toBe(false);
  });

  it('rejects non-object throws', () => {
    expect(isRetryableProviderFailure(null)).toBe(false);
    expect(isRetryableProviderFailure('boom')).toBe(false);
    expect(isRetryableProviderFailure(undefined)).toBe(false);
  });

  it('classifies real ProviderHttpError instances via errorKind', () => {
    const rateLimited = new ProviderHttpError({ providerName: 'p', status: 429, message: 'slow' });
    const unauthorized = new ProviderHttpError({ providerName: 'p', status: 401, message: 'no' });
    expect(isRetryableProviderFailure(rateLimited)).toBe(true);
    expect(isRetryableProviderFailure(unauthorized)).toBe(false);
  });
});

describe('readRetryAfterMs', () => {
  it('prefers a millisecond field, then seconds, then headers', () => {
    expect(readRetryAfterMs({ retryAfterMs: 1500 })).toBe(1500);
    expect(readRetryAfterMs({ retryAfterSeconds: 2 })).toBe(2000);
    expect(readRetryAfterMs({ headers: { 'retry-after': '3' } })).toBe(3000);
    expect(
      readRetryAfterMs({
        retryAfterMs: 100,
        retryAfterSeconds: 9,
        headers: { 'retry-after': '9' },
      }),
    ).toBe(100);
  });

  it('resolves HTTP-date values against the clock and clamps the past to zero', () => {
    const future = readRetryAfterMs({
      headers: { 'retry-after': new Date(Date.now() + 5000).toUTCString() },
    });
    expect(future).not.toBeNull();
    expect(future as number).toBeGreaterThan(0);
    expect(future as number).toBeLessThanOrEqual(5000);
    expect(
      readRetryAfterMs({ headers: { 'retry-after': new Date(Date.now() - 5000).toUTCString() } }),
    ).toBe(0);
  });

  it('returns null for garbage, negatives, and absent hints', () => {
    expect(readRetryAfterMs({ headers: { 'retry-after': 'soon-ish' } })).toBeNull();
    expect(readRetryAfterMs({ retryAfterMs: -1 })).toBeNull();
    expect(readRetryAfterMs({})).toBeNull();
    expect(readRetryAfterMs(null)).toBeNull();
  });
});

describe('ProviderHttpError.retryAfterMs', () => {
  it('stamps the field from a numeric retry-after header', () => {
    const err = new ProviderHttpError({
      providerName: 'p',
      status: 429,
      message: 'slow down',
      headers: { 'retry-after': '2' },
    });
    expect(err.retryAfterMs).toBe(2000);
    expect(readRetryAfterMs(err)).toBe(2000);
  });

  it('leaves HTTP-date headers to the reader (no stale stamp at construction)', () => {
    const err = new ProviderHttpError({
      providerName: 'p',
      status: 429,
      message: 'slow down',
      headers: { 'retry-after': new Date(Date.now() + 3000).toUTCString() },
    });
    expect(err.retryAfterMs).toBeUndefined();
    const resolved = readRetryAfterMs(err);
    expect(resolved).not.toBeNull();
    expect(resolved as number).toBeGreaterThan(0);
  });

  it('stays undefined without headers', () => {
    const err = new ProviderHttpError({ providerName: 'p', status: 500, message: 'boom' });
    expect(err.retryAfterMs).toBeUndefined();
  });
});
