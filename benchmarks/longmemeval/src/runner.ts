import pkg from '../package.json' with { type: 'json' };
/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * LongMemEval (+ real LOCOMO / DMR) memory-quality benchmark.
 *
 * For each question the {@link createMemorySystemAgent | MemorySystemAgent}
 * spins up a fresh in-memory `@graphorin/memory` instance, ingests every
 * haystack-session turn, optionally runs the consolidator, then answers
 * the question from recall via the configured `Provider`. Answers are
 * graded by the `@graphorin/evals` LLM-judge ("J" score) plus a
 * deterministic per-ability abstention scorer. With `--baseline` the run
 * is compared against a stored report and fails on regression - run once
 * per ability for per-category CI gates.
 *
 * The default `main()` uses a deterministic **offline stub** provider
 * (scores are plumbing-only); inject a real `Provider` programmatically
 * via {@link runLongMemEvalBenchmark} for real numbers. Datasets are
 * downloaded on demand by `scripts/fetch-eval-datasets.mjs` (dev-only) -
 * nothing here touches the network.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Provider, SessionScope } from '@graphorin/core';
import {
  type AgentLike,
  type Case,
  type Dataset,
  detectRegressions,
  type EvalReport,
  exitOnFailures,
  fenceForJudge,
  llmJudge,
  loadDmrDataset,
  loadLocomoDataset,
  loadLongMemEvalDataset,
  type MemoryEvalAbility,
  type MemoryEvalInput,
  predicate,
  type RegressionOptions,
  type RegressionReport,
  renderMarkdownReport,
  runEvals,
  type Scorer,
} from '@graphorin/evals';
import { createMemory, type Memory } from '@graphorin/memory';
import {
  createProvider,
  llamaCppServerAdapter,
  ollamaAdapter,
  openAICompatibleAdapter,
} from '@graphorin/provider';
import { createSqliteStore } from '@graphorin/store-sqlite';

import { createDefaultStubProvider } from './stub-provider.js';

export const VERSION: string = pkg.version;

const DEFAULT_TOP_K = 12;

/**
 * The regression-gate tolerances the dispatch CI job gates on. Quality-only:
 * `maxAvgDurationIncreaseMs` stays `Infinity` because real LLM latency swings by
 * whole seconds run to run (EB-4). Exported so the B2 negative-control test
 * exercises the EXACT values the gate uses - proving it fails on a real
 * regression rather than being theater.
 */
export const REGRESSION_TOLERANCES: RegressionOptions = {
  maxPassRateDropPct: 5,
  maxAvgScoreDrop: 0.05,
  maxAvgDurationIncreaseMs: Number.POSITIVE_INFINITY,
};

/** The real HTTP-adapter providers the CLI can resolve, besides the offline stub. */
const REAL_PROVIDER_NAMES = ['ollama', 'llamacpp', 'openai-compatible'] as const;
type RealProviderName = (typeof REAL_PROVIDER_NAMES)[number];

/** A provider request from CLI flags / env, before resolution (EB-1). */
export interface BenchProviderSpec {
  /** `stub` (default) or one of {@link REAL_PROVIDER_NAMES}. */
  readonly name?: string;
  /** Model id - required for every real provider. */
  readonly model?: string;
  /** Base URL - required for `openai-compatible`; loopback default for `ollama`/`llamacpp`. */
  readonly baseUrl?: string;
  /** Bearer key for `openai-compatible` (env-only; never a CLI flag). */
  readonly apiKey?: string;
}

/** A resolved {@link Provider} plus the provenance label stamped into RESULTS. */
export interface ResolvedBenchProvider {
  readonly provider: Provider;
  readonly label: string;
}

/**
 * Resolve a {@link Provider} from a CLI/env spec (EB-1). The default - and any
 * `stub` name - is the deterministic offline stub, labelled
 * `stub (plumbing-only)` so a plumbing run can never be mistaken for a real
 * result. A real `--provider` constructs the matching HTTP adapter; the network
 * is only touched later at `generate()` time, so this stays offline-safe (and
 * `check-no-network` ignores `benchmarks/`).
 *
 * Cloud models (Anthropic/OpenAI) are reached via `openai-compatible` pointed at
 * their OpenAI-compatible endpoint with `GRAPHORIN_BENCH_API_KEY`, or via the
 * programmatic {@link runLongMemEvalBenchmark} path for the Vercel AI SDK route.
 */
