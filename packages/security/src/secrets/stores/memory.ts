import type {
  SecretMetadata,
  SecretsSetOptions,
  SecretsStore,
  SecretValue as SecretValueContract,
} from '@graphorin/core/contracts';
import type { SessionScope } from '@graphorin/core/types';

import { enforceSecretAcl } from '../acl.js';
import { auditStoreOperation } from '../audit-helpers.js';
import { MemoryStoreInProductionError, SecretRequiredError } from '../errors.js';
import { SecretValue } from '../secret-value.js';

const STORE_SOURCE = 'memory';

/**
 * In-memory `SecretsStore` for tests. Refuses to start in `production`
 * mode unless explicitly opted in.
 *
 * @stable
 */
export class MemorySecretsStore implements SecretsStore {
  /** Stable identifier — surfaced in `getSecretsStoreStatus()`. */
  readonly kind = 'memory' as const;
  readonly #values = new Map<string, { value: SecretValue; meta: SecretMetadata }>();

  constructor(opts: { forceProduction?: boolean } = {}) {
    if (process.env.NODE_ENV === 'production' && !opts.forceProduction) {
      throw new MemoryStoreInProductionError();
    }
  }

  /** Whether this store has any keys at all. */
  get size(): number {
    return this.#values.size;
  }

  async get(key: string, scope?: SessionScope): Promise<SecretValue | null> {
    return auditStoreOperation(
      'secret:get',
      STORE_SOURCE,
      key,
      () => this.#read(key, scope, false),
      {
        decisionFor: (value) => (value === null ? 'not-found' : 'success'),
      },
    );
  }

  async require(key: string, scope?: SessionScope): Promise<SecretValue> {
    return auditStoreOperation('secret:require', STORE_SOURCE, key, async () => {
      const value = await this.#read(key, scope, true);
      if (value === null) throw new SecretRequiredError(key);
      return value;
    });
  }

  async set(
    key: string,
    value: string | SecretValueContract,
    opts: SecretsSetOptions = {},
  ): Promise<void> {
    return auditStoreOperation('secret:set', STORE_SOURCE, key, async () => {
      const wrapped =
        typeof value === 'string'
          ? SecretValue.fromString(value, { source: { resolver: 'memory', ref: `memory:${key}` } })
          : (value as SecretValue);
      const now = new Date().toISOString();
      const existing = this.#values.get(this.#scopedKey(key, opts.scope));
      const meta: SecretMetadata = Object.freeze({
        key,
        createdAt: existing?.meta.createdAt ?? now,
        updatedAt: now,
        ...(opts.expiresAt !== undefined ? { expiresAt: opts.expiresAt } : {}),
        ...(opts.tags !== undefined ? { tags: Object.freeze([...opts.tags]) } : {}),
        source: STORE_SOURCE,
      });
      this.#values.set(this.#scopedKey(key, opts.scope), { value: wrapped, meta });
    });
  }

  async delete(key: string, scope?: SessionScope): Promise<void> {
    return auditStoreOperation('secret:delete', STORE_SOURCE, key, async () => {
      this.#values.delete(this.#scopedKey(key, scope));
    });
  }

  async list(scope?: SessionScope): Promise<ReadonlyArray<SecretMetadata>> {
    const prefix = this.#scopePrefix(scope);
    const out: SecretMetadata[] = [];
    for (const [storeKey, entry] of this.#values) {
      if (storeKey.startsWith(prefix)) out.push(entry.meta);
    }
    return Object.freeze(out);
  }

  async #read(
    key: string,
    scope: SessionScope | undefined,
    enforceAclCheck: boolean,
  ): Promise<SecretValue | null> {
    if (enforceAclCheck) enforceSecretAcl(key);
    const entry = this.#values.get(this.#scopedKey(key, scope));
    return entry ? entry.value : null;
  }

  #scopedKey(key: string, scope?: SessionScope): string {
    return `${this.#scopePrefix(scope)}${key}`;
  }

  #scopePrefix(scope?: SessionScope): string {
    if (!scope) return 'global::';
    const user = scope.userId ?? '_';
    const agent = scope.agentId ?? '_';
    const session = scope.sessionId ?? '_';
    return `${user}/${agent}/${session}::`;
  }
}
