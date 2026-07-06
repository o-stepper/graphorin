import pkg from '../package.json' with { type: 'json' };
/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Memory retrieval QA benchmark: loads JSONL cases (facts + question +
 * expected substring), materialises an isolated in-memory SQLite store per
 * case, writes facts through SemanticMemory, hybrid-searches (FTS when no
 * embedder), and scores whether the expected substring appears in the
 * merged hit texts.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SessionScope } from '@graphorin/core';
import {
  type AgentLike,
  type Case,
  type EvalReport,
  exitOnFailures,
  loadJsonlDataset,
  predicate,
  renderMarkdownReport,
  runEvals,
} from '@graphorin/evals';
import { createMemory, type Memory } from '@graphorin/memory';
import { createSqliteStore } from '@graphorin/store-sqlite';

export const VERSION: string = pkg.version;

/**
 * Reduces FTS5 mismatches when a period glues onto the last token.
 * Deliberately KEPT (W-093): it is a write-side normalisation a real
 * ingestion pipeline could apply, mirrored 1:1 by the sibling
 * longmemeval runner's `normalizeForFts` - unlike the removed
 * query-side fan-out, it does not give the harness a retrieval path
 * users don't have.
 */
function normalizeFactForFts(text: string): string {
  if (text.includes('@')) return text;
  return text.replace(/\.(?=\s|$)/g, '');
}

export interface LocomoCaseInput {
  readonly facts: ReadonlyArray<string>;
  readonly question: string;
}

function pkgRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

function multilingualRoot(): string {
  return join(pkgRoot(), '..', 'locomo-multilingual');
}

function parseArgs(argv: ReadonlyArray<string>): {
  dataset: string;
  smoke: boolean;
  results: string;
  subset?: string;
} {
  let dataset = join(pkgRoot(), 'data', 'seed.jsonl');
  let smoke = false;
  let results = join(pkgRoot(), 'RESULTS.md');
  let subset: string | undefined;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dataset' && i + 1 < argv.length) {
      dataset = argv[++i] ?? dataset;
    } else if (a === '--smoke') {
      smoke = true;
    } else if (a === '--results' && i + 1 < argv.length) {
      results = argv[++i] ?? results;
    } else if (a === '--subset' && i + 1 < argv.length) {
      subset = argv[++i];
    }
  }
  if (subset !== undefined) {
    dataset = join(multilingualRoot(), subset, 'questions.jsonl');
  }
  return {
    dataset,
    smoke,
    results,
    ...(subset !== undefined ? { subset } : {}),
  };
}

/**
 * W-093 (evals-06 parity with the longmemeval runner): answer with the
 * EXACT retrieval path a user gets - ONE `memory.semantic.search` call
 * with the raw question. The former stopword/plural fan-out retrieved
 * through a harness-only path no application code has, so the CI smoke
 * could mask regressions of the real single-query pipeline.
 */
export async function answerQuestion(
  memory: Pick<Memory, 'semantic'>,
  scope: SessionScope,
  question: string,
): Promise<string> {
  const hits = await memory.semantic.search(scope, question, { topK: 24 });
  return hits.map((h) => h.record.text).join('\n');
}

function createRetrieverAgent(scope: SessionScope): AgentLike<LocomoCaseInput, string> {
  return {
    async run(input: LocomoCaseInput) {
      const store = await createSqliteStore({
        path: ':memory:',
        disableWalHardening: true,
      });
      await store.init();
      const memory = createMemory({
        store: store.memory as never,
        embeddings: store.embeddings,
        resolveScope: () => scope,
        conflictPipeline: { mode: 'off' },
        consolidator: { enabled: false },
      });
      try {
        for (const text of input.facts) {
          await memory.semantic.remember(scope, {
            text: normalizeFactForFts(text),
            sensitivity: 'internal',
          });
        }
        return await answerQuestion(memory, scope, input.question);
      } finally {
        await store.close();
      }
    },
  };
}

async function ensureDatasetReadable(datasetPath: string, subset?: string): Promise<void> {
  try {
    await readFile(datasetPath, 'utf8');
  } catch {
    if (subset !== undefined) {
      throw new Error(
        `[benchmark-memory-smoke] locale subset "${subset}" is not available yet (expected ${datasetPath}). ` +
          `Add questions.jsonl under benchmarks/locomo-multilingual/${subset}/ or drop --subset.`,
      );
    }
    throw new Error(`[benchmark-memory-smoke] cannot read dataset: ${datasetPath}`);
  }
}

/** Runs the benchmark and returns the eval report (does not write RESULTS). */
export async function runLocomoBenchmark(options: {
  readonly datasetPath: string;
  readonly smoke: boolean;
  readonly subset?: string;
}): Promise<EvalReport<LocomoCaseInput, string>> {
  await ensureDatasetReadable(options.datasetPath, options.subset);
  const dataset = await loadJsonlDataset(options.datasetPath, {
    name: 'memory-smoke-seed',
    mapper: (line): { id?: string; input: LocomoCaseInput; expected: string } => {
      const facts = line.facts;
      const question = line.question;
      const expected = line.expected;
      if (!Array.isArray(facts) || typeof question !== 'string' || typeof expected !== 'string') {
        throw new Error('[benchmark-memory-smoke] each row needs facts[], question, expected');
      }
      return {
        ...(typeof line.id === 'string' ? { id: line.id } : {}),
        input: { facts: facts as string[], question },
        expected,
      };
    },
  });

  let cases: Case<LocomoCaseInput, string>[] = [...dataset.cases] as Case<
    LocomoCaseInput,
    string
  >[];
  if (options.smoke) {
    cases = cases.slice(0, 3);
  }

  const scope: SessionScope = {
    userId: 'benchmark-user',
    sessionId: 'memory-smoke-session',
    agentId: 'memory-smoke-agent',
  };

  const agent = createRetrieverAgent(scope);
  const report = await runEvals<LocomoCaseInput, string>({
    agent,
    dataset: { cases },
    scorers: [
      predicate<LocomoCaseInput, string>({
        name: 'expected-in-hits',
        check: ({ case: c, output }) => {
          const needle = String(c.expected ?? '').toLowerCase();
          const hay = String(output ?? '').toLowerCase();
          const pass = needle.length > 0 && hay.includes(needle);
          return {
            pass,
            score: pass ? 1 : 0,
            reason: pass
              ? 'expected substring found in ranked facts'
              : 'expected substring missing',
          };
        },
      }),
    ],
    concurrency: 1,
  });
  return report;
}

async function writeResults(
  resultsPath: string,
  report: EvalReport<LocomoCaseInput, string>,
): Promise<void> {
  const header = [
    '# Memory retrieval QA - benchmark results',
    '',
    `**Graphorin** v${VERSION} · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>`,
    '',
    `_Generated: ${new Date().toISOString()}_`,
    '',
  ].join('\n');
  const body = renderMarkdownReport(report);
  await mkdir(dirname(resultsPath), { recursive: true });
  await writeFile(resultsPath, `${header}${body}`, 'utf8');
}

export async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const report = await runLocomoBenchmark({
    datasetPath: args.dataset,
    smoke: args.smoke,
    ...(args.subset !== undefined ? { subset: args.subset } : {}),
  });
  console.log(
    `[benchmark-memory-smoke] cases=${report.summary.total} passed=${report.summary.passed} failed=${report.summary.failed} avgMs=${report.summary.avgDurationMs.toFixed(2)}`,
  );
  await writeResults(args.results, report);
  exitOnFailures(report);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
