import { realpathSync } from 'node:fs';
import pkg from '../package.json' with { type: 'json' };
/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * HaluMem-format operation-level memory benchmark (wave-D item D1).
 *
 * Unlike the QA-level LongMemEval runner, this harness grades the memory
 * system's WRITE pipeline: every case's sessions are replayed through the
 * real ingest path (`session.push` -> consolidator standard phase ->
 * extraction -> conflict pipeline), then the post-ingest memory state is
 * observed and scored with the `@graphorin/evals` staged scorers:
 * extraction recall / precision, update omission and (on the `qa` stage)
 * the judged hallucination rate.
 *
 * The `--conflict-pipeline on|off` A/B axis is the point of the harness
 * (N-1): update omission with the neighbour-aware
 * extract-reconcile-supersede path ON versus OFF is the value proof for
 * the conflict pipeline. Both legs run with `autoPromoteExtraction: true`
 * (+ a pass-through ingest gate, as the config gate requires) so the
 * write-time promotion hatch is held constant and the A/B isolates the
 * reconcile path - otherwise W-019 pending supersedes would park every
 * update behind quarantine on both legs.
 *
 * deep-retest-0.13.6 P2-Q: the reconcile mid-zone only exists when the
 * store carries a vector signal - run the A/B with `--embedder fake`
 * (or a real embedder via the programmatic path). Without one the
 * store is FTS-only, the embedding three-zone classifier starves the
 * reconcile route, and the on/off legs converge to identical numbers.
 *
 * EB-11 caveat honoured: this harness MUTATES memory per case, so it
 * never shares an ingest cache across cases - every case gets a fresh
 * `:memory:` store.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Fact, Provider, SessionScope } from '@graphorin/core';
import {
  type AgentLike,
  type Case,
  createFakeEmbedder,
  type EvalReport,
  exitOnFailures,
  JUDGE_OFF_FORMAT_MARKER,
  loadHaluMemDataset,
  type MemoryOperationsEvalInput,
  type MemoryOperationsObservation,
  memoryExtractionPrecision,
  memoryExtractionRecall,
  memoryQaHallucination,
  memoryUpdateOmission,
  renderMarkdownReport,
  runEvals,
  type Scorer,
} from '@graphorin/evals';
import { createMemory } from '@graphorin/memory';
import { priceLookupByModel } from '@graphorin/pricing';
import {
  composeProviderMiddleware,
  createCostAccumulator,
  createProvider,
  llamaCppServerAdapter,
  ollamaAdapter,
  openAICompatibleAdapter,
  withCostLimit,
  withCostTracking,
} from '@graphorin/provider';
import { createSqliteStore } from '@graphorin/store-sqlite';

import { createHaluMemStubProvider } from './stub-provider.js';

export const VERSION: string = pkg.version;

/** Conflict-pipeline A/B axis (N-1). Default `'off'` - matches longmemeval. */
export type ConflictPipelineMode = 'on' | 'off';

/** Which stage of the dataset runs. */
export type HaluMemBenchStage = 'operations' | 'qa';

/** A provider request from CLI flags / env, before resolution (EB-1 idiom). */
export interface BenchProviderSpec {
  readonly name?: string;
  readonly model?: string;
  readonly baseUrl?: string;
  readonly apiKey?: string;
}

const REAL_PROVIDER_NAMES = ['ollama', 'llamacpp', 'openai-compatible'] as const;

/** Resolve a provider spec exactly like the longmemeval runner (EB-1). */
export function resolveBenchProvider(spec: BenchProviderSpec = {}): {
  provider: Provider;
  label: string;
} {
  const name = spec.name === undefined || spec.name === '' ? 'stub' : spec.name;
  if (name === 'stub') {
    return { provider: createHaluMemStubProvider(), label: 'stub (plumbing-only)' };
  }
  if (!(REAL_PROVIDER_NAMES as readonly string[]).includes(name)) {
    throw new Error(
      `[benchmark-halumem] unknown --provider '${name}'. Valid: stub, ${REAL_PROVIDER_NAMES.join(', ')}.`,
    );
  }
  const model = spec.model;
  if (model === undefined || model === '') {
    throw new Error(`[benchmark-halumem] --provider ${name} requires --model.`);
  }
  const opts = { acceptsSensitivity: ['public', 'internal'] as const };
  const baseUrl = spec.baseUrl !== undefined && spec.baseUrl !== '' ? spec.baseUrl : undefined;
  if (name === 'ollama') {
    return {
      provider: createProvider(ollamaAdapter({ model, ...(baseUrl ? { baseUrl } : {}) }), opts),
      label: `ollama:${model}`,
    };
  }
  if (name === 'llamacpp') {
    return {
      provider: createProvider(
        llamaCppServerAdapter({ model, ...(baseUrl ? { baseUrl } : {}) }),
        opts,
      ),
      label: `llamacpp:${model}`,
    };
  }
  if (baseUrl === undefined) {
    throw new Error('[benchmark-halumem] --provider openai-compatible requires --base-url.');
  }
  return {
    provider: createProvider(
      openAICompatibleAdapter({ model, baseUrl, ...(spec.apiKey ? { apiKey: spec.apiKey } : {}) }),
      opts,
    ),
    label: `openai-compatible:${model}`,
  };
}

