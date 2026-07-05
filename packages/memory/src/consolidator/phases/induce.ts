/**
 * Procedural memory extraction (P2-2) - AWM-style workflow induction. From
 * a **successful** agent trajectory, distil a reusable procedure: a goal, a
 * value-abstracted step sequence (`"search for {product}"`), the variable
 * names that abstraction introduced, and Voyager-style success criteria the
 * reuse can self-verify against. The induced procedure is stored in the
 * procedural tier **quarantined** + `provenance: 'induction'` (P1-4) -
 * procedures drive *actions*, so this is the highest-poisoning-risk write in
 * the system and must never bypass the quarantine gate.
 *
 * Provider-agnostic seam, mirroring the P2-3 / P2-4 retrieval seams: pure
 * request builder ({@link buildInductionRequest}) + tolerant pure parser
 * ({@link parseInducedProcedure}) + a resilient provider-backed inducer
 * ({@link createProviderWorkflowInducer}) + a pure orchestrator
 * ({@link runWorkflowInduction}) that does no I/O of its own. The module
 * imports only `@graphorin/core` types, so the default (no-inducer) path is
 * fully offline - induction only ever calls a model when a provider is wired
 * via `createMemory({ procedureInduction: { provider } })`.
 *
 * "Capture the trajectory + success signal" (the proposal's agent-side
 * dependency) needs **no agent change**: the agent already emits the full,
 * serializable {@link RunState} (`steps[]` + `messages[]` + `status`).
 * {@link trajectoryFromRunState} distils it into the minimal
 * {@link Trajectory} the inducer consumes - `succeeded = status ===
 * 'completed'` is the AWM online-mode success signal (no ground truth
 * needed).
 *
 * @packageDocumentation
 */

import type { Message, Provider, ProviderRequest, RunState } from '@graphorin/core';

/** Output-token ceiling for one induction call. */
export const DEFAULT_INDUCTION_MAX_TOKENS = 512;

/** Hard cap on steps in an induced procedure (defends against runaway output). */
export const MAX_PROCEDURE_STEPS = 50;

/** Upper bound on trajectory steps rendered into the induction prompt. */
export const MAX_TRAJECTORY_STEPS_SHOWN = 60;

/** Matches `{snake_case}` / `{kebab-case}` variable placeholders in a step. */
const VARIABLE_PLACEHOLDER = /\{([a-zA-Z][\w-]*)\}/gu;

/**
 * One distilled step of an agent trajectory - model-agnostic, so the
 * inducer never sees raw provider/tool wire formats.
 *
 * @stable
 */
export interface TrajectoryStep {
  /** Tool invoked at this step, when the step was a tool call. */
  readonly tool?: string;
  /** Concrete args / observation rendered to text (the value-abstraction source). */
  readonly detail?: string;
}

/**
 * The minimal trajectory an inducer needs: the goal, the ordered steps, and
 * whether the run succeeded. Induction fires on **success only** (AWM online
 * mode) - {@link runWorkflowInduction} returns `null` for a failed run.
 *
 * @stable
 */
export interface Trajectory {
  /** What the run set out to do (typically the first user message). */
  readonly goal: string;
  /** Ordered steps the agent took. */
  readonly steps: ReadonlyArray<TrajectoryStep>;
  /** Whether the run succeeded - the induction gate. */
  readonly succeeded: boolean;
}

/**
 * A reusable workflow distilled from a successful trajectory.
 *
 * @stable
 */
export interface InducedProcedure {
  /** Short imperative title / goal of the reusable workflow. */
  readonly title: string;
  /** Ordered, value-abstracted steps (`"search for {product}"`, …). */
  readonly steps: ReadonlyArray<string>;
  /** Variable names abstracted from concrete values (`"product"`, `"day"`). */
  readonly variables: ReadonlyArray<string>;
  /** Voyager-style verifiable success criteria for self-verification on reuse. */
  readonly successCriteria: ReadonlyArray<string>;
}

/** Per-call options for an induction request. */
export interface WorkflowInductionOptions {
  /** Output-token ceiling. Default {@link DEFAULT_INDUCTION_MAX_TOKENS}. */
  readonly maxTokens?: number;
  readonly signal?: AbortSignal;
}

/**
 * Provider-agnostic seam: turn one successful trajectory into a procedure.
 * Returns `null` when nothing inducible (degraded provider, empty output) -
 * never throws.
 *
 * @stable
 */
export interface WorkflowInducer {
  induce(
    trajectory: Trajectory,
    options?: WorkflowInductionOptions,
  ): Promise<InducedProcedure | null>;
}

/** Result of self-verifying a reuse against an induced procedure's criteria. */
export interface VerificationResult {
  /** True only when the procedure has criteria and every one is met. */
  readonly verified: boolean;
  /** Criteria not satisfied by the observed signals. */
  readonly unmet: ReadonlyArray<string>;
}

