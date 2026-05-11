/**
 * Migration registry + runner for `@graphorin/store-sqlite`.
 *
 * The default `createSqliteStore({ ... })` factory invokes
 * {@link runMigrations} during {@link MemoryStore.init}; downstream
 * packages register additional migrations via {@link registerMigration}
 * before the first `init()` call.
 *
 * @packageDocumentation
 */

export {
  _resetDynamicMigrationsForTesting,
  listMigrations,
  type Migration,
  registerMigration,
} from './registry.js';
export {
  type AppliedMigration,
  listAppliedMigrations,
  runMigrations,
} from './runner.js';
