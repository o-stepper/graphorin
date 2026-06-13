/**
 * Graphorin — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * LongMemEval (+ real LOCOMO / DMR) memory-quality benchmark.
 *
 * For each question the {@link createMemorySystemAgent | MemorySystemAgent}
 * spins up a fresh in-memory `@graphorin/memory` instance, ingests every
 * haystack-session turn, optionally runs the consolidator, then answers
 * the question from recall via the configured `Provider`. Answers are
 * graded by the `@graphorin/evals` LLM-judge ("J" score) plus a
 * deterministic per-ability abstention scorer. With `--baseline` the run
 * is compared against a stored report and fails on regression — run once
 * per ability for per-category CI gates.
 *
 * The default `main()` uses a deterministic **offline stub** provider
 * (scores are plumbing-only); inject a real `Provider` programmatically
 * via {@link runLongMemEvalBenchmark} for real numbers. Datasets are
 * downloaded on demand by `scripts/fetch-eval-datasets.mjs` (dev-only) —
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

export const VERSION = '0.1.0';

const DEFAULT_TOP_K = 12;

/** The real HTTP-adapter providers the CLI can resolve, besides the offline stub. */
const REAL_PROVIDER_NAMES = ['ollama', 'llamacpp', 'openai-compatible'] as const;
type RealProviderName = (typeof REAL_PROVIDER_NAMES)[number];

/** A provider request from CLI flags / env, before resolution (EB-1). */
export interface BenchProviderSpec {
  /** `stub` (default) or one of {@link REAL_PROVIDER_NAMES}. */
  readonly name?: string;
  /** Model id — required for every real provider. */
  readonly model?: string;
  /** Base URL — required for `openai-compatible`; loopback default for `ollama`/`llamacpp`. */
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
 * Resolve a {@link Provider} from a CLI/env spec (EB-1). The default — and any
 * `stub` name — is the deterministic offline stub, labelled
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
      // openai-compatible — no loopback default; a base URL is mandatory.
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

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'what',
  'which',
  'when',
  'where',
  'who',
  'whom',
  'how',
  'did',
  'does',
  'was',
  'were',
  'are',
  'his',
  'her',
  'their',
  'your',
  'user',
  'with',
  'from',
  'that',
  'this',
  'into',
  'about',
  'they',
  'them',
  'you',
  'have',
  'has',
]);

