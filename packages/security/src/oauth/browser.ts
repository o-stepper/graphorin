/**
 * Cross-platform browser launcher used by the Authorization Code
 * flow. The implementation is intentionally minimal - `child_process`
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
      // Fall back to printing the URL - never crash the OAuth flow.
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

/**
 * The launcher URL ultimately derives from fetched OAuth
 * discovery metadata. Reject anything that is not a plain http(s) URL,
 * and refuse shell/cmd metacharacters outright - defence in depth on
 * top of the discovery validation.
 */
function assertSafeLaunchUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Refusing to launch a browser for a malformed URL: ${url}`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Refusing to launch a browser for non-http(s) URL: ${parsed.protocol}`);
  }
  // Belt-and-braces: a valid http(s) URL cannot contain bare shell
  // metacharacters, but reject them explicitly so a parser quirk never
  // reaches a launcher.
  if (/[&|^<>"`\r\n]/.test(url)) {
    throw new Error('Refusing to launch a browser for a URL containing shell metacharacters.');
  }
}

function resolveLauncher(url: string, plat: NodeJS.Platform = platform()): LauncherSpec {
  assertSafeLaunchUrl(url);
  if (plat === 'darwin') return { command: 'open', args: [url] };
  // SPL-18: NOT `cmd /c start` - cmd.exe re-parses its command line and
  // `start` re-parses again, so metacharacters in a hostile URL could
  // break out of the argument. `rundll32 url.dll,FileProtocolHandler`
  // hands the URL to the shell's URL handler without a cmd re-parse.
  if (plat === 'win32') {
    return { command: 'rundll32', args: ['url.dll,FileProtocolHandler', url] };
  }
  // POSIX fallthrough - Linux + BSD + WSL.
  return { command: 'xdg-open', args: [url] };
}

/** @experimental - test seam for the platform-specific launcher. */
export function _resolveLauncherForTesting(url: string, plat: NodeJS.Platform): LauncherSpec {
  return resolveLauncher(url, plat);
}
