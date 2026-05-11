import { describe, expect, it } from 'vitest';

import { computeBackoffMs, sleep } from '../src/reconnect.js';

describe('computeBackoffMs', () => {
  it('grows exponentially with full jitter clamped to maxMs', () => {
    let max = 0;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const value = computeBackoffMs(attempt, { random: () => 1, baseMs: 100, maxMs: 1_600 });
      expect(value).toBeNotNull();
      max = Math.max(max, value as number);
    }
    expect(max).toBeLessThanOrEqual(1_600);
  });

  it('returns null when attempt exceeds maxAttempts', () => {
    expect(computeBackoffMs(4, { maxAttempts: 3 })).toBeNull();
  });

  it('throws when the attempt index is invalid', () => {
    expect(() => computeBackoffMs(0)).toThrow(RangeError);
    expect(() => computeBackoffMs(-1)).toThrow(RangeError);
  });

  it('uses Math.random by default', () => {
    const value = computeBackoffMs(1);
    expect(value).toBeGreaterThanOrEqual(0);
  });
});

describe('sleep', () => {
  it('resolves after the requested duration', async () => {
    const started = performance.now();
    await sleep(20);
    expect(performance.now() - started).toBeGreaterThanOrEqual(15);
  });

  it('rejects when the supplied AbortSignal fires', async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(new Error('boom')), 5);
    await expect(sleep(1_000, controller.signal)).rejects.toThrow('boom');
  });

  it('rejects immediately when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(sleep(50, controller.signal)).rejects.toBeInstanceOf(Error);
  });
});

// Vitest does not surface `toBeNotNull` directly; provide a tiny shim.
declare module 'vitest' {
  interface Assertion<T> {
    toBeNotNull(): T;
  }
}

expect.extend({
  toBeNotNull(received) {
    return {
      pass: received !== null,
      message: () => `expected ${String(received)} to be not null`,
    };
  },
});
