/**
 * `graphorin storage` - manage the SQLite store and its encryption-
 * at-rest opt-in.
 *
 * Surface (per Phase 15 § Storage):
 *
 *  - `graphorin storage status` - reports cipher peer + WAL + size +
 *    encryption mode.
 *  - `graphorin storage encrypt --passphrase-from <ref>` - opt-in
 *    encryption migration. Requires the `@graphorin/store-sqlite-
 *    encrypted` sub-pack from Phase 16.
 *  - `graphorin storage rekey --new-passphrase-from <ref>` - re-key
 *    an already-encrypted DB.
 *  - `graphorin storage cleanup-backups` - drop stale `.bak` /
 *    `.bak.<ts>` files left by previous encrypt / rekey runs.
 *  - `graphorin storage backup <dest>` - online, consistent copy via
 *    the driver's page-level backup API (store-02). Safe under a live
 *    writer, preserves rowids (FTS5 mappings survive). Never use
 *    `VACUUM INTO` - rowid renumbering corrupts FTS mappings.
 *
 * `encrypt`, `rekey`, and `cleanup-backups` need the cipher peer
 * (`better-sqlite3-multiple-ciphers`) which ships in the optional
 * Phase 16 sub-pack. When the peer is missing the CLI exits `2`
 * (`UNSUPPORTED`) with an actionable hint instead of silently
 * doing nothing.
 *
 * @packageDocumentation
 */

import { chmod, readdir, stat, unlink } from 'node:fs/promises';
import { dirname, isAbsolute, join, basename as pathBasename, resolve } from 'node:path';
import process from 'node:process';

import { resolveSecret, type SecretValue } from '@graphorin/security';
import { parseServerConfig } from '@graphorin/server';

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
export interface StorageCommonOptions extends CommonOutputOptions {
  readonly config?: string;
}

/** @stable */
export interface StorageStatusResult {
  readonly path: string;
  readonly mode: 'lib' | 'server';
  readonly encryption: { readonly enabled: boolean; readonly cipher?: string };
  readonly cipherPeer: { readonly installed: boolean; readonly hint?: string };
  readonly mainDb: { readonly exists: boolean; readonly sizeBytes?: number };
  readonly walFile: { readonly exists: boolean; readonly sizeBytes?: number };
  readonly auditDb: {
    readonly enabled: boolean;
    readonly path?: string;
    readonly exists?: boolean;
  };
}

/** @stable */
export async function runStorageStatus(
  options: StorageCommonOptions = {},
): Promise<StorageStatusResult> {
  const loaded = await loadConfig(options.config);
  const config = parseServerConfig(loaded.config);
  const cipherPeer = await probeCipherPeer();
  const mainDb = await statSafely(resolveStoragePath(config.storage.path));
  const walFile = await statSafely(`${resolveStoragePath(config.storage.path)}-wal`);
  let auditPath: string | undefined;
  let auditExists: boolean | undefined;
  if (config.audit.enabled) {
    auditPath = resolveStoragePath(config.audit.path ?? deriveAuditPath(config.storage.path));
    auditExists = (await statSafely(auditPath)).exists;
  }
  const out: StorageStatusResult = Object.freeze({
    path: resolveStoragePath(config.storage.path),
    mode: config.storage.mode,
    encryption: Object.freeze({
      enabled: config.storage.encryption.enabled,
      ...(config.storage.encryption.cipher !== undefined
        ? { cipher: config.storage.encryption.cipher }
        : {}),
    }),
    cipherPeer: Object.freeze({
      installed: cipherPeer.installed,
      ...(cipherPeer.hint !== undefined ? { hint: cipherPeer.hint } : {}),
    }),
    mainDb: Object.freeze({
      exists: mainDb.exists,
      ...(mainDb.size !== undefined ? { sizeBytes: mainDb.size } : {}),
    }),
    walFile: Object.freeze({
      exists: walFile.exists,
      ...(walFile.size !== undefined ? { sizeBytes: walFile.size } : {}),
    }),
    auditDb: Object.freeze({
      enabled: config.audit.enabled,
      ...(auditPath !== undefined ? { path: auditPath } : {}),
      ...(auditExists !== undefined ? { exists: auditExists } : {}),
    }),
  });
  emitReport(options, out, () => {
    const print = options.print ?? defaultPrintSink;
    print(brand(`storage status (${loaded.path})`));
    print(
      `  ${marker(out.mainDb.exists)} main:    ${out.path} (${formatSize(out.mainDb.sizeBytes)})`,
    );
    print(
      `  ${marker(out.walFile.exists)} wal:     ${out.path}-wal (${formatSize(out.walFile.sizeBytes)})`,
    );
    print(
      `  ${marker(out.encryption.enabled)} encryption: ${out.encryption.enabled ? `enabled (cipher=${out.encryption.cipher ?? 'sqlcipher'})` : 'disabled'}`,
    );
    print(
      `  ${marker(out.cipherPeer.installed)} cipher peer (better-sqlite3-multiple-ciphers): ${out.cipherPeer.installed ? 'installed' : 'missing'}`,
    );
    if (out.cipherPeer.hint !== undefined) print(`        -> ${out.cipherPeer.hint}`);
    if (out.auditDb.enabled) {
      print(`  ${marker(out.auditDb.exists === true)} audit.db: ${out.auditDb.path}`);
    }
  });
  return out;
}

