/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * The benchmark harness. `runTask` drives the real `createAgent(...)` loop
 * with the deterministic stub provider and folds its `AgentEvent` stream
 * into a {@link Trajectory} (correlating tool calls with their executions)
 * plus a goal-state snapshot. `runToolAgentSuite` scores each task with the
 * five trajectory scorers, repeats every task `k` times, and reports
 * `pass^1` / `pass^k`. A task passes only when all five scorers pass.
 */

import { createAgent } from '@graphorin/agent';
import {
  argumentValidity,
  correctToolSelected,
  finalStateCorrect,
  recoveryAfterError,
  redundantCallDetection,
  type Trajectory,
  type TrajectoryToolCall,
} from '@graphorin/evals/scorers';

import { createMockProvider } from './mock-provider.js';
import { DEFAULT_TASKS, type ToolAgentTask } from './tasks.js';
import {
  createWorld,
  makeRetailTools,
  retailToolSchemas,
  snapshot,
  type WorldSnapshot,
} from './world.js';

const TOOL_SCHEMAS = retailToolSchemas();

export interface ScorerOutcome {
  readonly scorer: string;
  readonly pass: boolean;
  readonly score: number;
  readonly reason?: string;
}

export interface TaskRun {
  readonly trajectory: Trajectory;
  readonly snapshot: WorldSnapshot;
}

/** Run one task once through the live agent loop and record its trajectory. */
export async function runTask(task: ToolAgentTask): Promise<TaskRun> {
  const world = createWorld(task.failOnce !== undefined ? { failOnce: task.failOnce } : {});
  const tools = makeRetailTools(world);
  const provider = createMockProvider({ modelId: 'mock-tool-agent', scripts: task.scripts });
  const agent = createAgent({
    name: 'tool-agent-benchmark',
    instructions: 'Execute the user request using the available tools.',
    provider,
    tools,
    maxParallelTools: 8,
  });

  const meta = new Map<string, { toolName: string; args: unknown }>();
  const calls: TrajectoryToolCall[] = [];
  let finalOutput = '';

  for await (const ev of agent.stream(task.input)) {
    switch (ev.type) {
      case 'tool.call.start':
        meta.set(ev.toolCallId, { toolName: ev.toolName, args: ev.args });
        break;
      case 'tool.call.end': {
        const prev = meta.get(ev.toolCallId);
        meta.set(ev.toolCallId, { toolName: prev?.toolName ?? 'unknown', args: ev.finalArgs });
        break;
      }
      case 'tool.execute.end': {
        const m = meta.get(ev.toolCallId);
        calls.push({
          toolCallId: ev.toolCallId,
          toolName: m?.toolName ?? 'unknown',
          args: m?.args,
          status: 'ok',
          result: ev.result,
        });
        break;
      }
      case 'tool.execute.error': {
        const m = meta.get(ev.toolCallId);
        calls.push({
          toolCallId: ev.toolCallId,
          toolName: m?.toolName ?? 'unknown',
          args: m?.args,
          status: 'error',
          error: { kind: ev.error.kind, message: ev.error.message },
        });
        break;
      }
      case 'text.complete':
        finalOutput = ev.text;
        break;
      default:
        break;
    }
  }

  const snap = snapshot(world);
  return { trajectory: { calls, finalState: snap, finalOutput }, snapshot: snap };
}

function buildScorers(task: ToolAgentTask) {
  return [
    correctToolSelected({
      expected: task.expectedTools,
      ...(task.requireOrder !== undefined ? { requireOrder: task.requireOrder } : {}),
    }),
    argumentValidity({ tools: TOOL_SCHEMAS }),
    redundantCallDetection(),
    recoveryAfterError(),
    finalStateCorrect({ matches: (s) => task.goal(s as WorldSnapshot) }),
  ];
}

/** Score one completed run with the five trajectory scorers. */
export async function scoreRun(task: ToolAgentTask, run: TaskRun): Promise<ScorerOutcome[]> {
  const outcomes: ScorerOutcome[] = [];
  for (const scorer of buildScorers(task)) {
    const result = await scorer.score({
      case: { input: task.input },
      output: run.trajectory,
      durationMs: 0,
    });
    outcomes.push({
      scorer: scorer.name,
      pass: result.pass,
      score: result.score ?? (result.pass ? 1 : 0),
      ...(result.reason !== undefined ? { reason: result.reason } : {}),
    });
  }
  return outcomes;
}

export interface TaskMetrics {
  readonly taskId: string;
  readonly attempts: number;
  readonly passes: number;
  readonly passAt1: boolean;
  readonly passAtK: boolean;
  readonly scorerAverages: Readonly<Record<string, number>>;
  readonly failReasons: ReadonlyArray<string>;
}

export interface SuiteMetrics {
  readonly k: number;
  readonly taskCount: number;
  readonly passAt1: number;
  readonly passAtK: number;
  readonly scorerAverages: Readonly<Record<string, number>>;
  readonly tasks: ReadonlyArray<TaskMetrics>;
}

/**
 * Run the suite `k` times per task and aggregate `pass^1` / `pass^k`. With a
 * deterministic provider each attempt is identical, so `pass^k == pass^1`;
 * the `k`-run loop and "all attempts must pass" semantics are kept so the
 * metric is meaningful the moment a stochastic provider is plugged in.
 */
export async function runToolAgentSuite(
  options: { readonly k?: number; readonly tasks?: ReadonlyArray<ToolAgentTask> } = {},
): Promise<SuiteMetrics> {
  const k = Math.max(1, options.k ?? 3);
  const tasks = options.tasks ?? DEFAULT_TASKS;
  const taskMetrics: TaskMetrics[] = [];

  for (const task of tasks) {
    const attemptPassed: boolean[] = [];
    const perScorer: Record<string, number[]> = {};
    let failReasons: string[] = [];
    for (let i = 0; i < k; i++) {
      const run = await runTask(task);
      const outcomes = await scoreRun(task, run);
      const passed = outcomes.every((o) => o.pass);
      attemptPassed.push(passed);
      for (const o of outcomes) {
        const bucket = perScorer[o.scorer] ?? [];
        bucket.push(o.score);
        perScorer[o.scorer] = bucket;
      }
      if (!passed) {
        failReasons = outcomes
          .filter((o) => !o.pass)
          .map((o) => `${o.scorer}: ${o.reason ?? 'failed'}`);
      }
    }
    const passes = attemptPassed.filter(Boolean).length;
    taskMetrics.push({
      taskId: task.id,
      attempts: k,
      passes,
      passAt1: attemptPassed[0] ?? false,
      passAtK: passes === k,
      scorerAverages: averageMap(perScorer),
      failReasons,
    });
  }

  return {
    k,
    taskCount: tasks.length,
    passAt1: mean(taskMetrics.map((t) => (t.passAt1 ? 1 : 0))),
    passAtK: mean(taskMetrics.map((t) => (t.passAtK ? 1 : 0))),
    scorerAverages: mergeAverages(taskMetrics),
    tasks: taskMetrics,
  };
}

function mean(xs: ReadonlyArray<number>): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

function averageMap(m: Readonly<Record<string, number[]>>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, values] of Object.entries(m)) out[key] = mean(values);
  return out;
}

function mergeAverages(tasks: ReadonlyArray<TaskMetrics>): Record<string, number> {
  const acc: Record<string, number[]> = {};
  for (const t of tasks) {
    for (const [key, value] of Object.entries(t.scorerAverages)) {
      const bucket = acc[key] ?? [];
      bucket.push(value);
      acc[key] = bucket;
    }
  }
  return averageMap(acc);
}
