import { existsSync } from 'node:fs';

import type {
  SecretMetadata,
  SecretsSetOptions,
  SecretsStore,
  SecretValue as SecretValueContract,
} from '@graphorin/core/contracts';
import type { SessionScope } from '@graphorin/core/types';

import { enforceSecretAcl } from './acl.js';
import { emitSecretsAudit } from './audit-emitter.js';
import { auditStoreOperation } from './audit-helpers.js';
import {
  MissingPeerDependencyError,
  SecretRequiredError,
  StrictSecretsUnavailableError,
} from './errors.js';
import { setRefStoreLookup } from './resolvers/index.js';
import type { SecretValue } from './secret-value.js';
import {
  EncryptedFileSecretsStore,
  EnvSecretsStore,
  KeyringSecretsStore,
  MemorySecretsStore,
} from './stores/index.js';

/**
 * Identifier of a `SecretsStore` kind. Used by `createSecretsStore(...)`,
 * the headless detector, and the status reporter.
 *
 * @stable
 */
export type SecretsStoreKind = 'auto' | 'keyring' | 'encrypted-file' | 'env' | 'memory';

/**
 * Options for `createSecretsStore(...)`.
 *
 * @stable
 */
export interface CreateSecretsStoreOptions {
  /** Which store to activate. Defaults to `'auto'` (capability-matrix probe). */
  readonly kind?: SecretsStoreKind;
  /**
   * Refuse to fall back when the requested primary store is unavailable.
   * Mirrors the `--strict-secrets` CLI flag from the runtime spec.
   */
  readonly strict?: boolean;
  /**
   * Explicit fallback order for the `'auto'` chain. Defaults to
   * `['keyring', 'encrypted-file', 'env']`.
   */
  readonly fallbackChain?: ReadonlyArray<Exclude<SecretsStoreKind, 'auto'>>;
  /**
   * Optional pre-built keyring options forwarded to
   * `new KeyringSecretsStore(...)`.
   */
  readonly keyring?: ConstructorParameters<typeof KeyringSecretsStore>[0];
  /**
   * Optional pre-built env-store options.
   */
  readonly env?: ConstructorParameters<typeof EnvSecretsStore>[0];
  /**
   * Optional pre-built encrypted-file options. Required when activating
   * an encrypted-file store explicitly.
   */
  readonly encryptedFile?: ConstructorParameters<typeof EncryptedFileSecretsStore>[0];
  /**
   * Optional `MemorySecretsStore` opt-out for production-mode tests.
   */
  readonly memory?: ConstructorParameters<typeof MemorySecretsStore>[0];
  /**
   * Optional logger override. Defaults to the standard error stream;
   * the framework logger arrives in a follow-on phase.
   */
  readonly warn?: (message: string) => void;
}

interface DowngradeRecord {
  readonly fromKind: Exclude<SecretsStoreKind, 'auto'>;
  readonly toKind: Exclude<SecretsStoreKind, 'auto'>;
  readonly reasons: ReadonlyArray<string>;
}

/**
 * Snapshot of the active store chain — surfaces in the
 * `/v1/health/secrets` admin endpoint (consumed by the standalone
 * server) and the `graphorin doctor --check-secrets` CLI command.
 *
 * @stable
 */
export interface SecretsStoreStatus {
  readonly active: Exclude<SecretsStoreKind, 'auto'>;
  readonly fallbackChain: ReadonlyArray<Exclude<SecretsStoreKind, 'auto'>>;
  readonly downgradedFrom?: Exclude<SecretsStoreKind, 'auto'>;
  readonly downgradeReason?: string;
  readonly strictMode: boolean;
  readonly headless: boolean;
  readonly headlessReasons: ReadonlyArray<string>;
}

let activeStatus: SecretsStoreStatus | undefined;
let activeStore: SecretsStore | undefined;

/**
 * Read the status of the currently-active `SecretsStore`. Returns
 * `undefined` if `createSecretsStore(...)` has not been called yet.
 *
 * @stable
 */
export function getSecretsStoreStatus(): SecretsStoreStatus | undefined {
  return activeStatus;
}

/**
 * Read the currently-active store. Returns `undefined` if
 * `createSecretsStore(...)` has not been called yet.
 *
 * @stable
 */