/** @stable */
export interface StorageBackupOptions extends StorageCommonOptions {
  /** Destination file path for the backup copy. */
  readonly dest: string;
  /** Replace an existing destination file. Default: refuse. */
  readonly overwrite?: boolean;
}

/** @stable */
export interface StorageBackupResult {
  readonly source: string;
  readonly dest: string;
  readonly sizeBytes?: number;
}

/**
 * store-02: online backup via the driver's page-level `backup()` API -
 * consistent under a live writer (the daemon can keep running),
 * preserves rowids so FTS5 external-content mappings survive, and for
 * an encrypted store produces an equally-encrypted copy (same key).
 * This is the ONLY supported SQL-level backup: `VACUUM INTO`
 * renumbers rowids and corrupts the FTS mapping on restore.
 *
 * @stable
 */
export async function runStorageBackup(
  options: StorageBackupOptions,
): Promise<StorageBackupResult> {
  const { openStoreContext } = await import('../internal/store-context.js');
  const dest = isAbsolute(options.dest) ? options.dest : resolve(process.cwd(), options.dest);
  const destStat = await statSafely(dest);
  if (destStat.exists && options.overwrite !== true) {
    throw new Error(
      `[graphorin/cli] backup destination already exists: ${dest}. Pass --overwrite to replace it.`,
    );
  }
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  let source: string;
  try {
    source = ctx.store.connection.path;
    if (source === dest) {
      throw new Error('[graphorin/cli] backup destination must differ from the store path.');
    }
    await ctx.store.connection.raw().backup(dest);
    // S-14b: mirror the source file mode - the driver writes the copy
    // with the umask default (0644), silently downgrading a 0600 live
    // store's posture in a file doctor never checks.
    const sourceStat = await stat(source);
    await chmod(dest, sourceStat.mode & 0o777);
  } finally {
    await ctx.close();
  }
  const written = await statSafely(dest);
  const out: StorageBackupResult = Object.freeze({
    source,
    dest,
    ...(written.size !== undefined ? { sizeBytes: written.size } : {}),
  });
  emitReport(options, out, () => {
    const print = options.print ?? defaultPrintSink;
    print(brand('storage backup'));
    print(`  ${statusMarker('ok')} ${out.source} -> ${out.dest} (${formatSize(out.sizeBytes)})`);
  });
  return out;
}

/** @stable */
export interface StorageCompactOptions extends StorageCommonOptions {
  /**
   * Free pages released per `PRAGMA incremental_vacuum(N)` batch. Small
   * batches keep the writer lock short on a huge freelist.
   * @default 1000
   */
  readonly batchPages?: number;
}

