/**
 * `graphorin doctor` — host health check.
 *
 * Wraps the read-only library helpers in `@graphorin/security/hardening`
 * (`checkPerms`, `checkSecrets`, `checkEncryption`, `checkSystemd`)
 * with `--fix-perms` repair, `--all` aggregation, JSON output for CI
 * pipelines, and exit-code semantics:
 *
 *  - exit `0` — every check passed (`fail` count is `0`).
 *  - exit `1` — at least one check returned `'fail'`.
 *  - exit `2` — invocation could not even start (e.g. config missing
 *    when `--check-secrets` requires the bootstrapped store).
 *
 * The doctor never writes to disk unless `--fix-perms` is supplied.
 * When repair is requested the CLI calls `ensureFileMode(...)` /
 * `ensureDirMode(...)` from `@graphorin/security/hardening` and re-runs
 * the perms check so the report reflects the post-fix state.
 *
 * Source-of-truth: process-hardening + `graphorin doctor` policy
 * (DEC-135).
 *
 * @packageDocumentation
 */

import { homedir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import {
  type CheckResult,
  checkEncryption,
  checkPerms,
  checkSecrets,
  checkSystemd,
  ensureDirMode,
  ensureFileMode,
} from '@graphorin/security';

import { EXIT_CODES } from '../internal/exit.js';
import {
  brand,
  type CommonOutputOptions,
  defaultPrintSink,
  emitReport,
  statusMarker,
} from '../internal/output.js';

/**
 * @stable
 */
export interface DoctorCommandOptions extends CommonOutputOptions {
  /**
   * Override the directory the doctor checks. Defaults to
   * `~/.graphorin/`. Tests inject a fresh tmp dir.
   */
  readonly home?: string;
  /** Run the file-perms repair. */
  readonly fixPerms?: boolean;
  /** Run the file-perms check. Implied by `--all`. */
  readonly checkPerms?: boolean;
  /** Run the secrets-store check. */
  readonly checkSecrets?: boolean;
  /** Run the audit-encryption check. */
  readonly checkEncryption?: boolean;
  /** Run the systemd check. Linux-only. */
  readonly checkSystemd?: boolean;
  /** Optional systemd unit identifier (default `graphorin.service`). */
  readonly systemdUnit?: string;
  /** Run every check. Equivalent to passing every `--check-*` flag. */
  readonly all?: boolean;
  /** Test seam — supply a custom systemd executor. */
  readonly systemdRun?: (cmd: string) => Promise<string>;
}

/**
 * @stable
 */
export interface DoctorReport {
  readonly version: string;
  readonly home: string;
  readonly platform: NodeJS.Platform;
  readonly checks: ReadonlyArray<CheckResult>;
  readonly summary: {
    readonly ok: number;
    readonly warn: number;
    readonly fail: number;
    readonly skip: number;
  };
  readonly fixedPerms?: ReadonlyArray<string>;
}

/**
 * Programmatic entry point. Returns the {@link DoctorReport} so tests
 * and downstream automations consume the structured payload directly.
 *
 * @stable
 */
export async function runDoctor(options: DoctorCommandOptions = {}): Promise<DoctorReport> {
  const home = options.home ?? join(homedir(), '.graphorin');
  const expected = expectedFileModes(home);

  const enable = expandFlags(options);
  const checks: CheckResult[] = [];
  const fixed: string[] = [];

  if (enable.perms) {
    if (options.fixPerms === true) {
      const before = await checkPerms({ expected });
      for (const result of before) {
        if (result.status === 'fail' && expected[result.check] !== undefined) {
          const mode = expected[result.check] as number;
          try {
            if (mode === 0o700) {
              await ensureDirMode(result.check, mode);
            } else {
              await ensureFileMode(result.check, mode);
            }
            fixed.push(result.check);
          } catch (err) {
            checks.push({
              check: result.check,
              status: 'fail',
              message: `--fix-perms failed: ${(err as Error).message}`,
            });
          }
        }
      }
      // Re-run after the repair so the final report reflects the
      // post-fix state.
      const after = await checkPerms({ expected });
      checks.push(...after);
    } else {
      const result = await checkPerms({ expected });
      checks.push(...result);
    }
  }

  if (enable.secrets) {
    checks.push(...checkSecrets());
  }

  if (enable.encryption) {
    checks.push(...checkEncryption());
  }

  if (enable.systemd) {
    const unit =
      options.systemdUnit ?? (process.platform === 'linux' ? 'graphorin.service' : undefined);
    const result = await checkSystemd({
      ...(unit !== undefined ? { unit } : {}),
      ...(options.systemdRun !== undefined ? { run: options.systemdRun } : {}),
    });
    checks.push(...result);
  }

  const summary: Record<'ok' | 'warn' | 'fail' | 'skip', number> = {
    ok: 0,
    warn: 0,
    fail: 0,
    skip: 0,
  };
  for (const c of checks) {
    summary[c.status] += 1;
  }

  const report: DoctorReport = Object.freeze({
    version: '0.3.0',
    home,
    platform: process.platform,
    checks: Object.freeze(checks),
    summary: Object.freeze(summary),
    ...(fixed.length > 0 ? { fixedPerms: Object.freeze(fixed) } : {}),
  });

  emitReport(options, report, () => emitHumanReport(report, options));

  if (summary.fail > 0) {
    process.exitCode = EXIT_CODES.RECOVERABLE_FAILURE;
  }

  return report;
}

/**
 * Default expected file modes per the project's process-hardening
 * policy (DEC-135).
 *
 * @internal
 */
export function expectedFileModes(home: string): Readonly<Record<string, number>> {
  return Object.freeze({
    [home]: 0o700,
    [`${home}/config.json`]: 0o600,
    [`${home}/data.db`]: 0o600,
    [`${home}/audit.db`]: 0o600,
    [`${home}/secrets.kse`]: 0o600,
  });
}

interface DoctorChecks {
  readonly perms: boolean;
  readonly secrets: boolean;
  readonly encryption: boolean;
  readonly systemd: boolean;
}

function expandFlags(options: DoctorCommandOptions): DoctorChecks {
  if (options.all === true) {
    return { perms: true, secrets: true, encryption: true, systemd: true };
  }
  const explicit =
    options.checkPerms === true ||
    options.checkSecrets === true ||
    options.checkEncryption === true ||
    options.checkSystemd === true ||
    options.fixPerms === true;
  if (!explicit) {
    return { perms: true, secrets: false, encryption: false, systemd: false };
  }
  return {
    perms: options.checkPerms === true || options.fixPerms === true,
    secrets: options.checkSecrets === true,
    encryption: options.checkEncryption === true,
    systemd: options.checkSystemd === true,
  };
}

function emitHumanReport(report: DoctorReport, options: DoctorCommandOptions): void {
  const print = options.print ?? defaultPrintSink;
  print(
    brand(
      `graphorin doctor v${report.version} (host: ${report.home}, platform: ${report.platform})`,
    ),
  );
  if (report.fixedPerms !== undefined) {
    print(brand(`--fix-perms repaired:`));
    for (const path of report.fixedPerms) print(`  - ${path}`);
  }
  if (report.checks.length === 0) {
    print(brand('no checks were enabled. Pass --all or one of --check-*.'));
    return;
  }
  for (const c of report.checks) {
    print(`  ${statusMarker(c.status)} ${c.check}: ${c.message}`);
    if (c.hint !== undefined) print(`        -> ${c.hint}`);
  }
  print(
    brand(
      `summary: ${report.summary.ok} ok, ${report.summary.warn} warn, ${report.summary.fail} fail, ${report.summary.skip} skip`,
    ),
  );
}
