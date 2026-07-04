/**
 * Naming-enforcement guard. The workflow engine deliberately uses
 * Graphorin's own primitive names (`Directive`, `Dispatch`, `pause`,
 * `LatestValue`, `AnyValue`, `Reducer`, `ListAggregate`, `Stream`,
 * `Barrier`, `Ephemeral`). Identifiers from third-party workflow
 * libraries must NOT appear in this package's source — `git grep`
 * users (and downstream consumers) can rely on hits for these names
 * pointing exclusively at Graphorin code.
 *
 * Comments and tests are scanned too so a contributor cannot smuggle
 * the foreign name in via a misleading code comment.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, '..');

/**
 * Identifiers / words that must not appear inside the package's
 * source. Each entry pairs a label with a regex; the regex matches on
 * word boundaries so substrings inside unrelated identifiers are not
 * flagged.
 */
const FORBIDDEN: ReadonlyArray<readonly [string, RegExp]> = [
  ['superstep', /\bsuperstep\b/i],
  ['pregel', /\bpregel\b/i],
  ['langgraph', /\blanggraph\b/i],
  ['mastra', /\bmastra\b/i],
  ['temporal-io', /\btemporal[-\s]?(?:io|workflow)\b/i],
  ['restate', /\brestate\b/i],
  ['inngest', /\binngest\b/i],
  ['durable-objects', /\bdurable[-\s]?objects?\b/i],
  ['langchain', /\blangchain\b/i],
];

async function* walk(root: string): AsyncIterable<string> {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.turbo') {
        continue;
      }
      yield* walk(full);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!/\.(?:ts|md|mts|json)$/.test(entry.name)) continue;
    if (entry.name === 'naming-enforcement.test.ts') continue;
    const stats = await stat(full);
    if (stats.size > 1_000_000) continue;
    yield full;
  }
}

describe('naming enforcement', () => {
  // The walk reads every source/docs file in the package; cold Windows CI
  // runners routinely blow the default 5 s per-test budget on this I/O,
  // hence the explicit 30 s timeout on the scan.
  it('source files do not reference third-party workflow library identifiers', async () => {
    const offences: Array<{ path: string; match: string }> = [];
    for await (const file of walk(PACKAGE_ROOT)) {
      const text = await readFile(file, 'utf8');
      for (const [label, regex] of FORBIDDEN) {
        if (regex.test(text)) {
          offences.push({ path: file, match: label });
        }
      }
    }
    expect(offences).toEqual([]);
  }, 30_000);

  it('the public API exposes the Graphorin-named primitives', async () => {
    const mod = await import('../src/index.js');
    const expected = [
      'Directive',
      'Dispatch',
      'pause',
      'latestValue',
      'anyValue',
      'reducer',
      'listAggregate',
      'stream',
      'barrier',
      'ephemeral',
      'createWorkflow',
      'createNode',
      'InMemoryCheckpointStore',
    ];
    for (const name of expected) {
      expect(mod).toHaveProperty(name);
    }
  });
});
