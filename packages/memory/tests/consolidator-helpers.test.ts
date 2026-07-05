import { describe, expect, it } from 'vitest';
import {
  applyNoiseFilters,
  BudgetExceededError,
  BudgetTracker,
  bucketStart,
  CONSOLIDATOR_TIER_DEFAULTS,
  classifyError,
  describeError,
  nextBackoffMs,
  nextBucketStart,
  type ParsedTrigger,
  parseTriggerSpec,
  reasonFromTrigger,
  retention,
  shouldArchive,
  tipMessageId,
} from '../src/consolidator/index.js';
import { salvageTruncatedExtraction } from '../src/consolidator/phases/standard.js';
import type { SessionMessageRecord } from '../src/internal/storage-adapter.js';

function makeMessage(
  role: 'user' | 'assistant' | 'system' | 'tool',
  text: string,
): {
  message: import('@graphorin/core').Message;
} {
  if (role === 'system') return { message: { role, content: text } };
  if (role === 'tool') return { message: { role, toolCallId: 'call_1', content: text } };
  if (role === 'user') return { message: { role, content: text } };
  return { message: { role, content: text } };
}

function makeRecord(role: 'user' | 'assistant', text: string, sequence = 1): SessionMessageRecord {
  return {
    id: `msg_${sequence}`,
    sequence,
    createdAt: new Date(0).toISOString(),
    tokenCount: null,
    ...makeMessage(role, text),
  };
}

describe('consolidator/noise-filter', () => {
  it('drops short greetings and oversize transcripts', () => {
    const result = applyNoiseFilters(
      [
        makeRecord('user', 'hi', 1),
        makeRecord('user', 'a'.repeat(11_000), 2),
        makeRecord('user', 'I will fly to Tbilisi this Friday for work.', 3),
      ],
      ['default'],
    );
    expect(result.kept.length).toBe(1);
    expect(result.droppedCount).toBe(2);
    expect(result.droppedByReason['too-short']).toBe(1);
    expect(result.droppedByReason['too-long']).toBe(1);
  });

  it('drops fenced code blocks and JSON dumps', () => {
    const result = applyNoiseFilters(
      [
        makeRecord('assistant', '```js\nconsole.log("hello world world world")\n```', 1),
        makeRecord('assistant', '{"foo":"bar","baz":1}', 2),
        makeRecord('user', 'I love hiking in the mountains every weekend.', 3),
      ],
      ['default'],
    );
    expect(result.kept.length).toBe(1);
    expect(result.droppedByReason['code-block']).toBe(2);
  });

  it('drops near-duplicate consecutive messages', () => {
    const result = applyNoiseFilters(
      [
        makeRecord('user', 'I really enjoy the morning coffee at the corner shop.', 1),
        makeRecord('user', 'I really enjoy the morning coffee at the corner shop!', 2),
      ],
      ['default'],
    );
    expect(result.kept.length).toBe(1);
    expect(result.droppedByReason['near-duplicate']).toBe(1);
  });

  it('the minimal preset keeps short tool replies', () => {
    const tool = {
      id: 'msg_1',
      sequence: 1,
      createdAt: new Date(0).toISOString(),
      tokenCount: null,
      message: { role: 'tool', toolCallId: 'c', content: 'ok' } as const,
    };
    const result = applyNoiseFilters([tool], ['minimal']);
    expect(result.kept.length).toBe(1);
  });

  it('the none preset returns the input unchanged', () => {
    const result = applyNoiseFilters([makeRecord('user', 'hi', 1)], ['none']);
    expect(result.kept.length).toBe(1);
    expect(result.droppedCount).toBe(0);
  });

  it('drops messages whose stop-word ratio exceeds the threshold', () => {
    const result = applyNoiseFilters([makeRecord('user', 'and the of the and', 1)], ['default']);
    expect(result.kept.length).toBe(0);
    expect(result.droppedByReason['stop-word-ratio']).toBe(1);
  });
});