function keywordTokens(question: string): string[] {
  const raw = question.toLowerCase().match(/[a-z0-9@._-]{3,}/g) ?? [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of raw) {
    if (STOPWORDS.has(t) || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

type SearchHit = { readonly record: { readonly id: string; readonly text: string } };

async function recall(
  memory: Memory,
  scope: SessionScope,
  question: string,
  topK: number,
): Promise<string> {
  const seen = new Set<string>();
  const texts: string[] = [];
  const collect = (hits: ReadonlyArray<SearchHit>): void => {
    for (const h of hits) {
      if (seen.has(h.record.id)) continue;
      seen.add(h.record.id);
      texts.push(h.record.text);
    }
  };
  collect(await memory.semantic.search(scope, question, { topK }));
  // Per-keyword fan-out. As of MRET-1 the store tokenises FTS queries itself
  // (each whitespace token is OR-quoted), so the natural-language search above
  // already recalls on individual terms; this loop is now a redundant recall
  // booster retained pending the EB-1 benchmark rework. It no longer
  // compensates for a library gap.
  const perToken = Math.max(4, Math.floor(topK / 2));
  for (const token of keywordTokens(question)) {
    collect(await memory.semantic.search(scope, token, { topK: perToken }));
  }
  return texts.join('\n');
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
 * full-context baseline feeds the *entire* haystack — only the context differs.
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
 * SOTA-1 baseline: inline the ENTIRE haystack into the prompt — no store, no
 * retrieval window. Every memory-pipeline score is reported against this; on a
 * small corpus the honest result often favours full-context (ConvoMem: full
 * context beats memory systems below ~150 conversations) at a much higher token
 * cost, which the {@link BenchMeter} surfaces. It is the prerequisite for any
 * corpus-size-aware threshold (SOTA-2) — without it, thresholds are picked blind.
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
            return `${turn.role}${stamp}: ${turn.content}`;
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
  /**
   * EB-11 hook: fired once per ACTUAL conversation ingest (a cache miss), NOT
   * per QA case — lets a caller/test confirm a sample's N questions ingest the
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
  // whole (~300-turn) conversation — and, with --consolidate, re-runs the LLM
  // consolidation pass — once per QUESTION. Key the ingested memory by that
  // shared array reference: each conversation is ingested once and its store is
  // reused (read-only) by its other questions; a different conversation is a
  // different array, so it gets a separate store and sample isolation holds.
  // The :memory: stores stay open for the run's lifetime (a short-lived
  // benchmark process) — not closed per case, since later questions of the same
  // sample still read them.
  const ingestCache = new WeakMap<object, Memory>();

  async function ingestConversation(input: MemoryEvalInput): Promise<Memory> {
    const cached = ingestCache.get(input.haystackSessions);
    if (cached !== undefined) return cached;
    const store = await createSqliteStore({ path: ':memory:', disableWalHardening: true });
    await store.init();
    const memory = createMemory({
      store: store.memory as never,
      embeddings: store.embeddings,
      resolveScope: () => scope,
      conflictPipeline: { mode: 'off' },
      consolidator:
        options.consolidate === true
          ? { enabled: true, provider: options.provider, tier: 'standard', defaultScope: scope }
          : { enabled: false },
    });
    for (const session of input.haystackSessions) {
      for (const turn of session.turns) {
        const stamp = turn.timestamp !== undefined ? ` [${turn.timestamp}]` : '';
        await memory.semantic.remember(scope, {
          text: normalizeForFts(`${turn.role}${stamp}: ${turn.content}`),
          sensitivity: 'internal',
        });
      }
    }
    if (options.consolidate === true) {
      await memory.consolidator.fireNow('standard', scope);
    }
    ingestCache.set(input.haystackSessions, memory);
    options.onIngest?.();
    return memory;
  }

  return {
    async run(input: MemoryEvalInput): Promise<string> {
      const memory = await ingestConversation(input);
      const context = await recall(memory, scope, input.question, topK);
      return answerFromContext(options.provider, input, context, options.meter);
    },
  };
}

/** The LongMemEval "J" judge — grades the candidate against the reference answer. */
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
        });
  return runEvals<MemoryEvalInput, string>({
    agent,
    dataset: { cases },
    scorers: [judgeScorer(options.judgeProvider ?? options.provider), abstentionScorer()],
    concurrency: options.concurrency ?? 1,
  });
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
}

/**
 * The RESULTS.md header, stamped with the provider provenance (EB-1) and — when
 * available — the run mode and tokens/query cost axis (SOTA-1). A stub run is
 * labelled `stub (plumbing-only)` so it can never read as a real result.
 */
export function buildResultsHeader(providerLabel: string, meta: ResultsMeta = {}): string {
  const lines = [
    '# LongMemEval — memory-quality benchmark results',
    '',
    `**Graphorin** v${VERSION} · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>`,
    '',
    `**Provider:** ${providerLabel}`,
  ];
  if (meta.mode !== undefined) lines.push(`**Mode:** ${meta.mode}`);
  if (meta.tokensPerQuery !== undefined) {
    lines.push(`**Tokens/query:** ${meta.tokensPerQuery.toFixed(0)}`);
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

export async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  // CLI flags win; env (GRAPHORIN_BENCH_*) fills the gaps. The API key is
  // env-only — never put a secret on the command line.
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
      '[benchmark-longmemeval] no real Provider selected; using the deterministic offline stub — ' +
        'scores are plumbing-only. Pass --provider ollama|llamacpp|openai-compatible (with --model, ' +
        'or the GRAPHORIN_BENCH_* env vars) for meaningful numbers.',
    );
  } else {
    console.log(`[benchmark-longmemeval] provider=${label}`);
  }
  const mode: BenchMode = args.mode ?? 'memory';
  const meter = createBenchMeter();
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
  });
  const tokensPerQuery = meter.queries > 0 ? meter.totalTokens / meter.queries : 0;
  console.log(
    `[benchmark-longmemeval] loader=${args.loader} mode=${mode}${args.ability !== undefined ? ` ability=${args.ability}` : ''} ` +
      `cases=${report.summary.total} passed=${report.summary.passed} failed=${report.summary.failed} ` +
      `avgMs=${report.summary.avgDurationMs.toFixed(2)} tokens/query=${tokensPerQuery.toFixed(0)}`,
  );
  await writeResults(args.results, report, label, { mode, tokensPerQuery });
  if (args.json !== undefined) {
    await writeFile(args.json, JSON.stringify(report, null, 2), 'utf8');
    console.log(`[benchmark-longmemeval] wrote JSON report to ${args.json}`);
  }

  let regression: RegressionReport<MemoryEvalInput, string> | undefined;
  if (args.baseline !== undefined) {
    let baselineText: string | undefined;
    try {
      baselineText = await readFile(args.baseline, 'utf8');
    } catch {
      console.warn(
        `[benchmark-longmemeval] no baseline at ${args.baseline} — skipping regression gate ` +
          '(seed one with --json).',
      );
    }
    if (baselineText !== undefined) {
      const baseline = JSON.parse(baselineText) as EvalReport<MemoryEvalInput, string>;
      regression = detectRegressions(report, baseline, {
        maxPassRateDropPct: 5,
        maxAvgScoreDrop: 0.05,
        // Quality-only gate: real LLM latency swings by whole seconds run to
        // run, so an absolute avg-duration budget would only produce flaky
        // failures here. Explicit even though Infinity is now the default (EB-4).
        maxAvgDurationIncreaseMs: Number.POSITIVE_INFINITY,
      });
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
