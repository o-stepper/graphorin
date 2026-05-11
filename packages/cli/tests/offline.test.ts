import { afterEach, describe, expect, it } from 'vitest';

import {
  assertNoNetworkInOfflineMode,
  isOfflineMode,
  OfflineModeViolationError,
} from '../src/internal/offline.js';

const ENV_KEY = 'GRAPHORIN_OFFLINE';

afterEach(() => {
  delete process.env[ENV_KEY];
});

describe('isOfflineMode', () => {
  it('returns false when the env var is unset', () => {
    delete process.env[ENV_KEY];
    expect(isOfflineMode()).toBe(false);
  });

  it.each(['1', 'true', 'yes', 'TRUE', 'Yes', '  1  '])('returns true for %s', (value) => {
    process.env[ENV_KEY] = value;
    expect(isOfflineMode()).toBe(true);
  });

  it.each(['0', 'false', 'no', '', 'maybe'])('returns false for %s', (value) => {
    process.env[ENV_KEY] = value;
    expect(isOfflineMode()).toBe(false);
  });

  it('respects an explicit env override', () => {
    delete process.env[ENV_KEY];
    expect(isOfflineMode({ GRAPHORIN_OFFLINE: '1' } as NodeJS.ProcessEnv)).toBe(true);
  });
});

describe('assertNoNetworkInOfflineMode', () => {
  it('is a no-op when the flag is unset', () => {
    expect(() => assertNoNetworkInOfflineMode('test')).not.toThrow();
  });

  it('throws OfflineModeViolationError when the flag is set', () => {
    process.env[ENV_KEY] = '1';
    let captured: unknown;
    try {
      assertNoNetworkInOfflineMode('pricing-refresh');
    } catch (err) {
      captured = err;
    }
    expect(captured).toBeInstanceOf(OfflineModeViolationError);
    expect((captured as OfflineModeViolationError).operation).toBe('pricing-refresh');
    expect((captured as OfflineModeViolationError).kind).toBe('offline-mode-violation');
  });
});