export function getActiveSecretsStore(): SecretsStore | undefined {
  return activeStore;
}

/**
 * Reset internal state. Tests use this between cases.
 *
 * @experimental
 */
export function _resetSecretsFactoryForTesting(): void {
  activeStatus = undefined;
  activeStore = undefined;
  setRefStoreLookup(undefined);
}

/**
 * Detect whether the host is "headless" — that is, no interactive
 * terminal is attached and the process is likely running unattended.
 * The result drives the `'auto'` chain's keyring vs. encrypted-file
 * decision.
 *
 * @stable
 */
export function detectHeadless(): { headless: boolean; reasons: ReadonlyArray<string> } {
  const reasons: string[] = [];
  if (process.env.GRAPHORIN_HEADLESS === '1') reasons.push('GRAPHORIN_HEADLESS=1');
  if (!process.stdout.isTTY) reasons.push('stdout is not a TTY');
  if (!process.stdin.isTTY) reasons.push('stdin is not a TTY');
  if (process.env.CI) reasons.push(`CI env (CI=${process.env.CI})`);
  if (process.env.KUBERNETES_SERVICE_HOST) reasons.push('Kubernetes context');
  if (process.env.DOCKER_CONTAINER || existsSync('/.dockerenv')) {
    reasons.push('Docker container detected');
  }
  if (
    process.platform === 'linux' &&
    !process.env.DBUS_SESSION_BUS_ADDRESS &&
    !existsSync('/var/run/dbus/system_bus_socket')
  ) {
    reasons.push('Linux without D-Bus session (no Secret Service)');
  }
  return { headless: reasons.length > 0, reasons: Object.freeze(reasons) };
}

/**
 * Compose multiple stores into a try-in-order chain. The first non-null
 * value wins; writes go to the first writable store.
 *
 * @stable
 */
export function composeChain(stores: ReadonlyArray<SecretsStore>): SecretsStore {
  if (stores.length === 0) {
    throw new Error('composeChain: at least one SecretsStore is required.');
  }
  if (stores.length === 1) {
    const only = stores[0];
    if (only === undefined) {
      throw new Error('composeChain: at least one SecretsStore is required.');
    }
    return only;
  }
  const ordered = Object.freeze([...stores]);

  return new ChainSecretsStore(ordered);
}

/**
 * Probe whether a store can be activated on the current host. Returns
 * the structured reasons it cannot, or an empty array on success.
 */
async function probeKind(
  kind: Exclude<SecretsStoreKind, 'auto'>,
  opts: CreateSecretsStoreOptions,
): Promise<{ ok: boolean; reasons: ReadonlyArray<string>; store?: SecretsStore }> {
  switch (kind) {
    case 'memory': {
      const store = new MemorySecretsStore(opts.memory);
      return { ok: true, reasons: [], store };
    }
    case 'env': {
      const store = new EnvSecretsStore(opts.env);
      return { ok: true, reasons: [], store };
    }
    case 'keyring': {
      try {
        await import('@napi-rs/keyring');
      } catch (err) {
        return {
          ok: false,
          reasons: [
            '@napi-rs/keyring peer dependency is not installed (install with: pnpm add @napi-rs/keyring)',
          ],
          ...(err instanceof Error ? {} : {}),
        };
      }
      const headless = detectHeadless();
      if (headless.headless) {
        return {
          ok: false,
          reasons: [
            'Host is headless; KeyringSecretsStore prefers an interactive session.',
            ...headless.reasons,
          ],
        };
      }
      const store = new KeyringSecretsStore(opts.keyring);
      return { ok: true, reasons: [], store };
    }
    case 'encrypted-file': {
      try {
        await import('@node-rs/argon2');
      } catch (err) {
        return {
          ok: false,
          reasons: [
            '@node-rs/argon2 peer dependency is not installed (install with: pnpm add @node-rs/argon2)',
          ],
          ...(err instanceof Error ? {} : {}),
        };
      }
      if (!opts.encryptedFile) {
        return {
          ok: false,
          reasons: [
            "createSecretsStore({ kind: 'encrypted-file', encryptedFile: { path, passphrase } }) is required to activate this store explicitly.",
          ],
        };
      }
      const store = new EncryptedFileSecretsStore(opts.encryptedFile);
      return { ok: true, reasons: [], store };
    }
  }
}

