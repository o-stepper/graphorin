/**
 * `graphorin audit` — operate on the tamper-evident audit log
 * (`audit.db`).
 *
 * Surface (per Phase 15 § Audit):
 *
 *  - `graphorin audit verify` — full hash chain integrity check.
 *  - `graphorin audit prune --before <date>` — drop entries older than
 *    a cutoff while preserving the surviving suffix's chain integrity.
 *  - `graphorin audit export --to <file>` — stream every entry as JSONL.
 *
 * The CLI opens `audit.db` through the framework default binding
 * registered by `@graphorin/server` (`ensureStoreAuditBinding()`); it
 * never re-implements the cipher path.
 *
 * @packageDocumentation
 */

import { writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import process from 'node:process';

import {
  type AuditChainVerifyResult,
  exportAudit,
  openAuditDb,
  type PruneAuditResult,
  pruneAudit,
  resolveSecret,
  type SecretValue,
  type StoredAuditEntry,
  verifyAuditChain,
} from '@graphorin/security';
import { ensureStoreAuditBinding, parseServerConfig } from '@graphorin/server';

import { EXIT_CODES } from '../internal/exit.js';
import { loadConfig } from '../internal/load-config.js';
import {
  brand,
  type CommonOutputOptions,
  defaultPrintSink,
  emitReport,
  statusMarker,
} from '../internal/output.js';

/** @stable */
export interface AuditCommonOptions extends CommonOutputOptions {
  readonly config?: string;
}

/** @stable */
export interface AuditVerifyResult {
  readonly ok: boolean;
  readonly path: string;
  readonly entries: number;
  readonly broken?: { readonly seq: number; readonly expected: string; readonly actual: string };
}

/**
 * `graphorin audit verify` — replay the chain and report the first
 * broken link (if any).
 *
 * @stable
 */
export async function runAuditVerify(options: AuditCommonOptions = {}): Promise<AuditVerifyResult> {
  const ctx = await openAuditContext(options);
  try {
    const result: AuditChainVerifyResult = await verifyAuditChain(ctx.auditDb);
    const out: AuditVerifyResult = result.ok
      ? Object.freeze({ ok: true, path: ctx.auditDb.path, entries: result.count })
      : Object.freeze({
          ok: false,
          path: ctx.auditDb.path,
          entries: 0,
          broken: Object.freeze({
            seq: result.brokenAt,
            expected: result.expected,
            actual: result.actual,
          }),
        });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      if (out.ok) {
        print(
          brand(`audit chain ${statusMarker('ok')} (${out.entries} entries verified, ${out.path})`),
        );
        return;
      }
      print(brand(`audit chain ${statusMarker('fail')} broken at seq ${out.broken?.seq}`));
      print(`  expected prevHash=${out.broken?.expected}`);
      print(`  actual prevHash=${out.broken?.actual}`);
      process.exitCode = EXIT_CODES.RECOVERABLE_FAILURE;
    });
    return out;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface AuditPruneOptions extends AuditCommonOptions {
  /**
   * ISO-8601 date / `YYYY-MM-DD` / millis-since-epoch. The helper
   * drops entries older than this cutoff.
   */
  readonly before: string;
  /** Minimum number of entries that must survive. Default `1`. */
  readonly retain?: number;
}

/** @stable */
export async function runAuditPrune(options: AuditPruneOptions): Promise<PruneAuditResult> {
  const cutoff = parseCutoff(options.before);
  const ctx = await openAuditContext(options);
  try {
    const result = await pruneAudit(ctx.auditDb, {
      before: cutoff,
      ...(options.retain !== undefined ? { retain: options.retain } : {}),
    });
    emitReport(options, result, () => {
      const print = options.print ?? defaultPrintSink;
      if (result.deleted === 0) {
        print(
          brand(`no audit entries qualified for prune (cutoff=${new Date(cutoff).toISOString()}).`),
        );
        return;
      }
      print(
        brand(
          `pruned ${result.deleted} audit entries (cutoff=${new Date(cutoff).toISOString()}, surviving from seq=${result.firstSurvivingSeq ?? '<empty>'})`,
        ),
      );
    });
    return result;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface AuditExportOptions extends AuditCommonOptions {
  readonly to: string;
  readonly fromSeq?: number;
  readonly toSeq?: number;
}

/** @stable */
export interface AuditExportResult {
  readonly path: string;
  readonly rows: number;
}

/**
 * `graphorin audit export --to <file>` — stream every entry as JSONL.
 *
 * @stable
 */
export async function runAuditExport(options: AuditExportOptions): Promise<AuditExportResult> {
  const cwd = process.cwd();
  const targetPath = isAbsolute(options.to) ? options.to : resolve(cwd, options.to);
  const ctx = await openAuditContext(options);
  try {
    const lines: string[] = [];
    const { rows } = await exportAudit(ctx.auditDb, {
      writer: { write: (line: string) => void lines.push(line) },
      ...(options.fromSeq !== undefined ? { fromSeq: options.fromSeq } : {}),
      ...(options.toSeq !== undefined ? { toSeq: options.toSeq } : {}),
    });
    await writeFile(targetPath, lines.join(''), { mode: 0o600 });
    const out: AuditExportResult = Object.freeze({ path: targetPath, rows });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      print(brand(`exported ${rows} audit entries to ${targetPath} (mode 0600).`));
    });
    return out;
  } finally {
    await ctx.close();
  }
}

interface AuditContext {
  readonly auditDb: Awaited<ReturnType<typeof openAuditDb>>;
  readonly path: string;
  readonly close: () => Promise<void>;
}

async function openAuditContext(options: AuditCommonOptions): Promise<AuditContext> {
  const loaded = await loadConfig(options.config);
  const config = parseServerConfig(loaded.config);
  if (!config.audit.enabled) {
    throw new Error(
      '[graphorin/cli] this command requires audit.enabled = true in the resolved config.',
    );
  }
  const passphraseRef = config.audit.passphraseRef ?? config.storage.encryption.passphraseRef;
  if (passphraseRef === undefined) {
    throw new Error(
      `[graphorin/cli] audit.enabled is true but no audit.passphraseRef (or storage.encryption.passphraseRef) is configured. audit.db is mandatory-encrypted by DEC-124.`,
    );
  }
  let passphrase: SecretValue;
  try {
    passphrase = await resolveSecret(passphraseRef);
  } catch (err) {
    throw new Error(
      `[graphorin/cli] failed to resolve audit passphrase '${passphraseRef}': ${(err as Error).message}`,
      { cause: err },
    );
  }
  const auditPath = config.audit.path ?? deriveAuditPath(config.storage.path);
  ensureStoreAuditBinding();
  const auditDb = await openAuditDb({
    path: auditPath,
    passphrase,
    ...(config.audit.cipher !== undefined ? { cipher: config.audit.cipher } : {}),
  });
  return Object.freeze({
    auditDb,
    path: auditPath,
    close: () => auditDb.close(),
  });
}

function deriveAuditPath(storagePath: string): string {
  const dir = dirname(storagePath);
  return resolve(dir, 'audit.db');
}

function parseCutoff(input: string): number {
  const numeric = Number(input);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  const ms = Date.parse(input);
  if (!Number.isFinite(ms)) {
    throw new Error(
      `[graphorin/cli] --before '${input}' is not a valid ISO date or epoch-ms value.`,
    );
  }
  return ms;
}

// Internal type-only consumers — keep in scope so tree-shaking
// preserves the entry point.
void ((_e?: StoredAuditEntry) => undefined);
