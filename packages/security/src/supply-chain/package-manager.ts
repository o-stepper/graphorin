/**
 * Package-manager wrapper used by the npm + git installers. The
 * framework prefers `pnpm` (the project default) and falls back to
 * `npm` / `yarn` when `pnpm` is not on `PATH`. Every spawned process
 * passes the appropriate `--ignore-scripts` flag when the resolved
 * trust policy demands it.
 *
 * @packageDocumentation
 */

import { spawn } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { delimiter, join, sep } from 'node:path';

/**
 * Discriminator for the resolved package manager.
 *
 * @stable
 */
export type PackageManagerKind = 'pnpm' | 'npm' | 'yarn';

/** Override hook used by tests. */
let activeRunner: PackageManagerRunner | null = null;

/**
 * Strategy hook: replace the default `child_process.spawn` runner.
 * Tests use this to assert the correct CLI is invoked without
 * actually shelling out.
 *
 * @experimental
 */
export type PackageManagerRunner = (args: {
  readonly command: string;
  readonly args: ReadonlyArray<string>;
  readonly cwd?: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly signal?: AbortSignal;
}) => Promise<PackageManagerResult>;

/** Result returned by the runner. */
export interface PackageManagerResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

/**
 * Override the runner. Returns the previous runner so tests can
 * restore the default at the end of a fixture.
 *
 * @experimental
 */
export function _setPackageManagerRunnerForTesting(
  runner: PackageManagerRunner | null,
): PackageManagerRunner | null {
  const previous = activeRunner;
  activeRunner = runner;
  return previous;
}

/** Override hook for the package-manager detector. */
let activeDetector: (() => PackageManagerKind) | null = null;

/**
 * Override the detected package manager. Returns the previous value.
 *
 * @experimental
 */
export function _setPackageManagerForTesting(
  detector: (() => PackageManagerKind) | null,
): (() => PackageManagerKind) | null {
  const previous = activeDetector;
  activeDetector = detector;
  return previous;
}

/**
 * Detect the available package manager. Prefers `pnpm` (project
 * default) and falls back to `npm` and `yarn`.
 *
 * @stable
 */
export function detectPackageManager(env: NodeJS.ProcessEnv = process.env): PackageManagerKind {
  if (activeDetector !== null) return activeDetector();
  for (const candidate of ['pnpm', 'npm', 'yarn'] as const) {
    if (isOnPath(candidate, env)) return candidate;
  }
  // Fall back to npm even when nothing was found - this surfaces a
  // clear runtime error from `child_process.spawn` instead of
  // hiding the misconfiguration in the policy resolver.
  return 'npm';
}

/**
 * Build the CLI invocation for an install request. Encapsulates the
 * subtle differences between the supported package managers.
 *
 * @stable
 */
export function buildInstallInvocation(args: {
  readonly manager: PackageManagerKind;
  readonly packageSpec: string;
  readonly ignoreScripts: boolean;
  readonly cwd?: string;
}): { command: string; args: ReadonlyArray<string> } {
  const ignore = args.ignoreScripts ? ['--ignore-scripts'] : [];
  switch (args.manager) {
    case 'pnpm':
      return {
        command: 'pnpm',
        args: ['add', args.packageSpec, '--no-frozen-lockfile', ...ignore],
      };
    case 'npm':
      return {
        command: 'npm',
        args: ['install', args.packageSpec, '--no-save', ...ignore],
      };
    case 'yarn':
      return {
        command: 'yarn',
        args: ['add', args.packageSpec, ...ignore],
      };
    default: {
      const exhaustive: never = args.manager;
      void exhaustive;
      throw new Error(`Unsupported package manager '${String(args.manager)}'.`);
    }
  }
}

/**
 * Run a package-manager invocation. Returns the buffered stdout +
 * stderr; a non-zero exit code is reported to the caller via the
 * `exitCode` field rather than thrown.
 *
 * @stable
 */
export async function runPackageManager(args: {
  readonly command: string;
  readonly args: ReadonlyArray<string>;
  readonly cwd?: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly signal?: AbortSignal;
}): Promise<PackageManagerResult> {
  if (activeRunner !== null) {
    return activeRunner({
      command: args.command,
      args: args.args,
      ...(args.cwd === undefined ? {} : { cwd: args.cwd }),
      ...(args.env === undefined ? {} : { env: args.env }),
      ...(args.signal === undefined ? {} : { signal: args.signal }),
    });
  }
  return new Promise<PackageManagerResult>((resolve, reject) => {
    const child = spawn(args.command, [...args.args], {
      ...(args.cwd === undefined ? {} : { cwd: args.cwd }),
      ...(args.env === undefined ? {} : { env: args.env }),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
    const onAbort = (): void => {
      child.kill('SIGTERM');
    };
    if (args.signal !== undefined) args.signal.addEventListener('abort', onAbort, { once: true });
    child.once('error', (err) => {
      if (args.signal !== undefined) args.signal.removeEventListener('abort', onAbort);
      reject(err);
    });
    child.once('close', (code) => {
      if (args.signal !== undefined) args.signal.removeEventListener('abort', onAbort);
      resolve({
        exitCode: code ?? 0,
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
      });
    });
  });
}

function isOnPath(name: string, env: NodeJS.ProcessEnv): boolean {
  const path = env.PATH ?? '';
  if (path.length === 0) return false;
  const segments = path.split(delimiter);
  for (const segment of segments) {
    const candidate = join(segment, name);
    const candidates =
      process.platform === 'win32'
        ? [candidate, `${candidate}.cmd`, `${candidate}.exe`]
        : [candidate];
    for (const file of candidates) {
      try {
        if (existsSync(file) && statSync(file).isFile()) return true;
      } catch {
        // ignore EACCES and friends; treat as missing
      }
    }
    void sep;
  }
  return false;
}
