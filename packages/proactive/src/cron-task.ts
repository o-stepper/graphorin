/**
 * Cron-leg proactive task (C2): a "fresh session per fire" runner over
 * the durable trigger scheduler.
 *
 * Every fire creates a new session, runs a dedicated agent on a
 * REQUIRED pinned model (fail-closed: the fire never inherits the
 * agent's fallback chain - decision D-8/C2), and classifies the result
 * onto the typed escalation ladder:
 *
 * - `completed` -> `notify` (or `act` for a task granted `'act'` whose
 *   run actually executed a writer tool);
 * - `awaiting_approval` -> `review` when a parked approval targets a
 *   writer tool, `question` otherwise, with a serialized
 *   `run:<runId>:<toolCallId>` resolve ref for messenger callback-data;
 * - a rung above the task's grant is denied fail-closed: pending
 *   approvals are auto-denied and the fire reports `escalationBlocked`.
 *
 * Grant -> capability mapping (deterministic enforcement before E1's
 * permission vocabulary exists): `notify` / `question` tasks run
 * `capability: 'read-only'` - writer tools are never advertised and
 * the executor blocks fabricated writer calls, so acting without the
 * grant is impossible by construction. Recursive scheduling is blocked
 * the same way: the dedicated agent's toolset must not carry
 * trigger-registering tools (checked at creation via
 * `schedulingToolNames`); after E1 lands, deny-by-name adds a second
 * layer.
 *
 * Composes with the existing workflow timer-daemon rather than
 * re-hosting it (D-9): a task that parks inside a durable workflow
 * resumes through `POST /v1/workflows/:id/resume` and the daemon's
 * ticks; this runner only owns the agent leg.
 *
 * @packageDocumentation
 */

import {
  type Agent,
  type AgentCallOptions,
  completedToolCallsFromState,
  type RunBudget,
} from '@graphorin/agent';
import type {
  ProactiveGrant,
  ProactiveOutcome,
  ProactiveOutcomeKind,
  ProactiveOutcomeOption,
  Provider,
} from '@graphorin/core';
import { proactiveOutcomeWithinGrant } from '@graphorin/core';
import type { SessionManager } from '@graphorin/sessions';
import { cron, type Scheduler, type TriggerDeclaration } from '@graphorin/triggers';

import { type ActiveHours, isWithinActiveHours, validateActiveHours } from './active-hours.js';
import { serializeApprovalRef } from './approval-ref.js';
import { ProactiveConfigError } from './errors.js';

/** When the task fires. C4 harness fields pass through. @stable */
export interface ProactiveCronSchedule {
  /** 5-field cron expression. */
  readonly cron: string;
  /** IANA timezone for the expression (W-124). */
  readonly timezone?: string;
  /** Deterministic per-id jitter (C4). */
  readonly jitterMs?: number;
  /** Auto-pause instant (C4). */
  readonly expiresAt?: string | number;
}

/** Structural evidence slice of `@graphorin/memory`'s facade. */
export interface MemoryIngestGateEvidence {
  readonly ingestGate: unknown;
}

/** Why a fire produced no outcome. @stable */
export type ProactiveTaskSkipReason = 'inactive-hours' | 'fire-in-flight';

/** What one fire resolved to. @stable */
export interface ProactiveTaskFireResult {
  readonly outcome?: ProactiveOutcome;
  readonly skipped?: ProactiveTaskSkipReason;
  /** The agent run ended `failed` (incl. budget stops). */
  readonly runError?: { readonly message: string; readonly code: string };
  /**
   * The run tried to escalate above the task's grant; the pending
   * approvals were auto-denied (fail-closed) and nothing was
   * delivered.
   */
  readonly escalationBlocked?: ProactiveOutcomeKind;
}