export function resolveBenchProvider(spec: BenchProviderSpec = {}): ResolvedBenchProvider {
  const name = spec.name === undefined || spec.name === '' ? 'stub' : spec.name;
  if (name === 'stub') {
    return { provider: createDefaultStubProvider(), label: 'stub (plumbing-only)' };
  }
  if (!(REAL_PROVIDER_NAMES as readonly string[]).includes(name)) {
    throw new Error(
      `[benchmark-longmemeval] unknown --provider '${name}'. Valid: stub, ${REAL_PROVIDER_NAMES.join(', ')}.`,
    );
  }
  const model = spec.model;
  if (model === undefined || model === '') {
    throw new Error(
      `[benchmark-longmemeval] --provider ${name} requires --model (or GRAPHORIN_BENCH_MODEL).`,
    );
  }
  const opts = { acceptsSensitivity: ['public', 'internal'] as const };
  const baseUrl = spec.baseUrl !== undefined && spec.baseUrl !== '' ? spec.baseUrl : undefined;
  switch (name as RealProviderName) {
    case 'ollama':
      return {
        provider: createProvider(ollamaAdapter({ model, ...(baseUrl ? { baseUrl } : {}) }), opts),
        label: `ollama:${model}`,
      };
    case 'llamacpp':
      return {
        provider: createProvider(
          llamaCppServerAdapter({ model, ...(baseUrl ? { baseUrl } : {}) }),
          opts,
        ),
        label: `llamacpp:${model}`,
      };
    default: {
      // openai-compatible - no loopback default; a base URL is mandatory.
      if (baseUrl === undefined) {
        throw new Error(
          '[benchmark-longmemeval] --provider openai-compatible requires --base-url ' +
            '(or GRAPHORIN_BENCH_BASE_URL).',
        );
      }
      return {
        provider: createProvider(
          openAICompatibleAdapter({
            model,
            baseUrl,
            ...(spec.apiKey ? { apiKey: spec.apiKey } : {}),
          }),
          opts,
        ),
        label: `openai-compatible:${model}`,
      };
    }
  }
}

type LoaderName = 'longmemeval' | 'locomo' | 'dmr';

/** Reduces FTS5 mismatches when a period glues onto the last token. */
function normalizeForFts(text: string): string {
  if (text.includes('@')) return text;
  return text.replace(/\.(?=\s|$)/g, '');
}

/**
 * Retrieval configuration the benchmark A/B-tests (evals-01/02). Each mode
 * maps onto the library's real search surface - the harness adds NOTHING
 * on top (the pre-C8 keyword fan-out booster is gone, evals-06), so the
 * numbers measure the search path users actually get.
 */
export type RetrievalMode =
  | 'default'
  | 'multi-query'
  | 'hyde'
  | 'iterative'
  | 'graph'
  | 'ppr'
  | 'entity';

/** Which embedder the memory system runs with (evals-01). */
export type EmbedderMode = 'none' | 'fake';

/** Iterative-retrieval abstention accounting (C8). */
export interface RetrievalStats {
  queries: number;
  abstained: number;
  insufficient: number;
}

/** A fresh, zeroed {@link RetrievalStats}. */
export function createRetrievalStats(): RetrievalStats {
  return { queries: 0, abstained: 0, insufficient: 0 };
}

/**
 * Deterministic, offline bag-of-words hash embedder (evals-01). Not a real
 * semantic model - it exists so the VECTOR leg of hybrid search (and the
 * graph/HyDE paths that ride it) can be exercised and A/B-compared in CI
 * without a model download. Real embedding quality needs a real embedder.
 */
export function createFakeEmbedder(dim = 64): import('@graphorin/core').EmbedderProvider {
  function embedOne(text: string): Float32Array {
    const vec = new Float32Array(dim);
    const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    for (const token of tokens) {
      let hash = 0x811c9dc5;
      for (let i = 0; i < token.length; i++) {
        hash ^= token.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
      }
      const slot = (hash >>> 0) % dim;
      vec[slot] = (vec[slot] ?? 0) + 1;
    }
    let norm = 0;
    for (const v of vec) norm += v * v;
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < dim; i++) vec[i] = (vec[i] ?? 0) / norm;
    }
    return vec;
  }
  return {
    id: () => `fake:bow-${dim}`,
    dim: () => dim,
    configHash: () => `fake-bow-${dim}`,
    embed: async (texts) => texts.map((t) => embedOne(t)),
  };
}

async function recall(
  memory: Memory,
  scope: SessionScope,
  question: string,
  topK: number,
  retrieval: RetrievalMode,
  stats: RetrievalStats | undefined,
): Promise<string> {
  if (retrieval === 'iterative') {
    const result = await memory.semantic.searchIterative(scope, question, { topK });
    if (stats !== undefined) {
      stats.queries += 1;
      if (result.abstained) stats.abstained += 1;
      if (!result.sufficient) stats.insufficient += 1;
    }
    return result.hits.map((h) => h.record.text).join('\n');
  }
  const hits = await memory.semantic.search(scope, question, {
    topK,
    ...(retrieval === 'multi-query' ? { multiQuery: 3 } : {}),
    ...(retrieval === 'hyde' ? { hyde: true } : {}),
    ...(retrieval === 'graph' ? { expandHops: 1 as const } : {}),
    // D5: PPR-lite two-hop damped spreading activation, and the exact
    // entity-match retriever.
    ...(retrieval === 'ppr' ? { expandHops: 2 as const, graphScoring: 'ppr' as const } : {}),
    ...(retrieval === 'entity' ? { entityMatch: true } : {}),
  });
  return hits.map((h) => h.record.text).join('\n');
}

/** Which system-under-test the runner evaluates (SOTA-1). */
export type BenchMode = 'memory' | 'full-context';

/** Accumulates provider usage across a run so RESULTS can report tokens/query (SOTA-1). */
export interface BenchMeter {
  queries: number;
  totalTokens: number;
}

/** A fresh, zeroed {@link BenchMeter}. */
export function createBenchMeter(): BenchMeter {
  return { queries: 0, totalTokens: 0 };
}