/** Embedder axis (P2-Q): `'fake'` arms the vector leg offline. */
export type BenchEmbedderMode = 'none' | 'fake';

/** Options for {@link createOperationsAgent}. */
export interface OperationsAgentOptions {
  readonly provider: Provider;
  readonly conflictPipeline?: ConflictPipelineMode;
  /**
   * Embedder under test. Default `'none'` (FTS-only store). The
   * conflict A/B needs `'fake'` (or a real embedder) - the reconcile
   * mid-zone is an embedding-similarity band.
   */
  readonly embedder?: BenchEmbedderMode;
  /** Recall depth for the QA stage. Default 8. */
  readonly topK?: number;
}

/**
 * deep-retest-0.13.6 P2-3: a provider/consolidator failure during
 * ingest. Thrown so the evals runner records the cause per case
 * instead of scoring an empty memory as a quality zero.
 */
export class HaluMemInfrastructureError extends Error {
  constructor(detail: string) {
    super(`${INFRA_MARKER} ${detail}`);
    this.name = 'HaluMemInfrastructureError';
  }
}

/** Stable marker `countInfrastructureFailures` scans reasons for. */
export const INFRA_MARKER = '[benchmark-halumem] infrastructure:';

/**
 * Scan a report for cases whose failure is an ingest infrastructure
 * error (the agent threw {@link HaluMemInfrastructureError}) rather
 * than a quality result.
 */
export function countInfrastructureFailures(
  report: EvalReport<MemoryOperationsEvalInput, MemoryOperationsObservation>,
): { count: number; caseIds: string[] } {
  const caseIds = report.results
    .filter((r) => r.scores.some((s) => s.result.reason?.includes(INFRA_MARKER) === true))
    .map((r) => r.caseId);
  return { count: caseIds.length, caseIds };
}

/**
 * deep-retest-0.13.11 P3: scan a report for cases the JUDGE failed to
 * grade (`llmJudge` threw {@link JudgeOffFormatError} after its
 * constrained retry). Those are judge/infrastructure failures - the
 * subject's answer was never scored - and must not be read as subject
 * quality results.
 */
export function countJudgeOffFormatFailures(
  report: EvalReport<MemoryOperationsEvalInput, MemoryOperationsObservation>,
): { count: number; caseIds: string[] } {
  const caseIds = report.results
    .filter((r) =>
      r.scores.some((s) => s.result.reason?.includes(JUDGE_OFF_FORMAT_MARKER) === true),
    )
    .map((r) => r.caseId);
  return { count: caseIds.length, caseIds };
}

/**
 * Minimal structural view of the store's semantic side used for the
 * post-ingest observation (`SemanticMemoryStoreExt.listActive`).
 */
interface ListActiveCapable {
  listActive?(
    scope: SessionScope,
    options?: { readonly limit?: number; readonly excludePendingSupersede?: boolean },
  ): Promise<ReadonlyArray<Fact>>;
}

/**
 * The system under test: replays one case's sessions through the REAL
 * ingest pipeline into a fresh `:memory:` store, fires the standard
 * consolidation phase per session, then observes the recall-eligible
 * memory points (and answers the probe question on QA cases).
 */
