#!/usr/bin/env node
/**
 * Graphorin v0.3.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * CI guard: ensures example READMEs keep required operator guidance strings.
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readmePath = join(root, 'examples/three-agent-harness/README.md');
const needle = '.graphorin/progress/';
const text = await readFile(readmePath, 'utf8');
if (!text.includes(needle)) {
  console.error(
    `[check-example-docs] missing required substring ${JSON.stringify(needle)} in ${readmePath}`,
  );
  process.exitCode = 1;
} else {
  console.log('[check-example-docs] ok');
}
