/**
 * Graphorin v0.6.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Three-agent orchestration harness — library mode. Wires three
 * `createAgent({...})` calls (Planner / Generator / Evaluator) with
 * the canonical structured-handoff convention
 * (`<artifactRoot>/<runId>/progress/<role>.<seq>.txt`) and runs the
 * Generator + Evaluator inside an `evaluatorOptimizer({...})`
 * self-revision loop. The default `recipe: 'stub'` keeps CI hermetic;
 * `recipe: 'ollama'` swaps in `ollamaAdapter({...})` for a local Ollama
 *
 * `runResearchAndDecideVariant({...})` is the opt-in fan-out variant:
 * the Generator spawns three web-search siblings via
 * `Agent.fanOut({...})` under a `'judge-merge'` strategy, then a
 * minimal `createCitationAgent({ sources, mode: 'inline' })`
 * post-processing step binds claims to sources.
 */

import { readFile } from 'node:fs/promises';
import process from 'node:process';
import {
  type Agent,
  createAgent,
  createProgressIO,
  type EvaluatorOptimizerOutcome,
  type EvaluatorOutcome,
  evaluatorOptimizer,
  type FanOutResult,
  type MergeStrategy,
  type ProgressIO,
  type Rubric,
} from '@graphorin/agent';
import type { AgentEvent, ProgressArtifactRef, Provider, Tracer } from '@graphorin/core';
import { collect } from '@graphorin/core';
import { optionalTracerFromEnv } from '@graphorin/example-trace-helper';
import { createProvider, ollamaAdapter } from '@graphorin/provider';
import { type CitationResult, type CitationSource, createCitationAgent } from './citation-agent.js';
import { LRU_FIXTURE_SOURCE } from './lru-fixture.js';
import {
  COMPARISON_JUDGE_REPLY,
  createStubProvider,
  EVALUATOR_REPLY,
  PLANNER_REPLY,
  ROLE_MARKERS,
  WEB_SEARCH_REPLIES,
} from './stub-provider.js';

/** Canonical version constant — must mirror `package.json`. */
export const VERSION = '0.6.0';

/** Recipe selector — `'stub'` (default, hermetic) or `'ollama'`. */
export type Recipe = 'stub' | 'ollama';

const ALL_RECIPES: ReadonlyArray<Recipe> = ['stub', 'ollama'];

const HARNESS_AGENT_ID = 'three-agent-harness';
const DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
const DEFAULT_LLM_MODEL = 'qwen2.5:7b-instruct-q4_K_M';
const DEFAULT_REQUEST = 'implement a thread-safe LRU cache in TypeScript with tests';
const DEFAULT_RESEARCH_QUESTION =
  'recommend a concurrency strategy for a high-throughput LRU cache';

/** Resolve the configured recipe. Defaults to `'stub'`. */
export function resolveRecipe(env: NodeJS.ProcessEnv = process.env): Recipe {
  const raw = (env.GRAPHORIN_LLM_RECIPE ?? 'stub').trim().toLowerCase();
  if ((ALL_RECIPES as ReadonlyArray<string>).includes(raw)) {
    return raw as Recipe;
  }
  throw new TypeError(
    `[graphorin/example-three-agent-harness] Unknown GRAPHORIN_LLM_RECIPE='${raw}'. ` +
      `Pick one of ${ALL_RECIPES.join(', ')}.`,
  );
}

/** Build the configured `Provider` for the chosen recipe. */
export function buildProvider(recipe: Recipe, env: NodeJS.ProcessEnv = process.env): Provider {
  if (recipe === 'stub') {
    return createProvider(createStubProvider(), {
      acceptsSensitivity: ['public', 'internal', 'secret'],
    });
  }
  const baseUrl = (env.GRAPHORIN_OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL).trim();
  const model = (env.GRAPHORIN_LLM_MODEL ?? DEFAULT_LLM_MODEL).trim();
  return createProvider(ollamaAdapter({ baseUrl, model }), {
    acceptsSensitivity: ['public', 'internal'],
  });
}

/** Inputs shared by every per-role factory. */
export interface RoleFactoryOptions {
  readonly provider: Provider;
  readonly sessionId?: string;
  readonly tracer?: Tracer;
}

