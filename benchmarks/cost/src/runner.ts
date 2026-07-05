import pkg from '../package.json' with { type: 'json' };
/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Prompt-assembly token-cost regression harness (EB-12).
 *
 * The old harness counted the raw tokens of five hard-coded messages - it
 * could not see the system prompt, the agent instructions, or the advertised
 * tool schemas, so a regression in *prompt assembly* (a fatter system prompt,
 * heavier tool descriptions) was invisible to it. This harness instead drives
 * a real {@link createAgent} turn through an **offline capturing provider** and
 * counts the tokens of the **assembled `ProviderRequest`** the agent actually
 * sends: `systemMessage` + the message transcript + the serialised tool
 * schemas. It does this for several scenarios and fails when any scenario grows
 * beyond the tolerance against `data/baseline.json`.
 *
 * No model, no network. Run with `--update-baseline` to reseed the baseline
 * after an intentional prompt-assembly change.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAgent } from '@graphorin/agent';
import type { Message, Provider, ProviderEvent, ProviderRequest, Tool } from '@graphorin/core';
import { calculateCost } from '@graphorin/pricing';
import { JsTiktokenCounter } from '@graphorin/provider/counters';

export const VERSION = '0.2.0';

/** A Provider that records every assembled request and returns a terminal text reply. */
function createCapturingProvider(): { provider: Provider; captured: ProviderRequest[] } {
  const captured: ProviderRequest[] = [];
  const provider: Provider = {
    name: 'cost-capture',
    modelId: 'mock',
    capabilities: {
      streaming: true,
      toolCalling: true,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: false,
      reasoning: false,
      contextWindow: 200_000,
      maxOutput: 8192,
    },
    async *stream(req: ProviderRequest): AsyncIterable<ProviderEvent> {
      captured.push(req);
      // A text-only terminal reply ends the run after one provider call, so
      // `captured[0]` is exactly the first assembled prompt.
      yield { type: 'stream-start', metadata: { providerName: 'cost-capture', modelId: 'mock' } };
      yield { type: 'text-delta', delta: 'ok' };
      yield {
        type: 'finish',
        finishReason: 'stop',
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      };
    },
    async generate(): Promise<never> {
      throw new Error('cost-capture provider: use stream(...)');
    },
  };
  return { provider, captured };
}

/** A trivial offline `Tool` whose only purpose is to enlarge the advertised schema. */
function makeTool(name: string, description: string): Tool<unknown, unknown, unknown> {
  const inputSchema = {
    parse: (v: unknown) => v,
    safeParse: (v: unknown) => ({ success: true as const, data: v }),
  } as Tool<unknown, unknown, unknown>['inputSchema'];
  return {
    name,
    description,
    inputSchema,
    sideEffectClass: 'read-only',
    async execute() {
      return {};
    },
  };
}

interface Scenario {
  readonly id: string;
  readonly instructions: string;
  readonly tools: ReadonlyArray<Tool<unknown, unknown, unknown>>;
  readonly input: string;
}

const PINNED_INPUT =
  'Remember my favorite color is blue and I work in Milan. What city do I work in?';

/**
 * Scenarios are ordered so a regression is attributable: `bare` is the floor;
 * `with-tools` adds advertised tool schemas; `rich-instructions` adds a longer
 * system prompt. By construction each of the latter two assembles a larger
 * prompt than `bare` - the "prompt assembly is measured" invariant the test
 * pins.
 */
const SCENARIOS: ReadonlyArray<Scenario> = [
  {
    id: 'bare',
    instructions: 'You are a helpful personal assistant.',
    tools: [],
    input: PINNED_INPUT,
  },
  {
    id: 'with-tools',
    instructions: 'You are a helpful personal assistant.',
    tools: [
      makeTool(
        'memory.search',
        'Search the user long-term memory by keyword and return matching facts.',
      ),
      makeTool('memory.write', 'Persist a new salient fact to the user long-term memory store.'),
      makeTool(
        'calendar.lookup',
        'Look up the user calendar for a given day and return scheduled events.',
      ),
    ],
    input: PINNED_INPUT,
  },
  {
    id: 'rich-instructions',
    instructions:
      'You are a meticulous personal assistant. Always ground answers in the provided memory ' +
      'context, never invent facts, cite the originating turn when you can, prefer concise ' +
      'replies, and decline politely when the answer is not present in memory.',
    tools: [],
    input: PINNED_INPUT,
  },
];

/** Drive one scenario through the agent and count the assembled request's tokens. */
async function measureScenario(scenario: Scenario): Promise<number> {
  const { provider, captured } = createCapturingProvider();
  const agent = createAgent({
    name: `cost-${scenario.id}`,
    instructions: scenario.instructions,
    provider,
    ...(scenario.tools.length > 0 ? { tools: [...scenario.tools] } : {}),
  });
  for await (const _ of agent.stream(scenario.input)) {
    // Drain the event stream; the capturing provider already recorded the request.
  }
  const req = captured[0];
  if (req === undefined) {
    throw new Error(`[benchmark-cost] scenario '${scenario.id}' issued no provider request`);
  }
  const counter = new JsTiktokenCounter({});
  const messages: Message[] = [];
  if (req.systemMessage !== undefined && req.systemMessage.length > 0) {
    messages.push({ role: 'system', content: req.systemMessage });
  }
  messages.push(...req.messages);
  let tokens = await counter.count(messages);
  if (req.tools !== undefined && req.tools.length > 0) {
    // The advertised tool schemas count toward the model's prompt budget.
    tokens += await counter.countText(JSON.stringify(req.tools));
  }
  return tokens;
}