/** @stable */
export interface StorageCompactResult {
  readonly path: string;
  /** Raw `PRAGMA auto_vacuum` value: 0 none, 1 full, 2 incremental. */
  readonly autoVacuum: number;
  /** `true` when the database supports incremental compaction. */
  readonly supported: boolean;
  readonly freelistBefore?: number;
  readonly freelistAfter?: number;
  readonly pageSize?: number;
  /** `page_size * (freelistBefore - freelistAfter)`. */
  readonly reclaimedBytes?: number;
}

/**
 * W-064: `graphorin storage compact` - return pruned pages to the OS.
 * `VACUUM` stays forbidden (it renumbers implicit rowids and corrupts
 * the FTS5 external-content mappings), but `PRAGMA incremental_vacuum`
 * relocates free pages via the ptrmap WITHOUT rebuilding tables, so it
 * is rowid-safe. Requires `auto_vacuum=2`, which `openConnection` sets
 * on every database it CREATES from this version on; on an older
 * database the command reports the limitation honestly (exit 0, file
 * untouched) - the only way out is recreating the store (fresh init +
 * `migrate-export` / import, or re-remember), because switching
 * auto_vacuum on retroactively needs the very VACUUM that is banned.
 * The vacuum runs in batches so a huge freelist never holds the writer
 * lock in one long bite; the WAL is checkpoint-TRUNCATEd first so
 * freed pages do not linger in the -wal file.
 *
 * @stable
 */
export async function runStorageCompact(
  options: StorageCompactOptions = {},
): Promise<StorageCompactResult> {
  const { openStoreContext } = await import('../internal/store-context.js');
  const batchPages = options.batchPages ?? 1000;
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
    // Compaction is a page-level operation: never migrate the schema
    // (an older server may own this database), never refuse on a
    // pending migration either.
    skipInit: true,
  });
  let out: StorageCompactResult;
  try {
    const conn = ctx.store.connection;
    const autoVacuum = Number(conn.pragma('auto_vacuum', { simple: true }));
    if (autoVacuum !== 2) {
      out = Object.freeze({
        path: conn.path,
        autoVacuum,
        supported: false,
      });
    } else {
      const pageSize = Number(conn.pragma('page_size', { simple: true }));
      // Flush the WAL first so already-checkpointed free pages are in
      // the main file and the -wal file shrinks too.
      conn.pragma('wal_checkpoint(TRUNCATE)');
      const freelistBefore = Number(conn.pragma('freelist_count', { simple: true }));
      let freelist = freelistBefore;
      while (freelist > 0) {
        conn.pragma(`incremental_vacuum(${batchPages})`);
        const next = Number(conn.pragma('freelist_count', { simple: true }));
        if (next >= freelist) break; // no progress - stop rather than spin
        freelist = next;
      }
      const freelistAfter = freelist;
      // In WAL mode the main file only shrinks at a checkpoint - flush
      // again so the reclaimed bytes leave the disk immediately.
      conn.pragma('wal_checkpoint(TRUNCATE)');
      out = Object.freeze({
        path: conn.path,
        autoVacuum,
        supported: true,
        freelistBefore,
        freelistAfter,
        pageSize,
        reclaimedBytes: Math.max(0, (freelistBefore - freelistAfter) * pageSize),
      });
    }
  } finally {
    await ctx.close();
  }
  emitReport(options, out, () => {
    const print = options.print ?? defaultPrintSink;
    print(brand('storage compact'));
    if (!out.supported) {
      print(
        `  ${statusMarker('warn')} auto_vacuum=${out.autoVacuum} - incremental compaction unavailable.`,
      );
      print('        This database was created before incremental auto-vacuum was enabled;');
      print(
        '        its file keeps the high-water-mark size (freed pages are reused, not returned to the OS).',
      );
      print(
        '        To reclaim disk: initialise a fresh store (new databases get auto_vacuum=2) and move the data',
      );
      print(
        '        across (graphorin migrate-export / import); VACUUM stays forbidden - it corrupts FTS5 rowid mappings.',
      );
      return;
    }
    print(
      `  ${statusMarker('ok')} ${out.path}: freelist ${out.freelistBefore} -> ${out.freelistAfter} pages, reclaimed ${formatSize(out.reclaimedBytes)}`,
    );
  });
  return out;
}