export function createOperationsAgent(
  options: OperationsAgentOptions,
): AgentLike<MemoryOperationsEvalInput, MemoryOperationsObservation> {
  const scope: SessionScope = {
    userId: 'halumem-user',
    sessionId: 'halumem-session',
    agentId: 'halumem-agent',
  };
  return {
    async run(input: MemoryOperationsEvalInput): Promise<MemoryOperationsObservation> {
      // EB-11: a fresh store per case - operation-level cases mutate
      // memory, so the longmemeval shared-haystack ingest cache must
      // NOT be reused here.
      const store = await createSqliteStore({ path: ':memory:', disableWalHardening: true });
      await store.init();
      try {
        const memory = createMemory({
          store: store.memory as never,
          embeddings: store.embeddings,
          resolveScope: () => scope,
          conflictPipeline: { mode: options.conflictPipeline ?? 'off' },
          // P2-Q: the fake embedder arms the vector leg so the
          // three-zone classifier has real similarity bands to route
          // through - see the module header.
          ...(options.embedder === 'fake' ? { embedder: createFakeEmbedder() } : {}),
          // Both A/B legs promote synthesized facts at write time (see the
          // module header) - the gate evidence is a pass-through here
          // because the benchmark measures extraction, not admission.
          ingestGate: () => true,
          consolidator: {
            enabled: true,
            provider: options.provider,
            tier: 'standard',
            defaultScope: scope,
            autoPromoteExtraction: true,
          },
        });
        for (const session of input.haystackSessions) {
          for (const turn of session.turns) {
            // The standard-phase transcript already prefixes role +
            // timestamp per line - push the raw turn content.
            const stamp = turn.timestamp !== undefined ? `[${turn.timestamp}] ` : '';
            await memory.session.push(scope, {
              role: turn.role,
              content: `${stamp}${turn.content}`,
            });
          }
          // One standard-phase fire per session mirrors incremental
          // consolidation: later sessions reconcile against the facts the
          // earlier ones produced.
          //
          // P2-3: the consolidator is resilient BY DESIGN - a provider
          // failure comes back as a failed PhaseOutcome, not a throw.
          // Discarding it here is what turned an HTTP 404 into
          // "memoryPoints: []" and a fake quality zero, so surface it
          // (and stamp direct throws - budget preflight etc. - with the
          // same marker so classification is path-independent).
          let outcome: Awaited<ReturnType<typeof memory.consolidator.fireNow>>;
          try {
            outcome = await memory.consolidator.fireNow('standard', scope);
          } catch (err) {
            if (err instanceof HaluMemInfrastructureError) throw err;
            throw new HaluMemInfrastructureError(
              `consolidator standard phase threw: ` +
                `${err instanceof Error ? err.message : String(err)} - ` +
                'provider/ingest failure, NOT a quality result',
            );
          }
          if (
            outcome !== null &&
            (outcome.status === 'failed' ||
              outcome.status === 'deferred' ||
              (outcome.status === 'partial' && outcome.errorMessage !== null))
          ) {
            throw new HaluMemInfrastructureError(
              `consolidator standard phase ${outcome.status}: ` +
                `${outcome.errorMessage ?? 'no error message'} - ` +
                'provider/ingest failure, NOT a quality result',
            );
          }
        }
        const semantic = store.memory.semantic as ListActiveCapable;
        const facts =
          typeof semantic.listActive === 'function'
            ? await semantic.listActive(scope, { limit: 1000 })
            : [];
        const memoryPoints = facts.map((fact) => fact.text);
        let answer: string | undefined;
        if (input.question !== undefined) {
          answer = await answerFromMemory(memory, scope, input.question, options);
        }
        return { memoryPoints, ...(answer !== undefined ? { answer } : {}) };
      } finally {
        await store.close();
      }
    },
  };
}

async function answerFromMemory(
  memory: ReturnType<typeof createMemory>,
  scope: SessionScope,
  question: string,
  options: OperationsAgentOptions,
): Promise<string> {
  const hits = await memory.semantic.search(scope, question, { topK: options.topK ?? 8 });
  const context = hits.map((hit) => `- ${hit.record.text}`).join('\n');
  const response = await options.provider.generate({
    systemMessage:
      'Answer the question ONLY from the supplied memory notes. ' +
      'If the notes do not contain the answer, say you do not have that information.',
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: `Memory notes:\n${context}\n\nQuestion: ${question}` }],
      },
    ],
    temperature: 0,
    maxTokens: 256,
  });
  return response.text ?? '';
}