interface BaselineFile {
  readonly scenarios: Readonly<Record<string, number>>;
  readonly toleranceRatio: number;
  readonly encoding: string;
  readonly frameworkVersion: string;
}

function pkgRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

function baselinePath(): string {
  return join(pkgRoot(), 'data', 'baseline.json');
}

async function loadBaseline(): Promise<BaselineFile> {
  return JSON.parse(await readFile(baselinePath(), 'utf8')) as BaselineFile;
}

export interface ScenarioResult {
  readonly id: string;
  readonly tokens: number;
  readonly baseline: number;
  readonly ratio: number;
}

export interface CostRegressionReport {
  readonly results: ReadonlyArray<ScenarioResult>;
  readonly worstRatio: number;
  readonly usd: number | null;
}

/** Measure every scenario and compare against the stored baseline. */
export async function runCostRegression(): Promise<CostRegressionReport> {
  const baseline = await loadBaseline();
  const results: ScenarioResult[] = [];
  for (const scenario of SCENARIOS) {
    const tokens = await measureScenario(scenario);
    const base = baseline.scenarios[scenario.id] ?? tokens;
    results.push({ id: scenario.id, tokens, baseline: base, ratio: (tokens - base) / base });
  }
  const worstRatio = results.reduce((m, r) => Math.max(m, r.ratio), Number.NEGATIVE_INFINITY);
  // Nominal USD for the largest assembled prompt, for an at-a-glance figure.
  const worst = results.reduce(
    (a, b) => (b.tokens > a.tokens ? b : a),
    results[0] as ScenarioResult,
  );
  const cost = calculateCost({
    provider: 'openai',
    model: 'gpt-4o-mini-2024-07-18',
    inputTokens: worst?.tokens ?? 0,
    outputTokens: 0,
  });
  return { results, worstRatio, usd: cost?.amount ?? null };
}

/** Measure every scenario by id - used by `--update-baseline` and the test. */
export async function measureAllScenarios(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const scenario of SCENARIOS) {
    out[scenario.id] = await measureScenario(scenario);
  }
  return out;
}

export const SCENARIO_IDS: ReadonlyArray<string> = SCENARIOS.map((s) => s.id);

async function updateBaseline(): Promise<void> {
  const scenarios = await measureAllScenarios();
  const prior = await loadBaseline().catch(() => undefined);
  const next: BaselineFile = {
    scenarios,
    toleranceRatio: prior?.toleranceRatio ?? 0.1,
    encoding: prior?.encoding ?? 'cl100k_base',
    frameworkVersion: pkg.version,
  };
  await writeFile(baselinePath(), `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  console.log(`[benchmark-cost] baseline updated: ${JSON.stringify(scenarios)}`);
}

export async function main(): Promise<void> {
  if (process.argv.includes('--update-baseline')) {
    await updateBaseline();
    return;
  }
  const smoke = process.argv.includes('--smoke');
  const baseline = await loadBaseline();
  const report = await runCostRegression();
  const maxGrowth = baseline.toleranceRatio;
  const bad = report.worstRatio > maxGrowth;

  for (const r of report.results) {
    console.log(
      `[benchmark-cost] ${r.id}: tokens=${r.tokens} baseline=${r.baseline} deltaRatio=${r.ratio.toFixed(4)}`,
    );
  }
  console.log(
    `[benchmark-cost] Graphorin v${VERSION} - worstRatio=${report.worstRatio.toFixed(4)} tolerance=${maxGrowth} - ${
      report.usd !== null
        ? `nominalUsd@gpt-4o-mini-input=${report.usd.toFixed(6)}`
        : 'nominalUsd=unavailable'
    }`,
  );

  if (!smoke) {
    const rows = report.results
      .map(
        (r) => `| ${r.id} | ${String(r.tokens)} | ${String(r.baseline)} | ${r.ratio.toFixed(4)} |`,
      )
      .join('\n');
    await writeFile(
      join(pkgRoot(), 'RESULTS.md'),
      [
        '# Prompt-assembly token cost - results',
        '',
        `**Graphorin** v${VERSION} · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>`,
        '',
        `_Generated: ${new Date().toISOString()}_`,
        '',
        'Tokens of the assembled `ProviderRequest` (system + instructions + tool schemas + transcript) per scenario.',
        '',
        '| Scenario | Tokens | Baseline | Delta ratio |',
        '| --- | --- | --- | --- |',
        rows,
        '',
        `Tolerance ${maxGrowth} · Pass ${bad ? 'no' : 'yes'}`,
        '',
      ].join('\n'),
      'utf8',
    );
  }

  const strict = process.env.COST_REGRESSION_STRICT !== '0' && !smoke;
  if (bad && strict) {
    console.error(
      `[benchmark-cost] regression: a scenario grew by ${(report.worstRatio * 100).toFixed(2)}% (> ${(maxGrowth * 100).toFixed(0)}%)`,
    );
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
