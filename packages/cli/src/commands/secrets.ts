/**
 * `graphorin secrets` - manage the operator's secrets store.
 *
 * Surface (per Phase 15 § Secrets):
 *
 *  - `graphorin secrets list`
 *  - `graphorin secrets get <key>`
 *  - `graphorin secrets set <key> [--value <v>] [--from-stdin] [--scope <ref>]`
 *  - `graphorin secrets delete <key>`
 *  - `graphorin secrets ref <uri>` - test resolution of a `SecretRef` URI.
 *  - `graphorin secrets rotate <key> --new-value <v>`
 *
 * Honours `--secrets-source <kind>` and `--strict-secrets` per
 * DEC-136 - both flags are forwarded to `createSecretsStore(...)` so
 * the CLI activates the same store the running server would.
 *
 * The CLI never logs raw secret bytes. `get` prints the value through
 * `value.use((s) => print(s))` so the bytes are released as soon as
 * the print callback returns; `--json` mode emits only the metadata
 * fields, never the value, unless `--reveal` is explicitly supplied.
 *
 * @packageDocumentation
 */

import { homedir } from 'node:os';
import { join } from 'node:path';
import { stdin } from 'node:process';

import type { SecretMetadata } from '@graphorin/core/contracts';
import {
  createSecretsStore,
  getActiveSecretsStore,
  parseSecretRef,
  resolveSecret,
  type SecretsStoreKind,
  SecretValue,
} from '@graphorin/security';

import { EXIT_CODES } from '../internal/exit.js';
import {
  brand,
  type CommonOutputOptions,
  defaultPrintSink,
  emitReport,
  statusMarker,
} from '../internal/output.js';

/** @stable */
export interface SecretsCommonOptions extends CommonOutputOptions {
  /** Mirrors `--secrets-source` per DEC-136. */
  readonly secretsSource?: SecretsStoreKind;
  /** Mirrors `--strict-secrets` per DEC-136. */
  readonly strictSecrets?: boolean;
}

/** @stable */
export interface SecretsListOptions extends SecretsCommonOptions {}

/** @stable */
export async function runSecretsList(
  options: SecretsListOptions = {},
): Promise<ReadonlyArray<SecretMetadata>> {
  const store = await openStore(options);
  const list = await store.list();
  emitReport(options, list, () => {
    const print = options.print ?? defaultPrintSink;
    if (list.length === 0) {
      print(brand('no secrets recorded.'));
      return;
    }
    print(brand(`${list.length} secret(s):`));
    for (const m of list) {
      print(`  ${statusMarker('ok')} ${m.key} (updated=${m.updatedAt ?? '-'})`);
    }
  });
  return list;
}

/** @stable */
export interface SecretsGetOptions extends SecretsCommonOptions {
  readonly key: string;
  /**
   * When `true`, print the raw value through the human report. The
   * default is to print only structured metadata so the bytes do not
   * surface in shell history.
   */
  readonly reveal?: boolean;
}

/** @stable */
export interface SecretsGetResult {
  readonly key: string;
  readonly found: boolean;
  /** Only present when `reveal: true` AND the secret exists. */
  readonly value?: string;
}

/** @stable */
export async function runSecretsGet(options: SecretsGetOptions): Promise<SecretsGetResult> {
  const store = await openStore(options);
  const value = await store.get(options.key);
  if (value === null) {
    const out: SecretsGetResult = Object.freeze({ key: options.key, found: false });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      print(brand(`secret '${options.key}' not found.`));
    });
    // W-002: exit code independent of --json (see runAuditVerify).
    process.exitCode = EXIT_CODES.RECOVERABLE_FAILURE;
    return out;
  }
  if (options.reveal === true) {
    const raw = await value.use((s) => String(s));
    const out: SecretsGetResult = Object.freeze({ key: options.key, found: true, value: raw });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      print(brand(`secret '${options.key}' resolved (length=${raw.length})`));
      print(`  ${raw}`);
    });
    return out;
  }
  const out: SecretsGetResult = Object.freeze({ key: options.key, found: true });
  emitReport(options, out, () => {
    const print = options.print ?? defaultPrintSink;
    print(brand(`secret '${options.key}' found (use --reveal to print the bytes)`));
  });
  return out;
}

