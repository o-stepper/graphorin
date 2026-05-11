/**
 * `graphorin storage` — manage the SQLite store and its encryption-
 * at-rest opt-in.
 *
 * Surface (per Phase 15 § Storage):
 *
 *  - `graphorin storage status` — reports cipher peer + WAL + size +
 *    encryption mode.
 *  - `graphorin storage encrypt --passphrase-from <ref>` — opt-in
 *    encryption migration. Requires the `@graphorin/store-sqlite-
 *    encrypted` sub-pack from Phase 16.
 *  - `graphorin storage rekey --new-passphrase-from <ref>` — re-key
 *    an already-encrypted DB.
 *  - `graphorin storage cleanup-backups` — drop stale `.bak` /
 *    `.bak.<ts>` files left by previous encrypt / rekey runs.
 *
 * `encrypt`, `rekey`, and `cleanup-backups` need the cipher peer
 * (`better-sqlite3-multiple-ciphers`) which ships in the optional
 * Phase 16 sub-pack. When the peer is missing the CLI exits `2`
 * (`UNSUPPORTED`) with an actionable hint instead of silently
 * doing nothing.
 *
 * @packageDocumentation
 */

import { readdir, stat, unlink } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
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
  const mainDb = await statSafely(absoluteFromConfig(loaded.path, config.storage.path));
  const walFile = await statSafely(`${absoluteFromConfig(loaded.path, config.storage.path)}-wal`);
  let auditPath: string | undefined;
  let auditExists: boolean | undefined;
  if (config.audit.enabled) {
    auditPath = absoluteFromConfig(
      loaded.path,
      config.audit.path ?? deriveAuditPath(config.storage.path),
    );
    auditExists = (await statSafely(auditPath)).exists;
  }
  const out: StorageStatusResult = Object.freeze({
    path: absoluteFromConfig(loaded.path, config.storage.path),
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
 * `graphorin storage encrypt --passphrase-from <ref>` — encrypt a
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
  const sourcePath = absoluteFromConfig(loaded.path, config.storage.path);
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
  const path = absoluteFromConfig(loaded.path, config.storage.path);
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
  const dbPath = absoluteFromConfig(loaded.path, config.storage.path);
  const dir = dirname(dbPath);
  const basename = dbPath.split('/').pop() ?? '';
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
    const full = `${dir}/${name}`;
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
  try {
    const moduleName = 'better-sqlite3-multiple-ciphers';
    await import(/* @vite-ignore */ moduleName);
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

function absoluteFromConfig(configPath: string, target: string): string {
  if (isAbsolute(target)) return target;
  return resolve(dirname(configPath), target);
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
