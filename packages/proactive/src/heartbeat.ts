/**
 * Heartbeat runner (C1): a checklist-driven periodic agent beat.
 *
 * Every fire evaluates a bot-supplied `checklist()`; an empty checklist
 * skips the beat entirely (zero model calls), a busy agent defers it
 * (`Agent.isBusy()` or an injected `runGate`), active hours keep the
 * bot quiet at night, and an all-quiet model reply - the sentinel - is
 * suppressed instead of delivered. Every real finding is reported as a
 * `notify` rung of the proactive outcome ladder; the heavier rungs
 * (question / review / act) belong to cron-leg tasks (C2/C3).
 *
 * Cost posture: beats default to an isolated session and pass the
 * per-beat ceilings through the agent's run-level budget (C5) and the
 * fail-closed model pin (`pinnedProvider`). Pair the agent with
 * `scaffold: 'minimal'` (C6) for the cheap-run scaffold.
 *
 * Single-process by design: schedules ride `@graphorin/triggers`,
 * whose SQLite store is single-process (W-133). Run one heartbeat
 * process per store.
 *
 * @packageDocumentation
 */

import type { Agent, AgentCallOptions, RunBudget } from '@graphorin/agent';
import type { ProactiveNotifyOutcome, ProactiveOutcome } from '@graphorin/core';
import type { SessionManager } from '@graphorin/sessions';
import { cron, interval, type Scheduler, type TriggerDeclaration } from '@graphorin/triggers';

import { type ActiveHours, isWithinActiveHours, validateActiveHours } from './active-hours.js';

/**
 * When the heartbeat fires. Exactly one of `every` / `cron` is
 * required. `jitterMs` / `expiresAt` pass through to the trigger
 * declaration (the C4 scheduler harness).
 *
 * @stable
 */
export interface HeartbeatSchedule {
  /** Fixed interval in milliseconds. */
  readonly every?: number;
  /** 5-field cron expression. */
  readonly cron?: string;
  /** IANA timezone for the cron expression (W-124). */
  readonly timezone?: string;
  /** Deterministic per-id jitter (C4). */
  readonly jitterMs?: number;
  /** Auto-pause instant (C4). */
  readonly expiresAt?: string | number;
}

/**
 * The cheap isolated run profile of a beat.
 *
 * @stable
 */
export interface HeartbeatProfile {
  /**
   * Fresh session per beat (default `true`). `false` reuses the stable
   * session id `heartbeat:<id>` so beats share memory scope.
   */
  readonly isolatedSession?: boolean;
  /**
   * Fail-closed model pin for every beat: the run resolves to exactly
   * this provider and never consults the agent's fallback chain
   * (`AgentCallOptions.pinnedProvider`).
   */
  readonly provider?: AgentCallOptions<unknown>['pinnedProvider'];
  /** Per-beat USD ceiling (run-level budget, C5). */
  readonly budgetUsd?: number;
  /** Per-beat token ceiling (run-level budget, C5). */
  readonly maxTokens?: number;
}

/** Why a fire produced no outcome. @stable */
export type HeartbeatSkipReason =
  | 'inactive-hours'
  | 'beat-in-flight'
  | 'agent-busy'
  | 'empty-checklist'
  | 'sentinel'
  | 'below-min-length';

/** A skipped fire, reported to `onSkip` observers. @stable */
export interface HeartbeatSkip {
  readonly reason: HeartbeatSkipReason;
  readonly at: string;
}

/** What one beat resolved to. @stable */
export interface HeartbeatBeatResult {
  /** Present when the beat delivered a finding. */
  readonly outcome?: ProactiveOutcome;
  /** Present when the beat was skipped. */
  readonly skipped?: HeartbeatSkipReason;
  /** Present when the agent run ended `failed` (incl. budget stops). */
  readonly runError?: { readonly message: string; readonly code: string };
}