/** Options for {@link runHaluMemBenchmark}. */
export interface RunHaluMemOptions {
  readonly datasetPath: string;
  readonly stage: HaluMemBenchStage;
  readonly provider: Provider;
  /** evals-04: the judge for the QA stage - never the system under test. */
  readonly judgeProvider?: Provider;
  readonly conflictPipeline?: ConflictPipelineMode;
  /** Embedder axis (P2-Q). Default `'none'`. */
  readonly embedder?: BenchEmbedderMode;
  readonly smoke?: boolean;
  readonly concurrency?: number;
}

/** Run one stage and return the eval report (does not write RESULTS). */
export async function runHaluMemBenchmark(
  options: RunHaluMemOptions,
): Promise<EvalReport<MemoryOperationsEvalInput, MemoryOperationsObservation>> {
  const dataset = await loadHaluMemDataset({ path: options.datasetPath, stage: options.stage });
  let cases: Case<MemoryOperationsEvalInput, MemoryOperationsObservation>[] = [...dataset.cases];
  if (options.smoke === true) cases = cases.slice(0, 2);
  const agent = createOperationsAgent({
    provider: options.provider,
    ...(options.conflictPipeline !== undefined
      ? { conflictPipeline: options.conflictPipeline }
      : {}),
    ...(options.embedder !== undefined ? { embedder: options.embedder } : {}),
  });
  const scorers: Scorer<MemoryOperationsEvalInput, MemoryOperationsObservation>[] =
    options.stage === 'operations'
      ? [memoryExtractionRecall(), memoryExtractionPrecision(), memoryUpdateOmission()]
      : [memoryQaHallucination({ provider: options.judgeProvider ?? options.provider })];
  return runEvals<MemoryOperationsEvalInput, MemoryOperationsObservation>({
    agent,
    dataset: { cases },
    scorers,
    concurrency: options.concurrency ?? 1,
  });
}

/** CLI argument shape produced by {@link parseArgs}. */
export interface CliArgs {
  dataset: string;
  stage: HaluMemBenchStage;
  conflictPipeline?: ConflictPipelineMode;
  embedder?: BenchEmbedderMode;
  smoke: boolean;
  results: string;
  json?: string;
  providerName?: string;
  model?: string;
  baseUrl?: string;
  judgeProviderName?: string;
  judgeModel?: string;
  judgeBaseUrl?: string;
  maxCostUsd?: number;
  /**
   * Deep-retest 0.13.8 P1: opt out of the fail-closed unpriced-model
   * preflight under `--max-cost-usd` (spend stays under-counted).
   */
  allowUnpricedModel: boolean;
  help: boolean;
}

/** A bad invocation (unknown flag, missing value) - report usage, never run. */
export class CliUsageError extends Error {}

/** Printed by `--help`; kept in sync with {@link parseArgs} by test. */
export const USAGE = `Usage: node dist/runner.js [flags]

HaluMem-format operation-level memory benchmark (extraction recall/precision,
update omission, QA hallucination). A bare run replays the committed synthetic
fixture with the offline stub provider - plumbing-only numbers.

Flags:
  --dataset <path>            Dataset file (default: fixtures/halumem.synthetic.json)
  --stage <operations|qa>     Which stage to run (default: operations)
  --conflict-pipeline <on|off> Conflict pipeline under test (default: off) - run
                              both values and compare update omission (N-1)
  --embedder <none|fake>      Embedder under test (default: none). The conflict
                              A/B needs 'fake' (or a real embedder): the
                              reconcile mid-zone is an embedding band, so an
                              FTS-only store converges on/off to the same numbers
  --smoke                     First 2 cases only
  --results <path>            RESULTS markdown output (default: RESULTS.md)
  --json <path>               Write the JSON report
  --provider <name>           stub | ollama | llamacpp | openai-compatible
  --model <id>                Model id (required for real providers)
  --base-url <url>            Provider base URL
  --judge-provider <name>     Dedicated judge provider for the qa stage
  --judge-model <id>          Judge model id
  --judge-base-url <url>      Judge base URL
  --max-cost-usd <n>          Abort when observed provider spend exceeds n USD.
                              Fails closed before the first request when a
                              subject/judge model has no pricing-snapshot entry
  --allow-unpriced-model      Proceed under --max-cost-usd despite unpriced
                              models (their spend stays under-counted)
  --help, -h                  Show this help

Env: GRAPHORIN_BENCH_PROVIDER/MODEL/BASE_URL/API_KEY fill provider gaps;
GRAPHORIN_BENCH_JUDGE_* configure the judge. Secrets are env-only.`;

function pkgRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

