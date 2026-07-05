/**
 * `graphorin migrate` - apply pending storage migrations.
 *
 * Idempotent: re-running the command after every migration has been
 * applied is a no-op + a successful exit. Failures bubble up with the
 * underlying SQLite error so operators can fix corrupted state.
 *
 * @packageDocumentation
 */

import process from 'node:process';

import { parseServerConfig } from '@graphorin/server';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { loadConfig } from '../internal/load-config.js';
import { applyHardeningEarly } from './start.js';

/**
 * @stable
 */
export interface MigrateCommandOptions {
  readonly config?: string;
  readonly target?: string;
  readonly print?: (line: string) => void;
}

/**
 * @stable
 */
export interface MigrateCommandResult {
  readonly applied: ReadonlyArray<string>;
}

/**
 * @stable
 */
export async function runMigrate(
  options: MigrateCommandOptions = {},
): Promise<MigrateCommandResult> {
  applyHardeningEarly();
  const print = options.print ?? ((line: string) => process.stderr.write(`${line}\n`));
  let loaded: Awaited<ReturnType<typeof loadConfig>>;
  try {
    loaded = await loadConfig(options.config);
  } catch (err) {
    print(`[graphorin/cli] ${(err as Error).message}`);
    process.exit(1);
  }
  print(`[graphorin/cli] resolved config: ${loaded.path}`);

  let parsed: ReturnType<typeof parseServerConfig>;
  try {
    parsed = parseServerConfig(loaded.config);
  } catch (err) {
    print(`[graphorin/cli] ${(err as Error).message}`);
    process.exit(1);
  }

  if (options.target !== undefined) {
    print(
      `[graphorin/cli] --target is reserved for the Phase 15 migration runner; the v0.1 store applies every pending migration in order.`,
    );
  }

  const store = await createSqliteStore({
    path: parsed.storage.path,
    mode: parsed.storage.mode,
  });
  try {
    await store.init();
    const ids = store.appliedMigrations.map((m) => `${m.version} (${m.name})`);
    print(`[graphorin/cli] applied ${ids.length} migration(s):`);
    for (const id of ids) {
      print(`  - ${id}`);
    }
    return Object.freeze({ applied: Object.freeze(ids) });
  } catch (err) {
    print(`[graphorin/cli] migration failed: ${(err as Error).message}`);
    process.exit(1);
  } finally {
    await store.close();
  }
}