/** @stable */
export interface StorageEncryptOptions extends StorageCommonOptions {
  /** SecretRef URI for the new passphrase. */
  readonly passphraseFrom: string;
  /**
   * Optional explicit target path for the encrypted output. Default:
   * `<storage.path>.encrypted`.
   */
  readonly targetPath?: string;
  /**
   * If `true`, atomically swap the encrypted target into the
   * `storage.path` location after the integrity check, leaving the
   * original under `<storage.path>.bak.<timestamp>`. Default `false`.
   */
  readonly swap?: boolean;
}

/** @stable */
export interface StorageEncryptResult {
  readonly sourcePath: string;
  readonly targetPath: string;
  readonly cipher: string;
  readonly integrityOk: boolean;
  readonly swap?: { readonly originalRenamedTo: string };
}

/**
 * `graphorin storage encrypt --passphrase-from <ref>` - encrypt a
 * previously unencrypted SQLite store. Delegates to the optional Phase
 * 16 sub-pack `@graphorin/store-sqlite-encrypted` once installed; when
 * the sub-pack is missing the CLI exits `2` (`UNSUPPORTED`) with an
 * actionable hint.
 *
 * @stable
 */
export async function runStorageEncrypt(
  options: StorageEncryptOptions,
): Promise<StorageEncryptResult> {
  const subpack = await loadEncryptedSubpack();
  if (subpack === null) {
    return failUnsupported(
      options,
      `'graphorin storage encrypt' requires the optional sub-pack '@graphorin/store-sqlite-encrypted' (Phase 16) and the cipher peer 'better-sqlite3-multiple-ciphers'.`,
      'Install @graphorin/store-sqlite-encrypted (which pulls the cipher peer transitively) before running this command.',
    );
  }
  const loaded = await loadConfig(options.config);
  const config = parseServerConfig(loaded.config);
  const sourcePath = resolveStoragePath(config.storage.path);
  const targetPath = options.targetPath ?? `${sourcePath}.encrypted`;
  const passphrase = await resolvePassphraseRef(options.passphraseFrom);
  try {
    const result = await passphrase.use((raw) =>
      subpack.encryptDatabase({
        sourcePath,
        targetPath,
        passphrase: raw,
        ...(options.swap === true ? { swap: true } : {}),
        overwriteTarget: false,
      }),
    );
    const out: StorageEncryptResult = Object.freeze({
      sourcePath,
      targetPath: result.targetPath,
      cipher: result.cipher,
      integrityOk: result.integrityCheck.ok,
      ...(result.swap !== undefined ? { swap: result.swap } : {}),
    });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      print(brand(`encrypt: ${out.sourcePath} -> ${out.targetPath} (cipher=${out.cipher})`));
      print(`  ${marker(out.integrityOk)} cipher_integrity_check`);
      if (out.swap !== undefined) {
        print(`  ${statusMarker('ok')} swapped; original kept at ${out.swap.originalRenamedTo}`);
      }
    });
    return out;
  } finally {
    passphrase.dispose();
  }
}

/** @stable */
export interface StorageRekeyOptions extends StorageCommonOptions {
  readonly oldPassphraseFrom: string;
  readonly newPassphraseFrom: string;
}

/** @stable */
export interface StorageRekeyResult {
  readonly path: string;
  readonly cipher: string;
  readonly integrityOk: boolean;
}

/** @stable */
export async function runStorageRekey(options: StorageRekeyOptions): Promise<StorageRekeyResult> {
  const subpack = await loadEncryptedSubpack();
  if (subpack === null) {
    return failUnsupported(
      options,
      `'graphorin storage rekey' requires the optional sub-pack '@graphorin/store-sqlite-encrypted' (Phase 16).`,
      'Install @graphorin/store-sqlite-encrypted before running this command.',
    );
  }
  const loaded = await loadConfig(options.config);
  const config = parseServerConfig(loaded.config);
  const path = resolveStoragePath(config.storage.path);
  const oldPassphrase = await resolvePassphraseRef(options.oldPassphraseFrom);
  const newPassphrase = await resolvePassphraseRef(options.newPassphraseFrom);
  try {
    const result = await oldPassphrase.use((oldRaw) =>
      newPassphrase.use((newRaw) =>
        subpack.rekeyDatabase({
          path,
          oldPassphrase: oldRaw,
          newPassphrase: newRaw,
        }),
      ),
    );
    const out: StorageRekeyResult = Object.freeze({
      path: result.path,
      cipher: result.cipher,
      integrityOk: result.integrityCheck.ok,
    });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      print(brand(`rekey: ${out.path} (cipher=${out.cipher})`));
      print(`  ${marker(out.integrityOk)} cipher_integrity_check`);
    });
    return out;
  } finally {
    oldPassphrase.dispose();
    newPassphrase.dispose();
  }
}