/** Live counters surfaced by {@link ProactiveCronTask.status}. @stable */
export interface ProactiveCronTaskStatus {
  readonly running: boolean;
  readonly fires: number;
  readonly outcomes: number;
  readonly failures: number;
  readonly escalationsBlocked: number;
  readonly skips: Readonly<Record<ProactiveTaskSkipReason, number>>;
  readonly lastFireAt?: string;
  readonly lastOutcomeAt?: string;
  readonly lastError?: string;
}

/**
 * Options for {@link createProactiveCronTask}.
 *
 * @stable
 */
export interface CreateProactiveCronTaskOptions<TDeps = unknown> {
  /** Task identity: the trigger id and the outcome `taskId`. */
  readonly id: string;
  /**
   * The dedicated agent every fire runs on. BY-CONSTRUCTION contract:
   * its toolset must not carry trigger-registering tools (see
   * `schedulingToolNames`), and it should be a separate instance from
   * the interactive agent (one run per instance).
   */
  readonly agent: Agent<TDeps, string>;
  readonly scheduler: Scheduler;
  readonly schedule: ProactiveCronSchedule;
  /** The instruction each fire runs with. */
  readonly prompt: string | (() => string | Promise<string>);
  /**
   * REQUIRED fail-closed model pin: every fire resolves to exactly
   * this provider and never consults the agent's fallback chain.
   */
  readonly provider: Provider;
  /**
   * Maximum escalation rung (default `'notify'`). `'notify'` /
   * `'question'` fires run `capability: 'read-only'` - side effects
   * are impossible by construction. `'act'` additionally requires
   * `memory` with an ACTIVE ingest gate (B3) - fail-closed config
   * check.
   */
  readonly grant?: ProactiveGrant;
  /**
   * Evidence for the `'act'` grant: the memory facade whose
   * `ingestGate` is non-null (`createMemory({ ingestGate })`). Ignored
   * for lower grants.
   */
  readonly memory?: MemoryIngestGateEvidence;
  /** Per-fire run budget (C5). `onExceed` is pinned to `'stop'`. */
  readonly budget?: Pick<RunBudget, 'maxCostUsd' | 'maxTokens'>;
  /** Daily window in which fires may run. Absent = always. */
  readonly activeHours?: ActiveHours;
  /** Session manager: when present, each fire creates a real session. */
  readonly sessions?: SessionManager;
  /** User the created sessions belong to. Default `'proactive'`. */
  readonly userId?: string;
  /** Observer for ladder outcomes. Errors are caught + WARNed. */
  readonly onOutcome?: (outcome: ProactiveOutcome) => void | Promise<void>;
  /**
   * Names of trigger-registering tools that must NOT be reachable from
   * this task. Checked against the dedicated agent's registry at
   * creation time; a hit throws {@link ProactiveConfigError} unless
   * `allowRecursiveScheduling` grants it explicitly. Default `[]` -
   * the by-construction contract (a curated toolset without scheduling
   * tools) is the primary enforcement until E1's deny-by-name lands.
   */
  readonly schedulingToolNames?: ReadonlyArray<string>;
  /** Explicit recursive-scheduling grant. Default `false`. */
  readonly allowRecursiveScheduling?: boolean;
  /** Approve / deny button labels for review-rung outcomes. */
  readonly reviewOptions?: ReadonlyArray<ProactiveOutcomeOption>;
  /**
   * C3 messenger bridge: register a parked fire's resumable state with
   * the server's run tracker so `POST /v1/runs/:runId/resume` can find
   * it. Structural (`GraphorinServer.runs` satisfies it); pair with
   * registering the dedicated agent under `registryAgentId` in the
   * server's agent registry. Absent, question/review outcomes are still
   * delivered - resolution then happens library-side.
   */
  readonly suspendedRuns?: SuspendedRunRegistryLike;
  /**
   * Registry id the dedicated agent is registered under for REST
   * resume (see `suspendedRuns`). Default `proactive-<id>`. Avoid ':'
   * in the id - it is the scope-segment separator
   * (`agents:invoke:<id>`).
   */
  readonly registryAgentId?: string;
  /** Override the wall clock - used by tests. */
  readonly now?: () => number;
  /** WARN sink. Default `console.warn`. */
  readonly warn?: (message: string) => void;
}