/**
 * Shared answer path: build the QA prompt from the supplied context, answer via
 * the provider, and meter usage. The memory agent feeds *recalled* context; the
 * full-context baseline feeds the *entire* haystack - only the context differs.
 */
async function answerFromContext(
  provider: Provider,
  input: MemoryEvalInput,
  context: string,
  meter: BenchMeter | undefined,
): Promise<string> {
  const askedAt = input.askedAt !== undefined ? `\nCURRENT DATE: ${input.askedAt}` : '';
  const response = await provider.generate({
    systemMessage:
      "You are a personal assistant answering from the user's long-term memory. Use ONLY " +
      'the MEMORY context. If the answer is not present, reply that you do not have that ' +
      'information.',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `MEMORY:\n${context}${askedAt}\n\nQUESTION: ${input.question}\n\nANSWER:`,
          },
        ],
      },
    ],
    temperature: 0,
    maxTokens: 256,
  });
  if (meter !== undefined) {
    meter.queries += 1;
    meter.totalTokens += response.usage?.totalTokens ?? 0;
  }
  return response.text ?? '';
}

/** Options for {@link createFullContextAgent}. */
export interface FullContextAgentOptions {
  readonly provider: Provider;
  /** Optional token/latency meter shared with the runner (SOTA-1). */
  readonly meter?: BenchMeter;
}

/**
 * SOTA-1 baseline: inline the ENTIRE haystack into the prompt - no store, no
 * retrieval window. Every memory-pipeline score is reported against this; on a
 * small corpus the honest result often favours full-context (ConvoMem: full
 * context beats memory systems below ~150 conversations) at a much higher token
 * cost, which the {@link BenchMeter} surfaces. It is the prerequisite for any
 * corpus-size-aware threshold (SOTA-2) - without it, thresholds are picked blind.
 */
export function createFullContextAgent(
  options: FullContextAgentOptions,
): AgentLike<MemoryEvalInput, string> {
  return {
    async run(input: MemoryEvalInput): Promise<string> {
      const context = input.haystackSessions
        .flatMap((session) =>
          session.turns.map((turn) => {
            const stamp = turn.timestamp !== undefined ? ` [${turn.timestamp}]` : '';
            // W-022: prefer the dataset-native speaker name - LOCOMO
            // questions reference speakers by name, not by role.
            return `${turn.speaker ?? turn.role}${stamp}: ${turn.content}`;
          }),
        )
        .join('\n');
      return answerFromContext(options.provider, input, context, options.meter);
    },
  };
}

/** Options for {@link createMemorySystemAgent}. */
export interface MemorySystemAgentOptions {
  readonly provider: Provider;
  readonly scope?: SessionScope;
  readonly topK?: number;
  /** Run the consolidator's standard phase after ingest (needs an extraction-capable provider). */
  readonly consolidate?: boolean;
  /** Optional token/latency meter shared with the runner (SOTA-1). */
  readonly meter?: BenchMeter;
  /** Retrieval configuration under test (C8). Default `'default'`. */
  readonly retrieval?: RetrievalMode;
  /** Embedder under test (C8). Default `'none'` (FTS-only). */
  readonly embedder?: EmbedderMode;
  /** Iterative-retrieval abstention stats sink (C8). */
  readonly retrievalStats?: RetrievalStats;
  /**
   * EB-11 hook: fired once per ACTUAL conversation ingest (a cache miss), NOT
   * per QA case - lets a caller/test confirm a sample's N questions ingest the
   * haystack only once.
   */
  readonly onIngest?: () => void;
}

/**
 * The system under test: ingests a question's haystack sessions into a
 * fresh in-memory memory instance, then answers from recall via the
 * configured provider.
 */