/**
 * Build the Planner agent. The Planner receives the user request and
 * returns a structured plan that the Generator consumes via
 * `agent.progress.read(...)`.
 */
export function createPlanner(options: RoleFactoryOptions): Agent<undefined, string> {
  const { provider } = options;
  return createAgent<undefined, string>({
    name: 'planner',
    instructions:
      `${ROLE_MARKERS.planner} You are the Planner agent. ` +
      'Expand the user request into a structured plan with explicit phases, ' +
      'success criteria, and suggested tools. Persist the plan via the ' +
      'structured-handoff artifact convention (the harness does the actual ' +
      'write — your job is to produce the plan text).',
    provider,
    ...(options.sessionId !== undefined ? { sessionId: options.sessionId } : {}),
    ...(options.tracer !== undefined ? { tracer: options.tracer } : {}),
  });
}

/**
 * Build the Generator agent. Receives the user request and the
 * Planner's plan; produces the next unfinished phase of working
 * code.
 */
export function createGenerator(options: RoleFactoryOptions): Agent<undefined, string> {
  const { provider } = options;
  return createAgent<undefined, string>({
    name: 'generator',
    instructions:
      `${ROLE_MARKERS.generator} You are the Generator agent. ` +
      'Read the Planner artifact (handed in via the user message) and ' +
      'implement the next unfinished phase incrementally. Emit working ' +
      'TypeScript and a per-phase progress note suitable for ' +
      '`agent.progress.write({ role: "generator", ... })`.',
    provider,
    ...(options.sessionId !== undefined ? { sessionId: options.sessionId } : {}),
    ...(options.tracer !== undefined ? { tracer: options.tracer } : {}),
  });
}

/**
 * Build the Evaluator agent. Scores the Generator's candidate
 * output against the rubric and returns
 * `{ score, critique, pass }` JSON.
 */
export function createEvaluator(options: RoleFactoryOptions): Agent<undefined, string> {
  const { provider } = options;
  return createAgent<undefined, string>({
    name: 'evaluator',
    instructions:
      `${ROLE_MARKERS.evaluator} You are the Evaluator agent. ` +
      'Score the candidate output 0-10. Reply with a single JSON object ' +
      'matching `{ "score": number, "critique": string, "pass": boolean }`. ' +
      '`pass` is true when `score >= 8`.',
    provider,
    ...(options.sessionId !== undefined ? { sessionId: options.sessionId } : {}),
    ...(options.tracer !== undefined ? { tracer: options.tracer } : {}),
  });
}

/** Build a stubbed web-search sub-agent for the fan-out variant. */
export function createWebSearchAgent(
  options: RoleFactoryOptions & { readonly idx: number },
): Agent<undefined, string> {
  const { provider, idx } = options;
  return createAgent<undefined, string>({
    name: `web-search-${idx}`,
    instructions:
      `${ROLE_MARKERS.webSearch} You are a stubbed web-search sub-agent ` +
      `(index ${idx}). Return one short evidence snippet relevant to the ` +
      'parent request.',
    provider,
    ...(options.sessionId !== undefined ? { sessionId: options.sessionId } : {}),
    ...(options.tracer !== undefined ? { tracer: options.tracer } : {}),
  });
}

/**
 * Build the comparison-judge agent used by the
 * `'judge-merge'` strategy of the research-and-decide fan-out variant.
 */
export function createComparisonJudge(options: RoleFactoryOptions): Agent<undefined, string> {
  const { provider } = options;
  return createAgent<undefined, string>({
    name: 'comparison-judge',
    instructions:
      `${ROLE_MARKERS.comparisonJudge} You are the Comparison Judge. ` +
      'Read the supplied evidence snippets and return a single decision ' +
      'paragraph the parent agent can ship. Cite no sources inline; the ' +
      'citation step downstream owns binding claims to sources.',
    provider,
    ...(options.sessionId !== undefined ? { sessionId: options.sessionId } : {}),
    ...(options.tracer !== undefined ? { tracer: options.tracer } : {}),
  });
}

