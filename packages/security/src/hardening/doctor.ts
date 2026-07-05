/**
 * `graphorin doctor` library functions. Each helper returns a
 * `CheckResult[]` with structured `status` (`'ok' | 'warn' | 'fail'`)
 * + remediation hint. The CLI binary in Phase 15 wraps these helpers
 * as the `graphorin doctor` subcommands.
 *
 * The helpers do not write to disk - they only read. `--fix-perms`
 * is implemented in the CLI by calling `ensureFileMode(...)` /
 * `ensureDirMode(...)` after `checkPerms(...)` reports a drift.
 *
 * References:
 *  - DEC-135 - process hardening (file modes, refuse-as-root).
 *  - DEC-136 - secrets capability matrix
 *    (`getSecretsStoreStatus(...)`).
 *  - DEC-129 - encryption-at-rest opt-in (audit-db binding).
 *
 * @packageDocumentation
 */

import { lstat as lstatCb } from 'node:fs/promises';

import { listAuditDbBindings } from '../audit/audit-db.js';
import { getSecretsStoreStatus } from '../secrets/factory.js';

const POSIX_MASK = 0o777;

/**
 * Discriminator for individual check outcomes.
 *
 * @stable
 */
export type CheckStatus = 'ok' | 'warn' | 'fail' | 'skip';

/**
 * One result row produced by the doctor library.
 *
 * @stable
 */
export interface CheckResult {
  readonly check: string;
  readonly status: CheckStatus;
  readonly message: string;
  readonly hint?: string;
}

/**
 * Options for `checkPerms(...)`.
 *
 * @stable
 */
export interface CheckPermsOptions {
  /**
   * Map of path → expected POSIX mode. Each entry is checked
   * against `lstat`. Missing files surface as `'warn'` so the
   * doctor can recommend `graphorin init`.
   */
  readonly expected: Readonly<Record<string, number>>;
}

/**
 * Verify that a set of paths carry the expected POSIX modes. Used
 * by `graphorin doctor --check-perms`.
 *
 * @stable
 */
export async function checkPerms(opts: CheckPermsOptions): Promise<CheckResult[]> {
  if (process.platform === 'win32') {
    return [
      {
        check: 'permissions',
        status: 'skip',
        message: 'POSIX modes are not honoured on Windows; the doctor cannot verify this section.',
        hint: 'Use BitLocker FDE on Windows hosts.',
      },
    ];
  }
  const out: CheckResult[] = [];
  for (const [path, expected] of Object.entries(opts.expected)) {
    try {
      const stats = await lstatCb(path);
      const actual = stats.mode & POSIX_MASK;
      if (actual === expected) {
        out.push({ check: path, status: 'ok', message: `mode ${expected.toString(8)}` });
      } else {
        out.push({
          check: path,
          status: 'fail',
          message: `mode ${actual.toString(8)} (expected ${expected.toString(8)})`,
          hint: 'Run `graphorin doctor --fix-perms` to repair.',
        });
      }
    } catch (error) {
      const code = (error as { code?: string } | null | undefined)?.code;
      if (code === 'ENOENT') {
        out.push({
          check: path,
          status: 'warn',
          message: 'path does not exist yet',
          hint: 'Run `graphorin init` to bootstrap the data directory.',
        });
      } else {
        out.push({
          check: path,
          status: 'fail',
          message: `failed to stat: ${(error as Error).message}`,
        });
      }
    }
  }
  return out;
}

/**
 * Wrapper around `getSecretsStoreStatus(...)` from the secrets
 * subsystem. Surfaces any active downgrade as a `'warn'` and
 * `--strict-secrets` failure as `'fail'`.
 *
 * @stable
 */
