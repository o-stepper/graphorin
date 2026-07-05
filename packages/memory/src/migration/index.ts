/**
 * Embedder migration runner - one of the three deliverables that turns
 * `@graphorin/memory` into a long-running, embedder-aware system.
 *
 * @packageDocumentation
 */

export type {
  EmbedderMigrationStrategy,
  MigrateEmbedderOptions,
  MigrationProgress,
} from './embedder-migration.js';
export { migrateEmbedder } from './embedder-migration.js';
