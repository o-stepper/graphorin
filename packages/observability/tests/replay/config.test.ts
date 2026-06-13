import { describe, expect, it } from 'vitest';

import { DEFAULT_REPLAY_LOG_CONFIG } from '../../src/replay/index.js';

describe('@graphorin/observability/replay — DEFAULT_REPLAY_LOG_CONFIG', () => {
  it('defaults retentionDays to the documented 30 days', () => {
    expect(DEFAULT_REPLAY_LOG_CONFIG.retentionDays).toBe(30);
  });

  it('leaves auto-prune disabled by default (no built-in scheduler consumes it — RP-19)', () => {
    expect(DEFAULT_REPLAY_LOG_CONFIG.autoPrune.enabled).toBe(false);
    expect(DEFAULT_REPLAY_LOG_CONFIG.autoPrune.schedule).toBe('0 4 * * *');
  });

  it('encryption-at-rest defaults to off (opt-in)', () => {
    expect(DEFAULT_REPLAY_LOG_CONFIG.encryption).toBe('off');
  });

  it('the default object is frozen', () => {
    expect(Object.isFrozen(DEFAULT_REPLAY_LOG_CONFIG)).toBe(true);
  });
});
