/**
 * W-039 lockstep contract between the two no-network matchers: the
 * shipped ESLint rule (`no-implicit-network-call`) and the CI gate
 * (`scripts/check-no-network.mjs` `detectViolations`). They evolved
 * separately (EB-10 taught the script undici/got; the rule knew axios
 * calls the script did not) - this corpus pins the BINARY verdict
 * (flagged / clean) of both matchers per realistic file snippet, so
 * the next unilateral extension fails here instead of drifting.
 *
 * Deliberate residual asymmetries go into EXCEPTIONS with a comment;
 * the healthy state is an empty table.
 */

import { describe, expect, it } from 'vitest';

import { lintSource } from './_lint.js';

/** Framework-shaped virtual path - activates the rule via fail-open. */
const FRAMEWORK_PATH = '/repo/packages/agent/src/runtime.js';

/**
 * snippet -> expected verdict, shared by both matchers. Each entry is a
 * realistic file (imports + call sites), not a bare expression.
 */
const CORPUS: ReadonlyArray<{ label: string; source: string; flagged: boolean }> = [
  {
    label: 'bare fetch call',
    source: `export async function load(url) {\n  return await fetch(url);\n}\n`,
    flagged: true,
  },
  {
    label: 'axios import + axios.get',
    source: `import axios from 'axios';\nexport const r = await axios.get('/x');\n`,
    flagged: true,
  },
  {
    label: 'bare axios factory call',
    source: `import axios from 'axios';\nexport const r = await axios({ url: '/x' });\n`,
    flagged: true,
  },
  {
    label: 'undici import + undici.request',
    source: `import * as undici from 'undici';\nexport const r = await undici.request('https://x');\n`,
    flagged: true,
  },
  {
    label: 'raw socket via net.createConnection',
    source: `import net from 'node:net';\nexport const sock = net.createConnection({ port: 80 });\n`,
    flagged: true,
  },
  {
    label: 'new WebSocket',
    source: `export const ws = new WebSocket('wss://example.com');\n`,
    flagged: true,
  },
  {
    label: 'static got import (no call)',
    source: `import got from 'got';\nexport { got };\n`,
    flagged: true,
  },
  {
    label: 'ky via require',
    source: `const ky = require('ky');\nmodule.exports = ky;\n`,
    flagged: true,
  },
  {
    label: 'dynamic node-fetch import',
    source: `export async function client() {\n  const mod = await import('node-fetch');\n  return mod.default;\n}\n`,
    flagged: true,
  },
  {
    label: 'node:fs import is clean',
    source: `import { readFile } from 'node:fs/promises';\nexport const read = readFile;\n`,
    flagged: false,
  },
  {
    label: 'fetch inside a string literal is clean',
    source: `export const hint = 'call fetch(url) from your app code';\n`,
    flagged: false,
  },
  {
    label: 'fetch inside a comment is clean',
    source: `// a fetch(url) here would violate DEC-154\nexport const a = 1;\n`,
    flagged: false,
  },
  {
    label: 'identifier suffix refetch is clean',
    source: `export async function reload(refetch) {\n  return await refetch();\n}\n`,
    flagged: false,
  },
];

/**
 * Documented residual asymmetries: labels the two matchers are ALLOWED
 * to disagree on, each with a reason. Keep empty.
 */
const EXCEPTIONS: ReadonlyMap<string, string> = new Map();

describe('W-039 lockstep - eslint rule vs check-no-network script', () => {
  it('both matchers give the same binary verdict per corpus file', async () => {
    const gate = (await import(
      new URL('../../../scripts/check-no-network.mjs', import.meta.url).href
    )) as { detectViolations: (source: string) => string[] };

    const disagreements: string[] = [];
    for (const entry of CORPUS) {
      if (EXCEPTIONS.has(entry.label)) continue;
      const ruleFlagged =
        lintSource({
          source: entry.source,
          rule: 'no-implicit-network-call',
          filename: FRAMEWORK_PATH,
        }).length > 0;
      const scriptFlagged = gate.detectViolations(entry.source).length > 0;
      if (ruleFlagged !== entry.flagged) {
        disagreements.push(
          `[${entry.label}] eslint rule said flagged=${ruleFlagged}, corpus expects ${entry.flagged}`,
        );
      }
      if (scriptFlagged !== entry.flagged) {
        disagreements.push(
          `[${entry.label}] script said flagged=${scriptFlagged}, corpus expects ${entry.flagged}`,
        );
      }
    }
    expect(disagreements).toEqual([]);
  });
});