export const INDUCTION_SYSTEM_PROMPT = [
  'You are the workflow-induction step of a long-running agent memory. Given the goal and the',
  'sequence of steps an agent took to SUCCEED at a task, distil a reusable procedure a future',
  'agent could follow for the same kind of task. Abstract concrete values into {snake_case}',
  'variables (e.g. "dry cat food" → {product}, "Monday" → {day}) so the procedure generalizes;',
  'keep the steps short and imperative. Also state a few verifiable success criteria - concrete,',
  'checkable conditions that indicate the task is done. Do NOT invent steps that did not occur.',
  'Return strictly JSON: { "title": string, "steps": string[], "variables": string[],',
  '"successCriteria": string[] }.',
].join(' ');

/**
 * Build the (pure) induction request. Renders the trajectory as numbered
 * steps; caps the rendered steps to keep the prompt bounded.
 */
export function buildInductionRequest(
  trajectory: Trajectory,
  options: WorkflowInductionOptions = {},
): ProviderRequest {
  const stepLines = trajectory.steps
    .slice(0, MAX_TRAJECTORY_STEPS_SHOWN)
    .map((step, i) => {
      const head = step.tool !== undefined && step.tool.length > 0 ? step.tool : 'step';
      return step.detail !== undefined && step.detail.length > 0
        ? `[${i + 1}] ${head}: ${step.detail}`
        : `[${i + 1}] ${head}`;
    })
    .join('\n');
  const content = [
    `Goal: ${trajectory.goal.length > 0 ? trajectory.goal : '(unstated)'}`,
    '',
    'Trajectory (the steps the agent took to succeed):',
    stepLines.length > 0 ? stepLines : '(none)',
    '',
    'Distil the reusable procedure.',
  ].join('\n');
  return {
    messages: [{ role: 'user', content }],
    systemMessage: INDUCTION_SYSTEM_PROMPT,
    temperature: 0,
    maxTokens: options.maxTokens ?? DEFAULT_INDUCTION_MAX_TOKENS,
    ...(options.signal !== undefined ? { signal: options.signal } : {}),
    outputType: { kind: 'structured' },
  };
}

/**
 * Parse the induction response into an {@link InducedProcedure}, tolerating
 * chatty / fenced output. Returns `null` when absent / unparseable / it
 * yields no steps. **Never throws on model output** - only normalizes.
 *
 * The returned `variables` are reconciled with the steps: every `{name}`
 * placeholder actually present in the steps is guaranteed to appear, so the
 * abstraction is grounded in the procedure rather than in a model-declared
 * list that may drift from it.
 *
 * @internal
 */
export function parseInducedProcedure(text: string | undefined): InducedProcedure | null {
  if (text === undefined || text.length === 0) return null;
  const parsed = tryParseObject(stripFence(text).trim());
  if (!isRecord(parsed)) return null;
  return normalizeInducedProcedure({
    title: typeof parsed.title === 'string' ? parsed.title : '',
    steps: toStringArray(parsed.steps),
    variables: toStringArray(parsed.variables),
    successCriteria: toStringArray(parsed.successCriteria ?? parsed.success_criteria),
  });
}

/**
 * Normalize a raw induced procedure: trim + drop empty entries, cap step
 * count, and reconcile the variable list with the placeholders actually used
 * in the steps. Returns `null` when no usable steps remain (nothing to
 * induce).
 *
 * @internal
 */
export function normalizeInducedProcedure(raw: {
  title: string;
  steps: ReadonlyArray<string>;
  variables: ReadonlyArray<string>;
  successCriteria: ReadonlyArray<string>;
}): InducedProcedure | null {
  const steps = raw.steps
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, MAX_PROCEDURE_STEPS);
  if (steps.length === 0) return null;

  // Variables = placeholders actually in the steps (source of truth, keeps
  // the abstraction grounded), unioned with any extra model-declared names.
  const fromSteps = extractPlaceholders(steps);
  const declared = raw.variables.map((v) => normalizeVariableName(v)).filter((v) => v.length > 0);
  const variables = dedupe([...fromSteps, ...declared]);

  const successCriteria = dedupe(
    raw.successCriteria.map((c) => c.trim()).filter((c) => c.length > 0),
  );
  const title = raw.title.trim().length > 0 ? raw.title.trim() : (steps[0] ?? 'induced procedure');
  return { title, steps, variables, successCriteria };
}

/**
 * Resilient provider-backed inducer. A provider throw or unparseable output
 * degrades to `null` (no procedure) - induction never breaks the write path.
 */
export function createProviderWorkflowInducer(
  provider: Provider,
  options: {
    readonly maxTokens?: number;
    /**
     * Usage callback (MCON-15) - induction is the framework's highest
     * poisoning-risk LLM spend and previously flowed past every budget
     * envelope. `createMemory` wires this into the consolidator budget
     * when one is enabled; standalone callers can record it themselves.
     * Best-effort: a throwing callback never breaks induction.
     */
    readonly onUsage?: (usage: {
      readonly promptTokens: number;
      readonly completionTokens: number;
    }) => void;
  } = {},
): WorkflowInducer {
  return {
    async induce(trajectory, callOptions = {}): Promise<InducedProcedure | null> {
      const merged: WorkflowInductionOptions = {
        maxTokens: callOptions.maxTokens ?? options.maxTokens ?? DEFAULT_INDUCTION_MAX_TOKENS,
        ...(callOptions.signal !== undefined ? { signal: callOptions.signal } : {}),
      };
      try {
        const res = await provider.generate(buildInductionRequest(trajectory, merged));
        try {
          options.onUsage?.({
            promptTokens: res.usage.promptTokens,
            completionTokens: res.usage.completionTokens,
          });
        } catch {
          // Accounting is advisory; never break the induction result.
        }
        return parseInducedProcedure(res.text);
      } catch {
        return null;
      }
    },
  };
}

