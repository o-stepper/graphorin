import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OAuthFlowAbortedError } from '../../src/oauth/errors.js';
import {
  _setTokenEndpointFetcherForTesting,
  encodeBasicAuth,
  postToTokenEndpoint,
} from '../../src/oauth/index.js';

describe('@graphorin/security/oauth - token-endpoint helpers', () => {
  beforeEach(() => {
    _setTokenEndpointFetcherForTesting(null);
  });
  afterEach(() => {
    _setTokenEndpointFetcherForTesting(null);
  });

  it('forwards form-encoded params and basic-auth header to the stub', async () => {
    let captured: { url: string; body: string; basic?: string } | undefined;
    _setTokenEndpointFetcherForTesting(async (url, init) => {
      captured = {
        url,
        body: init.body,
        ...(init.basicAuth === undefined ? {} : { basic: init.basicAuth }),
      };
      return { ok: true, status: 200, body: { access_token: 'tok', token_type: 'Bearer' } };
    });
    const response = await postToTokenEndpoint(
      'https://issuer.example.com/oauth/token',
      { grant_type: 'authorization_code', code: 'abc xyz' },
      { basicAuth: encodeBasicAuth('cli', 'shh') },
    );
    expect(response.ok).toBe(true);
    expect(captured?.url).toBe('https://issuer.example.com/oauth/token');
    expect(captured?.body).toContain('grant_type=authorization_code');
    expect(captured?.body).toContain('code=abc%20xyz');
    expect(captured?.basic).toBe(encodeBasicAuth('cli', 'shh'));
  });

  it('throws when the abort signal fires before the request', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      postToTokenEndpoint(
        'https://issuer.example.com/oauth/token',
        {},
        { signal: controller.signal },
      ),
    ).rejects.toBeInstanceOf(OAuthFlowAbortedError);
  });

  it('encodeBasicAuth produces RFC 2617 credentials', () => {
    expect(encodeBasicAuth('user', 'pass')).toBe(
      Buffer.from('user:pass', 'utf8').toString('base64'),
    );
  });
});
