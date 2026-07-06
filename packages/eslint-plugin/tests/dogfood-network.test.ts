/**
 * W-039 dogfood: run `@graphorin/no-implicit-network-call` over the
 * monorepo's own source. The repository lints with Biome, so without
 * this test the shipped rule never sees the code it exists to guard.
 *
 * Exemptions are NOT sprinkled as opt-out comments over the transport
 * files - that would fork the repo's single source of truth. Instead
 * the test imports `isAllowListed` from scripts/check-no-network.mjs
 * and skips exactly the paths the CI gate skips.
 *
 * Scope: the packages with known network-adjacent surfaces (security,
 * observability, pricing, cli, server) rather than all 27 - the full
 * sweep triples the runtime without adding signal, since the remaining
 * packages already pass the same matchers via check-no-network in CI.
 */

import type { Dirent } from 'node:fs';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import plugin from '../src/index.js';

const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const DOGFOOD_PACKAGES = ['security', 'observability', 'pricing', 'cli', 'server'];

function listTsFiles(dir: string): string[] {
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listTsFiles(full));
    else if (entry.name.endsWith('.ts') || entry.name.endsWith('.mts')) files.push(full);
  }
  return files;
}

describe('W-039 dogfood - no-implicit-network-call over the framework source', () => {
  it('reports nothing outside the check-no-network ALLOW_LIST', async () => {
    const gate = (await import(
      new URL('../../../scripts/check-no-network.mjs', import.meta.url).href
    )) as { isAllowListed: (relativePath: string) => boolean };
    const parser = await import('@typescript-eslint/parser');
    const linter = new Linter({ cwd: REPO_ROOT });
    const config = [
      {
        files: ['**/*.ts', '**/*.mts'],
        languageOptions: {
          parser: parser as never,
          ecmaVersion: 2023 as const,
          sourceType: 'module' as const,
        },
        plugins: { '@graphorin': plugin as never },
        rules: { '@graphorin/no-implicit-network-call': 'error' as const },
      },
    ];

    const offenders: string[] = [];
    let linted = 0;
    for (const pkg of DOGFOOD_PACKAGES) {
      for (const file of listTsFiles(join(REPO_ROOT, 'packages', pkg, 'src'))) {
        const rel = relative(REPO_ROOT, file).replace(/\\/g, '/');
        if (gate.isAllowListed(rel)) continue;
        const messages = linter.verify(readFileSync(file, 'utf8'), config, file);
        linted += 1;
        for (const m of messages) {
          offenders.push(`${rel}: ${m.message}`);
        }
      }
    }

    expect(linted).toBeGreaterThan(100);
    expect(offenders).toEqual([]);
  }, 120_000);
});
