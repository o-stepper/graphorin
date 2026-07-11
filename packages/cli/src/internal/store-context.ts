/**
 * Shared helper that loads `graphorin.config`, parses it through
 * `parseServerConfig(...)`, opens the SQLite store, optionally resolves
 * the server pepper, and returns a disposable handle for any Phase 15
 * subcommand that needs a live storage / auth context.
 *
 * Centralising the resource lifecycle here means every command (token,
 * audit, secrets, memory, triggers, storage, …) acquires + releases
 * the same way; tests only stub the loader once.
 *
 * @internal
 */

import { resolveSecret, type SecretValue } from '@graphorin/security';
import { parseServerConfig, type ServerConfigSpec } from '@graphorin/server';
import {
  type CreateSqliteStoreOptions,
  createSqliteStore,
  type GraphorinSqliteStore,
  pendingMigrations,
} from '@graphorin/store-sqlite';

import { loadConfig } from './load-config.js';

/**
 * @internal
 */
export interface OpenStoreContextOptions {
  /** Path to `graphorin.config.{ts,js,mjs,json}`. */
  readonly config?: string;
  /**
   * When `true`, refuse to continue when `auth.pepperRef` cannot be
   * resolved. Default `false` - callers that do not need the pepper
   * (e.g. `graphorin audit verify`) skip resolution entirely.
   */
  readonly requirePepper?: boolean;
  /**
   * Override the store factory - tests inject a fake store so they
   * can run subcommand integration without touching a real DB.
   */
  readonly storeFactory?: (options: CreateSqliteStoreOptions) => Promise<GraphorinSqliteStore>;
  /**
   * Skip migrations. Defaults to `false` so subcommands always operate
   * against an initialized schema.
   */
  readonly skipInit?: boolean;
  /**
   * W-068: what to do about pending schema migrations.
   *
   * - `'apply'` (default, the historical behaviour): run `store.init()`,
   *   which applies every pending migration.
   * - `'check'`: do NOT migrate. Read-only commands use this so a newer
   *   CLI never silently upgrades the schema of a database a running
   *   (older) server owns; when the schema is behind, the command fails
   *   with an actionable message instead.
   *
   * Ignored when `skipInit` is `true`.
   */
  readonly migrationPolicy?: 'apply' | 'check';
}

/**
 * @internal
 */
export interface StoreContext {
  readonly configPath: string;
  readonly config: ServerConfigSpec;
  readonly store: GraphorinSqliteStore;
  readonly pepper?: SecretValue;
  /** Releases the underlying SQLite connection. */
  close(): Promise<void>;
}

/**
 * Open the storage context for the provided config path. Throws on
 * Zod validation errors and on `requirePepper && !pepperRef`.
 *
 * @internal
 */
export async function openStoreContext(
  options: OpenStoreContextOptions = {},
): Promise<StoreContext> {
  const loaded = await loadConfig(options.config);
  const config = parseServerConfig(loaded.config);
  const factory = options.storeFactory ?? createSqliteStore;
  const storeOpts: CreateSqliteStoreOptions = {
    path: config.storage.path,
    mode: config.storage.mode,
  };
  // IP-1: the CLI honours the same encryption config as the server, so
  // `graphorin` commands can open a database produced by
  // `graphorin storage encrypt`.
  if (config.storage.encryption.enabled) {
    if (config.storage.encryption.passphraseRef === undefined) {
      throw new Error(
        '[graphorin/cli] storage.encryption.enabled is true but no passphraseRef is configured.',
      );
    }
    const { resolveSecret } = await import('@graphorin/security/secrets');
    const passphrase = await resolveSecret(config.storage.encryption.passphraseRef);
    (storeOpts as { encryption?: unknown }).encryption = {
      enabled: true,
      ...(config.storage.encryption.cipher !== undefined
        ? { cipher: config.storage.encryption.cipher }
        : {}),
      passphraseResolver: async () => passphrase.use((v: string) => v),
    };
  }
  const store = await factory(storeOpts);
  if (options.skipInit !== true) {
    if (options.migrationPolicy === 'check') {
      // Read-only commands must not auto-migrate a live server's
      // database (W-068). Compare the applied set against this build's
      // bundle; refuse with a recipe when the schema is behind. The
      // helper reads sqlite_master first, so a foreign database is not
      // marked by creating schema_migrations.
      let pendingCount = 0;
      try {
        pendingCount = pendingMigrations(store.connection).length;
      } catch {
        // A store without a raw connection (test fakes) has nothing to
        // check - treat as up to date.
        pendingCount = 0;
      }
      if (pendingCount > 0) {
        await store.close();
        throw new Error(
          `[graphorin/cli] the database schema is ${pendingCount} migration(s) behind this CLI. ` +
            'This command will not upgrade a live database. ' +
            "Run 'graphorin migrate' (with the server stopped) or use a CLI version matching the server.",
        );
      }
    } else {
      await store.init();
    }
  }

  let pepper: SecretValue | undefined;
  if (options.requirePepper === true) {
    if (config.auth.kind !== 'token' || config.auth.pepperRef === undefined) {
      await store.close();
      throw new Error(
        `[graphorin/cli] this command requires auth.kind: 'token' + auth.pepperRef in '${loaded.path}'.`,
      );
    }
    try {
      pepper = await resolveSecret(config.auth.pepperRef);
    } catch (err) {
      await store.close();
      throw new Error(
        `[graphorin/cli] failed to resolve auth.pepperRef '${config.auth.pepperRef}': ${(err as Error).message}`,
        { cause: err },
      );
    }
  }

  const ctx: StoreContext = Object.freeze({
    configPath: loaded.path,
    config,
    store,
    ...(pepper !== undefined ? { pepper } : {}),
    close: () => store.close(),
  });
  return ctx;
}