describe('consolidator/decay', () => {
  it('decays exponentially around the configured tau', () => {
    const now = Date.parse('2026-04-21T00:00:00Z');
    const day = 1000 * 60 * 60 * 24;
    const r0 = retention({ now, lastAccessedAt: now, createdAt: now, strength: 1, tauDays: 7 });
    const r7 = retention({
      now,
      lastAccessedAt: now - 7 * day,
      createdAt: now - 7 * day,
      strength: 1,
      tauDays: 7,
    });
    const r14 = retention({
      now,
      lastAccessedAt: now - 14 * day,
      createdAt: now - 14 * day,
      strength: 1,
      tauDays: 7,
    });
    expect(r0).toBeCloseTo(1, 5);
    expect(r7).toBeCloseTo(Math.exp(-1), 5);
    expect(r14).toBeCloseTo(Math.exp(-2), 5);
  });

  it('recommends archive only when retention is below threshold', () => {
    const now = Date.parse('2026-04-21T00:00:00Z');
    const day = 1000 * 60 * 60 * 24;
    const old = shouldArchive({
      now,
      lastAccessedAt: now - 30 * day,
      createdAt: now - 30 * day,
      strength: 1,
      tauDays: 7,
      archiveThreshold: 0.05,
    });
    const fresh = shouldArchive({
      now,
      lastAccessedAt: now - 1 * day,
      createdAt: now - 1 * day,
      strength: 1,
      tauDays: 7,
      archiveThreshold: 0.05,
    });
    expect(old).toBe(true);
    expect(fresh).toBe(false);
  });
});