export function createMemorySystemAgent(
  options: MemorySystemAgentOptions,
): AgentLike<MemoryEvalInput, string> {
  const scope: SessionScope = options.scope ?? {
    userId: 'longmemeval-user',
    sessionId: 'longmemeval-session',
    agentId: 'longmemeval-agent',
  };
  const topK = options.topK ?? DEFAULT_TOP_K;
  // EB-11: the LOCOMO loader pushes the SAME `haystackSessions` array into
  // every QA case of one conversation, so a fresh per-case ingest re-loads the
  // whole (~300-turn) conversation - and, with --consolidate, re-runs the LLM
  // consolidation pass - once per QUESTION. Key the ingested memory by that
  // shared array reference: each conversation is ingested once and its store is
  // reused (read-only) by its other questions; a different conversation is a
  // different array, so it gets a separate store and sample isolation holds.
  // The :memory: stores stay open for the run's lifetime (a short-lived
  // benchmark process) - not closed per case, since later questions of the same
  // sample still read them.
  const retrieval: RetrievalMode = options.retrieval ?? 'default';
  // evals-09: cache the in-flight PROMISE (not the resolved Memory) so two
  // concurrent cases sharing one haystack cannot both miss and double-ingest.
  const ingestCache = new WeakMap<object, Promise<Memory>>();

  function ingestConversation(input: MemoryEvalInput): Promise<Memory> {
    const cached = ingestCache.get(input.haystackSessions);
    if (cached !== undefined) return cached;
    const pending = (async (): Promise<Memory> => {
      const store = await createSqliteStore({ path: ':memory:', disableWalHardening: true });
      await store.init();
      const memory = createMemory({
        store: store.memory as never,
        embeddings: store.embeddings,
        resolveScope: () => scope,
        conflictPipeline: { mode: 'off' },
        // C8 (evals-01/02): the A/B switches wire the REAL library config.
        ...(options.embedder === 'fake' ? { embedder: createFakeEmbedder() } : {}),
        ...(retrieval === 'multi-query' || retrieval === 'hyde'
          ? { queryTransform: { provider: options.provider } }
          : {}),
        ...(retrieval === 'iterative'
          ? { iterativeRetrieval: { provider: options.provider } }
          : {}),
        ...(retrieval === 'graph' || retrieval === 'ppr' || retrieval === 'entity'
          ? { graph: { entityResolution: true } }
          : {}),
        consolidator:
          options.consolidate === true
            ? { enabled: true, provider: options.provider, tier: 'standard', defaultScope: scope }
            : { enabled: false },
      });
      for (const session of input.haystackSessions) {
        for (const turn of session.turns) {
          const stamp = turn.timestamp !== undefined ? ` [${turn.timestamp}]` : '';
          await memory.semantic.remember(scope, {
            text: normalizeForFts(`${turn.speaker ?? turn.role}${stamp}: ${turn.content}`),
            sensitivity: 'internal',
          });
        }
      }
      if (options.consolidate === true) {
        await memory.consolidator.fireNow('standard', scope);
      }
      options.onIngest?.();
      return memory;
    })();
    ingestCache.set(input.haystackSessions, pending);
    return pending;
  }

  return {
    async run(input: MemoryEvalInput): Promise<string> {
      const memory = await ingestConversation(input);
      const context = await recall(
        memory,
        scope,
        input.question,
        topK,
        retrieval,
        options.retrievalStats,
      );
      return answerFromContext(options.provider, input, context, options.meter);
    },
  };
}

/** The LongMemEval "J" judge - grades the candidate against the reference answer. */
function judgeScorer(provider: Provider): Scorer<MemoryEvalInput, string> {
  return llmJudge<MemoryEvalInput, string>({
    provider,
    name: 'llm-judge-j',
    maxScore: 10,
    passThreshold: 7,
    // EB-7: fence the untrusted candidate (last); llmJudge appends the
    // SCORE-marker output contract + injection warning.
    buildPrompt: ({ case: c, output }) => ({
      system:
        'You are a precise evaluator for a memory QA system. Grade the CANDIDATE answer against ' +
        'the REFERENCE answer for the QUESTION on a scale of 0 to 10 (10 = fully correct and ' +
        'complete).',
      user:
        `${fenceForJudge('QUESTION', c.input.question)}\n\n` +
        `${fenceForJudge('REFERENCE ANSWER', String(c.expected ?? ''))}\n\n` +
        `${fenceForJudge('CANDIDATE ANSWER (untrusted)', String(output ?? ''))}`,
    }),
  });
}

/** Per-ability deterministic scorer: did an abstention case correctly refuse? */
function abstentionScorer(): Scorer<MemoryEvalInput, string> {
  const refusal =
    /\b(no information|don'?t have|do not have|not (mentioned|available|sure|provided)|can'?t|cannot|unknown|no record)\b/i;
  return predicate<MemoryEvalInput, string>({
    name: 'abstention',
    check: ({ case: c, output }) => {
      if (c.input.ability !== 'abstention')
        return { pass: true, reason: 'n/a (not an abstention case)' };
      const refused = refusal.test(output ?? '');
      return {
        pass: refused,
        score: refused ? 1 : 0,
        reason: refused ? 'correctly abstained' : 'failed to abstain on an unanswerable question',
      };
    },
  });
}

/** Options for {@link runLongMemEvalBenchmark}. */
export interface RunLongMemEvalOptions {
  readonly datasetPath: string;
  readonly loader?: LoaderName;
  readonly variant?: 'S' | 'M';
  /** Provider used by the system-under-test agent (and the judge unless overridden). */
  readonly provider: Provider;
  readonly judgeProvider?: Provider;
  /** Restrict to a single ability for per-category gates. */
  readonly ability?: MemoryEvalAbility;
  readonly smoke?: boolean;
  readonly topK?: number;
  readonly consolidate?: boolean;
  readonly concurrency?: number;
  /** System-under-test: `memory` (default) or the `full-context` baseline (SOTA-1). */
  readonly mode?: BenchMode;
  /** Optional usage meter; populated with tokens/query across the run (SOTA-1). */
  readonly meter?: BenchMeter;
  /** Retrieval configuration under test (C8). Default `'default'`. */
  readonly retrieval?: RetrievalMode;
  /** Embedder under test (C8). Default `'none'`. */
  readonly embedder?: EmbedderMode;
  /** Iterative-retrieval abstention stats sink (C8). */
  readonly retrievalStats?: RetrievalStats;
  /** Repeat every case N times for variance reporting (C8). Default 1. */
  readonly iterations?: number;
}

