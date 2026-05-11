/**
 * Graphorin v0.1.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
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

export const VERSION = '0.1.0';

/** Reduces FTS5 mismatches when a period glues onto the last token. */
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

const FTS_STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'are',
  'but',
  'not',
  'you',
  'all',
  'can',
  'her',
  'was',
  'one',
  'our',
  'out',
  'day',
  'get',
  'has',
  'him',
  'his',
  'how',
  'its',
  'may',
  'new',
  'now',
  'old',
  'see',
  'two',
  'way',
  'who',
  'boy',
  'did',
  'she',
  'use',
  'her',
  'many',
  'than',
  'them',
  'these',
  'some',
  'what',
  'which',
  'when',
  'where',
  'does',
  'with',
  'from',
  'have',
  'that',
  'this',
  'your',
  'into',
  'also',
  'each',
  'work',
  'name',
  'user',
  'kind',
  'type',
  'list',
  'will',
]);

function tokenVariants(token: string): string[] {
  const out = [token];
  if (token.endsWith('s') && token.length > 4) out.push(token.slice(0, -1));
  if (!token.endsWith('s') && token.length > 3) out.push(`${token}s`);
  return out;
}

function keywordTokens(question: string): string[] {
  const raw = question.toLowerCase().match(/[a-z0-9@._-]{2,}/g) ?? [];
  const out: string[] = [];
  for (const t of raw) {
    if (t.length < 3 && !t.includes('@')) continue;
    if (FTS_STOPWORDS.has(t)) continue;
    out.push(t);
  }
  return out;
}

async function searchFactsForBenchmark(
  memory: Memory,
  scope: SessionScope,
  question: string,
): Promise<string> {
  const tokens = keywordTokens(question);
  const seen = new Set<string>();
  const texts: string[] = [];

  async function pushHits(
    hits: ReadonlyArray<{ record: { id: string; text: string } }>,
  ): Promise<void> {
    for (const h of hits) {
      if (seen.has(h.record.id)) continue;
      seen.add(h.record.id);
      texts.push(h.record.text);
    }
  }

  if (tokens.length === 0) {
    const hits = await memory.semantic.search(scope, question, { topK: 24 });
    await pushHits(hits);
    return texts.join('\n');
  }

  for (const t of tokens) {
    for (const variant of tokenVariants(t)) {
      const hits = await memory.semantic.search(scope, variant, { topK: 12 });
      await pushHits(hits);
    }
  }

  if (texts.length === 0) {
    const hits = await memory.semantic.search(scope, question, { topK: 24 });
    await pushHits(hits);
  }

  return texts.join('\n');
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
        return await searchFactsForBenchmark(memory, scope, input.question);
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
        `[benchmark-locomo] locale subset "${subset}" is not available yet (expected ${datasetPath}). ` +
          `Add questions.jsonl under benchmarks/locomo-multilingual/${subset}/ or drop --subset.`,
      );
    }
    throw new Error(`[benchmark-locomo] cannot read dataset: ${datasetPath}`);
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
    name: 'locomo-seed',
    mapper: (line): { id?: string; input: LocomoCaseInput; expected: string } => {
      const facts = line.facts;
      const question = line.question;
      const expected = line.expected;
      if (!Array.isArray(facts) || typeof question !== 'string' || typeof expected !== 'string') {
        throw new Error('[benchmark-locomo] each row needs facts[], question, expected');
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
    sessionId: 'locomo-session',
    agentId: 'locomo-agent',
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
    '# Memory retrieval QA — benchmark results',
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
    `[benchmark-locomo] cases=${report.summary.total} passed=${report.summary.passed} failed=${report.summary.failed} avgMs=${report.summary.avgDurationMs.toFixed(2)}`,
  );
  await writeResults(args.results, report);
  exitOnFailures(report);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
