/**
 * Localhost callback server used by the Authorization Code + PKCE
 * flow. The server binds a random port in the operator-supplied
 * range, exposes a single `/callback` endpoint, and resolves with the
 * parsed query parameters as soon as the browser hits the redirect
 * URI.
 *
 * The implementation is intentionally bare-bones (Node's built-in
 * `http` module) so the framework does not pull a web framework into
 * the security package.
 *
 * @packageDocumentation
 */

import { randomInt } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

import {
  OAuthAuthorizationError,
  OAuthCallbackError,
  OAuthCallbackPortError,
  OAuthFlowAbortedError,
} from './errors.js';

interface DeferredPromise<T> {
  readonly promise: Promise<T>;
  resolve(value: T): void;
  reject(reason: unknown): void;
}

function createDeferred<T>(): DeferredPromise<T> {
  let resolveFn: (value: T) => void = () => undefined;
  let rejectFn: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolveFn = res;
    rejectFn = rej;
  });
  return { promise, resolve: resolveFn, reject: rejectFn };
}

/** Inclusive default port range (IANA dynamic port space). */
const DEFAULT_PORT_RANGE: readonly [number, number] = [49152, 65535];

/** Parsed callback query parameters. */
export interface CallbackParams {
  readonly code: string;
  readonly state?: string;
  readonly raw: ReadonlyMap<string, string>;
}

/**
 * Options accepted by {@link startLocalCallbackServer}.
 *
 * @stable
 */
export interface LocalCallbackServerOptions {
  /** Inclusive port range. Defaults to `[49152, 65535]`. */
  readonly portRange?: readonly [number, number];
  /** Maximum number of bind attempts before failing. Defaults to 5. */
  readonly maxAttempts?: number;
  /** Optional override for the callback path. Defaults to `/callback`. */
  readonly path?: string;
  /** Browser-facing success page (HTML). Optional. */
  readonly successHtml?: string;
  /** Browser-facing error page (HTML). Optional. */
  readonly errorHtml?: string;
}

/** Handle returned by {@link startLocalCallbackServer}. */
export interface LocalCallbackServer {
  readonly redirectUri: string;
  readonly port: number;
  readonly waitForCallback: (signal?: AbortSignal) => Promise<CallbackParams>;
  readonly close: () => Promise<void>;
}

/**
 * Bind a localhost callback server on a random port in
 * `options.portRange`. The handle exposes the chosen redirect URI
 * and a `waitForCallback(signal)` helper that resolves once the
 * browser hits the path.
 *
 * @stable
 */
