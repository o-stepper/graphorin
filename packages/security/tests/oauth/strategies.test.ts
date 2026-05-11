import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _resetOAuthStrategiesForTesting,
  findOAuthStrategies,
  listOAuthStrategies,
  registerOAuthStrategy,
} from '../../src/oauth/strategies.js';

describe('@graphorin/security/oauth — strategies', () => {
  beforeEach(() => {
    _resetOAuthStrategiesForTesting();
  });
  afterEach(() => {
    _resetOAuthStrategiesForTesting();
  });

  it('matches strategies by URL or ID regex', () => {
    registerOAuthStrategy({
      id: 'slack',
      matchUrl: /slack\.com$/u,
    });
    registerOAuthStrategy({
      id: 'linear',
      matchId: /^linear-/u,
    });
    expect(
      findOAuthStrategies({ serverId: 'slack-mcp', serverUrl: 'https://api.slack.com' }).map(
        (s) => s.id,
      ),
    ).toEqual(['slack']);
    expect(
      findOAuthStrategies({ serverId: 'linear-prod', serverUrl: 'https://example.com' }).map(
        (s) => s.id,
      ),
    ).toEqual(['linear']);
    expect(listOAuthStrategies()).toHaveLength(2);
  });

  it('returns the unsubscribe function', () => {
    const unsubscribe = registerOAuthStrategy({ id: 'tmp', matchId: /tmp/u });
    expect(listOAuthStrategies()).toHaveLength(1);
    unsubscribe();
    expect(listOAuthStrategies()).toHaveLength(0);
  });
});
