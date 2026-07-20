/**
 * `withRedaction` + per-pattern `verify` - numeric-integrity coverage
 * (deep-retest 0.13.2 P2). The middleware must honour the catalogue's
 * `verify` predicate exactly like the OTLP validator does (RP-21):
 * a regex hit the verifier rejects stays byte-identical, emits no
 * violation, and never trips fail-closed mode. Serialized JSON numbers
 * (scores, epoch timestamps, snowflake ids) must survive the scrub.
 */
import type { Provider, ProviderEvent, ProviderRequest, ProviderResponse } from '@graphorin/core';
import type { RedactionPattern } from '@graphorin/observability/redaction/patterns';
import { describe, expect, it } from 'vitest';

import {
  type PromptRedactionViolation,
  withRedaction,
} from '../../src/middleware/with-redaction.js';

interface CapturingAdapter {
  provider: Provider;
  seen: ProviderRequest[];
  streamDeltas: string[];
}

function capturingAdapter(): CapturingAdapter {
  const seen: ProviderRequest[] = [];
  const streamDeltas: string[] = [];
  const provider: Provider = {
    name: 'capture',
    modelId: 'capture-model',
    capabilities: {
      streaming: true,
      toolCalling: true,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: false,
      reasoning: false,
      contextWindow: 1024,
      maxOutput: 256,
    },
    async *stream(req: ProviderRequest): AsyncIterable<ProviderEvent> {
      seen.push(req);
      for (const delta of streamDeltas) {
        yield { type: 'text-delta' as const, delta };
      }
      yield {
        type: 'finish' as const,
        finishReason: 'stop' as const,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
    },
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      seen.push(req);
      return {
        text: 'ok',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: 'stop' as const,
      };
    },
  };
  return { provider, seen, streamDeltas };
}

interface Harness {
  adapter: CapturingAdapter;
  wrapped: Provider;
  violations: PromptRedactionViolation[];
}

function harness(overrides: Record<string, unknown> = {}): Harness {
  const violations: PromptRedactionViolation[] = [];
  const adapter = capturingAdapter();
  const wrapped = withRedaction({
    scanScope: 'all',
    logger: () => undefined,
    trustClassOverride: 'public-tls',
    onViolation: (v) => violations.push(v),
    ...overrides,
  })(adapter.provider);
  return { adapter, wrapped, violations };
}

async function scrubToolContent(content: string, h: Harness = harness()): Promise<string> {
  await h.wrapped.generate({
    messages: [{ role: 'tool', toolCallId: 'call_1', content }],
  });
  const msg = h.adapter.seen[0]?.messages[0];
  return (msg as { content: string }).content;
}