describe('consolidator/budget', () => {
  it('skips LLM phases when the daily ceiling is zero (free tier)', () => {
    const tracker = new BudgetTracker({
      maxTokensPerDay: 0,
      maxCostPerDay: 0,
      onExceed: 'pause',
      resetSemantics: 'utc',
      now: () => Date.parse('2026-04-21T00:00:00Z'),
    });
    expect(tracker.precheck('light').allowed).toBe(true);
    const guard = tracker.precheck('standard');
    expect(guard.allowed).toBe(false);
    expect(guard.reason).toBe('tokens-exceeded');
  });

  it('pauses on exceed when policy is `pause`', () => {
    const tracker = new BudgetTracker({
      maxTokensPerDay: 1000,
      maxCostPerDay: 0.5,
      onExceed: 'pause',
      resetSemantics: 'utc',
      now: () => Date.parse('2026-04-21T00:00:00Z'),
    });
    tracker.record({ phase: 'standard', tokens: 1500, costUsd: 0 });
    expect(tracker.snapshot().paused).toBe(true);
    expect(tracker.precheck('standard').allowed).toBe(false);
  });

  it('throws on exceed when policy is `throw`', () => {
    const tracker = new BudgetTracker({
      maxTokensPerDay: 100,
      maxCostPerDay: 0.5,
      onExceed: 'throw',
      resetSemantics: 'utc',
      now: () => Date.parse('2026-04-21T00:00:00Z'),
    });
    expect(() => tracker.record({ phase: 'standard', tokens: 200, costUsd: 0 })).toThrow(
      BudgetExceededError,
    );
  });

  it('does not pause on exceed when policy is `log`', () => {
    const tracker = new BudgetTracker({
      maxTokensPerDay: 100,
      maxCostPerDay: 0.1,
      onExceed: 'log',
      resetSemantics: 'utc',
      now: () => Date.parse('2026-04-21T00:00:00Z'),
      logger: () => {},
    });
    tracker.record({ phase: 'standard', tokens: 200, costUsd: 0 });
    expect(tracker.snapshot().paused).toBe(false);
  });

  it('`log` actually WARNs - once per resource per window (memory-consolidation-02)', () => {
    const warnings: string[] = [];
    let now = Date.parse('2026-04-21T00:00:00Z');
    const tracker = new BudgetTracker({
      maxTokensPerDay: 100,
      maxCostPerDay: 0.1,
      onExceed: 'log',
      resetSemantics: 'utc',
      now: () => now,
      logger: (message) => warnings.push(message),
    });
    tracker.record({ phase: 'standard', tokens: 200, costUsd: 0 });
    tracker.record({ phase: 'standard', tokens: 200, costUsd: 0 });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('tokens budget exceeded');
    expect(warnings[0]).toContain("onExceed: 'log'");
    // The cost leg warns independently.
    tracker.record({ phase: 'deep', tokens: 0, costUsd: 0.5 });
    expect(warnings).toHaveLength(2);
    expect(warnings[1]).toContain('cost budget exceeded');
    // A new budget window re-arms the WARN.
    now = Date.parse('2026-04-22T01:00:00Z');
    tracker.record({ phase: 'standard', tokens: 200, costUsd: 0 });
    expect(warnings).toHaveLength(3);
  });

  it('a configured priceUsage makes the USD ceiling trip (memory-consolidation-02)', () => {
    // The tracker itself accumulates whatever costUsd the phases record;
    // this pins the pause behaviour once cost is finally non-zero.
    const tracker = new BudgetTracker({
      maxTokensPerDay: 1_000_000,
      maxCostPerDay: 0.01,
      onExceed: 'pause',
      resetSemantics: 'utc',
      now: () => Date.parse('2026-04-21T00:00:00Z'),
    });
    const priceUsage = ({
      promptTokens,
      completionTokens,
    }: {
      promptTokens: number;
      completionTokens: number;
    }): number => (promptTokens * 3 + completionTokens * 15) / 1_000_000;
    tracker.record({
      phase: 'standard',
      tokens: 5_000,
      costUsd: priceUsage({ promptTokens: 4_000, completionTokens: 1_000 }),
    });
    expect(tracker.snapshot().paused).toBe(true);
    expect(tracker.precheck('standard').reason).toBe('cost-exceeded');
  });

  it('resets at UTC midnight', () => {
    let now = Date.parse('2026-04-21T23:30:00Z');
    const tracker = new BudgetTracker({
      maxTokensPerDay: 1000,
      maxCostPerDay: 1,
      onExceed: 'pause',
      resetSemantics: 'utc',
      now: () => now,
    });
    tracker.record({ phase: 'standard', tokens: 5000, costUsd: 0 });
    expect(tracker.snapshot().paused).toBe(true);
    now = Date.parse('2026-04-22T00:30:00Z');
    expect(tracker.snapshot().paused).toBe(false);
    expect(tracker.snapshot().tokensUsedToday).toBe(0);
  });

  it('reconfigure unpauses when both ceilings catch up', () => {
    const tracker = new BudgetTracker({
      maxTokensPerDay: 100,
      maxCostPerDay: 0.1,
      onExceed: 'pause',
      resetSemantics: 'utc',
      now: () => Date.parse('2026-04-21T00:00:00Z'),
    });
    tracker.record({ phase: 'standard', tokens: 200, costUsd: 0 });
    expect(tracker.snapshot().paused).toBe(true);
    tracker.reconfigure({ maxTokensPerDay: 1000, maxCostPerDay: 1 });
    expect(tracker.snapshot().paused).toBe(false);
  });

  it('exposes UTC bucket arithmetic', () => {
    const t = Date.parse('2026-04-21T13:24:55.123Z');
    expect(bucketStart(t, 'utc')).toBe(Date.UTC(2026, 3, 21));
    expect(nextBucketStart(bucketStart(t, 'utc'), 'utc')).toBe(Date.UTC(2026, 3, 22));
  });

  it('local bucket reflects local midnight', () => {
    const t = Date.parse('2026-04-21T13:24:55Z');
    const b = bucketStart(t, 'local');
    expect(typeof b).toBe('number');
    expect(nextBucketStart(b, 'local')).toBe(b + 24 * 60 * 60 * 1000);
  });

  it('sliding-24h accumulates within the window, keeps pause, and ages spend out only past 24h (MCON-3)', () => {
    const HOUR = 60 * 60 * 1000;
    let now = Date.parse('2026-04-21T00:00:00Z');
    const tracker = new BudgetTracker({
      maxTokensPerDay: 100,
      maxCostPerDay: 1000,
      onExceed: 'pause',
      resetSemantics: 'sliding-24h',
      now: () => now,
    });

    tracker.record({ phase: 'standard', tokens: 60, costUsd: 0 });
    expect(tracker.snapshot().tokensUsedToday).toBe(60);

    // < 24h later the spend is preserved - not zeroed on every check.
    now += HOUR;
    expect(tracker.snapshot().tokensUsedToday).toBe(60);

    // Cross the ceiling → pause; the pause survives the next check.
    tracker.record({ phase: 'standard', tokens: 60, costUsd: 0 });
    expect(tracker.snapshot().tokensUsedToday).toBe(120);
    expect(tracker.snapshot().paused).toBe(true);
    expect(tracker.precheck('standard').allowed).toBe(false);

    now += HOUR;
    expect(tracker.snapshot().paused).toBe(true);
    expect(tracker.snapshot().tokensUsedToday).toBe(120);

    // Past 24h from both spends: they age out of the trailing window, the
    // total drops to 0, and the tracker auto-unpauses.
    now += 25 * HOUR;
    const snap = tracker.snapshot();
    expect(snap.tokensUsedToday).toBe(0);
    expect(snap.paused).toBe(false);
    expect(tracker.precheck('standard').allowed).toBe(true);
  });
});

