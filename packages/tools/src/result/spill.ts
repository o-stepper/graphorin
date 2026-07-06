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

/** Options for {@link createDefaultSpillWriter}. */
export interface DefaultSpillWriterOptions {
  /** Artifact root. Default `<os.tmpdir()>/graphorin-spill`. */
  readonly root?: string;
  /**
   * TTL for the best-effort startup sweep of orphaned run directories
   * (TL-10). Default 7 days; pass `false` to disable the startup sweep.
   */
  readonly startupSweepTtlMs?: number | false;
}

/** Default TTL for the startup sweep of orphaned spill runs (7 days). */
export const DEFAULT_SPILL_SWEEP_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Suffix of the taint sidecar written next to each spill artifact (tools-03). */
export const SPILL_SIDECAR_SUFFIX = '.meta.json';

/**
 * Path of the taint sidecar for a spill artifact (tools-03). Shared by
 * the default writer and {@link createFileResultReader}.
 *
 * @internal
 */
export function sidecarPathFor(artifactPath: string): string {
  return `${artifactPath}${SPILL_SIDECAR_SUFFIX}`;
}

/**
 * Build the default spill writer - writes the un-truncated body to
 * `<os.tmpdir()>/graphorin-spill/<runId>/<toolCallId>.<ext>` with `0600`
 * permissions and tier-aware sensitivity inheritance.
 *
 * Lifecycle (TL-10): `clear(runId)` removes one run's artifacts (the
 * agent calls it on terminal completed/failed runs); `sweep(ttlMs)`
 * removes run directories older than the TTL, and one best-effort
 * 7-day sweep fires at construction to collect orphans from crashed
 * processes.
 *
 * Operators that need a sandbox-aware path inject their own writer via
 * `createToolExecutor({ spill })` (and a matching reader for `read_result`).
 *
 * @stable
 */
export function createDefaultSpillWriter(options: DefaultSpillWriterOptions = {}): SpillWriter {
  const root = options.root ?? path.join(os.tmpdir(), 'graphorin-spill');

  async function sweep(ttlMs: number): Promise<number> {
    const cutoff = Date.now() - Math.max(0, ttlMs);
    let removed = 0;
    let entries: string[];
    try {
      entries = await fs.readdir(root);
    } catch {
      return 0; // root does not exist yet - nothing to sweep
    }
    for (const entry of entries) {
      const dir = path.join(root, entry);
      try {
        const stat = await fs.stat(dir);
        if (!stat.isDirectory()) continue;
        if (stat.mtimeMs < cutoff) {
          await fs.rm(dir, { recursive: true, force: true });
          removed += 1;
        }
      } catch {
        // raced with another sweep / permission issue - best effort
      }
    }
    return removed;
  }

  if (options.startupSweepTtlMs !== false) {
    void sweep(options.startupSweepTtlMs ?? DEFAULT_SPILL_SWEEP_TTL_MS).catch(() => {});
  }

  return {
    artifactRoot: root,
    async write(opts) {
      const dir = path.join(root, opts.runId);
      await fs.mkdir(dir, { recursive: true });
      const file = path.join(dir, `${opts.toolCallId}.${opts.extension}`);
      await fs.writeFile(file, opts.body, { mode: 0o600 });
      // tools-03: persist the producer's taint next to the artifact so a
      // reader in another executor / a resumed process re-applies it -
      // the executor's in-memory taint map does not survive either
      // boundary, and without the sidecar an untrusted spill read back
      // through the trusted `read_result` built-in laundered to trusted.
      if (opts.producerTrustClass !== undefined || opts.sensitivityTier !== undefined) {
        const meta = {
          ...(opts.producerTrustClass !== undefined
            ? { producerTrustClass: opts.producerTrustClass }
            : {}),
          ...(opts.producerSource !== undefined ? { source: opts.producerSource } : {}),
          ...(opts.sensitivityTier !== undefined ? { sensitivity: opts.sensitivityTier } : {}),
          // W-156: persist the whole-artifact imperative flag so a
          // reader in another executor / a resumed process surfaces it
          // on page reads. Only `true` is stored - a clean artifact's
          // sidecar stays byte-identical to the pre-W-156 shape. The
          // sidecar existence gate above is deliberately unchanged:
          // the executor acts on the flag only for tainted reads, so
          // an artifact without producer taint carries no flag.
          ...(opts.imperativePatternsPresent === true ? { imperativePatternsPresent: true } : {}),
        };
        await fs.writeFile(sidecarPathFor(file), JSON.stringify(meta), { mode: 0o600 });
      }
      return { path: file, bytes: Buffer.byteLength(opts.body, 'utf8') };
    },
    async clear(runId) {
      // The run id comes from the framework, but never let a crafted id
      // escape the artifact root.
      const dir = path.resolve(root, runId);
      if (!dir.startsWith(path.resolve(root) + path.sep)) return;
      await fs.rm(dir, { recursive: true, force: true });
    },
    sweep,
  };
}