/** Run the benchmark and return the eval report (does not write RESULTS). */
export async function runLongMemEvalBenchmark(
  options: RunLongMemEvalOptions,
): Promise<EvalReport<MemoryEvalInput, string>> {
  const dataset = await loadDataset(options);
  let cases: Case<MemoryEvalInput, string>[] = [...dataset.cases];
  if (options.ability !== undefined) {
    cases = cases.filter((c) => c.input.ability === options.ability);
  }
  if (options.smoke === true) {
    cases = cases.slice(0, 3);
  }
  const agent =
    options.mode === 'full-context'
      ? createFullContextAgent({
          provider: options.provider,
          ...(options.meter !== undefined ? { meter: options.meter } : {}),
        })
      : createMemorySystemAgent({
          provider: options.provider,
          ...(options.topK !== undefined ? { topK: options.topK } : {}),
          ...(options.consolidate !== undefined ? { consolidate: options.consolidate } : {}),
          ...(options.meter !== undefined ? { meter: options.meter } : {}),
          ...(options.retrieval !== undefined ? { retrieval: options.retrieval } : {}),
          ...(options.embedder !== undefined ? { embedder: options.embedder } : {}),
          ...(options.retrievalStats !== undefined
            ? { retrievalStats: options.retrievalStats }
            : {}),
        });
  return runEvals<MemoryEvalInput, string>({
    agent,
    dataset: { cases },
    scorers: [judgeScorer(options.judgeProvider ?? options.provider), abstentionScorer()],
    concurrency: options.concurrency ?? 1,
    ...(options.iterations !== undefined && options.iterations > 1
      ? { iterations: options.iterations }
      : {}),
  });
}

/**
 * C8: per-iteration variance + abstention-rate aggregates. `runEvals`
 * folds all iterations into one flat report; this decomposes it so RESULTS
 * can print mean ± stddev instead of a single point estimate, plus the
 * abstention rate the LongMemEval literature asks for.
 */
export interface BenchAggregates {
  /** Pass rate per iteration (single-element for iterations=1). */
  readonly passRates: ReadonlyArray<number>;
  readonly passRateMean: number;
  readonly passRateStddev: number;
  /** Fraction of abstention-ability cases that correctly abstained (or null). */
  readonly abstentionRate: number | null;
}

export function computeBenchAggregates(
  report: EvalReport<MemoryEvalInput, string>,
): BenchAggregates {
  // runEvals suffixes repeated case ids with `-iter-N`.
  const byIteration = new Map<number, { total: number; passed: number }>();
  let abstentionTotal = 0;
  let abstentionPassed = 0;
  for (const result of report.results) {
    const match = /-iter-(\d+)$/.exec(result.caseId);
    const iteration = match !== null ? Number.parseInt(match[1] ?? '0', 10) : 0;
    const bucket = byIteration.get(iteration) ?? { total: 0, passed: 0 };
    bucket.total += 1;
    const passedAll = result.scores.every((s) => s.result.pass);
    if (passedAll) bucket.passed += 1;
    byIteration.set(iteration, bucket);
    if (result.input.ability === 'abstention') {
      abstentionTotal += 1;
      const abstention = result.scores.find((s) => s.scorer === 'abstention');
      if (abstention?.result.pass === true) abstentionPassed += 1;
    }
  }
  const passRates = [...byIteration.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, b]) => (b.total > 0 ? b.passed / b.total : 0));
  const mean = passRates.length > 0 ? passRates.reduce((a, b) => a + b, 0) / passRates.length : 0;
  const variance =
    passRates.length > 1
      ? passRates.reduce((acc, r) => acc + (r - mean) ** 2, 0) / (passRates.length - 1)
      : 0;
  return {
    passRates,
    passRateMean: mean,
    passRateStddev: Math.sqrt(variance),
    abstentionRate: abstentionTotal > 0 ? abstentionPassed / abstentionTotal : null,
  };
}

async function loadDataset(
  options: RunLongMemEvalOptions,
): Promise<Dataset<MemoryEvalInput, string>> {
  const loader = options.loader ?? 'longmemeval';
  if (loader === 'locomo') return loadLocomoDataset({ path: options.datasetPath });
  if (loader === 'dmr') return loadDmrDataset({ path: options.datasetPath });
  return loadLongMemEvalDataset({
    path: options.datasetPath,
    ...(options.variant !== undefined ? { variant: options.variant } : {}),
  });
}

interface CliArgs {
  dataset: string;
  loader: LoaderName;
  variant?: 'S' | 'M';
  ability?: MemoryEvalAbility;
  smoke: boolean;
  results: string;
  baseline?: string;
  json?: string;
  topK?: number;
  consolidate: boolean;
  gateOn: 'all' | 'regressions';
  /** EB-1 real-provider path (default: offline stub). */
  providerName?: string;
  model?: string;
  baseUrl?: string;
  /** SOTA-1 system-under-test (default: memory). */
  mode?: BenchMode;
  /** C8 (evals-04): dedicated judge provider - never grade yourself. */
  judgeProviderName?: string;
  judgeModel?: string;
  judgeBaseUrl?: string;
  /** C8: opt-out for the self-judged-baseline refusal. */
  allowSelfJudge: boolean;
  /** C8 (evals-01/02): A/B switches. */
  retrieval?: RetrievalMode;
  embedder?: EmbedderMode;
  /** C8 (evals-05): repeat cases for variance. */
  iterations?: number;
}

function pkgRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

function parseArgs(argv: ReadonlyArray<string>): CliArgs {
  const args: CliArgs = {
    dataset: join(pkgRoot(), 'data', 'fixture.json'),
    loader: 'longmemeval',
    smoke: false,
    results: join(pkgRoot(), 'RESULTS.md'),
    consolidate: false,
    gateOn: 'all',
    allowSelfJudge: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === '--dataset' && next !== undefined) {
      args.dataset = next;
      i++;
    } else if (a === '--loader' && next !== undefined) {
      args.loader = next as LoaderName;
      i++;
    } else if (a === '--variant' && next !== undefined) {
      args.variant = next as 'S' | 'M';
      i++;
    } else if (a === '--ability' && next !== undefined) {
      args.ability = next as MemoryEvalAbility;
      i++;
    } else if (a === '--results' && next !== undefined) {
      args.results = next;
      i++;
    } else if (a === '--baseline' && next !== undefined) {
      args.baseline = next;
      i++;
    } else if (a === '--json' && next !== undefined) {
      args.json = next;
      i++;
    } else if (a === '--top-k' && next !== undefined) {
      args.topK = Number.parseInt(next, 10);
      i++;
    } else if (a === '--gate-on' && next !== undefined) {
      args.gateOn = next === 'regressions' ? 'regressions' : 'all';
      i++;
    } else if (a === '--provider' && next !== undefined) {
      args.providerName = next;
      i++;
    } else if (a === '--model' && next !== undefined) {
      args.model = next;
      i++;
    } else if (a === '--base-url' && next !== undefined) {
      args.baseUrl = next;
      i++;
    } else if (a === '--mode' && next !== undefined) {
      args.mode = next === 'full-context' ? 'full-context' : 'memory';
      i++;
    } else if (a === '--judge-provider' && next !== undefined) {
      args.judgeProviderName = next;
      i++;
    } else if (a === '--judge-model' && next !== undefined) {
      args.judgeModel = next;
      i++;
    } else if (a === '--judge-base-url' && next !== undefined) {
      args.judgeBaseUrl = next;
      i++;
    } else if (a === '--retrieval' && next !== undefined) {
      args.retrieval = next as RetrievalMode;
      i++;
    } else if (a === '--embedder' && next !== undefined) {
      args.embedder = next as EmbedderMode;
      i++;
    } else if (a === '--iterations' && next !== undefined) {
      args.iterations = Number.parseInt(next, 10);
      i++;
    } else if (a === '--allow-self-judge') {
      args.allowSelfJudge = true;
    } else if (a === '--smoke') {
      args.smoke = true;
    } else if (a === '--consolidate') {
      args.consolidate = true;
    }
  }
  return args;
}

/** Run metadata stamped into the RESULTS header beside the provider (SOTA-1). */
export interface ResultsMeta {
  /** Which system-under-test ran. */
  readonly mode?: BenchMode;
  /** Mean provider tokens per QA query (the honest cost axis next to accuracy). */
  readonly tokensPerQuery?: number;
  readonly generatedAt?: string;
  /** C8 (evals-01): the retrieval configuration the run measured. */
  readonly retrieval?: RetrievalMode;
  readonly embedder?: EmbedderMode;
  readonly topK?: number;
  readonly consolidate?: boolean;
  /** C8 (evals-04): who graded - and whether it graded itself. */
  readonly judge?: string;
  readonly selfJudged?: boolean;
  /** C8 (evals-05): iteration count + variance. */
  readonly iterations?: number;
  readonly passRateMean?: number;
  readonly passRateStddev?: number;
  /** C8: abstention-rate aggregate (abstention-ability cases only). */
  readonly abstentionRate?: number | null;
  /** C8: iterative-retrieval abstentions (retrieval='iterative' only). */
  readonly retrievalAbstained?: number;
}

/**
 * The RESULTS.md header, stamped with the provider provenance (EB-1) and - when
 * available - the run mode and tokens/query cost axis (SOTA-1). A stub run is
 * labelled `stub (plumbing-only)` so it can never read as a real result.
 */
export function buildResultsHeader(providerLabel: string, meta: ResultsMeta = {}): string {
  const lines = [
    '# LongMemEval - memory-quality benchmark results',
    '',
    `**Graphorin** v${VERSION} · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>`,
    '',
    `**Provider:** ${providerLabel}`,
  ];
  if (meta.mode !== undefined) lines.push(`**Mode:** ${meta.mode}`);
  if (meta.retrieval !== undefined || meta.embedder !== undefined || meta.topK !== undefined) {
    lines.push(
      `**Retrieval config:** retrieval=${meta.retrieval ?? 'default'} embedder=${meta.embedder ?? 'none'} topK=${meta.topK ?? DEFAULT_TOP_K} consolidate=${meta.consolidate === true}`,
    );
  }
  if (meta.judge !== undefined) {
    lines.push(
      `**Judge:** ${meta.judge}${meta.selfJudged === true ? ' (SELF-JUDGED - do not compare across systems)' : ''}`,
    );
  }
  if (meta.tokensPerQuery !== undefined) {
    lines.push(`**Tokens/query:** ${meta.tokensPerQuery.toFixed(0)}`);
  }
  if (meta.iterations !== undefined && meta.iterations > 1) {
    lines.push(
      `**Pass rate:** ${((meta.passRateMean ?? 0) * 100).toFixed(1)}% ± ${((meta.passRateStddev ?? 0) * 100).toFixed(1)}pp over ${meta.iterations} iterations`,
    );
  }
  if (meta.abstentionRate !== undefined && meta.abstentionRate !== null) {
    lines.push(`**Abstention rate:** ${(meta.abstentionRate * 100).toFixed(1)}%`);
  }
  if (meta.retrievalAbstained !== undefined) {
    lines.push(`**Iterative-retrieval abstentions:** ${meta.retrievalAbstained}`);
  }
  lines.push('', `_Generated: ${meta.generatedAt ?? new Date().toISOString()}_`, '');
  return lines.join('\n');
}

