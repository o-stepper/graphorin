import { describe, expect, it } from 'vitest';

import { DEFAULT_REPLAY_LOG_CONFIG } from '../../src/replay/index.js';

describe('@graphorin/observability/replay — DEFAULT_REPLAY_LOG_CONFIG', () => {
  it('defaults retentionDays to the documented 30 days', () => {
    expect(DEFAULT_REPLAY_LOG_CONFIG.retentionDays).toBe(30);
  });

  it('enables auto-prune by default with a daily 4am UTC cron', () => {
    expect(DEFAULT_REPLAY_LOG_CONFIG.autoPrune.enabled).toBe(true);
    expect(DEFAULT_REPLAY_LOG_CONFIG.autoPrune.schedule).toBe('0 4 * * *');
  });

  it('encryption-at-rest defaults to off (opt-in)', () => {
    expect(DEFAULT_REPLAY_LOG_CONFIG.encryption).toBe('off');
  });

  it('the default object is frozen', () => {
    expect(Object.isFrozen(DEFAULT_REPLAY_LOG_CONFIG)).toBe(true);
  });
});