export function checkSecrets(): CheckResult[] {
  const status = getSecretsStoreStatus();
  if (status === undefined) {
    return [
      {
        check: 'secrets-store',
        status: 'warn',
        message:
          'createSecretsStore({ kind: "auto" }) has not been called yet - the doctor cannot inspect the store.',
        hint: 'Bootstrap the host with createSecretsStore({ kind: "auto" }) before running checks.',
      },
    ];
  }
  const rows: CheckResult[] = [
    {
      check: 'secrets-store',
      status: 'ok',
      message: `active: ${status.active}, fallback chain: ${status.fallbackChain.join(' → ')}`,
    },
  ];
  if (status.downgradedFrom !== undefined) {
    rows.push({
      check: 'secrets-downgrade',
      status: 'warn',
      message: `downgraded from ${status.downgradedFrom} (${status.downgradeReason ?? 'reason not recorded'})`,
      hint: 'Install / unlock the primary store, or pass --strict-secrets to fail-fast.',
    });
  }
  if (status.headless) {
    rows.push({
      check: 'secrets-headless',
      status: 'ok',
      message: `host detected as headless: ${status.headlessReasons.join(', ') || '(no reasons recorded)'}`,
    });
  }
  return rows;
}

/**
 * Verify that an encrypted-SQLite binding is registered for the
 * audit log. The framework refuses to open the audit log without an
 * encrypted binding, so the doctor surfaces the missing binding as
 * `'fail'`.
 *
 * @stable
 */
export function checkEncryption(): CheckResult[] {
  const bindings = listAuditDbBindings();
  if (bindings.length === 0) {
    return [
      {
        check: 'audit-db',
        status: 'fail',
        message: 'no encrypted-SQLite binding registered for the audit log',
        hint: 'Install the SQLite cipher peer dependency and register a binding via registerAuditDbBinding(...). The framework default ships from @graphorin/store-sqlite (Phase 05).',
      },
    ];
  }
  return [
    {
      check: 'audit-db',
      status: 'ok',
      message: `bindings: ${bindings.map((b) => b.id).join(', ')}`,
    },
  ];
}

/**
 * Linux-only systemd hardening check. Returns a `'skip'` row on
 * non-Linux hosts. The body parses the structured output of
 * `systemd-analyze security <unit>`; the parser is intentionally
 * thin so deployments without systemd report a clean skip.
 *
 * @stable
 */
export function checkSystemd(opts: {
  readonly unit?: string;
  readonly run?: (command: string) => Promise<string>;
}): Promise<CheckResult[]> {
  if (process.platform !== 'linux') {
    return Promise.resolve([
      {
        check: 'systemd',
        status: 'skip',
        message: 'systemd hardening checks only run on Linux hosts',
      },
    ]);
  }
  if (!opts.unit) {
    return Promise.resolve([
      {
        check: 'systemd',
        status: 'skip',
        message: 'no unit configured; pass `unit: "graphorin.service"` to check.',
      },
    ]);
  }
  const exec = opts.run ?? defaultRun;
  return exec(`systemd-analyze security ${opts.unit}`)
    .then((stdout) => {
      const score = parseSystemdScore(stdout);
      if (score === undefined) {
        return [
          {
            check: 'systemd',
            status: 'warn',
            message: 'could not parse systemd-analyze security output',
          } satisfies CheckResult,
        ];
      }
      const status: CheckStatus = score < 5 ? 'ok' : score < 8 ? 'warn' : 'fail';
      return [
        {
          check: 'systemd',
          status,
          message: `systemd hardening score: ${score.toFixed(1)} (target < 5)`,
        } satisfies CheckResult,
      ];
    })
    .catch((error: unknown) => [
      {
        check: 'systemd',
        status: 'warn',
        message: `failed to run systemd-analyze: ${(error as Error).message}`,
      } satisfies CheckResult,
    ]);
}

async function defaultRun(_command: string): Promise<string> {
  // Default impl is conservative - operators must inject a real
  // executor (e.g. `node:child_process` `execFile`) to opt in.
  throw new Error(
    'no executor supplied to checkSystemd({ run })). Inject a child-process runner from the host.',
  );
}

/**
 * Parse the score line from `systemd-analyze security`. The line
 * normally looks like `→ Overall exposure level for ...: 7.4 OK`.
 *
 * @stable
 */
export function parseSystemdScore(output: string): number | undefined {
  // `systemd-analyze security` prints at most a few hundred lines; cap
  // the haystack before the regex so the parser is bounded even when
  // the executor returns unexpectedly large output.
  const haystack = output.length > 65_536 ? output.slice(0, 65_536) : output;
  const match = /(?:Overall|exposure level)[^\n\d]*(\d+(?:\.\d+)?)/i.exec(haystack);
  if (!match) return undefined;
  const score = Number(match[1]);
  return Number.isFinite(score) ? score : undefined;
}
