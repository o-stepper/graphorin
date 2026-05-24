/**
 * Default spill-to-file writer for the result truncation pipeline.
 *
 * Pairs with {@link createFileResultReader} (`./reader.ts`): the agent
 * runtime constructs one writer at warm-up, hands it to the executor for
 * the `'spill-to-file'` truncation strategy, and builds a reader over the
 * same `artifactRoot` so the built-in `read_result` tool can fetch a
 * spilled artifact back on demand (P1-4).
 *
 * @packageDocumentation
 */

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { SpillWriter } from './truncate.js';

/**
 * Build the default spill writer — writes the un-truncated body to
 * `<os.tmpdir()>/graphorin-spill/<runId>/<toolCallId>.<ext>` with `0600`
 * permissions and tier-aware sensitivity inheritance.
 *
 * Operators that need a sandbox-aware path inject their own writer via
 * `createToolExecutor({ spill })` (and a matching reader for `read_result`).
 *
 * @stable
 */
export function createDefaultSpillWriter(): SpillWriter {
  const root = path.join(os.tmpdir(), 'graphorin-spill');
  return {
    artifactRoot: root,
    async write(opts) {
      const dir = path.join(root, opts.runId);
      await fs.mkdir(dir, { recursive: true });
      const file = path.join(dir, `${opts.toolCallId}.${opts.extension}`);
      await fs.writeFile(file, opts.body, { mode: 0o600 });
      return { path: file, bytes: Buffer.byteLength(opts.body, 'utf8') };
    },
  };
}