/** Parse `argv` (from index 2); throws {@link CliUsageError} on bad input. */
export function parseArgs(argv: ReadonlyArray<string>): CliArgs {
  const args: CliArgs = {
    dataset: join(pkgRoot(), 'fixtures', 'halumem.synthetic.json'),
    stage: 'operations',
    smoke: false,
    results: join(pkgRoot(), 'RESULTS.md'),
    allowUnpricedModel: false,
    help: false,
  };
  const value = (flag: string, next: string | undefined): string => {
    if (next === undefined) throw new CliUsageError(`flag '${flag}' requires a value`);
    return next;
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i] as string;
    const next = argv[i + 1];
    if (a === '--') continue;
    if (a === '--dataset') {
      args.dataset = value(a, next);
      i++;
    } else if (a === '--stage') {
      const stage = value(a, next);
      if (stage !== 'operations' && stage !== 'qa') {
        throw new CliUsageError(`--stage must be 'operations' or 'qa', got '${stage}'`);
      }
      args.stage = stage;
      i++;
    } else if (a === '--conflict-pipeline') {
      const mode = value(a, next);
      if (mode !== 'on' && mode !== 'off') {
        throw new CliUsageError(`--conflict-pipeline must be 'on' or 'off', got '${mode}'`);
      }
      args.conflictPipeline = mode;
      i++;
    } else if (a === '--embedder') {
      const mode = value(a, next);
      if (mode !== 'none' && mode !== 'fake') {
        throw new CliUsageError(`--embedder must be 'none' or 'fake', got '${mode}'`);
      }
      args.embedder = mode;
      i++;
    } else if (a === '--results') {
      args.results = value(a, next);
      i++;
    } else if (a === '--json') {
      args.json = value(a, next);
      i++;
    } else if (a === '--provider') {
      args.providerName = value(a, next);
      i++;
    } else if (a === '--model') {
      args.model = value(a, next);
      i++;
    } else if (a === '--base-url') {
      args.baseUrl = value(a, next);
      i++;
    } else if (a === '--judge-provider') {
      args.judgeProviderName = value(a, next);
      i++;
    } else if (a === '--judge-model') {
      args.judgeModel = value(a, next);
      i++;
    } else if (a === '--judge-base-url') {
      args.judgeBaseUrl = value(a, next);
      i++;
    } else if (a === '--max-cost-usd') {
      const ceiling = Number.parseFloat(value(a, next));
      if (!Number.isFinite(ceiling) || ceiling <= 0) {
        throw new CliUsageError(`--max-cost-usd must be a positive number, got '${next}'`);
      }
      args.maxCostUsd = ceiling;
      i++;
    } else if (a === '--allow-unpriced-model') {
      args.allowUnpricedModel = true;
    } else if (a === '--smoke') {
      args.smoke = true;
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    } else {
      throw new CliUsageError(
        `unknown ${a.startsWith('-') ? 'flag' : 'argument'} '${a}'. Run with --help for usage.`,
      );
    }
  }
  return args;
}

/**
 * D1 (W-084): shared run-level USD ceiling over the resolved providers -
 * same shape as the longmemeval helper. deep-retest-0.13.6 P2-4: the
 * bundled pricing snapshot prices the usage (`priceLookupByModel`) so
 * the ceiling actually observes spend - without a lookup the
 * accumulator saw $0 and `--max-cost-usd` was honestly-warned but
 * UNENFORCED. Providers whose models are absent from the snapshot
 * still keep the ceiling inert; `main()` warns when that happens.
 */
export function withBenchCostCeiling(maxCostUsd: number): {
  wrap: (provider: Provider) => Provider;
  observedCostUsd: () => number;
  unpricedModels: () => ReadonlyArray<string>;
} {
  const accumulator = createCostAccumulator();
  const unpriced = new Set<string>();
  const observedCostUsd = (): number => {
    let total = 0;
    for (const totals of accumulator.totals().values()) total += totals.costUsd;
    return total;
  };
  const wrap = composeProviderMiddleware([
    withCostLimit({
      maxPerRun: maxCostUsd,
      onExceed: 'throw',
      resolveObservedCost: () => observedCostUsd(),
    }),
    withCostTracking({
      onUsage: accumulator.onUsage,
      // Deep-retest 0.13.7 P3: record the models the snapshot cannot
      // price so reports can stamp `costPricingMatched: false` instead
      // of silently under-counting observed spend.
      priceLookup: (info) => {
        const rates = priceLookupByModel(info);
        if (rates === null) unpriced.add(info.modelId);
        return rates;
      },
    }),
  ]);
  return { wrap, observedCostUsd, unpricedModels: () => [...unpriced] };
}