/**
 * Structural slice of the server's `RunStateTracker` the C3 bridge
 * needs - no dependency on `@graphorin/server`.
 *
 * @stable
 */
export interface SuspendedRunRegistryLike {
  registerSuspended(
    runId: string,
    descriptor: {
      readonly kind: 'agent';
      readonly agentId: string;
      readonly sessionId?: string;
      readonly userId?: string;
    },
    state: unknown,
  ): void;
}

/**
 * The cron-leg task handle.
 *
 * @stable
 */
export interface ProactiveCronTask {
  readonly id: string;
  /** Register the schedule on the scheduler. Idempotent. */
  start(): Promise<void>;
  /** Unregister the schedule. */
  stop(): Promise<void>;
  /** Fire once now (also the trigger callback). */
  fire(): Promise<ProactiveTaskFireResult>;
  status(): ProactiveCronTaskStatus;
}

const DEFAULT_REVIEW_OPTIONS: ReadonlyArray<ProactiveOutcomeOption> = Object.freeze([
  Object.freeze({ label: 'Approve', value: 'approve' }),
  Object.freeze({ label: 'Deny', value: 'deny' }),
]);

const WRITER_CLASSES: ReadonlySet<string> = new Set(['side-effecting', 'external-stateful']);

/**
 * Build a {@link ProactiveCronTask}.
 *
 * @stable
 */
