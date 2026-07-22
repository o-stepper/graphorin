import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const SRC_DIR = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src');

function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectSourceFiles(full));
    } else if (entry.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

// Fourteenth deep retest: GHSA-frvp-7c67-39w9 (path traversal) lives in
// @hono/node-server's serve-static entry point. The server never serves
// static files - this tripwire keeps an accidental future import from
// silently widening the attack surface documented as unused.
describe('supply-chain tripwire: @hono/node-server/serve-static', () => {
  it('no source file imports the serve-static entry point', () => {
    for (const file of collectSourceFiles(SRC_DIR)) {
      const text = readFileSync(file, 'utf8');
      expect(text, `${file} must not reference @hono/node-server/serve-static`).not.toContain(
        '@hono/node-server/serve-static',
      );
      expect(text, `${file} must not import serveStatic`).not.toMatch(/\bserveStatic\b/);
    }
  });
});
