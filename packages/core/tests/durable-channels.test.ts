/**
 * Direct unit coverage for the durable-workflow primitives in
 * `channels/durable.ts`. The workflow engine exercises these end to end
 * in `@graphorin/workflow`; the branch semantics (guards, instant
 * parsing, schema delivery, approval option spreads) are pinned here so
 * a core-only change cannot silently alter them.
 */
import { describe, expect, it } from 'vitest';

import {
  APPROVAL_PAUSE_KIND,
  type ApprovalPauseValue,
  AWAKEABLE_PAUSE_KIND,
  type AwakeablePayloadError,
  awaitExternal,
  DEFAULT_APPROVAL_TIMEOUT_DECISION,
  isApprovalPauseValue,
  isAwakeablePauseValue,
  isAwakeablePayloadError,
  isTimerPauseValue,
  requestApproval,
  sleepFor,
  sleepUntil,
  TIMER_PAUSE_KIND,
  type TimerPauseValue,
} from '../src/channels/durable.js';
import { isPauseSignal, type PauseSignal, runWithPauseResume } from '../src/channels/pause.js';

/** Runs `fn`, captures the thrown PauseSignal, and returns its value. */
function capturePause(fn: () => unknown): unknown {
  try {
    fn();
  } catch (err) {
    if (isPauseSignal(err)) return (err as PauseSignal).value;
    throw err;
  }
  throw new Error('expected a PauseSignal');
}

describe('durable pause-value type guards', () => {
  it('isTimerPauseValue accepts only the timer shape', () => {
    expect(isTimerPauseValue({ kind: TIMER_PAUSE_KIND, wakeAt: 123 })).toBe(true);
    expect(isTimerPauseValue(null)).toBe(false);
    expect(isTimerPauseValue('timer')).toBe(false);
    expect(isTimerPauseValue({ kind: 'other', wakeAt: 123 })).toBe(false);
    expect(isTimerPauseValue({ kind: TIMER_PAUSE_KIND, wakeAt: 'soon' })).toBe(false);
  });

  it('isAwakeablePauseValue accepts only the awakeable shape', () => {
    expect(isAwakeablePauseValue({ kind: AWAKEABLE_PAUSE_KIND, name: 'x' })).toBe(true);
    expect(isAwakeablePauseValue(null)).toBe(false);
    expect(isAwakeablePauseValue(7)).toBe(false);
    expect(isAwakeablePauseValue({ kind: 'other', name: 'x' })).toBe(false);
    expect(isAwakeablePauseValue({ kind: AWAKEABLE_PAUSE_KIND, name: 42 })).toBe(false);
  });

  it('isApprovalPauseValue accepts only the approval shape', () => {
    expect(isApprovalPauseValue({ kind: APPROVAL_PAUSE_KIND, name: 'ship' })).toBe(true);
    expect(isApprovalPauseValue(null)).toBe(false);
    expect(isApprovalPauseValue([])).toBe(false);
    expect(isApprovalPauseValue({ kind: TIMER_PAUSE_KIND, name: 'ship' })).toBe(false);
    expect(isApprovalPauseValue({ kind: APPROVAL_PAUSE_KIND, name: 9 })).toBe(false);
  });
});

describe('sleepUntil / sleepFor', () => {
  it('accepts an epoch-ms number', () => {
    const value = capturePause(() => sleepUntil(1_800_000_000_000)) as TimerPauseValue;
    expect(value).toEqual({ kind: TIMER_PAUSE_KIND, wakeAt: 1_800_000_000_000 });
  });

  it('accepts a Date instance', () => {
    const at = new Date('2027-01-01T00:00:00.000Z');
    const value = capturePause(() => sleepUntil(at)) as TimerPauseValue;
    expect(value.wakeAt).toBe(at.getTime());
  });

  it('accepts a parseable ISO string', () => {
    const value = capturePause(() => sleepUntil('2027-01-01T00:00:00.000Z')) as TimerPauseValue;
    expect(value.wakeAt).toBe(Date.parse('2027-01-01T00:00:00.000Z'));
  });

  it('rejects an unparseable instant', () => {
    expect(() => sleepUntil('not-a-date')).toThrow(TypeError);
    expect(() => sleepUntil(Number.NaN)).toThrow(TypeError);
  });

  it('sleepFor rejects negative and non-finite durations', () => {
    expect(() => sleepFor(-1)).toThrow(TypeError);
    expect(() => sleepFor(Number.POSITIVE_INFINITY)).toThrow(TypeError);
  });

  it('sleepFor suspends with a wake-at at least the duration away', () => {
    const before = Date.now();
    const value = capturePause(() => sleepFor(60_000)) as TimerPauseValue;
    expect(value.kind).toBe(TIMER_PAUSE_KIND);
    expect(value.wakeAt).toBeGreaterThanOrEqual(before + 60_000);
  });
});