/** Live counters surfaced by {@link Heartbeat.status}. @stable */
export interface HeartbeatStatus {
  readonly running: boolean;
  readonly beats: number;
  readonly outcomes: number;
  readonly failures: number;
  readonly defers: number;
  readonly skips: Readonly<Record<HeartbeatSkipReason, number>>;
  readonly lastBeatAt?: string;
  readonly lastOutcomeAt?: string;
  readonly lastError?: string;
}

/**
 * Options for {@link createHeartbeat}.
 *
 * @stable
 */
export interface CreateHeartbeatOptions<TDeps = unknown> {
  /**
   * The agent every beat runs on. Dedicate an instance to the
   * heartbeat: `Agent.isBusy()` guards THIS instance's in-flight run,
   * and a shared instance would make beats and interactive turns
   * collide on the one-run-per-instance invariant.
   */
  readonly agent: Agent<TDeps, string>;
  /** The trigger scheduler the beat schedule registers on. */
  readonly scheduler: Scheduler;
  readonly schedule: HeartbeatSchedule;
  /**
   * The beat's agenda. `null` / empty / whitespace skips the beat
   * before any model call - an empty checklist must cost nothing.
   */
  readonly checklist: () => string | null | Promise<string | null>;
  /** Trigger id + outcome `taskId`. Default `'heartbeat'`. */
  readonly id?: string;
  /**
   * The all-quiet marker. A reply that carries nothing beyond the
   * sentinel is suppressed, never delivered. Default `'HEARTBEAT_OK'`.
   */
  readonly sentinel?: string;
  /**
   * Replies shorter than this (after sentinel stripping) are dropped
   * as noise. Default `8` characters.
   */
  readonly minOutcomeLength?: number;
  readonly profile?: HeartbeatProfile;
  /** Daily window in which beats may run. Absent = always. */
  readonly activeHours?: ActiveHours;
  /**
   * Session manager for isolated beats: when present (and the profile
   * is isolated), each beat creates a real session (`tags:
   * ['heartbeat']`). Absent, beats still run isolated under fresh
   * session IDS without session bookkeeping.
   */
  readonly sessions?: SessionManager;
  /** User the created sessions belong to. Default `'heartbeat'`. */
  readonly userId?: string;
  /** Observer for delivered findings. Errors are caught + WARNed. */
  readonly onOutcome?: (outcome: ProactiveOutcome) => void | Promise<void>;
  /** Observer for skipped fires. Errors are caught + WARNed. */
  readonly onSkip?: (skip: HeartbeatSkip) => void;
  /**
   * External busy gate: `true` defers the beat. Default
   * `() => agent.isBusy()`. A naive internal mutex would only defer
   * against runs the heartbeat itself started - this gate exists so
   * the composition root can point it at the real interactive runner.
   */
  readonly runGate?: () => boolean;
  /** Deferral cadence while the gate is busy. Default 30s. */
  readonly deferMs?: number;
  /** Give up after this many consecutive defers. Default 10. */
  readonly maxDefers?: number;
  /** Override the wall clock - used by tests. */
  readonly now?: () => number;
  /** Override `setTimeout` / `clearTimeout` - used by tests. */
  readonly setTimeout?: (cb: () => void, ms: number) => unknown;
  readonly clearTimeout?: (handle: unknown) => void;
  /** WARN sink. Default `console.warn`. */
  readonly warn?: (message: string) => void;
}

/**
 * The heartbeat handle.
 *
 * @stable
 */
export interface Heartbeat {
  /** Register the schedule on the scheduler. Idempotent. */
  start(): Promise<void>;
  /** Unregister the schedule and cancel a pending deferral. */
  stop(): Promise<void>;
  /** Fire one beat now (also the trigger callback). */
  beat(): Promise<HeartbeatBeatResult>;
  status(): HeartbeatStatus;
  /** The registered trigger id. */
  readonly id: string;
}

const DEFAULT_SENTINEL = 'HEARTBEAT_OK';
const DEFAULT_MIN_OUTCOME_LENGTH = 8;
const DEFAULT_DEFER_MS = 30_000;
const DEFAULT_MAX_DEFERS = 10;

/**
 * Build a {@link Heartbeat}.
 *
 * @stable
 */
