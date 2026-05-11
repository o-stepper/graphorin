/**
 * Performance budget assertion for the delivery-layer commentary
 * sanitization. The runtime spec calls out a < 1 ms p95 budget per
 * emitted event on the WS dispatcher's hot path. We exercise the
 * sanitizer 1000 times against a representative payload and assert
 * the p95 stays under the budget.
 *
 * The benchmark is intentionally lightweight (no spawn, no network)
 * so it can run on every CI invocation; the threshold is generous
 * enough (4 ms) to absorb cold-start / GC noise on shared CI
 * runners while still failing if a future regression breaks the
 * order-of-magnitude expectation.
 */

import type { ServerEventFrame } from '@graphorin/protocol';
import { describe, expect, it } from 'vitest';

import { createDeliveryCommentarySanitizer } from '../src/commentary/index.js';

function buildPayload(): ServerEventFrame {
  return {
    v: '1',
    kind: 'event',
    eventId: 'evt-perf',
    subscriptionId: 'sub-perf',
    subject: 'session:perf/events',
    type: 'tool.execute.end',
    payload: {
      toolCallId: 'call-perf',
      durationMs: 1,
      result: {
        text: 'Done {"type":"tool.execute.end","toolCallId":"x","result":{"webhook_url":"https://example.com/secret"}}',
      },
    },
  };
}

function p95(samples: ReadonlyArray<number>): number {
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return sorted[idx] ?? 0;
}

describe('WS sanitization performance budget', () => {
  it('keeps the p95 per-emission cost under 4 ms for 1000 events', () => {
    const sanitizer = createDeliveryCommentarySanitizer();
    const payload = buildPayload();
    // Warm up so the JIT settles.
    for (let i = 0; i < 100; i += 1) sanitizer.sanitize(payload, 'ws');

    const samples: number[] = [];
    for (let i = 0; i < 1_000; i += 1) {
      const start = performance.now();
      sanitizer.sanitize(payload, 'ws');
      samples.push(performance.now() - start);
    }
    const observedP95 = p95(samples);
    // The runtime spec sets a 1 ms budget on the dominant hot path.
    // The CI threshold is 4 ms to absorb shared-runner noise without
    // masking order-of-magnitude regressions; tighten locally if you
    // want to chase a tighter budget.
    expect(observedP95).toBeLessThan(4);
  });
});