/** @stable */
export interface SecretsSetOptions extends SecretsCommonOptions {
  readonly key: string;
  readonly value?: string;
  /** When `true`, read the value from stdin. */
  readonly fromStdin?: boolean;
}

/** @stable */
export async function runSecretsSet(options: SecretsSetOptions): Promise<{ readonly ok: true }> {
  const store = await openStore(options);
  let raw = options.value;
  if (raw === undefined && options.fromStdin === true) {
    raw = await readStdin();
  }
  if (raw === undefined) {
    throw new Error(
      '[graphorin/cli] secrets set requires either --value <v> or --from-stdin (no plaintext on the command line).',
    );
  }
  await store.set(
    options.key,
    SecretValue.fromString(raw, { source: { resolver: 'graphorin secrets set' } }),
  );
  // SECRETS-S-04: a read-only store (e.g. the env resolver) silently no-ops on
  // set() - it warns but never throws, so a naive `return { ok: true }` reports
  // success (exit 0 / ok:true) for a write that never landed. Read the value
  // back and fail loudly when it did not persist, so `--json` CI consumers see
  // a non-zero exit instead of a false positive.
  const persisted = await store.get(options.key);
  if (persisted === null) {
    throw new Error(
      `[graphorin/cli] secret '${options.key}' was not persisted - the active secrets store is read-only. ` +
        'Activate a writable store first (e.g. GRAPHORIN_MASTER_PASSPHRASE with --secrets-source encrypted-file, or --secrets-source keyring).',
    );
  }
  emitReport(options, { ok: true } as const, () => {
    const print = options.print ?? defaultPrintSink;
    print(brand(`secret '${options.key}' written.`));
  });
  return { ok: true };
}

/** @stable */
export interface SecretsDeleteOptions extends SecretsCommonOptions {
  readonly key: string;
}

/** @stable */
export async function runSecretsDelete(
  options: SecretsDeleteOptions,
): Promise<{ readonly ok: true }> {
  const store = await openStore(options);
  await store.delete(options.key);
  emitReport(options, { ok: true } as const, () => {
    const print = options.print ?? defaultPrintSink;
    print(brand(`secret '${options.key}' deleted.`));
  });
  return { ok: true };
}

/** @stable */
export interface SecretsRefOptions extends SecretsCommonOptions {
  readonly uri: string;
  readonly reveal?: boolean;
}

/** @stable */
export interface SecretsRefResult {
  readonly uri: string;
  readonly scheme: string;
  readonly resolved: boolean;
  readonly length?: number;
  readonly value?: string;
}

/**
 * Test resolution of a `SecretRef` URI. The CLI parses the URI first
 * (sanity check + scheme echo), then resolves through the registered
 * resolver chain.
 *
 * @stable
 */
export async function runSecretsRef(options: SecretsRefOptions): Promise<SecretsRefResult> {
  const parsed = parseSecretRef(options.uri);
  // SECRETS-S-03: honour --secrets-source / --strict-secrets. A `ref:KEY` URI
  // resolves against the active store's ref-lookup, which is only wired once
  // createSecretsStore(...) has run; activating the requested store here makes
  // the flags take effect instead of resolving against whatever store (if any)
  // happened to be active - previously `ref:` URIs failed with "No active
  // SecretsStore" because the CLI never activated one.
  await openStore(options);
  try {
    const value = await resolveSecret(options.uri);
    const length = await value.use((s) => s.length);
    const raw = options.reveal === true ? await value.use((s) => String(s)) : undefined;
    const out: SecretsRefResult = Object.freeze({
      uri: options.uri,
      scheme: parsed.scheme,
      resolved: true,
      length,
      ...(raw !== undefined ? { value: raw } : {}),
    });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      print(
        brand(
          `${statusMarker('ok')} resolved '${parsed.scheme}' ref (length=${length}${raw !== undefined ? `, value='${raw}'` : ''})`,
        ),
      );
    });
    return out;
  } catch (err) {
    const out: SecretsRefResult = Object.freeze({
      uri: options.uri,
      scheme: parsed.scheme,
      resolved: false,
    });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      print(
        brand(`${statusMarker('fail')} ${parsed.scheme} ref failed: ${(err as Error).message}`),
      );
    });
    // W-002: exit code independent of --json (see runAuditVerify).
    process.exitCode = EXIT_CODES.RECOVERABLE_FAILURE;
    return out;
  }
}

