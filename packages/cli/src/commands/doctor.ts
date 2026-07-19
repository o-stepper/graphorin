import pkg from '../../package.json' with { type: 'json' };
/**
 * `graphorin doctor` - host health check.
 *
 * Wraps the read-only library helpers in `@graphorin/security/hardening`
 * (`checkPerms`, `checkSecrets`, `checkEncryption`, `checkSystemd`)
 * with `--fix-perms` repair, `--all` aggregation, JSON output for CI
 * pipelines, and exit-code semantics:
 *
 *  - exit `0` - every check passed (`fail` count is `0`).
 *  - exit `1` - at least one check returned `'fail'`.
 *  - exit `2` - invocation could not even start (e.g. config missing
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
import { dirname, isAbsolute, join, resolve } from 'node:path';
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
import { parseServerConfig, type ServerConfigSpec } from '@graphorin/server';

import { EXIT_CODES } from '../internal/exit.js';
import { loadConfig } from '../internal/load-config.js';
import {
  brand,
  type CommonOutputOptions,
  defaultPrintSink,
  emitReport,
  statusMarker,
} from '../internal/output.js';
import { runLocalSmoke } from '../internal/smoke-local.js';

/**
 * @stable
 */
export interface DoctorCommandOptions extends CommonOutputOptions {
  /**
   * Override the directory the doctor checks. Defaults to
   * `~/.graphorin/`. Tests inject a fresh tmp dir.
   */
  readonly home?: string;
  /**
   * F-06: check the storage / audit paths resolved from this
   * `graphorin.config.*` file instead of the hardcoded `~/.graphorin`
   * layout, so doctor and `graphorin init` (which writes a PROJECT
   * config) live in the same world. Without the flag the default
   * `~/.graphorin` layout is checked, as before.
   */
  readonly config?: string;
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
  /** Test seam - supply a custom systemd executor. */
  readonly systemdRun?: (cmd: string) => Promise<string>;
  /**
   * Run the local-first smoke (external audit 2026-07-16, item 6):
   * native SQLite stack, write / reopen / search round-trip, Ollama
   * reachability + model inventory, an embedding-dimension probe, and
   * (with {@link ollamaModel}) a streamed tool-call round-trip through
   * the real adapter. Deliberately NOT implied by `--all` - the Ollama
   * legs talk to a local daemon, which CI hosts may not run.
   */
  readonly smokeLocal?: boolean;
  /** Ollama base URL for the smoke. Default `http://127.0.0.1:11434`. */
  readonly ollamaBaseUrl?: string;
  /** Chat model the smoke exercises end to end (streaming + tool call). */
  readonly ollamaModel?: string;
  /** Embedding model for the dimension probe. Default `nomic-embed-text`. */
  readonly embedModel?: string;
  /** Wall-clock bound for the smoke's chat leg. Default 60s. */
  readonly chatTimeoutMs?: number;
  /** Test seam - injected fetch for the smoke's Ollama calls. */
  readonly smokeFetchImpl?: typeof fetch;
  /** Test seam - directory for the smoke's throwaway store. */
  readonly smokeDir?: string;
}

/**
 * @stable
 */
export interface DoctorReport {
  readonly version: string;
  readonly home: string;
  /** Resolved config path when `--config` drove the perms check. */
  readonly configPath?: string;
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
  let expected: Readonly<Record<string, number>>;
  let configPath: string | undefined;
  // P2-1 (deep retest 2026-07-19): a config-driven doctor must respect
  // what the config turned OFF - `--all` on a fresh unencrypted init
  // used to fail on the audit-encryption binding the disabled audit log
  // never needs. Undefined (no config supplied) keeps the strict
  // default-layout behaviour.
  let auditEnabled: boolean | undefined;
  if (options.config !== undefined) {
    const loaded = await loadConfig(options.config);
    configPath = loaded.path;
    const parsed = parseServerConfig(loaded.config);
    auditEnabled = parsed.audit.enabled;
    expected = expectedFileModesForConfig(loaded.path, parsed);
  } else {
    expected = expectedFileModes(home);
  }

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
    checks.push(...checkEncryption(auditEnabled !== undefined ? { auditEnabled } : {}));
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

  if (options.smokeLocal === true) {
    checks.push(
      ...(await runLocalSmoke({
        ...(options.ollamaBaseUrl !== undefined ? { ollamaBaseUrl: options.ollamaBaseUrl } : {}),
        ...(options.ollamaModel !== undefined ? { ollamaModel: options.ollamaModel } : {}),
        ...(options.embedModel !== undefined ? { embedModel: options.embedModel } : {}),
        ...(options.chatTimeoutMs !== undefined ? { chatTimeoutMs: options.chatTimeoutMs } : {}),
        ...(options.smokeFetchImpl !== undefined ? { fetchImpl: options.smokeFetchImpl } : {}),
        ...(options.smokeDir !== undefined ? { smokeDir: options.smokeDir } : {}),
      })),
    );
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
    version: pkg.version,
    home,
    ...(configPath !== undefined ? { configPath } : {}),
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

/**
 * F-06: expected file modes for a `--config`-driven check - the config
 * file itself plus the storage / audit paths it resolves to. Relative
 * paths resolve against the CWD (the IP-20 rule every other store-
 * opening command uses). The secrets backend has no configured path
 * (`secrets.source` picks a resolver, not a file), so it stays covered
 * by `--check-secrets` only.
 *
 * @internal
 */
export function expectedFileModesForConfig(
  configPath: string,
  config: ServerConfigSpec,
): Readonly<Record<string, number>> {
  const storagePath = isAbsolute(config.storage.path)
    ? config.storage.path
    : resolve(config.storage.path);
  const expected: Record<string, number> = {
    [configPath]: 0o600,
    [storagePath]: 0o600,
  };
  if (config.audit.enabled) {
    const auditPath = config.audit.path ?? join(dirname(storagePath), 'audit.db');
    expected[isAbsolute(auditPath) ? auditPath : resolve(auditPath)] = 0o600;
  }
  return Object.freeze(expected);
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
    // `--smoke-local` alone selects only the smoke; the host checks
    // still compose with it via the explicit `--check-*` flags / `--all`.
    if (options.smokeLocal === true) {
      return { perms: false, secrets: false, encryption: false, systemd: false };
    }
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
  const target =
    report.configPath !== undefined ? `config: ${report.configPath}` : `host: ${report.home}`;
  print(brand(`graphorin doctor v${report.version} (${target}, platform: ${report.platform})`));
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