describe('awaitExternal', () => {
  it('rejects an empty or non-string name', () => {
    expect(() => awaitExternal('')).toThrow(TypeError);
    expect(() => awaitExternal(7 as unknown as string)).toThrow(TypeError);
  });

  it('suspends with the awakeable pause value outside a resume scope', () => {
    const value = capturePause(() => awaitExternal('payment'));
    expect(value).toEqual({ kind: AWAKEABLE_PAUSE_KIND, name: 'payment' });
  });

  it('returns the replayed value as-is without a schema', async () => {
    const result = await runWithPauseResume([{ ok: true }], () => awaitExternal('payment'));
    expect(result).toEqual({ ok: true });
  });

  it('returns the parsed (possibly transformed) value when the schema accepts', async () => {
    const schema = {
      safeParse: (value: unknown) => ({ success: true as const, data: `parsed:${String(value)}` }),
    };
    const result = await runWithPauseResume(['raw'], () => awaitExternal('payment', { schema }));
    expect(result).toBe('parsed:raw');
  });

  it('throws AwakeablePayloadError when the schema rejects the delivered value', async () => {
    const schema = {
      safeParse: () => ({ success: false as const, error: { message: 'nope' } }),
    };
    await expect(
      runWithPauseResume(['raw'], () => awaitExternal('payment', { schema })),
    ).rejects.toSatisfy((err: unknown) => {
      expect(isAwakeablePayloadError(err)).toBe(true);
      const typed = err as AwakeablePayloadError;
      expect(typed.awakeableName).toBe('payment');
      expect(typed.issues).toBe('nope');
      return true;
    });
  });

  it('isAwakeablePayloadError rejects look-alikes', () => {
    expect(isAwakeablePayloadError(new Error('x'))).toBe(false);
    const impostor = new Error('x');
    impostor.name = 'AwakeablePayloadError';
    expect(isAwakeablePayloadError(impostor)).toBe(false);
    expect(isAwakeablePayloadError(null)).toBe(false);
  });
});

describe('requestApproval', () => {
  it('rejects an empty or non-string name', () => {
    expect(() => requestApproval('')).toThrow(TypeError);
    expect(() => requestApproval(undefined as unknown as string)).toThrow(TypeError);
  });

  it('suspends with the bare approval value when no payload or options are given', () => {
    const value = capturePause(() => requestApproval('deploy'));
    expect(value).toEqual({ kind: APPROVAL_PAUSE_KIND, name: 'deploy' });
  });

  it('carries the payload when supplied', () => {
    const value = capturePause(() =>
      requestApproval('deploy', { env: 'prod' }),
    ) as ApprovalPauseValue;
    expect(value.payload).toEqual({ env: 'prod' });
    expect(value.wakeAt).toBeUndefined();
  });

  it('accepts timeoutAt as number, Date, and parseable string', () => {
    const asNumber = capturePause(() =>
      requestApproval('deploy', undefined, { timeoutAt: 1_800_000_000_000 }),
    ) as ApprovalPauseValue;
    expect(asNumber.wakeAt).toBe(1_800_000_000_000);

    const at = new Date('2027-06-01T12:00:00.000Z');
    const asDate = capturePause(() =>
      requestApproval('deploy', undefined, { timeoutAt: at }),
    ) as ApprovalPauseValue;
    expect(asDate.wakeAt).toBe(at.getTime());

    const asString = capturePause(() =>
      requestApproval('deploy', undefined, { timeoutAt: '2027-06-01T12:00:00.000Z' }),
    ) as ApprovalPauseValue;
    expect(asString.wakeAt).toBe(at.getTime());
  });

  it('rejects an unparseable timeoutAt', () => {
    expect(() => requestApproval('deploy', undefined, { timeoutAt: 'whenever' })).toThrow(
      TypeError,
    );
  });

  it('carries a custom timeoutDecision alongside the deadline', () => {
    const value = capturePause(() =>
      requestApproval('deploy', 'ship it', {
        timeoutAt: 1_800_000_000_000,
        timeoutDecision: { granted: true },
      }),
    ) as ApprovalPauseValue;
    expect(value).toEqual({
      kind: APPROVAL_PAUSE_KIND,
      name: 'deploy',
      payload: 'ship it',
      wakeAt: 1_800_000_000_000,
      timeoutDecision: { granted: true },
    });
  });

  it('replays a delivered decision inside a resume scope', async () => {
    const decision = await runWithPauseResume([{ granted: false }], () =>
      requestApproval('deploy'),
    );
    expect(decision).toEqual({ granted: false });
  });

  it('the default timeout decision is a frozen deny', () => {
    expect(DEFAULT_APPROVAL_TIMEOUT_DECISION).toEqual({ granted: false, reason: 'defer-timeout' });
    expect(Object.isFrozen(DEFAULT_APPROVAL_TIMEOUT_DECISION)).toBe(true);
  });
});
