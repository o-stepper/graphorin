import { describe, expect, it } from 'vitest';

import {
  GraphorinOAuthError,
  OAuthAuthorizationError,
  OAuthCallbackPortError,
  OAuthDiscoveryError,
  OAuthFlowAbortedError,
  OAuthPeerDependencyMissingError,
  OAuthRefreshError,
  OAuthRegistrationUnsupportedError,
  OAuthRevokedError,
} from '../../src/oauth/errors.js';

describe('@graphorin/security/oauth - typed errors', () => {
  it('every error carries a stable kind', () => {
    expect(new OAuthDiscoveryError('https://x', 'm').kind).toBe('discovery-failed');
    expect(new OAuthRegistrationUnsupportedError('https://x').kind).toBe(
      'registration-unsupported',
    );
    expect(new OAuthRefreshError('id', 'invalid_grant', 'm').kind).toBe('refresh-failed');
    expect(new OAuthRevokedError('id', 'invalid_grant').kind).toBe('revoked');
    expect(new OAuthAuthorizationError('access_denied', 'denied').kind).toBe('authorization-error');
    expect(new OAuthFlowAbortedError('callback').kind).toBe('aborted');
    expect(new OAuthCallbackPortError(1, 2, 3).kind).toBe('callback-port-unavailable');
    expect(new OAuthPeerDependencyMissingError().kind).toBe('peer-missing');
  });

  it('OAuthAuthorizationError preserves description', () => {
    const err = new OAuthAuthorizationError('invalid_grant', 'token expired');
    expect(err.oauthError).toBe('invalid_grant');
    expect(err.oauthErrorDescription).toBe('token expired');
    expect(err.message).toContain('token expired');
  });

  it('OAuthRefreshError preserves provider error tag', () => {
    const err = new OAuthRefreshError('mcp-test', 'temporarily_unavailable', 'busy');
    expect(err.providerError).toBe('temporarily_unavailable');
    expect(err.serverId).toBe('mcp-test');
  });

  it('inherits from a single base class', () => {
    expect(new OAuthRevokedError('a', 'b')).toBeInstanceOf(GraphorinOAuthError);
  });
});
