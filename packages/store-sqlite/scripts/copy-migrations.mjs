#!/usr/bin/env node
/**
 * copy-migrations.mjs
 *
 * Copies the bundled `*.sql` migration files from `src/migrations/`
 * to `dist/migrations/` after the TypeScript bundler runs.
 *
 * The migration registry reads its files at runtime via
 * `readFileSync(import.meta.url + '*.sql')`, so the build step has to
 * preserve the on-disk layout. We deliberately do NOT inline the SQL
 * into the bundled JS — keeping migrations as standalone files makes
 * `git diff` (and the operator-friendly `graphorin migrate --dump`
 * coming in Phase 15) far more readable.
 */

import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '..', 'src', 'migrations');
const DST = join(__dirname, '..', 'dist', 'migrations');

mkdirSync(DST, { recursive: true });

const entries = readdirSync(SRC, { withFileTypes: true });
let copied = 0;
for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith('.sql')) continue;
  copyFileSync(join(SRC, entry.name), join(DST, entry.name));
  copied++;
}

console.log(`copy-migrations: copied ${copied} .sql file(s) to ${DST}`);