/** Inputs accepted by {@link runHarness}. */
export interface RunHarnessOptions {
  readonly request: string;
  readonly artifactRoot: string;
  readonly recipe?: Recipe;
  readonly maxIterations?: number;
  readonly providerOverride?: Provider;
  readonly env?: NodeJS.ProcessEnv;
  readonly runId?: string;
  /** When set, loads planner artifacts from this prior run id (same `artifactRoot`) into the Planner prompt. */
  readonly priorRunId?: string;
  readonly sessionId?: string;
}

/** Aggregate result returned by {@link runHarness}. */
export interface RunHarnessResult {
  readonly runId: string;
  readonly recipe: Recipe;
  readonly plan: string;
  readonly outcome: EvaluatorOptimizerOutcome<string>;
  readonly plannerArtifact: ProgressArtifactRef;
  readonly generatorArtifacts: ReadonlyArray<ProgressArtifactRef>;
}

/**
 * Run the full Planner / Generator / Evaluator harness end-to-end.
 *
 * 1. Build a `ProgressIO` bound to `artifactRoot`.
 * 2. Stream the Planner; persist its plan as `planner.001.txt`.
 * 3. Drive `evaluatorOptimizer({...})`:
 *    - Generator iteration N reads the Planner artifact, streams
 *      the Generator agent against the request + prior critique,
 *      persists the candidate as `generator.NNN.txt`.
 *    - Evaluator iteration N parses the Evaluator agent's JSON
 *      reply into an `EvaluatorOutcome`.
 * 4. Return the structured outcome + artifact refs.
 */
export async function runHarness(options: RunHarnessOptions): Promise<RunHarnessResult> {
  const env = options.env ?? process.env;
  const recipe = options.recipe ?? resolveRecipe(env);
  const provider = options.providerOverride ?? buildProvider(recipe, env);
  const progressIO: ProgressIO = createProgressIO({ artifactRoot: options.artifactRoot });
  const runId = options.runId ?? generateRunId();
  const sessionId = options.sessionId ?? `harness-session_${runId}`;
  const maxIterations = options.maxIterations ?? 3;

  const tracer = optionalTracerFromEnv(env);
  const planner = createPlanner({
    provider,
    sessionId,
    ...(tracer !== undefined ? { tracer } : {}),
  });
  const generator = createGenerator({
    provider,
    sessionId,
    ...(tracer !== undefined ? { tracer } : {}),
  });
  const evaluator = createEvaluator({
    provider,
    sessionId,
    ...(tracer !== undefined ? { tracer } : {}),
  });

  let plannerRequest = options.request;
  const priorId = options.priorRunId?.trim();
  if (priorId !== undefined && priorId.length > 0) {
    const priorPlanner = await progressIO.read('', { runId: priorId, role: 'planner' });
    if (priorPlanner.length > 0) {
      const blocks = await Promise.all(
        priorPlanner.map(async (ref) => {
          const body = await readFile(ref.path, 'utf8');
          return `[prior ${ref.role} seq ${ref.seq}]\n${body}`;
        }),
      );
      plannerRequest = `${options.request}\n\n—— Prior run ${priorId} ——\n${blocks.join('\n\n')}`;
    }
  }

  const plan = await streamAgent(planner, plannerRequest, sessionId);
  const plannerArtifact = await progressIO.write(runId, plan, {
    role: 'planner',
    sensitivity: 'internal',
    tags: ['phase:plan'],
  });

  const generatorArtifacts: ProgressArtifactRef[] = [];

  const rubric: Rubric = {
    kind: 'zod',
    instructions:
      'Reply with a single JSON object: { score: number, critique: string, pass: boolean }. ' +
      '`pass` is true when score >= 8.',
  };

  const outcome = await evaluatorOptimizer<string>(options.request, {
    generator: async (input, priorCritique, _iteration) => {
      const refs = await progressIO.read(runId, { role: 'planner' });
      const planSummary = refs
        .map((ref) => `- ${ref.role}.${seqLabel(ref.seq)} @ ${ref.path}`)
        .join('\n');
      const critiqueBlock =
        priorCritique !== undefined && priorCritique.length > 0
          ? `\n\nPrior evaluator critique:\n${priorCritique}`
          : '';
      const generatorInput =
        `Request: ${input}\n\nPlan artifacts:\n${planSummary}\n\n` +
        `Plan body:\n${plan}${critiqueBlock}`;
      const candidate = await streamAgent(generator, generatorInput, sessionId);
      const ref = await progressIO.write(runId, candidate, {
        role: 'generator',
        sensitivity: 'internal',
        tags: ['phase:generate'],
      });
      generatorArtifacts.push(ref);
      return candidate;
    },
    evaluator: async (input, candidate, _rubric, _iteration) => {
      const evalInput =
        `Score the candidate against the original request.\n\n` +
        `Request: ${input}\n\nCandidate:\n${candidate}`;
      const reply = await streamAgent(evaluator, evalInput, sessionId);
      return parseEvaluatorOutcome(reply);
    },
    maxIterations,
    rubric,
    runId,
    sessionId,
    agentId: HARNESS_AGENT_ID,
  });

  return {
    runId,
    recipe,
    plan,
    outcome,
    plannerArtifact,
    generatorArtifacts,
  };
}