async function writeResults(
  resultsPath: string,
  report: EvalReport<MemoryEvalInput, string>,
  providerLabel: string,
  meta: ResultsMeta,
): Promise<void> {
  await mkdir(dirname(resultsPath), { recursive: true });
  await writeFile(
    resultsPath,
    `${buildResultsHeader(providerLabel, meta)}${renderMarkdownReport(report)}`,
    'utf8',
  );
}

/**
 * W-021: resolve the judge configuration from CLI flags + env. CLI
 * wins; env fills the gaps; EMPTY strings (how CI dispatch forms and
 * unset repo secrets surface) never arm or half-configure the judge.
 * The judge often lives on a DIFFERENT endpoint than the SUT (that is
 * the point of a non-self judge), so `GRAPHORIN_BENCH_JUDGE_API_KEY`
 * takes precedence, falling back to the shared SUT key for
 * single-endpoint setups. Returns `undefined` when no judge is named.
 */
export function resolveJudgeSpec(
  cli: { readonly name?: string; readonly model?: string; readonly baseUrl?: string },
  env: Record<string, string | undefined>,
  sutApiKey: string | undefined,
): { name: string; model?: string; baseUrl?: string; apiKey?: string } | undefined {
  const nonEmpty = (value: string | undefined): string | undefined =>
    value !== undefined && value.length > 0 ? value : undefined;
  const name = nonEmpty(cli.name) ?? nonEmpty(env.GRAPHORIN_BENCH_JUDGE_PROVIDER);
  if (name === undefined) return undefined;
  const model = nonEmpty(cli.model) ?? nonEmpty(env.GRAPHORIN_BENCH_JUDGE_MODEL);
  const baseUrl = nonEmpty(cli.baseUrl) ?? nonEmpty(env.GRAPHORIN_BENCH_JUDGE_BASE_URL);
  const apiKey = nonEmpty(env.GRAPHORIN_BENCH_JUDGE_API_KEY) ?? nonEmpty(sutApiKey);
  return {
    name,
    ...(model !== undefined ? { model } : {}),
    ...(baseUrl !== undefined ? { baseUrl } : {}),
    ...(apiKey !== undefined ? { apiKey } : {}),
  };
}