describe('consolidator/triggers', () => {
  it('parses every trigger kind', () => {
    const turn = parseTriggerSpec('turn:20');
    expect(turn).toMatchObject<Partial<ParsedTrigger>>({ kind: 'turn', count: 20 });

    const idleM = parseTriggerSpec('idle:5m');
    expect(idleM).toMatchObject<Partial<ParsedTrigger>>({ kind: 'idle', idleMs: 5 * 60 * 1000 });

    const idleS = parseTriggerSpec('idle:30s');
    expect(idleS).toMatchObject<Partial<ParsedTrigger>>({ kind: 'idle', idleMs: 30 * 1000 });

    const cron = parseTriggerSpec('cron:0 3 * * *');
    expect(cron).toMatchObject<Partial<ParsedTrigger>>({ kind: 'cron', expression: '0 3 * * *' });

    const event = parseTriggerSpec('event:session-ended');
    expect(event).toMatchObject<Partial<ParsedTrigger>>({ kind: 'event', name: 'session-ended' });

    const budget = parseTriggerSpec('budget:0.5');
    expect(budget).toMatchObject<Partial<ParsedTrigger>>({ kind: 'budget', threshold: 0.5 });
  });

  it('rejects malformed specs', () => {
    expect(() => parseTriggerSpec('turn:0')).toThrow(/positive integer/);
    expect(() => parseTriggerSpec('idle:')).toThrow(/idle/);
    expect(() => parseTriggerSpec('cron:')).toThrow(/cron/);
    expect(() => parseTriggerSpec('event:')).toThrow(/empty event/);
    expect(() => parseTriggerSpec('budget:1.5')).toThrow(/fraction between 0 and 1/);
    expect(() => parseTriggerSpec('garbage' as never)).toThrow(/expected 'kind:value'/);
    expect(() => parseTriggerSpec('unknown:x' as never)).toThrow(/unknown consolidator trigger/);
  });

  it('reasonFromTrigger preserves the discriminator', () => {
    const reason = reasonFromTrigger(parseTriggerSpec('turn:5'));
    expect(reason).toEqual({ kind: 'turn', value: 5 });
  });
});