export function createProactiveCronTask<TDeps = unknown>(
  options: CreateProactiveCronTaskOptions<TDeps>,
): ProactiveCronTask {
  const id = options.id;
  const grant: ProactiveGrant = options.grant ?? 'notify';
  const now = options.now ?? Date.now;
  const warn = options.warn ?? ((m: string) => console.warn(m));
  const reviewOptions = options.reviewOptions ?? DEFAULT_REVIEW_OPTIONS;

  if (typeof id !== 'string' || id.length === 0) {
    throw new ProactiveConfigError('?', 'invalid-options', 'cron task: id must be non-empty');
  }
  if (options.provider === undefined || options.provider === null) {
    throw new ProactiveConfigError(
      id,
      'invalid-options',
      `cron task '${id}': provider is required - every fire runs on a fail-closed pinned model`,
    );
  }
  if (options.activeHours !== undefined) validateActiveHours(options.activeHours);
  // Fail-closed act gate (C3.4): the grant needs EVIDENCE of an active
  // memory ingest gate (B3) - auto-acting on memory that ingests
  // unguarded turns is exactly the loop the gate exists to break.
  if (grant === 'act' && (options.memory === undefined || options.memory.ingestGate == null)) {
    throw new ProactiveConfigError(
      id,
      'act-requires-ingest-gate',
      `cron task '${id}': grant 'act' requires memory with an ACTIVE ingest gate ` +
        `(createMemory({ ingestGate })) - fail-closed until the B3 gate is wired`,
    );
  }
  // Deterministic no-recursive-scheduling guard (pre-E1 enforcement):
  // a declared scheduling tool reachable from the task's agent is a
  // config error unless explicitly granted.
  if (options.allowRecursiveScheduling !== true) {
    for (const name of options.schedulingToolNames ?? []) {
      if (options.agent.registry?.get(name) !== undefined) {
        throw new ProactiveConfigError(
          id,
          'recursive-scheduling',
          `cron task '${id}': scheduling tool '${name}' is reachable from the task's agent - ` +
            `a proactive run must not register triggers/schedules without an explicit grant ` +
            `(allowRecursiveScheduling: true)`,
        );
      }
    }
  }

  let running = false;
  let fireInFlight = false;
  let fires = 0;
  let outcomes = 0;
  let failures = 0;
  let escalationsBlocked = 0;
  const skips: Record<ProactiveTaskSkipReason, number> = {
    'inactive-hours': 0,
    'fire-in-flight': 0,
  };
  let lastFireAt: string | undefined;
  let lastOutcomeAt: string | undefined;
  let lastError: string | undefined;

  function skip(reason: ProactiveTaskSkipReason): ProactiveTaskFireResult {
    skips[reason] += 1;
    return { skipped: reason };
  }

  async function deliver(outcome: ProactiveOutcome): Promise<void> {
    outcomes += 1;
    lastOutcomeAt = outcome.firedAt;
    try {
      await options.onOutcome?.(outcome);
    } catch (err) {
      warn(`[graphorin/proactive] cron task '${id}' onOutcome observer threw: ${describe(err)}`);
    }
  }

  /** `true` when the tool is a writer per the agent's registry. */
  function isWriterTool(toolName: string): boolean {
    const entry = options.agent.registry?.get(toolName);
    if (entry === undefined) return true; // unknown -> conservative
    const cls =
      (entry as { readonly __sideEffectClass?: string }).__sideEffectClass ??
      (entry as { readonly sideEffectClass?: string }).sideEffectClass;
    return cls === undefined || WRITER_CLASSES.has(cls);
  }

  async function resolveSessionId(): Promise<string> {
    const fireTag = `${id}-${now()}`;
    if (options.sessions !== undefined) {
      const session = await options.sessions.create({
        userId: options.userId ?? 'proactive',
        agentId: `proactive:${id}`,
        title: `Proactive ${fireTag}`,
        tags: ['proactive'],
      });
      return session.id;
    }
    return `proactive:${fireTag}`;
  }

  async function fire(): Promise<ProactiveTaskFireResult> {
    if (fireInFlight) return skip('fire-in-flight');
    if (options.activeHours !== undefined && !isWithinActiveHours(options.activeHours, now())) {
      return skip('inactive-hours');
    }
    fireInFlight = true;
    try {
      const prompt = typeof options.prompt === 'string' ? options.prompt : await options.prompt();
      fires += 1;
      lastFireAt = new Date(now()).toISOString();
      const sessionId = await resolveSessionId();
      const budget: RunBudget | undefined =
        options.budget !== undefined ? { ...options.budget, onExceed: 'stop' } : undefined;
      const callOptions: AgentCallOptions<TDeps> = {
        sessionId,
        ...(options.userId !== undefined ? { userId: options.userId } : {}),
        // notify / question fires are read-only BY CONSTRUCTION (D2
        // single-writer capability): writer tools are never advertised
        // and the executor blocks fabricated writer calls.
        ...(grant === 'notify' || grant === 'question' ? { capability: 'read-only' } : {}),
        ...(budget !== undefined ? { budget } : {}),
        pinnedProvider: options.provider,
      };

      const result = await options.agent.run(prompt, callOptions);

      if (result.status === 'awaiting_approval') {
        const pending = result.state.pendingApprovals;
        const kind: ProactiveOutcomeKind = pending.some((a) => isWriterTool(a.toolName))
          ? 'review'
          : 'question';
        if (!proactiveOutcomeWithinGrant(kind, grant)) {
          // Fail-closed: deny every pending approval so no parked state
          // outlives the blocked escalation, then report the block.
          escalationsBlocked += 1;
          warn(
            `[graphorin/proactive] cron task '${id}': the run escalated to '${kind}' above ` +
              `its grant '${grant}' - auto-denying ${pending.length} pending approval(s).`,
          );
          await options.agent.run(result.state, {
            ...callOptions,
            directive: {
              approvals: pending.map((a) => ({
                toolCallId: a.toolCallId,
                granted: false,
                reason: `denied: '${kind}' is above the task grant '${grant}'`,
                ...(a.subRunToolCallId !== undefined
                  ? { subRunToolCallId: a.subRunToolCallId }
                  : {}),
              })),
            },
          });
          return { escalationBlocked: kind };
        }
        // C3 messenger bridge: park the resumable state with the
        // server tracker so the REST resume route can settle it.
        try {
          options.suspendedRuns?.registerSuspended(
            result.state.id,
            {
              kind: 'agent',
              agentId: options.registryAgentId ?? `proactive-${id}`,
              sessionId,
              ...(options.userId !== undefined ? { userId: options.userId } : {}),
            },
            result.state,
          );
        } catch (err) {
          warn(
            `[graphorin/proactive] cron task '${id}' suspendedRuns bridge threw: ${describe(err)}`,
          );
        }
        const first = pending[0];
        const ref = serializeApprovalRef({
          runId: result.state.id,
          toolCallId: first?.toolCallId ?? '',
        });
        const text =
          kind === 'review'
            ? `Approval needed: ${pending.map((a) => a.toolName).join(', ')}.` +
              (first?.reason !== undefined ? ` ${first.reason}` : '')
            : `Input needed: ${pending.map((a) => a.toolName).join(', ')}.` +
              (first?.reason !== undefined ? ` ${first.reason}` : '');
        const outcome: ProactiveOutcome = {
          kind,
          taskId: id,
          firedAt: new Date(now()).toISOString(),
          text,
          ref,
          options: reviewOptions,
          runId: result.state.id,
          sessionId,
        };
        await deliver(outcome);
        return { outcome };
      }

      if (result.status !== 'completed') {
        failures += 1;
        const code = result.error?.code ?? result.status;
        lastError = `${code}: ${result.error?.message ?? 'run did not complete'}`;
        warn(`[graphorin/proactive] cron task '${id}' fire ended ${result.status} (${code}).`);
        return { runError: { message: result.error?.message ?? result.status, code } };
      }

      const text = String(result.output ?? '').trim();
      if (text.length === 0) {
        // A completed fire with nothing to say delivers nothing.
        return {};
      }
      const executedWriter = completedToolCallsFromState(result.state).some((tc) =>
        isWriterTool(tc.call.toolName),
      );
      const kind: ProactiveOutcomeKind = grant === 'act' && executedWriter ? 'act' : 'notify';
      const outcome: ProactiveOutcome = {
        kind,
        taskId: id,
        firedAt: new Date(now()).toISOString(),
        text,
        runId: result.state.id,
        sessionId,
      };
      await deliver(outcome);
      return { outcome };
    } catch (err) {
      failures += 1;
      lastError = describe(err);
      warn(`[graphorin/proactive] cron task '${id}' fire threw: ${describe(err)}`);
      return { runError: { message: describe(err), code: 'fire-threw' } };
    } finally {
      fireInFlight = false;
    }
  }

  function declaration(): TriggerDeclaration {
    return cron(id, options.schedule.cron, () => void fire(), {
      ...(options.schedule.timezone !== undefined ? { timezone: options.schedule.timezone } : {}),
      ...(options.schedule.jitterMs !== undefined ? { jitterMs: options.schedule.jitterMs } : {}),
      ...(options.schedule.expiresAt !== undefined
        ? { expiresAt: options.schedule.expiresAt }
        : {}),
    });
  }

  return {
    id,
    async start(): Promise<void> {
      if (running) return;
      running = true;
      await options.scheduler.register(declaration());
    },
    async stop(): Promise<void> {
      if (!running) return;
      running = false;
      await options.scheduler.unregister(id);
    },
    fire,
    status(): ProactiveCronTaskStatus {
      return Object.freeze({
        running,
        fires,
        outcomes,
        failures,
        escalationsBlocked,
        skips: Object.freeze({ ...skips }),
        ...(lastFireAt !== undefined ? { lastFireAt } : {}),
        ...(lastOutcomeAt !== undefined ? { lastOutcomeAt } : {}),
        ...(lastError !== undefined ? { lastError } : {}),
      });
    },
  };
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