/** Inputs accepted by {@link runResearchAndDecideVariant}. */
export interface ResearchAndDecideOptions {
  readonly question: string;
  readonly recipe?: Recipe;
  readonly providerOverride?: Provider;
  readonly env?: NodeJS.ProcessEnv;
  readonly maxConcurrentChildren?: number;
  readonly sources?: ReadonlyArray<CitationSource>;
  readonly sessionId?: string;
}

/** Aggregate result returned by {@link runResearchAndDecideVariant}. */
export interface ResearchAndDecideResult {
  readonly fanOutResult: FanOutResult<string>;
  readonly citationResult: CitationResult;
  readonly recipe: Recipe;
}

/**
 * Run the optional research-and-decide variant. The Generator
 * agent spawns 3 stubbed web-search children via
 * `Agent.fanOut({...})` under `'judge-merge'`; a final
 * `createCitationAgent({ sources, mode: 'inline' })` post-processing
 * step binds claims to source documents.
 */
export async function runResearchAndDecideVariant(
  options: ResearchAndDecideOptions,
): Promise<ResearchAndDecideResult> {
  const env = options.env ?? process.env;
  const recipe = options.recipe ?? resolveRecipe(env);
  const provider = options.providerOverride ?? buildProvider(recipe, env);
  const sessionId = options.sessionId ?? `research-session_${generateRunId()}`;
  const tracer = optionalTracerFromEnv(env);
  const genOpt = { provider, sessionId, ...(tracer !== undefined ? { tracer } : {}) };
  const generator = createGenerator(genOpt);
  const judge = createComparisonJudge(genOpt);

  const childCount = 3;
  const webSearchAgents = Array.from({ length: childCount }, (_, i) =>
    createWebSearchAgent({
      provider,
      idx: i,
      sessionId,
      ...(tracer !== undefined ? { tracer } : {}),
    }),
  );

  const judgeMerge: MergeStrategy<string> = {
    kind: 'judge-merge',
    judge: async (children) => {
      const completed = children
        .filter((c) => c.status === 'completed' && typeof c.output === 'string')
        .map((c) => c.output as string);
      const judgeInput =
        `Question: ${options.question}\n\nEvidence snippets:\n` +
        completed.map((snippet, idx) => `(${idx + 1}) ${snippet}`).join('\n');
      return streamAgent(judge, judgeInput, sessionId);
    },
  };

  const fanOutResult = await generator.fanOut<string>({
    children: webSearchAgents.map((agent, idx) => ({
      agentId: `web-search-${idx}`,
      invoke: () => streamAgent(agent, `${options.question} [child:${idx}]`, sessionId),
    })),
    maxConcurrentChildren: options.maxConcurrentChildren ?? 4,
    mergeStrategy: judgeMerge,
  });

  const sources = options.sources ?? defaultStubSources();
  const citationAgent = createCitationAgent({
    sources,
    mode: 'inline',
    ...(tracer !== undefined ? { tracer } : {}),
  });
  const citationResult = citationAgent.bind(fanOutResult.output);

  return { fanOutResult, citationResult, recipe };
}

/**
 * Default stubbed source list for the research-and-decide variant.
 * Mirrors {@link WEB_SEARCH_REPLIES} so a smoke run of the variant
 * produces deterministic citation bindings.
 */
