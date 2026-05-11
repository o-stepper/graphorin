import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OAuthFlowAbortedError } from '../../src/oauth/errors.js';
import { _setBrowserOpenerForTesting, openInBrowser } from '../../src/oauth/index.js';

describe('@graphorin/security/oauth — browser opener', () => {
  beforeEach(() => {
    _setBrowserOpenerForTesting(null);
  });
  afterEach(() => {
    _setBrowserOpenerForTesting(null);
  });

  it('delegates to the active opener when one is registered', async () => {
    const calls: string[] = [];
    const previous = _setBrowserOpenerForTesting(async (url) => {
      calls.push(url);
    });
    expect(previous).toBeNull();
    await openInBrowser('https://example.com');
    expect(calls).toEqual(['https://example.com']);
  });

  it('throws when the abort signal fires before launch', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(openInBrowser('https://example.com', controller.signal)).rejects.toBeInstanceOf(
      OAuthFlowAbortedError,
    );
  });
});
