/**
 * Cross-platform browser launcher used by the Authorization Code
 * flow. The implementation is intentionally minimal — `child_process`
 * is enough on every host platform we support and we avoid pulling in
 * the `open` package as a hard dependency.
 *
 * Consumers can override the launcher entirely via the
 * `openAuthorizationUrl` option to {@link OAuthClient.authorizeCode}.
 *
 * @packageDocumentation
 */

import { spawn } from 'node:child_process';
import { platform } from 'node:os';

import { OAuthFlowAbortedError } from './errors.js';

/**
 * Strategy hook used by tests so the unit suite never opens a real
 * browser.
 *
 * @experimental
 */
export type BrowserOpener = (url: string, signal?: AbortSignal) => Promise<void>;

let activeOpener: BrowserOpener | null = null;

/**
 * Override the active browser opener. Returns the previous opener so
 * tests can restore the default at the end of a fixture.
 *
 * @experimental
 */
export function _setBrowserOpenerForTesting(opener: BrowserOpener | null): BrowserOpener | null {
  const previous = activeOpener;
  activeOpener = opener;
  return previous;
}

/**
 * Default cross-platform launcher. Falls back to printing the URL on
 * platforms where `spawn` returns a non-zero exit code so headless
 * deployments still surface the URL to the operator.
 *
 * @stable
 */
export async function openInBrowser(url: string, signal?: AbortSignal): Promise<void> {
  if (activeOpener !== null) return activeOpener(url, signal);
  if (signal?.aborted === true) throw new OAuthFlowAbortedError('browser');

  const { command, args } = resolveLauncher(url);
  return new Promise<void>((resolve) => {
    const child = spawn(command, args, {
      stdio: 'ignore',
      detached: true,
    });
    const onAbort = (): void => {
      child.kill('SIGTERM');
    };
    if (signal !== undefined) signal.addEventListener('abort', onAbort, { once: true });

    let settled = false;
    const settle = (): void => {
      if (settled) return;
      settled = true;
      if (signal !== undefined) signal.removeEventListener('abort', onAbort);
      resolve();
    };

    child.once('error', () => {
      // Fall back to printing the URL — never crash the OAuth flow.
      // eslint-disable-next-line no-console
      console.log(`Open this URL in your browser to continue: ${url}`);
      settle();
    });
    child.once('spawn', () => {
      child.unref();
      settle();
    });
  });
}

interface LauncherSpec {
  readonly command: string;
  readonly args: ReadonlyArray<string>;
}

function resolveLauncher(url: string): LauncherSpec {
  const plat = platform();
  if (plat === 'darwin') return { command: 'open', args: [url] };
  if (plat === 'win32') return { command: 'cmd', args: ['/c', 'start', '""', url] };
  // POSIX fallthrough — Linux + BSD + WSL.
  return { command: 'xdg-open', args: [url] };
}