/**
 * Parse the `GRAPHORIN_SECRETS_SOURCE` env value (per the documented
 * `--secrets-source` flag policy). Accepts a single store kind
 * (`'keyring'`, `'encrypted-file'`, `'env'`, `'memory'`, `'auto'`) or
 * a comma-separated chain (e.g. `'keyring,encrypted-file'`). Returns
 * `undefined` when the env is unset.
 *
 * @stable
 */
export function parseSecretsSourceEnv(
  raw: string | undefined,
):
  | { kind: SecretsStoreKind; fallbackChain?: ReadonlyArray<Exclude<SecretsStoreKind, 'auto'>> }
  | undefined {
  if (raw === undefined || raw.trim().length === 0) return undefined;
  const tokens = raw
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
  if (tokens.length === 0) return undefined;
  const valid: ReadonlyArray<SecretsStoreKind> = [
    'auto',
    'keyring',
    'encrypted-file',
    'env',
    'memory',
  ];
  for (const token of tokens) {
    if (!valid.includes(token as SecretsStoreKind)) {
      throw new Error(
        `GRAPHORIN_SECRETS_SOURCE: unknown kind '${token}'. Allowed: ${valid.join(', ')}.`,
      );
    }
  }
  if (tokens.length === 1) {
    return { kind: tokens[0] as SecretsStoreKind };
  }
  if (tokens.includes('auto')) {
    throw new Error(
      "GRAPHORIN_SECRETS_SOURCE: 'auto' cannot be combined with other kinds in a chain.",
    );
  }
  return {
    kind: 'auto',
    fallbackChain: tokens as ReadonlyArray<Exclude<SecretsStoreKind, 'auto'>>,
  };
}

/**
 * Activate a `SecretsStore` for the current process. The result is
 * cached; subsequent calls overwrite the previous active store and
 * re-wire the `ref:` resolver.
 *
 * @stable
 */
export async function createSecretsStore(
  opts: CreateSecretsStoreOptions = {},
): Promise<SecretsStore> {
  // In library mode, GRAPHORIN_SECRETS_SOURCE acts as the env-var
  // counterpart to the documented `--secrets-source` CLI flag. Caller
  // overrides via `opts.kind` / `opts.fallbackChain` always win — the
  // env is the default, never an override.
  const envOverride =
    opts.kind === undefined && opts.fallbackChain === undefined
      ? parseSecretsSourceEnv(process.env.GRAPHORIN_SECRETS_SOURCE)
      : undefined;
  const kind = opts.kind ?? envOverride?.kind ?? 'auto';
  const fallbackChain =
    opts.fallbackChain ??
    envOverride?.fallbackChain ??
    (['keyring', 'encrypted-file', 'env'] as const);
  const strict = opts.strict ?? false;
  const warn = opts.warn ?? defaultWarn;
  const headless = detectHeadless();

  if (kind !== 'auto') {
    const probe = await probeKind(kind, opts);
    if (!probe.ok || !probe.store) {
      throw new StrictSecretsUnavailableError(kind, probe.reasons);
    }
    activate(probe.store, kind, [kind], headless, strict);
    return probe.store;
  }

  // Auto chain — probe each fallback in order.
  const tried: { kind: Exclude<SecretsStoreKind, 'auto'>; reasons: ReadonlyArray<string> }[] = [];
  for (const candidate of fallbackChain) {
    const probe = await probeKind(candidate, opts);
    if (probe.ok && probe.store) {
      const downgrade =
        tried.length > 0 && tried[0]
          ? { fromKind: tried[0].kind, toKind: candidate, reasons: tried[0].reasons }
          : undefined;
      if (downgrade && tried[0]) {
        warn(`[graphorin/security] ${tried[0].kind} unavailable; falling back to ${candidate}.`);
        for (const reason of tried[0].reasons) warn(`  reason: ${reason}`);
        warn("  Run 'graphorin doctor --check-secrets' to verify.");
      }
      activate(probe.store, candidate, fallbackChain, headless, strict, downgrade);
      return probe.store;
    }
    tried.push({ kind: candidate, reasons: probe.reasons });
    if (strict) break;
  }

  if (strict) {
    const first = tried[0];
    throw new StrictSecretsUnavailableError(
      first?.kind ?? 'auto',
      first?.reasons ?? ['No fallback chain entries probed.'],
    );
  }

  throw new MissingPeerDependencyError(
    '@graphorin/security:auto',
    'createSecretsStore({ kind: "auto" })',
    {
      cause: tried,
    },
  );
}