/** @stable */
export interface StorageCleanupBackupsOptions extends StorageCommonOptions {
  /**
   * Skip the actual delete; print what would be removed. Default `false`.
   * Tests pass `true` to assert the discovery without touching files.
   */
  readonly dryRun?: boolean;
}

/** @stable */
export interface StorageCleanupBackupsResult {
  readonly directory: string;
  readonly removed: ReadonlyArray<string>;
  readonly dryRun: boolean;
}

/**
 * Drop stale `.bak`, `.bak.<ts>`, and `.tmp.<ts>` siblings of the
 * configured storage path. Useful after `encrypt` / `rekey` runs that
 * leave intermediate copies around.
 *
 * @stable
 */
export async function runStorageCleanupBackups(
  options: StorageCleanupBackupsOptions = {},
): Promise<StorageCleanupBackupsResult> {
  const loaded = await loadConfig(options.config);
  const config = parseServerConfig(loaded.config);
  const dbPath = resolveStoragePath(config.storage.path);
  const dir = dirname(dbPath);
  // E6: node:path basename, NOT dbPath.split('/') - on Windows the path is
  // backslash-separated, so the split returned the whole path, no readdir
  // entry ever matched, and cleanup-backups was a silent no-op.
  const basename = pathBasename(dbPath);
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (err) {
    throw new Error(
      `[graphorin/cli] cannot read storage directory '${dir}': ${(err as Error).message}`,
    );
  }
  const candidates = entries.filter((name) => isStaleBackup(basename, name));
  const removed: string[] = [];
  for (const name of candidates) {
    const full = join(dir, name);
    if (options.dryRun !== true) {
      try {
        await unlink(full);
        removed.push(full);
      } catch {
        // best-effort cleanup; surface in summary
      }
    } else {
      removed.push(full);
    }
  }
  const out: StorageCleanupBackupsResult = Object.freeze({
    directory: dir,
    removed: Object.freeze(removed),
    dryRun: options.dryRun === true,
  });
  emitReport(options, out, () => {
    const print = options.print ?? defaultPrintSink;
    if (out.removed.length === 0) {
      print(brand(`no stale backups found in ${dir}.`));
      return;
    }
    print(
      brand(
        `${out.dryRun ? 'would remove' : 'removed'} ${out.removed.length} stale backup file(s) in ${dir}:`,
      ),
    );
    for (const name of out.removed) print(`  - ${name}`);
  });
  return out;
}

function isStaleBackup(baseName: string, candidate: string): boolean {
  if (candidate === baseName) return false;
  if (!candidate.startsWith(baseName)) return false;
  const suffix = candidate.slice(baseName.length);
  if (suffix === '.bak') return true;
  if (/^\.bak\.\d+$/.test(suffix)) return true;
  if (/^\.tmp\.\d+$/.test(suffix)) return true;
  return false;
}

