/**
 * CI assertion that `@graphorin/workflow` does NOT depend on
 * `@graphorin/agent` (or any subpath import). The two packages compose
 * orthogonally — the workflow runtime knows nothing about agents and
 * the agent runtime knows nothing about workflows. Operators wiring
 * agents-as-nodes do so in user code only.
 *
 * The check covers two surfaces:
 *
 * - The package's `dependencies / devDependencies / peerDependencies`
 *   manifest must NOT list any sibling `@graphorin/agent*` package.
 * - The package's source must NOT import from `@graphorin/agent` (or
 *   any subpath such as `@graphorin/agent/run-state`). Tests are
 *   excluded from this check so the suite can document the boundary.
 */

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, '..');

async function* walkSrc(root: string): AsyncIterable<string> {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.turbo') {
        continue;
      }
      yield* walkSrc(full);
      continue;
    }
    if (entry.isFile() && /\.(?:ts|mts)$/.test(entry.name)) yield full;
  }
}

describe('no-@graphorin/agent dependency boundary', () => {
  it('package.json does not list @graphorin/agent in any dependency bucket', async () => {
    const raw = await readFile(join(PACKAGE_ROOT, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, unknown>;
      devDependencies?: Record<string, unknown>;
      peerDependencies?: Record<string, unknown>;
      optionalDependencies?: Record<string, unknown>;
    };
    for (const bucket of [
      pkg.dependencies,
      pkg.devDependencies,
      pkg.peerDependencies,
      pkg.optionalDependencies,
    ]) {
      if (!bucket) continue;
      for (const name of Object.keys(bucket)) {
        expect(
          name === '@graphorin/agent' || name.startsWith('@graphorin/agent/'),
          `${name} must not appear in package.json dependency buckets`,
        ).toBe(false);
      }
    }
  });

  it('source files never import from @graphorin/agent', async () => {
    const offences: Array<{ path: string; match: string }> = [];
    const importPattern =
      /(?:import\s+[^'"]*?from\s+|require\s*\(\s*)['"]@graphorin\/agent(?:\/[^'"]*)?['"]/g;
    for await (const file of walkSrc(join(PACKAGE_ROOT, 'src'))) {
      const text = await readFile(file, 'utf8');
      const matches = text.match(importPattern);
      if (matches && matches.length > 0) {
        for (const match of matches) offences.push({ path: file, match });
      }
    }
    expect(offences).toEqual([]);
  });
});
