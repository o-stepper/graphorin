import { _resetOAuthAuditListenersForTesting } from '../../src/oauth/audit-emitter.js';
import { _setBrowserOpenerForTesting } from '../../src/oauth/browser.js';
import { _resetOAuthLifecycleListenersForTesting } from '../../src/oauth/events.js';
import {
  _setDcrFetcherForTesting,
  _setDeviceAuthFetcherForTesting,
  _setDiscoveryFetcherForTesting,
  _setRevocationFetcherForTesting,
  _setTokenEndpointFetcherForTesting,
} from '../../src/oauth/index.js';
import { _resetInflightRefreshForTesting } from '../../src/oauth/refresh.js';
import { _resetOAuthStrategiesForTesting } from '../../src/oauth/strategies.js';

/** Reset every OAuth-subsystem singleton between tests. */
export function resetOAuthSubsystem(): void {
  _setDiscoveryFetcherForTesting(null);
  _setDcrFetcherForTesting(null);
  _setDeviceAuthFetcherForTesting(null);
  _setRevocationFetcherForTesting(null);
  _setTokenEndpointFetcherForTesting(null);
  _setBrowserOpenerForTesting(null);
  _resetOAuthAuditListenersForTesting();
  _resetOAuthLifecycleListenersForTesting();
  _resetOAuthStrategiesForTesting();
  _resetInflightRefreshForTesting();
}

/** Build a synthetic discovery payload + storage seed. */
export function buildSyntheticServerMetadata(
  overrides: {
    readonly issuer?: string;
    readonly authorizationEndpoint?: string;
    readonly tokenEndpoint?: string;
    readonly registrationEndpoint?: string;
    readonly revocationEndpoint?: string;
    readonly deviceAuthorizationEndpoint?: string;
  } = {},
): import('../../src/oauth/types.js').OAuthServerMetadata {
  return Object.freeze({
    issuer: overrides.issuer ?? 'https://issuer.example.com',
    authorizationEndpoint:
      overrides.authorizationEndpoint ?? 'https://issuer.example.com/oauth/authorize',
    tokenEndpoint: overrides.tokenEndpoint ?? 'https://issuer.example.com/oauth/token',
    ...(overrides.registrationEndpoint === undefined
      ? {}
      : { registrationEndpoint: overrides.registrationEndpoint }),
    ...(overrides.revocationEndpoint === undefined
      ? {}
      : { revocationEndpoint: overrides.revocationEndpoint }),
    ...(overrides.deviceAuthorizationEndpoint === undefined
      ? {}
      : { deviceAuthorizationEndpoint: overrides.deviceAuthorizationEndpoint }),
    raw: { issuer: overrides.issuer ?? 'https://issuer.example.com' },
  });
}