describe('withRedaction - serialized numbers survive the creditcard pattern', () => {
  it('leaves a fact_search score float byte-identical (reviewer repro)', async () => {
    const h = harness();
    const content = JSON.stringify({ score: 0.01639344262295082, text: 'Front squat 5x5.' });
    const out = await scrubToolContent(content, h);
    expect(out).toBe(content);
    expect(JSON.parse(out)).toEqual({ score: 0.01639344262295082, text: 'Front squat 5x5.' });
    expect(h.violations).toHaveLength(0);
  });

  it('leaves an epoch-ms timestamp alone (Luhn-invalid 13-digit run)', async () => {
    const h = harness();
    const content = JSON.stringify({ createdAt: 1752897600000, note: 'run finished' });
    const out = await scrubToolContent(content, h);
    expect(out).toBe(content);
    expect(h.violations).toHaveLength(0);
  });

  it('leaves a Luhn-valid fraction alone thanks to the decimal boundary', async () => {
    // The fractional digits are the Visa test PAN - only the leading `.`
    // separates this from a real card; the lookbehind must refuse it.
    const h = harness();
    const content = JSON.stringify({ p: 0.4111111111111111 });
    const out = await scrubToolContent(content, h);
    expect(out).toBe(content);
    expect(h.violations).toHaveLength(0);
  });

  it('leaves the integer part of a decimal alone (trailing lookahead)', async () => {
    // 4111111111119 is Luhn-valid and 13 digits; the `.75` tail marks it
    // as a decimal, not a PAN.
    const h = harness();
    const out = await scrubToolContent('total 4111111111119.75 EUR', h);
    expect(out).toBe('total 4111111111119.75 EUR');
    expect(h.violations).toHaveLength(0);
  });

  it('leaves a Luhn-valid snowflake-style id alone (leading digit 1)', async () => {
    const h = harness();
    const content = JSON.stringify({ id: '1240000000000000001' });
    const out = await scrubToolContent(content, h);
    expect(out).toBe(content);
    expect(h.violations).toHaveLength(0);
  });

  it('still redacts a real PAN inside a JSON string leaf, keeping the JSON valid', async () => {
    const h = harness();
    const out = await scrubToolContent(JSON.stringify({ card: '4111 1111 1111 1111' }), h);
    expect(out).toBe(JSON.stringify({ card: '[REDACTED creditcard]' }));
    expect(JSON.parse(out)).toEqual({ card: '[REDACTED creditcard]' });
    expect(h.violations.some((v) => v.patternName === 'creditcard')).toBe(true);
  });

  it('redacts a raw numeric PAN with a quoted mask, keeping the JSON valid', async () => {
    const h = harness();
    const out = await scrubToolContent('{"card":4111111111111111}', h);
    expect(out).toBe('{"card":"[REDACTED creditcard]"}');
    expect(JSON.parse(out)).toEqual({ card: '[REDACTED creditcard]' });
    expect(h.violations.some((v) => v.patternName === 'creditcard')).toBe(true);
  });

  it('quotes every masked numeric leaf in an array, keeping the JSON valid', async () => {
    const h = harness();
    const out = await scrubToolContent('{"cards":[4111111111111111, 5500000000000004]}', h);
    expect(JSON.parse(out)).toEqual({
      cards: ['[REDACTED creditcard]', '[REDACTED creditcard]'],
    });
    expect(h.violations.some((v) => v.patternName === 'creditcard')).toBe(true);
  });

  it('keeps the mask unquoted in prose', async () => {
    const h = harness();
    const out = await scrubToolContent('card 4111 1111 1111 1111 thanks', h);
    expect(out).toBe('card [REDACTED creditcard] thanks');
  });

  it('round-trips a seeded corpus of floats / epochs / ids without a single hit', async () => {
    // Deterministic LCG so the corpus is stable across runs.
    let seed = 0x9e3779b9;
    const next = (): number => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    for (let i = 0; i < 250; i += 1) {
      const payload = {
        score: next(),
        at: 1700000000000 + Math.floor(next() * 99999999999),
        id: `1${String(Math.floor(next() * 1e17)).padStart(17, '0')}`,
      };
      const content = JSON.stringify(payload);
      const h = harness();
      const out = await scrubToolContent(content, h);
      expect(out).toBe(content);
      expect(JSON.parse(out)).toEqual(payload);
      expect(h.violations).toHaveLength(0);
    }
  });
});

describe('withRedaction - verify contract', () => {
  const rejectAll: RedactionPattern = {
    name: 'reject-all',
    category: 'pii',
    description: 'test pattern whose verifier rejects every regex hit',
    regex: /\bnum-\d+\b/g,
    verify: () => false,
  };
  const evenOnly: RedactionPattern = {
    name: 'even-only',
    category: 'pii',
    description: 'test pattern accepting even payloads only',
    regex: /\bnum-\d+\b/g,
    mask: '[MASKED]',
    verify: (m) => Number(m.slice(4)) % 2 === 0,
  };

  it('a rejected hit is untouched, uncounted, and does not trip failClosed', async () => {
    const h = harness({ patterns: [rejectAll], failClosed: true });
    await h.wrapped.generate({ messages: [{ role: 'user', content: 'see num-7 here' }] });
    const content = (h.adapter.seen[0]?.messages[0] as { content: string }).content;
    expect(content).toBe('see num-7 here');
    expect(h.violations).toHaveLength(0);
  });

  it('masks only accepted matches and counts only their length', async () => {
    const h = harness({ patterns: [evenOnly] });
    await h.wrapped.generate({
      messages: [{ role: 'user', content: 'num-1 num-2 num-3 num-4' }],
    });
    const content = (h.adapter.seen[0]?.messages[0] as { content: string }).content;
    expect(content).toBe('num-1 [MASKED] num-3 [MASKED]');
    expect(h.violations).toHaveLength(1);
    expect(h.violations[0]?.matchLength).toBe('num-2'.length + 'num-4'.length);
  });

  it('streaming scan honours verify: epoch emits nothing, a PAN emits a violation', async () => {
    const first = harness();
    first.adapter.streamDeltas.push('ts=1718000000000 done');
    for await (const _ of first.wrapped.stream({
      messages: [{ role: 'user', content: 'hi' }],
    })) {
      // drain
    }
    expect(first.violations.filter((v) => v.fieldPath === 'response.text-delta')).toHaveLength(0);

    const second = harness();
    second.adapter.streamDeltas.push('card 4111 1111 1111 1111 charged');
    for await (const _ of second.wrapped.stream({
      messages: [{ role: 'user', content: 'hi' }],
    })) {
      // drain
    }
    const hits = second.violations.filter((v) => v.fieldPath === 'response.text-delta');
    expect(hits).toHaveLength(1);
    expect(hits[0]?.patternName).toBe('creditcard');
  });
});
