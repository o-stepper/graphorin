/**
 * `graphorin memory` — long-term memory operator commands.
 *
 * Surface (per Phase 15 § Memory):
 *
 *  - `graphorin memory status` — counts + active embedder + migration
 *    state. Pure read-only inspection of the SQLite store.
 *  - `graphorin memory migrate --from <embedder> --to <embedder>
 *    --strategy <lock-on-first|auto-migrate|multi-active>` — embedder
 *    swap. The runner itself lives in `@graphorin/memory`
 *    ({@link migrateEmbedder}); the CLI is a thin wrapper that loads
 *    the operator's `embedders.ts` module if supplied through
 *    `--embedders <path>`. Without that module the command emits a
 *    pointer to the documentation rather than guessing which embedder
 *    factory to instantiate.
 *
 * @packageDocumentation
 */

import process from 'node:process';

import { EXIT_CODES } from '../internal/exit.js';
import {
  brand,
  type CommonOutputOptions,
  defaultPrintSink,
  emitReport,
  statusMarker,
} from '../internal/output.js';
import { openStoreContext } from '../internal/store-context.js';

/** @stable */
export interface MemoryCommonOptions extends CommonOutputOptions {
  readonly config?: string;
}

/** @stable */
export interface MemoryStatusEmbedder {
  readonly id: string;
  readonly model: string;
  readonly dim: number;
  readonly distanceMetric: string;
  readonly retired: boolean;
  readonly createdAt: string;
  readonly retiredAt?: string;
}

/** @stable */
export interface MemoryStatusResult {
  readonly storagePath: string;
  readonly embedders: ReadonlyArray<MemoryStatusEmbedder>;
  readonly counts: {
    readonly facts: number;
    readonly episodes: number;
    readonly sessionMessages: number;
    readonly procedures: number;
  };
}

/** @stable */
export async function runMemoryStatus(
  options: MemoryCommonOptions = {},
): Promise<MemoryStatusResult> {
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const embedders = ctx.store.embeddings.listAll().map(
      (row): MemoryStatusEmbedder =>
        Object.freeze({
          id: row.id,
          model: row.model,
          dim: row.dim,
          distanceMetric: row.distanceMetric,
          retired: row.retiredAt !== null,
          createdAt: new Date(row.createdAt).toISOString(),
          ...(row.retiredAt !== null ? { retiredAt: new Date(row.retiredAt).toISOString() } : {}),
        }),
    );
    const counts = await readMemoryCounts(ctx.store);
    const out: MemoryStatusResult = Object.freeze({
      storagePath: ctx.config.storage.path,
      embedders: Object.freeze(embedders),
      counts: Object.freeze(counts),
    });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      print(brand(`memory status (${out.storagePath})`));
      if (out.embedders.length === 0) {
        print(brand(`  no embedders registered yet — run createMemory({ embedder }) once.`));
      } else {
        print(brand(`  embedders (${out.embedders.length}):`));
        for (const e of out.embedders) {
          const status = e.retired ? statusMarker('warn') : statusMarker('ok');
          print(`    ${status} ${e.id} (model=${e.model}, dim=${e.dim}, retired=${e.retired})`);
        }
      }
      print(
        brand(
          `  counts: facts=${out.counts.facts}, episodes=${out.counts.episodes}, sessionMessages=${out.counts.sessionMessages}, procedures=${out.counts.procedures}`,
        ),
      );
    });
    return out;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface MemoryMigrateOptions extends MemoryCommonOptions {
  readonly from: string;
  readonly to: string;
  readonly strategy: 'lock-on-first' | 'auto-migrate' | 'multi-active';
  /**
   * Optional path to a JS / TS module exporting an
   * `embedders` object: `{ <id>: () => EmbedderProvider }`. The CLI
   * imports this module so it can construct the source / target
   * embedder instances the runner needs. Without the module the
   * command exits `2` with a pointer to the documentation.
   */
  readonly embeddersModule?: string;
}

/**
 * `graphorin memory migrate` — embedder swap. The migration logic lives
 * in `@graphorin/memory`'s `migrateEmbedder(...)`; the CLI prints a
 * pointer when the operator did not supply the embedder factory module
 * (the framework cannot guess the operator's embedder configuration).
 *
 * @stable
 */
export async function runMemoryMigrate(options: MemoryMigrateOptions): Promise<never> {
  const print = options.print ?? defaultPrintSink;
  if (options.embeddersModule === undefined) {
    print(
      brand(
        `'graphorin memory migrate' requires an --embedders module (a JS / TS file exporting { embedders: { '${options.from}': () => EmbedderProvider, '${options.to}': () => EmbedderProvider } }).`,
      ),
    );
    print(
      brand(
        'The CLI cannot guess which embedder factory to instantiate; the framework intentionally avoids implicit network downloads (DEC-154).',
      ),
    );
    print(
      brand(
        `For programmatic migrations call migrateEmbedder({ source, target, embeddings, strategy: '${options.strategy}' }) from @graphorin/memory directly.`,
      ),
    );
    process.exit(EXIT_CODES.UNSUPPORTED);
  }
  // The full --embeddersModule wiring is out of scope for the v0.1
  // surface; the helpful message above plus the programmatic pointer
  // are the contract per the working plan acceptance criteria.
  print(
    brand(
      '--embeddersModule resolution is planned for v0.2; use migrateEmbedder() programmatically.',
    ),
  );
  process.exit(EXIT_CODES.UNSUPPORTED);
}

async function readMemoryCounts(
  store: Awaited<ReturnType<typeof openStoreContext>>['store'],
): Promise<MemoryStatusResult['counts']> {
  const conn = store.connection;
  return Object.freeze({
    facts: countTable(conn, 'facts'),
    episodes: countTable(conn, 'episodes'),
    sessionMessages: countTable(conn, 'session_messages'),
    procedures: countTable(conn, 'rules'),
  });
}

function countTable(
  conn: { readonly get: <T = unknown>(query: string) => T | undefined },
  table: string,
): number {
  try {
    const row = conn.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`);
    return typeof row?.n === 'number' ? row.n : 0;
  } catch {
    return 0;
  }
}