/**
 * Deep-retest 0.13.8 P1: `--max-cost-usd` preflight. A model the pricing
 * snapshot cannot price contributes $0 to the shared accumulator, so the
 * ceiling silently under-observes its spend - with an unpriced subject
 * AND judge the cap is fully inert. Mirror the agent-level precedent
 * (`RunBudget.onUnpriced` defaults to `'fail'`): resolve pricing for
 * every capped provider BEFORE the first request and fail closed unless
 * the operator explicitly accepts under-counting.
 */
export function preflightUnpricedModels(providers: ReadonlyArray<Provider>): ReadonlyArray<string> {
  const unpriced = new Set<string>();
  for (const provider of providers) {
    if (priceLookupByModel({ modelId: provider.modelId }) === null) {
      unpriced.add(provider.modelId);
    }
  }
  return [...unpriced];
}

/**
 * Deep-retest 0.13.9 P2: the report stamps must union the preflight
 * knowledge with the ceiling's observations. The ceiling's set fills
 * only when a usage response arrives, so a run that fails before the
 * first response would otherwise stamp `costPricingMatched: true` for
 * a model the preflight already knew it cannot price.
 */
export function combineUnpricedModels(
  preflight: ReadonlyArray<string>,
  observed: ReadonlyArray<string>,
): ReadonlyArray<string> {
  return [...new Set([...preflight, ...observed])];
}

function buildResultsHeader(
  providerLabel: string,
  meta: {
    stage: HaluMemBenchStage;
    conflictPipeline: ConflictPipelineMode;
    embedder: BenchEmbedderMode;
    judge?: string;
    observedCostUsd?: number;
    maxCostUsd?: number;
    unpricedModels?: ReadonlyArray<string>;
  },
): string {
  return [
    '# HaluMem-format - operation-level memory benchmark results',
    '',
    `**Graphorin** v${VERSION} · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>`,
    '',
    `**Provider:** ${providerLabel}`,
    `**Stage:** ${meta.stage}`,
    `**Conflict pipeline:** ${meta.conflictPipeline}`,
    `**Embedder:** ${meta.embedder}`,
    ...(meta.judge !== undefined ? [`**Judge:** ${meta.judge}`] : []),
    ...(meta.observedCostUsd !== undefined
      ? [
          `**Observed cost (USD):** $${meta.observedCostUsd.toFixed(6)} (cap $${meta.maxCostUsd})${
            (meta.unpricedModels?.length ?? 0) > 0
              ? ` - NO snapshot price for: ${(meta.unpricedModels ?? []).join(', ')} (spend under-counted)`
              : ''
          }`,
        ]
      : []),
    '',
    `_Generated: ${new Date().toISOString()}_`,
    '',
  ].join('\n');
}