function activate(
  store: SecretsStore,
  kind: Exclude<SecretsStoreKind, 'auto'>,
  chain: ReadonlyArray<Exclude<SecretsStoreKind, 'auto'>>,
  headless: { headless: boolean; reasons: ReadonlyArray<string> },
  strict: boolean,
  downgrade?: DowngradeRecord,
): void {
  activeStore = store;
  activeStatus = Object.freeze({
    active: kind,
    fallbackChain: Object.freeze([...chain]),
    ...(downgrade
      ? {
          downgradedFrom: downgrade.fromKind,
          downgradeReason: downgrade.reasons.join('; '),
        }
      : {}),
    strictMode: strict,
    headless: headless.headless,
    headlessReasons: headless.reasons,
  });
  if (downgrade) {
    // Emit a typed audit event for every downgrade. The audit-log
    // subsystem (sibling sub-package) writes this into the dedicated
    // audit database; consumers in tests can subscribe via
    // onSecretsAudit(...) to assert downgrade behaviour.
    emitSecretsAudit({
      action: 'secrets:downgrade',
      decision: 'success',
      ts: Date.now(),
      source: 'createSecretsStore',
      target: kind,
      metadata: {
        downgradedFrom: downgrade.fromKind,
        reasons: downgrade.reasons,
        headless: headless.headless,
        headlessReasons: headless.reasons,
        strictMode: strict,
      },
    });
  }
  // Wire the `ref:` resolver against the active store so config files
  // can use `ref:KEY` regardless of which physical store wins.
  setRefStoreLookup(async (key) => {
    return store.get(key);
  });
}

function defaultWarn(message: string): void {
  console.warn(message);
}

/**
 * Internal `SecretsStore` that tries each backing store in order. Used
 * by `composeChain(...)` and exposed for testing.
 */
class ChainSecretsStore implements SecretsStore {
  readonly kind = 'chain' as const;
  readonly #stores: ReadonlyArray<SecretsStore>;
  constructor(stores: ReadonlyArray<SecretsStore>) {
    this.#stores = stores;
  }

  async get(key: string, scope?: SessionScope): Promise<SecretValue | null> {
    return auditStoreOperation(
      'secret:get',
      'chain',
      key,
      async () => {
        for (const store of this.#stores) {
          const value = (await store.get(key, scope)) as SecretValue | null;
          if (value !== null) return value;
        }
        return null;
      },
      { decisionFor: (v) => (v === null ? 'not-found' : 'success') },
    );
  }

  async require(key: string, scope?: SessionScope): Promise<SecretValue> {
    return auditStoreOperation('secret:require', 'chain', key, async () => {
      enforceSecretAcl(key);
      for (const store of this.#stores) {
        const value = (await store.get(key, scope)) as SecretValue | null;
        if (value !== null) return value;
      }
      throw new SecretRequiredError(key);
    });
  }

  async set(
    key: string,
    value: string | SecretValueContract,
    opts?: SecretsSetOptions,
  ): Promise<void> {
    const target = this.#stores[0];
    if (!target) throw new Error('ChainSecretsStore has no backing stores.');
    return target.set(key, value, opts);
  }

  async delete(key: string, scope?: SessionScope): Promise<void> {
    for (const store of this.#stores) await store.delete(key, scope);
  }

  async list(scope?: SessionScope): Promise<ReadonlyArray<SecretMetadata>> {
    const seen = new Map<string, SecretMetadata>();
    for (const store of this.#stores) {
      for (const meta of await store.list(scope)) {
        if (!seen.has(meta.key)) seen.set(meta.key, meta);
      }
    }
    return Object.freeze([...seen.values()]);
  }
}
