/**
 * Pre-bind validation. Runs *before* the HTTP listener attaches so a
 * misconfigured server never accepts a single request.
 *
 * Steps (fail-fast on every failure):
 *
 *  1. Resolve every `*Ref` field on the config through the
 *     `@graphorin/security` resolver registry. Missing ref → exit 1.
 *  2. Confirm the server pepper resolved to non-empty bytes.
 *  3. Confirm the encryption peer is loadable when
 *     `storage.encryption.enabled === true` (or `audit.enabled === true`).
 *  4. Run pending storage migrations — failures bubble up as
 *     `MigrationFailedError`.
 *
 * The function is idempotent — calling it more than once for the
 * same {@link createSqliteStore} handle re-validates the secrets but
 * leaves the underlying database untouched.
 *
 * @packageDocumentation
 */

import type { SecretValue } from '@graphorin/security';

import { resolveSecret } from '@graphorin/security/secrets';
import type { GraphorinSqliteStore } from '@graphorin/store-sqlite';

import type { ServerConfigSpec } from '../config.js';
import {
  MigrationFailedError,
  PrebindEncryptionPeerMissingError,
  PrebindEncryptionRequiredError,
  PrebindPepperMissingError,
  PrebindSecretUnresolvableError,
} from '../errors/index.js';

/**
 * Result returned by {@link runPreBind}. Consumers (`createServer`,
 * tests) consume the resolved pepper + encryption decision when
 * wiring the rest of the server.
 *
 * @stable
 */
export interface PreBindResult {
  readonly pepper?: SecretValue;
  readonly auditPath?: string;
  readonly auditPassphrase?: SecretValue;
  readonly storagePassphrase?: SecretValue;
}

/**
 * @stable
 */
export interface RunPreBindOptions {
  readonly config: ServerConfigSpec;
  readonly store: GraphorinSqliteStore;
  /**
   * Optional override for the cipher-peer probe. Tests inject a stub
   * that signals "missing peer" without uninstalling the real one.
   */
  readonly probeCipherPeer?: () => Promise<void>;
}

async function resolveRef(path: ReadonlyArray<string | number>, raw: string): Promise<SecretValue> {
  try {
    return await resolveSecret(raw);
  } catch (err) {
    throw new PrebindSecretUnresolvableError(path, raw, err);
  }
}

/**
 * @stable
 */
export async function runPreBind(options: RunPreBindOptions): Promise<PreBindResult> {
  const { config, store } = options;
  const out: { -readonly [K in keyof PreBindResult]?: PreBindResult[K] } = {};

  if (config.auth.kind === 'token') {
    if (config.auth.pepperRef === undefined || config.auth.pepperRef.length === 0) {
      throw new PrebindPepperMissingError();
    }
    const pepper = await resolveRef(['auth', 'pepperRef'], config.auth.pepperRef);
    const buf = await pepper.useBuffer((b) => Buffer.from(b));
    if (buf.length === 0) {
      throw new PrebindPepperMissingError();
    }
    out.pepper = pepper;
  }

  if (config.storage.encryption.enabled) {
    if (config.storage.encryption.passphraseRef === undefined) {
      throw new PrebindEncryptionRequiredError(
        'storage.encryption.enabled is true but no passphraseRef is configured.',
      );
    }
    out.storagePassphrase = await resolveRef(
      ['storage', 'encryption', 'passphraseRef'],
      config.storage.encryption.passphraseRef,
    );
    if (options.probeCipherPeer !== undefined) {
      try {
        await options.probeCipherPeer();
      } catch (err) {
        throw new PrebindEncryptionPeerMissingError(err);
      }
    }
  }

  if (config.audit.enabled) {
    const passphraseRef = config.audit.passphraseRef ?? config.storage.encryption.passphraseRef;
    if (passphraseRef === undefined) {
      throw new PrebindEncryptionRequiredError(
        'audit.enabled is true but no audit.passphraseRef (or storage.encryption.passphraseRef) is configured. Audit logs are mandatory-encrypted (DEC-124).',
      );
    }
    out.auditPath = config.audit.path ?? deriveAuditPath(config.storage.path);
    out.auditPassphrase = await resolveRef(['audit', 'passphraseRef'], passphraseRef);
  }

  try {
    await store.init();
  } catch (err) {
    throw new MigrationFailedError(`Storage migrations failed: ${describeError(err)}`, err);
  }

  return Object.freeze(out as PreBindResult);
}

function deriveAuditPath(storagePath: string): string {
  const idx = storagePath.lastIndexOf('/');
  if (idx < 0) return 'audit.db';
  return `${storagePath.slice(0, idx)}/audit.db`;
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