describe('consolidator/dlq helpers', () => {
  it('classifies common error kinds', () => {
    expect(classifyError(new Error('429 rate limit hit'))).toBe('rate_limit');
    expect(classifyError(new Error('Provider 5xx'))).toBe('5xx');
    expect(classifyError(new Error('Embedder failed to load'))).toBe('embedder_failed');
    expect(classifyError(new Error('Invalid response shape'))).toBe('invalid_response');
    expect(classifyError(new Error('Timeout waiting on body'))).toBe('timeout');
    expect(classifyError(new Error('budget exceeded'))).toBe('budget');
    expect(classifyError(new Error('mystery'))).toBe('unknown');
    expect(classifyError(null)).toBe('unknown');
  });

  it('exponential backoff is bounded', () => {
    const ms = nextBackoffMs({
      retryCount: 10,
      baseMs: 60_000,
      maxMs: 60 * 60 * 1000,
      jitter: () => 1,
    });
    expect(ms).toBeLessThanOrEqual(60 * 60 * 1000);
    const min = nextBackoffMs({
      retryCount: 0,
      baseMs: 60_000,
      maxMs: 60 * 60 * 1000,
      jitter: () => 0,
    });
    expect(min).toBe(0);
  });

  it('describeError handles primitives + null', () => {
    expect(describeError(null)).toBe('unknown error');
    expect(describeError('boom')).toBe('boom');
    expect(describeError(new Error('x'))).toBe('x');
    expect(describeError(42)).toBe('42');
  });
});

describe('consolidator/idempotency', () => {
  it('tipMessageId picks the highest sequence', () => {
    const tip = tipMessageId([
      makeRecord('user', 'a', 1),
      makeRecord('user', 'b', 5),
      makeRecord('user', 'c', 3),
    ]);
    expect(tip).toBe('msg_5');
    expect(tipMessageId([])).toBe(null);
  });
});

describe('consolidator tier defaults', () => {
  it('exposes the documented presets', () => {
    expect(CONSOLIDATOR_TIER_DEFAULTS.free.ceilings.maxTokensPerDay).toBe(0);
    expect(CONSOLIDATOR_TIER_DEFAULTS.cheap.ceilings.maxTokensPerDay).toBe(50_000);
    expect(CONSOLIDATOR_TIER_DEFAULTS.standard.ceilings.maxTokensPerDay).toBe(200_000);
    expect(CONSOLIDATOR_TIER_DEFAULTS.full.ceilings.maxTokensPerDay).toBe(1_000_000);
    expect(CONSOLIDATOR_TIER_DEFAULTS.free.phases).toEqual(['light']);
    expect(CONSOLIDATOR_TIER_DEFAULTS.cheap.phases).toEqual(['light', 'standard']);
    expect(CONSOLIDATOR_TIER_DEFAULTS.standard.phases).toEqual(['light', 'standard', 'deep']);
  });
});

describe('salvageTruncatedExtraction (W-020)', () => {
  it('recovers the complete prefix when truncated mid-object', () => {
    const out = salvageTruncatedExtraction(
      '{"facts":[{"text":"User lives in Tbilisi"},{"text":"User works in te',
    );
    expect(out.map((f) => f.text)).toEqual(['User lives in Tbilisi']);
  });

  it('recovers the complete prefix when truncated mid-string, tracking escapes and braces', () => {
    const out = salvageTruncatedExtraction(
      '{"facts":[{"text":"has } brace and \\" quote"},{"text":"cut here: \\"open',
    );
    expect(out.map((f) => f.text)).toEqual(['has } brace and " quote']);
  });

  it('returns [] when nothing complete survived', () => {
    expect(salvageTruncatedExtraction(undefined)).toEqual([]);
    expect(salvageTruncatedExtraction('')).toEqual([]);
    expect(salvageTruncatedExtraction('no json here')).toEqual([]);
    expect(salvageTruncatedExtraction('{"facts":[{"text":"unclosed')).toEqual([]);
  });

  it('keeps everything when the array closed and truncation hit trailing commentary', () => {
    const out = salvageTruncatedExtraction(
      '{"facts":[{"text":"a"},{"text":"b"}], "note": "this trail is trunc',
    );
    expect(out.map((f) => f.text)).toEqual(['a', 'b']);
  });

  it('tolerates a fenced block whose closing fence was truncated away', () => {
    const out = salvageTruncatedExtraction('```json\n{"facts":[{"text":"kept"},{"text":"lost');
    expect(out.map((f) => f.text)).toEqual(['kept']);
  });
});