/**
 * Pure orchestrator: induce a procedure from a trajectory.
 *
 * **Gate - successful trajectories only** (AWM online mode): a failed /
 * aborted run, or one with no steps, yields `null` without calling the
 * inducer. Otherwise the inducer runs and the result is normalized.
 */
export async function runWorkflowInduction(
  trajectory: Trajectory,
  inducer: WorkflowInducer,
  options: WorkflowInductionOptions = {},
): Promise<InducedProcedure | null> {
  if (!trajectory.succeeded) return null;
  if (trajectory.steps.length === 0) return null;
  const induced = await inducer.induce(trajectory, options);
  if (induced === null) return null;
  return normalizeInducedProcedure({
    title: induced.title,
    steps: induced.steps,
    variables: induced.variables,
    successCriteria: induced.successCriteria,
  });
}

/**
 * Distil a {@link RunState} into the minimal {@link Trajectory} the inducer
 * needs. Pure - consumes the agent's already-emitted run state, so capturing
 * a trajectory + its success signal needs no agent-loop change. The success
 * signal is `status === 'completed'`.
 */
export function trajectoryFromRunState(run: RunState): Trajectory {
  const steps: TrajectoryStep[] = [];
  for (const step of run.steps) {
    for (const tc of step.toolCalls) {
      const detail = renderArgs(tc.call.args);
      steps.push({
        tool: tc.call.toolName,
        ...(detail !== undefined ? { detail } : {}),
      });
    }
  }
  return {
    goal: firstUserText(run.messages) ?? '',
    steps,
    succeeded: run.status === 'completed',
  };
}

/**
 * Self-verify a reuse against an induced procedure's success criteria. A
 * criterion is met when any observed signal contains it (case-insensitive
 * substring) - a deterministic, offline check the agent runtime can feed
 * actual run observations into on reuse. With **no criteria**, the reuse
 * cannot be self-verified, so `verified` is `false`.
 */
export function checkSuccessCriteria(
  procedure: { readonly successCriteria?: ReadonlyArray<string> },
  observed: ReadonlyArray<string>,
): VerificationResult {
  const criteria = (procedure.successCriteria ?? [])
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  if (criteria.length === 0) return { verified: false, unmet: [] };
  const haystack = observed.map((o) => o.toLowerCase());
  const unmet = criteria.filter((c) => !haystack.some((o) => o.includes(c.toLowerCase())));
  return { verified: unmet.length === 0, unmet };
}

// ── helpers ──────────────────────────────────────────────────────────────

function extractPlaceholders(steps: ReadonlyArray<string>): string[] {
  const out: string[] = [];
  for (const step of steps) {
    for (const match of step.matchAll(VARIABLE_PLACEHOLDER)) {
      const name = match[1];
      if (name !== undefined) out.push(name);
    }
  }
  return out;
}

function normalizeVariableName(value: string): string {
  // Accept either a bare name or a `{name}` placeholder.
  const inner = /^\{([a-zA-Z][\w-]*)\}$/u.exec(value.trim());
  return (inner?.[1] ?? value).trim();
}

function dedupe(values: ReadonlyArray<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function renderArgs(args: unknown): string | undefined {
  if (args === undefined || args === null) return undefined;
  if (typeof args === 'string') return args.length > 0 ? truncate(args) : undefined;
  try {
    const json = JSON.stringify(args);
    return json !== undefined && json !== '{}' ? truncate(json) : undefined;
  } catch {
    return undefined;
  }
}

function truncate(value: string, max = 200): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function firstUserText(messages: ReadonlyArray<Message>): string | undefined {
  for (const message of messages) {
    if (message.role !== 'user') continue;
    const text = messageText(message);
    if (text.length > 0) return text;
  }
  return undefined;
}

function messageText(message: Message): string {
  const content = message.content;
  if (typeof content === 'string') return content.trim();
  const parts: string[] = [];
  for (const part of content) {
    if (part.type === 'text' && typeof part.text === 'string') parts.push(part.text);
  }
  return parts.join(' ').trim();
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stripFence(text: string): string {
  const match = /^```[^\n]*\n([\s\S]*?)\n```/u.exec(text.trim());
  return match?.[1] ?? text;
}

function tryParseObject(candidate: string): unknown {
  if (candidate.length === 0) return undefined;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start < 0 || end < start) return undefined;
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      return undefined;
    }
  }
}
