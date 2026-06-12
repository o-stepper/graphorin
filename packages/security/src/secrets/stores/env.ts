import type {
  SecretMetadata,
  SecretsSetOptions,
  SecretsStore,
  SecretValue as SecretValueContract,
} from '@graphorin/core/contracts';
import type { SessionScope } from '@graphorin/core/types';

import { enforceSecretAcl, secretAclAllowsRead } from '../acl.js';
import { emitSecretsAudit } from '../audit-emitter.js';
import { auditStoreOperation } from '../audit-helpers.js';
import { SecretRequiredError } from '../errors.js';
import { SecretValue } from '../secret-value.js';

const STORE_SOURCE = 'env';

/**
 * Options for `EnvSecretsStore`.
 *
 * @stable
 */
export interface EnvSecretsStoreOptions {
  /**
   * Optional uppercase prefix applied to keys so multiple Graphorin
   * deployments can share a process. Defaults to no prefix.
   */
  readonly prefix?: string;
  /**
   * Whether `set(...)` is allowed to mutate `process.env`. Defaults to
   * `false` — the env store is intended for read-only chains where
   * secrets are baked into the host environment.
   */
  readonly allowMutation?: boolean;
}

const REGISTERED_KEYS = new Map<EnvSecretsStore, Set<string>>();

/**
 * `SecretsStore` backed by `process.env`. Read-only by default —
 * enabling `allowMutation: true` keeps the API workable for tests but
 * still emits a single `console.warn` per mutation.
 *
 * @stable
 */
export class EnvSecretsStore implements SecretsStore {
  readonly kind = 'env' as const;
  readonly #prefix: string;
  readonly #allowMutation: boolean;

  constructor(opts: EnvSecretsStoreOptions = {}) {
    this.#prefix = opts.prefix ?? '';
    this.#allowMutation = opts.allowMutation ?? false;
    REGISTERED_KEYS.set(this, new Set());
  }

  async get(key: string, _scope?: SessionScope): Promise<SecretValue | null> {
    void _scope;
    return auditStoreOperation(
      'secret:get',
      STORE_SOURCE,
      key,
      async () => {
        if (!secretAclAllowsRead(key)) return null; // SPL-14
        const value = this.#read(key);
        if (value === undefined) return null;
        return SecretValue.fromString(value, {
          source: { resolver: 'env', ref: `env:${this.#envKey(key)}` },
        });
      },
      {
        decisionFor: (v) =>
          v === null ? (secretAclAllowsRead(key) ? 'not-found' : 'denied') : 'success',
      },
    );
  }

  async require(key: string, _scope?: SessionScope): Promise<SecretValue> {
    void _scope;
    return auditStoreOperation('secret:require', STORE_SOURCE, key, async () => {
      enforceSecretAcl(key);
      const value = this.#read(key);
      if (value === undefined) throw new SecretRequiredError(key);
      return SecretValue.fromString(value, {
        source: { resolver: 'env', ref: `env:${this.#envKey(key)}` },
      });
    });
  }

  async set(
    key: string,
    value: string | SecretValueContract,
    _opts?: SecretsSetOptions,
  ): Promise<void> {
    void _opts;
    // SPL-16: a refused write must not audit as a success — the no-op
    // is recorded as 'denied' so the trail reflects reality.
    if (!this.#allowMutation) {
      console.warn(
        `[graphorin/security] EnvSecretsStore.set('${key}') is a no-op (read-only by default; pass { allowMutation: true } to enable test-only writes).`,
      );
      emitSecretsAudit({
        action: 'secret:set',
        decision: 'denied',
        ts: Date.now(),
        source: STORE_SOURCE,
        target: key,
        metadata: { mutationAllowed: false, reason: 'read-only-store' },
      });
      return;
    }
    return auditStoreOperation(
      'secret:set',
      STORE_SOURCE,
      key,
      async () => {
        const raw = typeof value === 'string' ? value : (value as SecretValue).reveal();
        process.env[this.#envKey(key)] = raw;
        REGISTERED_KEYS.get(this)?.add(key);
      },
      {
        metadata: { mutationAllowed: this.#allowMutation },
      },
    );
  }

  async delete(key: string, _scope?: SessionScope): Promise<void> {
    void _scope;
    // SPL-16: same honesty as set() — the refused delete audits 'denied'.
    if (!this.#allowMutation) {
      console.warn(
        `[graphorin/security] EnvSecretsStore.delete('${key}') is a no-op (read-only by default; pass { allowMutation: true } to enable test-only writes).`,
      );
      emitSecretsAudit({
        action: 'secret:delete',
        decision: 'denied',
        ts: Date.now(),
        source: STORE_SOURCE,
        target: key,
        metadata: { mutationAllowed: false, reason: 'read-only-store' },
      });
      return;
    }
    return auditStoreOperation(
      'secret:delete',
      STORE_SOURCE,
      key,
      async () => {
        delete process.env[this.#envKey(key)];
        REGISTERED_KEYS.get(this)?.delete(key);
      },
      {
        metadata: { mutationAllowed: this.#allowMutation },
      },
    );
  }

  async list(_scope?: SessionScope): Promise<ReadonlyArray<SecretMetadata>> {
    void _scope;
    const out: SecretMetadata[] = [];
    for (const key of REGISTERED_KEYS.get(this) ?? []) {
      out.push(
        Object.freeze({
          key,
          createdAt: new Date(0).toISOString(),
          source: STORE_SOURCE,
        }),
      );
    }
    return Object.freeze(out);
  }

  #read(key: string): string | undefined {
    return process.env[this.#envKey(key)];
  }

  #envKey(key: string): string {
    return `${this.#prefix}${key.toUpperCase()}`;
  }
}