export function createHeartbeat<TDeps = unknown>(
  options: CreateHeartbeatOptions<TDeps>,
): Heartbeat {
  const id = options.id ?? 'heartbeat';
  const sentinel = options.sentinel ?? DEFAULT_SENTINEL;
  const minOutcomeLength = options.minOutcomeLength ?? DEFAULT_MIN_OUTCOME_LENGTH;
  const deferMs = options.deferMs ?? DEFAULT_DEFER_MS;
  const maxDefers = options.maxDefers ?? DEFAULT_MAX_DEFERS;
  const now = options.now ?? Date.now;
  const setTimeoutImpl = options.setTimeout ?? ((cb, ms) => globalThis.setTimeout(cb, ms));
  const clearTimeoutImpl =
    options.clearTimeout ??
    ((h) => globalThis.clearTimeout(h as ReturnType<typeof globalThis.setTimeout>));
  const warn = options.warn ?? ((m: string) => console.warn(m));
  const gate = options.runGate ?? ((): boolean => options.agent.isBusy());

  if ((options.schedule.every === undefined) === (options.schedule.cron === undefined)) {
    throw new TypeError(
      `[graphorin/proactive] heartbeat('${id}'): exactly one of schedule.every / schedule.cron is required`,
    );
  }
  if (options.activeHours !== undefined) validateActiveHours(options.activeHours);
  if (options.sentinel !== undefined && options.sentinel.trim().length === 0) {
    throw new TypeError(`[graphorin/proactive] heartbeat('${id}'): sentinel must not be blank`);
  }

  let running = false;
  let beatInFlight = false;
  let deferHandle: unknown;
  let consecutiveDefers = 0;
  let beats = 0;
  let outcomes = 0;
  let failures = 0;
  let defers = 0;
  const skips: Record<HeartbeatSkipReason, number> = {
    'inactive-hours': 0,
    'beat-in-flight': 0,
    'agent-busy': 0,
    'empty-checklist': 0,
    sentinel: 0,
    'below-min-length': 0,
  };
  let lastBeatAt: string | undefined;
  let lastOutcomeAt: string | undefined;
  let lastError: string | undefined;

  function skip(reason: HeartbeatSkipReason): HeartbeatBeatResult {
    skips[reason] += 1;
    try {
      options.onSkip?.({ reason, at: new Date(now()).toISOString() });
    } catch (err) {
      warn(`[graphorin/proactive] heartbeat('${id}') onSkip observer threw: ${describe(err)}`);
    }
    return { skipped: reason };
  }

  function cancelDefer(): void {
    if (deferHandle !== undefined) {
      clearTimeoutImpl(deferHandle);
      deferHandle = undefined;
    }
  }

  /** Arm one deferral retry; gives up (with a WARN) past `maxDefers`. */
  function armDefer(): HeartbeatBeatResult {
    defers += 1;
    consecutiveDefers += 1;
    if (consecutiveDefers > maxDefers) {
      consecutiveDefers = 0;
      warn(
        `[graphorin/proactive] heartbeat('${id}'): agent stayed busy through ${maxDefers} ` +
          `deferrals - dropping this beat (the next schedule fire tries again).`,
      );
      return skip('agent-busy');
    }
    cancelDefer();
    deferHandle = setTimeoutImpl(() => {
      deferHandle = undefined;
      void beat();
    }, deferMs);
    return skip('agent-busy');
  }

  async function resolveSessionId(): Promise<string> {
    const isolated = options.profile?.isolatedSession !== false;
    if (!isolated) return `heartbeat:${id}`;
    const beatTag = `${id}-${now()}`;
    if (options.sessions !== undefined) {
      const session = await options.sessions.create({
        userId: options.userId ?? 'heartbeat',
        agentId: `heartbeat:${id}`,
        title: `Heartbeat ${beatTag}`,
        tags: ['heartbeat'],
      });
      return session.id;
    }
    return `heartbeat:${beatTag}`;
  }

  async function beat(): Promise<HeartbeatBeatResult> {
    if (beatInFlight) return skip('beat-in-flight');
    if (options.activeHours !== undefined && !isWithinActiveHours(options.activeHours, now())) {
      consecutiveDefers = 0;
      return skip('inactive-hours');
    }
    if (gate()) return armDefer();
    consecutiveDefers = 0;

    beatInFlight = true;
    try {
      const checklist = await options.checklist();
      if (checklist === null || checklist.trim().length === 0) {
        return skip('empty-checklist');
      }

      beats += 1;
      lastBeatAt = new Date(now()).toISOString();
      const sessionId = await resolveSessionId();
      const budget: RunBudget | undefined =
        options.profile?.budgetUsd !== undefined || options.profile?.maxTokens !== undefined
          ? {
              ...(options.profile.budgetUsd !== undefined
                ? { maxCostUsd: options.profile.budgetUsd }
                : {}),
              ...(options.profile.maxTokens !== undefined
                ? { maxTokens: options.profile.maxTokens }
                : {}),
              onExceed: 'stop',
            }
          : undefined;
      const callOptions: AgentCallOptions<TDeps> = {
        sessionId,
        ...(options.userId !== undefined ? { userId: options.userId } : {}),
        ...(budget !== undefined ? { budget } : {}),
        ...(options.profile?.provider !== undefined
          ? { pinnedProvider: options.profile.provider }
          : {}),
      };

      const result = await options.agent.run(checklist, callOptions);
      if (result.status !== 'completed') {
        failures += 1;
        const code = result.error?.code ?? result.status;
        lastError = `${code}: ${result.error?.message ?? 'run did not complete'}`;
        warn(`[graphorin/proactive] heartbeat('${id}') beat run ended ${result.status} (${code}).`);
        return {
          runError: { message: result.error?.message ?? result.status, code },
        };
      }

      // Sentinel suppression: strip every occurrence; what remains is
      // the actual finding. All-quiet or sub-threshold -> no delivery.
      const raw = String(result.output ?? '');
      const stripped = raw.split(sentinel).join('').trim();
      if (stripped.length < minOutcomeLength) {
        return skip(raw.includes(sentinel) ? 'sentinel' : 'below-min-length');
      }

      const outcome: ProactiveNotifyOutcome = {
        kind: 'notify',
        taskId: id,
        firedAt: new Date(now()).toISOString(),
        text: stripped,
        runId: result.state.id,
        sessionId,
      };
      outcomes += 1;
      lastOutcomeAt = outcome.firedAt;
      try {
        await options.onOutcome?.(outcome);
      } catch (err) {
        warn(`[graphorin/proactive] heartbeat('${id}') onOutcome observer threw: ${describe(err)}`);
      }
      return { outcome };
    } catch (err) {
      failures += 1;
      lastError = describe(err);
      warn(`[graphorin/proactive] heartbeat('${id}') beat threw: ${describe(err)}`);
      return { runError: { message: describe(err), code: 'beat-threw' } };
    } finally {
      beatInFlight = false;
    }
  }

  function declaration(): TriggerDeclaration {
    const triggerOptions = {
      ...(options.schedule.jitterMs !== undefined ? { jitterMs: options.schedule.jitterMs } : {}),
      ...(options.schedule.expiresAt !== undefined
        ? { expiresAt: options.schedule.expiresAt }
        : {}),
      ...(options.schedule.timezone !== undefined ? { timezone: options.schedule.timezone } : {}),
    };
    return options.schedule.cron !== undefined
      ? cron(id, options.schedule.cron, () => void beat(), triggerOptions)
      : interval(id, options.schedule.every as number, () => void beat(), triggerOptions);
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
      cancelDefer();
      await options.scheduler.unregister(id);
    },
    beat,
    status(): HeartbeatStatus {
      return Object.freeze({
        running,
        beats,
        outcomes,
        failures,
        defers,
        skips: Object.freeze({ ...skips }),
        ...(lastBeatAt !== undefined ? { lastBeatAt } : {}),
        ...(lastOutcomeAt !== undefined ? { lastOutcomeAt } : {}),
        ...(lastError !== undefined ? { lastError } : {}),
      });
    },
  };
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
