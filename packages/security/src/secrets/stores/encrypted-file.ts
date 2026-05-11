import { createCipheriv, randomBytes } from 'node:crypto';
import { chmod, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';

import type {
  SecretMetadata,
  SecretsSetOptions,
  SecretsStore,
  SecretValue as SecretValueContract,
} from '@graphorin/core/contracts';
import type { SessionScope } from '@graphorin/core/types';

import { enforceSecretAcl } from '../acl.js';
import { auditStoreOperation } from '../audit-helpers.js';
import { SecretRequiredError } from '../errors.js';
import { decryptBundle, deriveAesKey, ENCRYPTED_FILE_MAGIC } from '../resolvers/encrypted-file.js';
import { SecretValue } from '../secret-value.js';

const STORE_SOURCE = 'encrypted-file';

/**
 * Options for `EncryptedFileSecretsStore`.
 *
 * @stable
 */
export interface EncryptedFileSecretsStoreOptions {
  /** Absolute path to the bundle file. Tilde expansion supported. */
  readonly path: string;
  /** Passphrase wrapped in a `SecretValue`. */
  readonly passphrase: SecretValue;
  /**
   * Whether to enforce mode `0o600` on the bundle when writing. The
   * default (`true`) is the recommended configuration; tests on
   * platforms without POSIX mode bits opt out.
   */
  readonly enforcePermissions?: boolean;
}

interface BundlePlaintext {
  values: Record<string, string>;
  meta: { createdAt: string; updatedAt: string };
}

const SALT_BYTES = 16;
const NONCE_BYTES = 12;
const TAG_BYTES = 16;

function expandTilde(p: string): string {
  if (p === '~') return homedir();
  if (p.startsWith('~/')) return resolve(homedir(), p.slice(2));
  return p;
}

/**
 * `SecretsStore` backed by an AES-256-GCM bundle on disk.
 *
 * @stable
 */
export class EncryptedFileSecretsStore implements SecretsStore {
  readonly kind = 'encrypted-file' as const;
  readonly #path: string;
  readonly #passphrase: SecretValue;
  readonly #enforcePermissions: boolean;

  constructor(opts: EncryptedFileSecretsStoreOptions) {
    this.#path = expandTilde(opts.path);
    this.#passphrase = opts.passphrase;
    this.#enforcePermissions = opts.enforcePermissions ?? true;
  }

  async get(key: string, _scope?: SessionScope): Promise<SecretValue | null> {
    void _scope;
    return auditStoreOperation(
      'secret:get',
      STORE_SOURCE,
      key,
      async () => {
        const plain = await this.#readPlaintext();
        const value = plain.values[key];
        if (value === undefined) return null;
        return SecretValue.fromString(value, {
          source: { resolver: 'encrypted-file', ref: `encrypted-file:${this.#path}#${key}` },
        });
      },
      { decisionFor: (v) => (v === null ? 'not-found' : 'success') },
    );
  }

  async require(key: string, _scope?: SessionScope): Promise<SecretValue> {
    void _scope;
    return auditStoreOperation('secret:require', STORE_SOURCE, key, async () => {
      enforceSecretAcl(key);
      const plain = await this.#readPlaintext();
      const value = plain.values[key];
      if (value === undefined) throw new SecretRequiredError(key);
      return SecretValue.fromString(value, {
        source: { resolver: 'encrypted-file', ref: `encrypted-file:${this.#path}#${key}` },
      });
    });
  }

  async set(
    key: string,
    value: string | SecretValueContract,
    opts?: SecretsSetOptions,
  ): Promise<void> {
    void opts;
    return auditStoreOperation('secret:set', STORE_SOURCE, key, async () => {
      const raw = typeof value === 'string' ? value : (value as SecretValue).reveal();
      const plain = await this.#readOrInitPlaintext();
      plain.values[key] = raw;
      plain.meta.updatedAt = new Date().toISOString();
      await this.#writePlaintext(plain);
    });
  }

  async delete(key: string, _scope?: SessionScope): Promise<void> {
    void _scope;
    return auditStoreOperation('secret:delete', STORE_SOURCE, key, async () => {
      const plain = await this.#readOrInitPlaintext();
      if (!(key in plain.values)) return;
      delete plain.values[key];
      plain.meta.updatedAt = new Date().toISOString();
      await this.#writePlaintext(plain);
    });
  }

  async list(_scope?: SessionScope): Promise<ReadonlyArray<SecretMetadata>> {
    void _scope;
    let plain: BundlePlaintext;
    try {
      plain = await this.#readPlaintext();
    } catch {
      return Object.freeze([]);
    }
    return Object.freeze(
      Object.keys(plain.values).map((key) =>
        Object.freeze({
          key,
          createdAt: plain.meta.createdAt,
          updatedAt: plain.meta.updatedAt,
          source: 'encrypted-file',
        }),
      ),
    );
  }

  async #readPlaintext(): Promise<BundlePlaintext> {
    const bundle = await readFile(this.#path);
    if (this.#enforcePermissions && process.platform !== 'win32') {
      try {
        const info = await stat(this.#path);
        const mode = info.mode & 0o777;
        if ((mode & 0o077) !== 0) {
          console.warn(
            `[graphorin/security] EncryptedFileSecretsStore: '${this.#path}' is at mode 0o${mode.toString(8)}; expected 0o600.`,
          );
        }
      } catch {
        // best-effort
      }
    }
    return this.#passphrase.useBuffer(async (passBuf) => {
      const decoded = await decryptBundle(bundle, passBuf);
      const values =
        typeof decoded.values === 'object' && decoded.values !== null
          ? (decoded.values as Record<string, unknown>)
          : {};
      const meta =
        typeof decoded.meta === 'object' && decoded.meta !== null
          ? (decoded.meta as Record<string, unknown>)
          : {};
      const stringValues: Record<string, string> = {};
      for (const [k, v] of Object.entries(values)) {
        if (typeof v === 'string') stringValues[k] = v;
      }
      return {
        values: stringValues,
        meta: {
          createdAt: typeof meta.createdAt === 'string' ? meta.createdAt : new Date().toISOString(),
          updatedAt: typeof meta.updatedAt === 'string' ? meta.updatedAt : new Date().toISOString(),
        },
      };
    });
  }

  async #readOrInitPlaintext(): Promise<BundlePlaintext> {
    try {
      return await this.#readPlaintext();
    } catch {
      const now = new Date().toISOString();
      return { values: {}, meta: { createdAt: now, updatedAt: now } };
    }
  }

  async #writePlaintext(plain: BundlePlaintext): Promise<void> {
    const salt = randomBytes(SALT_BYTES);
    const nonce = randomBytes(NONCE_BYTES);
    const plaintext = Buffer.from(JSON.stringify(plain), 'utf8');
    let key: Buffer | null = null;
    try {
      key = await this.#passphrase.useBuffer((passBuf) => deriveAesKey(passBuf, salt));
      const cipher = createCipheriv('aes-256-gcm', key, nonce);
      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
      const tag = cipher.getAuthTag();
      const magic = Buffer.alloc(4);
      magic.writeUInt32LE(ENCRYPTED_FILE_MAGIC, 0);
      const bundle = Buffer.concat([magic, salt, nonce, ciphertext, tag]);
      await mkdir(dirname(this.#path), { recursive: true });
      await writeFile(this.#path, bundle, { mode: 0o600 });
      if (this.#enforcePermissions && process.platform !== 'win32') {
        await chmod(this.#path, 0o600);
      }
    } finally {
      plaintext.fill(0);
      if (key) key.fill(0);
    }
    void TAG_BYTES; // referenced for the spec; sizes asserted via decryptBundle
  }
}
