/**
 * The armed deadline must keep the event loop alive (matching
 * `callJsonHttp`'s timer): in a process where NOTHING else refs the
 * loop, the timeout still fires and the call fails honestly instead
 * of the process draining and exiting mid-call. Caught by the 0.15.0
 * published-surface smoke: the original implementation unref'd the
 * timer and a bare consumer script exited with an unsettled top-level
 * await before the deadline could fire.
 *
 * Runs a bare child `node` process against the BUILT dist (the only
 * way to observe loop-drain semantics - the vitest host always holds
 * the loop itself); skips when the dist is absent.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const DIST_URL = new URL('../dist/index.js', import.meta.url);
const DIST_ENTRY = fileURLToPath(DIST_URL);

describe('createRequestTimeout loop semantics', () => {
  it.skipIf(!existsSync(DIST_ENTRY))(
    'an armed deadline keeps a bare process alive until it fires',
    () => {
      const script = [
        // The file:// URL form works on every platform; a bare
        // Windows drive path (D:\...) is rejected by the ESM loader.
        `import { createRequestTimeout } from ${JSON.stringify(DIST_URL.href)};`,
        'const t = createRequestTimeout({ timeoutMs: 100 });',
        "t.signal.addEventListener('abort', () => {",
        "  if (t.fired) console.log('deadline-fired');",
        '  t.clear();',
        '});',
        // Nothing else refs the loop - with an unref'd timer the
        // process exits right here, silently, before the deadline.
      ].join('\n');
      const out = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
        encoding: 'utf8',
        timeout: 10_000,
      });
      expect(out).toContain('deadline-fired');
    },
  );
});