export async function main(): Promise<void> {
  let args: CliArgs;
  try {
    args = parseArgs(process.argv);
  } catch (error) {
    if (error instanceof CliUsageError) {
      console.error(`[benchmark-halumem] ${error.message}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
  if (args.help) {
    console.log(USAGE);
    return;
  }
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
      '[benchmark-halumem] no real Provider selected; using the deterministic offline stub - ' +
        'scores are plumbing-only.',
    );
  } else {
    console.log(`[benchmark-halumem] provider=${label}`);
  }
  const judgeName = args.judgeProviderName ?? process.env.GRAPHORIN_BENCH_JUDGE_PROVIDER;
  const judgeModel = args.judgeModel ?? process.env.GRAPHORIN_BENCH_JUDGE_MODEL;
  const judgeBaseUrl = args.judgeBaseUrl ?? process.env.GRAPHORIN_BENCH_JUDGE_BASE_URL;
  const judgeApiKey = process.env.GRAPHORIN_BENCH_JUDGE_API_KEY ?? apiKey;
  let judgeResolved =
    judgeName !== undefined && judgeName !== ''
      ? resolveBenchProvider({
          name: judgeName,
          ...(judgeModel !== undefined ? { model: judgeModel } : {}),
          ...(judgeBaseUrl !== undefined ? { baseUrl: judgeBaseUrl } : {}),
          ...(judgeApiKey !== undefined ? { apiKey: judgeApiKey } : {}),
        })
      : undefined;
  if (args.stage === 'qa' && judgeResolved === undefined && !label.startsWith('stub')) {
    console.warn(
      '[benchmark-halumem] qa stage without --judge-provider: the system under test grades ' +
        'ITSELF (evals-04) - numbers are not comparable across systems.',
    );
  }
  let ceiling: ReturnType<typeof withBenchCostCeiling> | undefined;
  let preflightUnpriced: ReadonlyArray<string> = [];
  let sutProvider = provider;
  if (args.maxCostUsd !== undefined) {
    // Deep-retest 0.13.8 P1: fail closed BEFORE the first request when the
    // cap cannot observe a model's spend, instead of running with a
    // silently porous ceiling (agent `RunBudget.onUnpriced` precedent).
    const unpriced = preflightUnpricedModels([
      provider,
      ...(judgeResolved !== undefined ? [judgeResolved.provider] : []),
    ]);
    preflightUnpriced = unpriced;
    if (unpriced.length > 0 && !args.allowUnpricedModel) {
      console.error(
        `[benchmark-halumem] --max-cost-usd cannot observe spend for: ${unpriced.join(', ')} ` +
          '(no pricing-snapshot entry). Use a model id the snapshot prices, refresh the ' +
          'snapshot, or pass --allow-unpriced-model to accept under-counted spend.',
      );
      process.exitCode = 1;
      return;
    }
    if (unpriced.length > 0) {
      console.warn(
        '[benchmark-halumem] --allow-unpriced-model: proceeding although the ceiling cannot ' +
          `observe spend for: ${unpriced.join(', ')} - costPricingMatched=false in benchConfig.`,
      );
    }
    ceiling = withBenchCostCeiling(args.maxCostUsd);
    sutProvider = ceiling.wrap(provider);
    if (judgeResolved !== undefined) {
      judgeResolved = { ...judgeResolved, provider: ceiling.wrap(judgeResolved.provider) };
    }
    console.log(`[benchmark-halumem] run-level cost ceiling: $${args.maxCostUsd}`);
  }
  const conflictPipeline: ConflictPipelineMode = args.conflictPipeline ?? 'off';
  const embedder: BenchEmbedderMode = args.embedder ?? 'none';
  if (conflictPipeline === 'on' && embedder === 'none') {
    console.warn(
      '[benchmark-halumem] --conflict-pipeline on with --embedder none: the reconcile ' +
        'mid-zone is an embedding band, so an FTS-only store starves the reconcile route ' +
        'and the A/B legs converge - pass --embedder fake for a meaningful comparison (P2-Q).',
    );
  }
  const report = await runHaluMemBenchmark({
    datasetPath: args.dataset,
    stage: args.stage,
    provider: sutProvider,
    ...(judgeResolved !== undefined ? { judgeProvider: judgeResolved.provider } : {}),
    conflictPipeline,
    embedder,
    smoke: args.smoke,
  });
  // P2-3: ingest failures (provider HTTP errors, consolidator faults)
  // are infrastructure, not quality - name them before any score line
  // so `0/N passed` can never masquerade as a measured quality zero.
  const infra = countInfrastructureFailures(report);
  if (infra.count > 0) {
    console.error(
      `[benchmark-halumem] status=INFRASTRUCTURE_FAILED cases=${infra.count}/${report.summary.total} ` +
        `(${infra.caseIds.join(', ')}): provider/consolidator errors during ingest - ` +
        'the scores below are NOT quality results. First error is recorded per case in the report.',
    );
    process.exitCode = 1;
  }
  // deep-retest-0.13.11 P3: a judge that returns an off-format/empty
  // grading reply is a JUDGE failure - the subject's answer was never
  // scored, so name it separately from subject quality (still non-zero
  // exit: an ungraded case is not a green case).
  const judgeOffFormat = countJudgeOffFormatFailures(report);
  if (judgeOffFormat.count > 0) {
    console.error(
      `[benchmark-halumem] status=JUDGE_FAILED cases=${judgeOffFormat.count}/${report.summary.total} ` +
        `(${judgeOffFormat.caseIds.join(', ')}): the judge returned off-format/empty replies even ` +
        'after the constrained retry - these subject answers were NOT graded. Treat as a ' +
        'judge/infrastructure failure, not a subject quality result; prefer a stronger judge model.',
    );
    process.exitCode = 1;
  }
  if (ceiling !== undefined && ceiling.observedCostUsd() === 0) {
    console.warn(
      '[benchmark-halumem] --max-cost-usd was set but the providers reported zero usage cost, ' +
        'so the ceiling could not observe spend (PS-8) - it was effectively UNENFORCED.',
    );
  }
  // Deep-retest 0.13.7 P3: the run's actual spend was tracked but never
  // reported - it could only be reconstructed from the billing console.
  // Deep-retest 0.13.9 P2: stamps below use the preflight/observed
  // union so a fail-before-usage run cannot claim pricing matched.
  const allUnpriced =
    ceiling !== undefined ? combineUnpricedModels(preflightUnpriced, ceiling.unpricedModels()) : [];
  if (ceiling !== undefined) {
    if (allUnpriced.length > 0) {
      console.warn(
        `[benchmark-halumem] no snapshot price for: ${allUnpriced.join(', ')} - ` +
          'observed cost under-counts their usage (costPricingMatched=false in benchConfig).',
      );
    }
    console.log(
      `[benchmark-halumem] observed cost: $${ceiling.observedCostUsd().toFixed(6)} ` +
        `(cap $${args.maxCostUsd})`,
    );
  }
  // P2-3 (deep retest 2026-07-19): a stub run's pass/fail counts are
  // plumbing-only noise, and `passed=0` reads like a failed quality
  // gate to anyone skimming CI logs. Stub summaries lead with an
  // explicit UNSCORED status (deep retest 0.13.1: `scored=not-scored`
  // buried mid-line still read as a green quality result) so nobody
  // mistakes an infrastructure smoke for a memory-quality proof;
  // real-provider runs keep the honest counts (and gate on them).
  if (label.startsWith('stub')) {
    console.log(
      `[benchmark-halumem] status=UNSCORED stage=${args.stage} ` +
        `conflictPipeline=${conflictPipeline} embedder=${embedder} cases=${report.summary.total} ` +
        '(infrastructure smoke only - no quality claim; scored runs need a ' +
        'real provider + dataset)',
    );
  } else {
    console.log(
      `[benchmark-halumem] stage=${args.stage} conflictPipeline=${conflictPipeline} ` +
        `embedder=${embedder} cases=${report.summary.total} passed=${report.summary.passed} ` +
        `failed=${report.summary.failed}`,
    );
  }
  const benchConfig = {
    stage: args.stage,
    conflictPipeline,
    embedder,
    provider: label,
    ...(judgeResolved !== undefined ? { judge: judgeResolved.label } : {}),
    ...(args.maxCostUsd !== undefined ? { maxCostUsd: args.maxCostUsd } : {}),
    ...(args.allowUnpricedModel ? { allowUnpricedModel: true } : {}),
    ...(ceiling !== undefined
      ? {
          observedCostUsd: ceiling.observedCostUsd(),
          costPricingMatched: allUnpriced.length === 0,
          ...(allUnpriced.length > 0 ? { unpricedModels: allUnpriced } : {}),
        }
      : {}),
    ...(infra.count > 0 ? { infrastructureFailedCases: infra.caseIds } : {}),
    ...(judgeOffFormat.count > 0 ? { judgeOffFormatCases: judgeOffFormat.caseIds } : {}),
  };
  await mkdir(dirname(args.results), { recursive: true });
  await writeFile(
    args.results,
    `${buildResultsHeader(label, {
      stage: args.stage,
      conflictPipeline,
      embedder,
      ...(judgeResolved !== undefined ? { judge: judgeResolved.label } : {}),
      ...(ceiling !== undefined && args.maxCostUsd !== undefined
        ? {
            observedCostUsd: ceiling.observedCostUsd(),
            maxCostUsd: args.maxCostUsd,
            unpricedModels: allUnpriced,
          }
        : {}),
    })}${renderMarkdownReport(report)}`,
    'utf8',
  );
  if (args.json !== undefined) {
    await writeFile(args.json, JSON.stringify({ ...report, benchConfig }, null, 2), 'utf8');
    console.log(`[benchmark-halumem] wrote JSON report to ${args.json}`);
  }
  // A stub run never gates on scores (plumbing-only); real runs fail on
  // failed cases so CI dispatch jobs surface quality regressions.
  if (!label.startsWith('stub')) exitOnFailures(report);
}

if (
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) ===
    (() => {
      try {
        return realpathSync(process.argv[1]);
      } catch {
        return process.argv[1];
      }
    })()
) {
  await main();
}
