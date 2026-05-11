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
import { _getKeyringEntryCtor, KEYRING_DEFAULT_SERVICE } from '../resolvers/keyring.js';
import { SecretValue } from '../secret-value.js';

const KNOWN_KEYS = new Map<KeyringSecretsStore, Set<string>>();

/**
 * Options for `KeyringSecretsStore`.
 *
 * @stable
 */
export interface KeyringSecretsStoreOptions {
  /**
   * Service prefix for every entry. Defaults to `'graphorin'` so users
   * can find every Graphorin-owned credential in their OS keychain.
   */
  readonly service?: string;
}

/**
 * `SecretsStore` backed by `@napi-rs/keyring`.
 *
 * @stable
 */
export class KeyringSecretsStore implements SecretsStore {
  readonly kind = 'keyring' as const;
  readonly #service: string;

  constructor(opts: KeyringSecretsStoreOptions = {}) {
    this.#service = opts.service ?? KEYRING_DEFAULT_SERVICE;
    KNOWN_KEYS.set(this, new Set());
  }

  async get(key: string, _scope?: SessionScope): Promise<SecretValue | null> {
    void _scope;
    return auditStoreOperation(
      'secret:get',
      `keyring:${this.#service}`,
      key,
      async () => {
        const Entry = await _getKeyringEntryCtor();
        const raw = new Entry(this.#service, key).getPassword();
        if (raw === null || raw === undefined) return null;
        KNOWN_KEYS.get(this)?.add(key);
        return SecretValue.fromString(raw, {
          source: { resolver: 'keyring', ref: `keyring:${key}?service=${this.#service}` },
        });
      },
      { decisionFor: (v) => (v === null ? 'not-found' : 'success') },
    );
  }

  async require(key: string, _scope?: SessionScope): Promise<SecretValue> {
    void _scope;
    return auditStoreOperation('secret:require', `keyring:${this.#service}`, key, async () => {
      enforceSecretAcl(key);
      const Entry = await _getKeyringEntryCtor();
      const raw = new Entry(this.#service, key).getPassword();
      if (raw === null || raw === undefined) throw new SecretRequiredError(key);
      KNOWN_KEYS.get(this)?.add(key);
      return SecretValue.fromString(raw, {
        source: { resolver: 'keyring', ref: `keyring:${key}?service=${this.#service}` },
      });
    });
  }

  async set(
    key: string,
    value: string | SecretValueContract,
    _opts?: SecretsSetOptions,
  ): Promise<void> {
    void _opts;
    return auditStoreOperation('secret:set', `keyring:${this.#service}`, key, async () => {
      const raw = typeof value === 'string' ? value : (value as SecretValue).reveal();
      const Entry = await _getKeyringEntryCtor();
      new Entry(this.#service, key).setPassword(raw);
      KNOWN_KEYS.get(this)?.add(key);
    });
  }

  async delete(key: string, _scope?: SessionScope): Promise<void> {
    void _scope;
    return auditStoreOperation('secret:delete', `keyring:${this.#service}`, key, async () => {
      const Entry = await _getKeyringEntryCtor();
      new Entry(this.#service, key).deletePassword();
      KNOWN_KEYS.get(this)?.delete(key);
    });
  }

  async list(_scope?: SessionScope): Promise<ReadonlyArray<SecretMetadata>> {
    void _scope;
    // OS keyrings do not expose enumeration; return only entries we
    // have observed in this process. Operators that need a full audit
    // run `graphorin secrets list` against the underlying keychain
    // tools (Keychain Access on macOS, etc.).
    const out: SecretMetadata[] = [];
    for (const key of KNOWN_KEYS.get(this) ?? []) {
      out.push(
        Object.freeze({
          key,
          createdAt: new Date(0).toISOString(),
          source: `keyring:${this.#service}`,
        }),
      );
    }
    return Object.freeze(out);
  }
}