export function defaultStubSources(): ReadonlyArray<CitationSource> {
  return WEB_SEARCH_REPLIES.map((text, idx) => ({
    id: `src-${idx}`,
    text,
    url: `https://example.invalid/three-agent-harness/source-${idx}`,
  }));
}

/**
 * Stream the supplied agent against the supplied input and return
 * the concatenated `text.delta` payload. Throws on `agent.error`.
 */
async function streamAgent(
  agent: Agent<undefined, string>,
  input: string,
  sessionId: string,
): Promise<string> {
  const events = (await collect(
    agent.stream(input, { sessionId }) as AsyncIterable<AgentEvent<string>>,
  )) as ReadonlyArray<AgentEvent<string>>;
  let buffer = '';
  for (const ev of events) {
    if (ev.type === 'text.delta') {
      buffer += ev.delta;
    } else if (ev.type === 'agent.error') {
      throw new Error(
        `[graphorin/example-three-agent-harness] '${agent.config.name}' failed: ` +
          `${ev.error.code} — ${ev.error.message}`,
      );
    }
  }
  return buffer;
}

/**
 * Parse the Evaluator agent's JSON reply into an
 * {@link EvaluatorOutcome}. Strips fenced code blocks if present;
 * falls back to `{ score: 0, pass: false }` on malformed JSON.
 */
function parseEvaluatorOutcome(text: string): EvaluatorOutcome {
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    const parsed = JSON.parse(cleaned) as {
      readonly score?: unknown;
      readonly pass?: unknown;
      readonly critique?: unknown;
    };
    return {
      score: typeof parsed.score === 'number' ? parsed.score : 0,
      pass: parsed.pass === true,
      critique: typeof parsed.critique === 'string' ? parsed.critique : '',
    };
  } catch {
    return { score: 0, pass: false, critique: text };
  }
}

function generateRunId(): string {
  return `harness_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
}

function seqLabel(seq: number): string {
  return String(seq).padStart(3, '0');
}

/**
 * CLI entry point. Runs the LRU-cache harness against the stub
 * recipe by default and prints a concise status line.
 */
export async function main(args: { readonly env?: NodeJS.ProcessEnv } = {}): Promise<number> {
  const env = args.env ?? process.env;
  const artifactRoot = (env.GRAPHORIN_ARTIFACT_ROOT ?? '').trim();
  const recipe = resolveRecipe(env);
  const root = artifactRoot.length > 0 ? artifactRoot : `./.graphorin/three-agent-harness`;

  const priorRunId = (env.GRAPHORIN_HARNESS_PRIOR_RUN_ID ?? '').trim();
  const result = await runHarness({
    request: env.GRAPHORIN_HARNESS_REQUEST ?? DEFAULT_REQUEST,
    artifactRoot: root,
    recipe,
    env,
    ...(priorRunId.length > 0 ? { priorRunId } : {}),
  });

  process.stdout.write(
    `graphorin v${VERSION} three-agent-harness — recipe='${result.recipe}', ` +
      `runId='${result.runId}', termination='${result.outcome.terminationReason}', ` +
      `iterations=${result.outcome.iterations.length}, ` +
      `finalScore=${result.outcome.finalScore}.\n`,
  );

  if (env.GRAPHORIN_HARNESS_VARIANT === 'research-and-decide') {
    const variant = await runResearchAndDecideVariant({
      question: env.GRAPHORIN_HARNESS_QUESTION ?? DEFAULT_RESEARCH_QUESTION,
      recipe,
      env,
    });
    process.stdout.write(
      `graphorin v${VERSION} three-agent-harness research-and-decide — ` +
        `children=${variant.fanOutResult.children.length}, ` +
        `bound=${variant.citationResult.boundCount}, ` +
        `unbound=${variant.citationResult.unboundCount}.\n`,
    );
  }

  return 0;
}

// Re-export the canonical fixture + replies so callers can assert on
// the same constants the stub provider uses.
export {
  COMPARISON_JUDGE_REPLY,
  EVALUATOR_REPLY,
  LRU_FIXTURE_SOURCE,
  PLANNER_REPLY,
  WEB_SEARCH_REPLIES,
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = await main();
  if (exitCode !== 0) process.exit(exitCode);
}