export async function startLocalCallbackServer(
  options: LocalCallbackServerOptions = {},
): Promise<LocalCallbackServer> {
  const range = options.portRange ?? DEFAULT_PORT_RANGE;
  const [low, high] = range;
  if (!Number.isInteger(low) || !Number.isInteger(high) || low < 1 || high > 65535 || low > high) {
    throw new RangeError(
      `Invalid OAuth callback port range [${low}, ${high}]; expected integers within [1, 65535] in ascending order.`,
    );
  }
  const path = normalizePath(options.path);
  const maxAttempts = Math.max(1, options.maxAttempts ?? 5);

  let server: Server | undefined;
  let chosenPort: number | undefined;
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = randomInt(low, high + 1);
    try {
      server = await tryBind(candidate);
      chosenPort = candidate;
      break;
    } catch (err) {
      lastError = err;
    }
  }
  if (server === undefined || chosenPort === undefined) {
    void lastError;
    throw new OAuthCallbackPortError(low, high, maxAttempts);
  }

  const redirectUri = `http://127.0.0.1:${chosenPort}${path}`;

  let pending: DeferredPromise<CallbackParams> | undefined;
  const armPending = (): DeferredPromise<CallbackParams> => {
    if (pending !== undefined) return pending;
    pending = createDeferred<CallbackParams>();
    return pending;
  };

  const handleRequest = (req: IncomingMessage, res: ServerResponse): void => {
    if (req.method !== 'GET') {
      respond(res, 405, 'method not allowed');
      return;
    }
    if (req.url === undefined) {
      respond(res, 400, 'invalid request');
      return;
    }
    let url: URL;
    try {
      url = new URL(req.url, redirectUri);
    } catch {
      respond(res, 400, 'invalid url');
      return;
    }
    if (url.pathname !== path) {
      respond(res, 404, 'not found');
      return;
    }
    const params = url.searchParams;
    const params2 = new Map<string, string>();
    for (const [key, value] of params.entries()) params2.set(key, value);
    const errorParam = params.get('error');
    const codeParam = params.get('code');
    const stateParam = params.get('state');
    const errorDescription = params.get('error_description') ?? undefined;

    if (errorParam !== null && errorParam !== '') {
      respondHtml(
        res,
        400,
        options.errorHtml ?? renderDefaultErrorHtml(errorParam, errorDescription),
      );
      armPending().reject(new OAuthAuthorizationError(errorParam, errorDescription));
      return;
    }
    if (codeParam === null || codeParam === '') {
      respond(res, 400, 'missing code parameter');
      armPending().reject(
        new OAuthCallbackError('Callback request omitted required `code` parameter.'),
      );
      return;
    }
    respondHtml(res, 200, options.successHtml ?? renderDefaultSuccessHtml());
    armPending().resolve({
      code: codeParam,
      ...(stateParam === null ? {} : { state: stateParam }),
      raw: params2,
    });
  };

  server.on('request', handleRequest);

  const close = async (): Promise<void> => {
    await new Promise<void>((resolve) => {
      server?.close(() => resolve());
    });
  };

  const waitForCallback = (signal?: AbortSignal): Promise<CallbackParams> => {
    if (signal?.aborted === true) {
      return Promise.reject(new OAuthFlowAbortedError('callback'));
    }
    const local = armPending();
    let onAbort: (() => void) | undefined;
    if (signal !== undefined) {
      onAbort = (): void => {
        local.reject(new OAuthFlowAbortedError('callback'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    }
    return local.promise.finally(() => {
      pending = undefined;
      if (signal !== undefined && onAbort !== undefined) {
        signal.removeEventListener('abort', onAbort);
      }
    });
  };

  return {
    redirectUri,
    port: chosenPort,
    waitForCallback,
    close,
  };
}

function normalizePath(input: string | undefined): string {
  const path = input ?? '/callback';
  if (!path.startsWith('/')) {
    throw new RangeError(`Callback path must start with '/'; received '${path}'.`);
  }
  return path;
}

function respond(res: ServerResponse, status: number, message: string): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(message);
}

function respondHtml(res: ServerResponse, status: number, html: string): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(html);
}

async function tryBind(port: number): Promise<Server> {
  return new Promise<Server>((resolve, reject) => {
    const srv = createServer();
    const onError = (err: Error): void => {
      srv.removeListener('listening', onListening);
      reject(err);
    };
    const onListening = (): void => {
      srv.removeListener('error', onError);
      const addr = srv.address();
      if (addr === null || typeof addr === 'string') {
        srv.close();
        reject(new Error('Listening address has unexpected shape.'));
        return;
      }
      resolve(srv);
    };
    srv.once('error', onError);
    srv.once('listening', onListening);
    srv.listen({ port, host: '127.0.0.1' });
  });
}

function renderDefaultSuccessHtml(): string {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head><meta charset="utf-8"><title>Authorization complete</title></head>',
    '<body style="font-family:system-ui,sans-serif;padding:2em;text-align:center">',
    '<h1>Authorization complete</h1>',
    '<p>You can close this tab and return to the terminal.</p>',
    '</body></html>',
  ].join('\n');
}

function renderDefaultErrorHtml(error: string, description?: string): string {
  const safeError = escapeHtml(error);
  const safeDescription = description === undefined ? '' : `<p>${escapeHtml(description)}</p>`;
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head><meta charset="utf-8"><title>Authorization failed</title></head>',
    '<body style="font-family:system-ui,sans-serif;padding:2em;text-align:center">',
    '<h1>Authorization failed</h1>',
    `<p><code>${safeError}</code></p>`,
    safeDescription,
    '</body></html>',
  ].join('\n');
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
