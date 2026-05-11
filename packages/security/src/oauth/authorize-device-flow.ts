/**
 * Device Authorization Grant (RFC 8628). Headless / SSH fallback for
 * the Authorization Code flow.
 *
 * @packageDocumentation
 */

import { buildOAuthSession } from './authorize-code-flow.js';
import { OAuthAuthorizationError, OAuthFlowAbortedError } from './errors.js';
import { encodeBasicAuth, postToTokenEndpoint } from './token-endpoint.js';
import type {
  AuthorizeDeviceOptions,
  DeviceUserCodeInfo,
  DiscoveredMetadata,
  OAuthRegistration,
  OAuthSession,
} from './types.js';

/** Device-authorization request response (RFC 8628 § 3.2). */
export interface DeviceAuthorizationResponse {
  readonly device_code: string;
  readonly user_code: string;
  readonly verification_uri: string;
  readonly verification_uri_complete?: string;
  readonly expires_in: number;
  readonly interval?: number;
  readonly [extra: string]: unknown;
}

/** Strategy hook used by tests to stub the device-authorization request. */
export type DeviceAuthFetcher = (
  url: string,
  init: { body: string; signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number; statusText?: string; json: () => Promise<unknown> }>;

let activeFetcher: DeviceAuthFetcher | null = null;

/**
 * Override the device-authorization fetcher. Used by the test suite.
 *
 * @experimental
 */
export function _setDeviceAuthFetcherForTesting(fetcher: DeviceAuthFetcher | null): void {
  activeFetcher = fetcher;
}

/** Internal arguments fed into {@link runDeviceAuthorizationFlow}. */
export interface DeviceAuthorizationFlowArgs {
  readonly serverId: string;
  readonly metadata: DiscoveredMetadata;
  readonly registration: OAuthRegistration;
  readonly options: AuthorizeDeviceOptions;
  /**
   * Sleep helper. Defaults to `setTimeout`. Tests use this to fast-
   * forward the polling cadence.
   */
  readonly sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

/**
 * Drive the Device Authorization Grant flow.
 *
 * @stable
 */
export async function runDeviceAuthorizationFlow(
  args: DeviceAuthorizationFlowArgs,
): Promise<OAuthSession> {
  const { serverId, metadata, registration, options } = args;
  const sleep = args.sleep ?? defaultSleep;
  const signal = options.signal;
  if (signal?.aborted === true) throw new OAuthFlowAbortedError('device-poll');

  const endpoint = metadata.server.deviceAuthorizationEndpoint;
  if (endpoint === undefined || endpoint === '') {
    throw new OAuthAuthorizationError(
      'unsupported_grant_type',
      'Authorization server does not advertise a device_authorization_endpoint (RFC 8628).',
    );
  }
  const initParams: Record<string, string> = {
    client_id: registration.clientId,
  };
  if (options.scope !== undefined) initParams.scope = options.scope;

  const initResponse = await postFormJson(endpoint, initParams, signal);
  if (!initResponse.ok) {
    throw new OAuthAuthorizationError(
      'device_authorization_failed',
      `${initResponse.status} ${initResponse.statusText ?? ''}`.trim(),
    );
  }
  const initBody = (await initResponse.json()) as DeviceAuthorizationResponse;
  const intervalMs = Math.max(1, initBody.interval ?? 5) * 1000;
  const expiresAt = Date.now() + Math.max(1, initBody.expires_in) * 1000;

  const info: DeviceUserCodeInfo = Object.freeze({
    userCode: initBody.user_code,
    verificationUri: initBody.verification_uri,
    ...(typeof initBody.verification_uri_complete === 'string'
      ? { verificationUriComplete: initBody.verification_uri_complete }
      : {}),
    expiresAt,
    intervalMs,
  });
  options.onUserCode?.(info);

  let pollIntervalMs = intervalMs;
  const tokenEndpoint = metadata.server.tokenEndpoint;
  const overallTimeoutAt =
    options.timeoutMs === undefined ? expiresAt : Date.now() + options.timeoutMs;

  while (Date.now() < overallTimeoutAt) {
    if (isAborted(signal)) throw new OAuthFlowAbortedError('device-poll');
    await sleep(pollIntervalMs, signal);

    const params: Record<string, string> = {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: initBody.device_code,
      client_id: registration.clientId,
    };
    let basic: string | undefined;
    if (registration.clientSecret !== undefined) {
      basic = encodeBasicAuth(registration.clientId, registration.clientSecret.reveal());
    }
    const response = await postToTokenEndpoint(tokenEndpoint, params, {
      ...(signal === undefined ? {} : { signal }),
      ...(basic === undefined ? {} : { basicAuth: basic }),
    });
    if (response.ok && response.body.error === undefined) {
      return buildOAuthSession(serverId, response.body);
    }
    const error = response.body.error;
    if (error === 'authorization_pending') continue;
    if (error === 'slow_down') {
      pollIntervalMs += 5_000;
      continue;
    }
    throw new OAuthAuthorizationError(
      error ?? `http_${response.status}`,
      response.body.error_description ?? response.statusText,
    );
  }
  throw new OAuthAuthorizationError(
    'expired_token',
    'Device authorization grant expired before completion.',
  );
}

async function postFormJson(
  url: string,
  params: Readonly<Record<string, string>>,
  signal?: AbortSignal,
): Promise<{ ok: boolean; status: number; statusText?: string; json: () => Promise<unknown> }> {
  if (signal?.aborted === true) throw new OAuthFlowAbortedError('device-poll');
  const body = encodeForm(params);
  if (activeFetcher !== null) {
    return activeFetcher(url, {
      body,
      ...(signal === undefined ? {} : { signal }),
    });
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
    ...(signal === undefined ? {} : { signal }),
  });
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    json: () => response.json() as Promise<unknown>,
  };
}

function encodeForm(params: Readonly<Record<string, string>>): string {
  const out: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    out.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  return out.join('&');
}

function isAborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true;
}

function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (isAborted(signal)) {
      reject(new OAuthFlowAbortedError('device-poll'));
      return;
    }
    const handle = setTimeout(() => {
      if (signal !== undefined) signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(handle);
      reject(new OAuthFlowAbortedError('device-poll'));
    };
    if (signal !== undefined) signal.addEventListener('abort', onAbort, { once: true });
  });
}