async function probeCipherPeer(): Promise<{
  readonly installed: boolean;
  readonly hint?: string;
}> {
  // S-07/1: a bare import of 'better-sqlite3-multiple-ciphers' probes
  // the CLI's own resolution scope, which lies under pnpm's strict
  // node_modules layout - the peer is declared by the encrypted
  // sub-pack, not by the CLI. Load it through the sub-pack's own
  // loader so `storage status` agrees with what `encrypt` / `rekey`
  // (which resolve via the sub-pack) can actually do.
  try {
    // Computed module name keeps TypeScript's resolution off the
    // build-time graph (same trick as loadEncryptedSubpack).
    const moduleName = '@graphorin/store-sqlite-encrypted';
    const mod = (await import(/* @vite-ignore */ moduleName)) as {
      loadCipherPeer?: () => Promise<unknown>;
    };
    if (typeof mod.loadCipherPeer !== 'function') {
      throw new Error('sub-pack does not expose loadCipherPeer');
    }
    await mod.loadCipherPeer();
    return Object.freeze({ installed: true });
  } catch {
    return Object.freeze({
      installed: false,
      hint: "install '@graphorin/store-sqlite-encrypted' (Phase 16) which transitively installs the cipher peer.",
    });
  }
}

/**
 * Encryption sub-pack surface consumed by the CLI runners. Declared
 * here so the dynamic-import path stays typed without forcing the CLI
 * to take a hard dependency on the optional package.
 *
 * @internal
 */
interface EncryptedSubpack {
  encryptDatabase(args: {
    sourcePath: string;
    targetPath: string;
    passphrase: string;
    swap?: boolean;
    overwriteTarget?: boolean;
  }): Promise<{
    sourcePath: string;
    targetPath: string;
    cipher: string;
    integrityCheck: { ok: boolean; rows: ReadonlyArray<string> };
    swap?: { originalRenamedTo: string };
  }>;
  rekeyDatabase(args: { path: string; oldPassphrase: string; newPassphrase: string }): Promise<{
    path: string;
    cipher: string;
    integrityCheck: { ok: boolean; rows: ReadonlyArray<string> };
  }>;
}

/** @internal */
async function loadEncryptedSubpack(): Promise<EncryptedSubpack | null> {
  try {
    // Computed module name keeps TypeScript's resolution off the
    // build-time graph so the CLI typechecks without the optional
    // package installed.
    const moduleName = '@graphorin/store-sqlite-encrypted';
    const mod = (await import(/* @vite-ignore */ moduleName)) as Partial<EncryptedSubpack>;
    if (typeof mod?.encryptDatabase === 'function' && typeof mod?.rekeyDatabase === 'function') {
      return mod as EncryptedSubpack;
    }
    return null;
  } catch {
    return null;
  }
}

/** @internal */
async function resolvePassphraseRef(ref: string): Promise<SecretValue> {
  try {
    return await resolveSecret(ref);
  } catch (err) {
    throw new Error(
      `[graphorin/cli] failed to resolve storage passphrase '${ref}': ${(err as Error).message}`,
      { cause: err },
    );
  }
}

async function statSafely(
  path: string,
): Promise<{ readonly exists: boolean; readonly size?: number }> {
  try {
    const s = await stat(path);
    return { exists: true, size: s.size };
  } catch {
    return { exists: false };
  }
}

// IP-20: resolve a relative storage path against the CWD - the SAME rule the
// server (`createServer` → `createSqliteStore`) and `openStoreContext` use - so
// `graphorin storage status / encrypt` from any directory reports the same
// database the server and the other CLI commands (`memory`, …) open. Resolving
// against the config-file dir made `storage status` the lone outlier: from a
// foreign CWD it inspected a different `data.db` than everything else.
function resolveStoragePath(target: string): string {
  return isAbsolute(target) ? target : resolve(target);
}

function deriveAuditPath(storagePath: string): string {
  const idx = storagePath.lastIndexOf('/');
  if (idx < 0) return 'audit.db';
  return `${storagePath.slice(0, idx)}/audit.db`;
}

function formatSize(bytes: number | undefined): string {
  if (bytes === undefined) return 'missing';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

function marker(ok: boolean): string {
  return ok ? statusMarker('ok') : statusMarker('warn');
}

function failUnsupported(options: CommonOutputOptions, message: string, hint: string): never {
  const print = options.print ?? defaultPrintSink;
  print(brand(message));
  print(brand(`hint: ${hint}`));
  process.exit(EXIT_CODES.UNSUPPORTED);
  // `process.exit` returns `never` at runtime, but the type system
  // narrows the return so explicit callers do not need a cast.
  /* c8 ignore next */
  throw new Error('unreachable');
}