export async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  // CLI flags win; env (GRAPHORIN_BENCH_*) fills the gaps. The API key is
  // env-only - never put a secret on the command line.
  const providerName = args.providerName ?? process.env.GRAPHORIN_BENCH_PROVIDER;
  const model = args.model ?? process.env.GRAPHORIN_BENCH_MODEL;
  const baseUrl = args.baseUrl ?? process.env.GRAPHORIN_BENCH_BASE_URL;
  const apiKey = process.env.GRAPHORIN_BENCH_API_KEY;
  const { provider, label } = resolveBenchProvider({
    ...(providerName !== undefined ? { name: providerName } : {}),
    ...(model !== undefined ? { model } : {}),
    ...(baseUrl !== undefined ? { baseUrl } : {}),
    ...(apiKey !== undefined ? { apiKey } : {}),
  });
  if (label.startsWith('stub')) {
    console.warn(
      '[benchmark-longmemeval] no real Provider selected; using the deterministic offline stub - ' +
        'scores are plumbing-only. Pass --provider ollama|llamacpp|openai-compatible (with --model, ' +
        'or the GRAPHORIN_BENCH_* env vars) for meaningful numbers.',
    );
  } else {
    console.log(`[benchmark-longmemeval] provider=${label}`);
  }
  const mode: BenchMode = args.mode ?? 'memory';
  // C8 (evals-04): a dedicated judge, resolved exactly like the SUT
  // provider (judge env vars fall back to the SUT env). Without one, the
  // SUT grades itself - legal for plumbing, poisonous for baselines.
  const judgeSpec = resolveJudgeSpec(
    {
      ...(args.judgeProviderName !== undefined ? { name: args.judgeProviderName } : {}),
      ...(args.judgeModel !== undefined ? { model: args.judgeModel } : {}),
      ...(args.judgeBaseUrl !== undefined ? { baseUrl: args.judgeBaseUrl } : {}),
    },
    process.env,
    apiKey,
  );
  const judgeResolved = judgeSpec !== undefined ? resolveBenchProvider(judgeSpec) : undefined;
  const judgeLabel = judgeResolved?.label ?? label;
  const selfJudged = judgeResolved === undefined && !label.startsWith('stub');
  if (selfJudged) {
    console.warn(
      '[benchmark-longmemeval] the system-under-test provider is grading ITSELF (evals-04). ' +
        'Pass --judge-provider/--judge-model for numbers you can compare across systems.',
    );
    if (args.json !== undefined && !args.allowSelfJudge) {
      console.error(
        '[benchmark-longmemeval] refusing to write a --json baseline from a SELF-JUDGED real-provider run. ' +
          'Pass --judge-provider (recommended) or --allow-self-judge to override.',
      );
      process.exitCode = 1;
      return;
    }
  }
  const meter = createBenchMeter();
  const retrievalStats = createRetrievalStats();
  const report = await runLongMemEvalBenchmark({
    datasetPath: args.dataset,
    loader: args.loader,
    ...(args.variant !== undefined ? { variant: args.variant } : {}),
    ...(args.ability !== undefined ? { ability: args.ability } : {}),
    smoke: args.smoke,
    ...(args.topK !== undefined ? { topK: args.topK } : {}),
    consolidate: args.consolidate,
    mode,
    meter,
    provider,
    ...(judgeResolved !== undefined ? { judgeProvider: judgeResolved.provider } : {}),
    ...(args.retrieval !== undefined ? { retrieval: args.retrieval } : {}),
    ...(args.embedder !== undefined ? { embedder: args.embedder } : {}),
    ...(args.iterations !== undefined ? { iterations: args.iterations } : {}),
    retrievalStats,
  });
  const tokensPerQuery = meter.queries > 0 ? meter.totalTokens / meter.queries : 0;
  const aggregates = computeBenchAggregates(report);
  console.log(
    `[benchmark-longmemeval] loader=${args.loader} mode=${mode}${args.ability !== undefined ? ` ability=${args.ability}` : ''} ` +
      `retrieval=${args.retrieval ?? 'default'} embedder=${args.embedder ?? 'none'} ` +
      `cases=${report.summary.total} passed=${report.summary.passed} failed=${report.summary.failed} ` +
      `avgMs=${report.summary.avgDurationMs.toFixed(2)} tokens/query=${tokensPerQuery.toFixed(0)}` +
      (aggregates.abstentionRate !== null
        ? ` abstentionRate=${(aggregates.abstentionRate * 100).toFixed(1)}%`
        : ''),
  );
  const benchConfig = {
    mode,
    retrieval: args.retrieval ?? 'default',
    embedder: args.embedder ?? 'none',
    topK: args.topK ?? DEFAULT_TOP_K,
    consolidate: args.consolidate,
    provider: label,
    judge: judgeLabel,
    selfJudged,
    iterations: args.iterations ?? 1,
    loader: args.loader,
    ...(args.variant !== undefined ? { variant: args.variant } : {}),
    ...(args.ability !== undefined ? { ability: args.ability } : {}),
  };
  await writeResults(args.results, report, label, {
    mode,
    tokensPerQuery,
    retrieval: benchConfig.retrieval,
    embedder: benchConfig.embedder,
    topK: benchConfig.topK,
    consolidate: args.consolidate,
    judge: judgeLabel,
    selfJudged,
    iterations: benchConfig.iterations,
    passRateMean: aggregates.passRateMean,
    passRateStddev: aggregates.passRateStddev,
    abstentionRate: aggregates.abstentionRate,
    ...(args.retrieval === 'iterative' ? { retrievalAbstained: retrievalStats.abstained } : {}),
  });
  if (args.json !== undefined) {
    // benchConfig rides as an EXTRA key: detectRegressions reads only
    // results/summary, so existing baselines stay compatible while every
    // new report says exactly what it measured (evals-01).
    await writeFile(
      args.json,
      JSON.stringify({ ...report, benchConfig, aggregates }, null, 2),
      'utf8',
    );
    console.log(`[benchmark-longmemeval] wrote JSON report to ${args.json}`);
  }

  let regression: RegressionReport<MemoryEvalInput, string> | undefined;
  if (args.baseline !== undefined) {
    let baselineText: string | undefined;
    try {
      baselineText = await readFile(args.baseline, 'utf8');
    } catch {
      console.warn(
        `[benchmark-longmemeval] no baseline at ${args.baseline} - skipping regression gate ` +
          '(seed one with --json).',
      );
    }
    if (baselineText !== undefined) {
      const baseline = JSON.parse(baselineText) as EvalReport<MemoryEvalInput, string>;
      regression = detectRegressions(report, baseline, REGRESSION_TOLERANCES);
      if (regression.hasRegressions) {
        console.error('[benchmark-longmemeval] REGRESSIONS DETECTED:');
        for (const f of regression.findings) console.error(`  - ${f.message}`);
      }
    }
  }
  // `all` (default) fails on any failed case or regression; `regressions`
  // gates only on the baseline comparison (used by the dispatch CI job, where
  // a placeholder provider may legitimately fail individual cases).
  if (args.gateOn === 'regressions') {
    if (regression?.hasRegressions === true) process.exitCode = 1;
  } else {
    exitOnFailures(report, regression);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