/** @stable */
export interface SecretsRotateOptions extends SecretsCommonOptions {
  readonly key: string;
  readonly newValue?: string;
  readonly fromStdin?: boolean;
}

/**
 * `graphorin secrets rotate <key>` - overwrite the existing value
 * with a fresh one. Functionally identical to `set` but the CLI
 * surfaces the operation explicitly so audit logs can distinguish
 * a rotation from an initial write.
 *
 * @stable
 */
export async function runSecretsRotate(
  options: SecretsRotateOptions,
): Promise<{ readonly ok: true }> {
  const store = await openStore(options);
  const existing = await store.get(options.key);
  if (existing === null) {
    throw new Error(
      `[graphorin/cli] cannot rotate '${options.key}' - secret does not exist (use 'graphorin secrets set' to create it).`,
    );
  }
  let raw = options.newValue;
  if (raw === undefined && options.fromStdin === true) raw = await readStdin();
  if (raw === undefined) {
    throw new Error(
      '[graphorin/cli] secrets rotate requires either --new-value <v> or --from-stdin.',
    );
  }
  await store.set(
    options.key,
    SecretValue.fromString(raw, { source: { resolver: 'graphorin secrets rotate' } }),
  );
  emitReport(options, { ok: true } as const, () => {
    const print = options.print ?? defaultPrintSink;
    print(brand(`secret '${options.key}' rotated.`));
  });
  return { ok: true };
}

async function openStore(options: SecretsCommonOptions) {
  // Reuse the per-process active store when the caller did not request
  // a different kind. The singleton matches the running server / lib
  // process so consecutive CLI invocations within the same process
  // address the same backing store (this matters for the in-memory
  // store + for subprocess CLI flows that share a parent's resolver
  // chain via env vars).
  if (options.secretsSource === undefined) {
    const active = getActiveSecretsStore();
    if (active !== undefined) return active;
  }
  // SECRETS-S-02: build the encrypted-file config from the environment so the
  // documented `--secrets-source encrypted-file` (and the auto chain's
  // encrypted-file leg) can actually activate - the factory requires an
  // explicit { path, passphrase } and the CLI never forwarded one. The
  // passphrase resolves from GRAPHORIN_MASTER_PASSPHRASE; the bundle path
  // defaults to ~/.graphorin/secrets.enc (override with GRAPHORIN_SECRETS_FILE).
  const masterPassphrase = process.env.GRAPHORIN_MASTER_PASSPHRASE;
  const encryptedFile =
    masterPassphrase !== undefined && masterPassphrase.length > 0
      ? {
          path: process.env.GRAPHORIN_SECRETS_FILE ?? join(homedir(), '.graphorin', 'secrets.enc'),
          passphrase: SecretValue.fromString(masterPassphrase, {
            source: { resolver: 'env', ref: 'env:GRAPHORIN_MASTER_PASSPHRASE' },
          }),
        }
      : undefined;
  return await createSecretsStore({
    ...(options.secretsSource !== undefined ? { kind: options.secretsSource } : {}),
    ...(options.strictSecrets !== undefined ? { strict: options.strictSecrets } : {}),
    ...(encryptedFile !== undefined ? { encryptedFile } : {}),
  });
}

async function readStdin(): Promise<string> {
  return await new Promise((resolve, reject) => {
    let buf = '';
    stdin.setEncoding('utf8');
    stdin.on('data', (chunk) => {
      buf += chunk;
    });
    stdin.on('end', () => resolve(buf.replace(/\r?\n$/, '')));
    stdin.on('error', reject);
  });
}
