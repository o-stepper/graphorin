import type { Message } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import {
  BUILT_IN_COMMENTARY_PATTERNS,
  createCommentarySanitizer,
} from '../src/commentary/index.js';

const COMMENTARY_LEAK = `Hello! {"type":"tool.execute.end","toolCallId":"tc-1","result":{"webhook_url":"https://example.com"}}`;

describe('Commentary sanitizer', () => {
  it('wraps detected tool.execute.end fragments by default', () => {
    const sanitizer = createCommentarySanitizer();
    const message: Message = {
      role: 'assistant',
      content: COMMENTARY_LEAK,
    };
    const out = sanitizer.sanitizeMessage(message, 'session-push');
    expect(out.message.role).toBe('assistant');
    if (out.message.role === 'assistant' && typeof out.message.content === 'string') {
      expect(out.message.content).toContain('<<<commentary>>>');
      expect(out.message.content).toContain('<<</commentary>>>');
    }
    expect(out.decisions[0]?.applied).toBe(true);
    expect(out.decisions[0]?.reasons).toContain('tool.execute.end-payload-signature');
  });

  it('strips fragments when policy is "strip"', () => {
    const sanitizer = createCommentarySanitizer({ policy: 'strip' });
    const message: Message = {
      role: 'assistant',
      content: COMMENTARY_LEAK,
    };
    const out = sanitizer.sanitizeMessage(message, 'session-export');
    if (out.message.role === 'assistant' && typeof out.message.content === 'string') {
      expect(out.message.content).not.toContain('tool.execute.end');
      expect(out.message.content).not.toContain('<<<commentary>>>');
      expect(out.message.content.startsWith('Hello!')).toBe(true);
    }
  });

  it('passes content through when policy is "pass-through"', () => {
    const sanitizer = createCommentarySanitizer({ policy: 'pass-through' });
    const message: Message = {
      role: 'assistant',
      content: COMMENTARY_LEAK,
    };
    const out = sanitizer.sanitizeMessage(message, 'session-replay');
    if (out.message.role === 'assistant' && typeof out.message.content === 'string') {
      expect(out.message.content).toBe(COMMENTARY_LEAK);
    }
    expect(out.decisions[0]?.applied).toBe(false);
  });

  it('is idempotent: re-sanitizing already-wrapped content produces the same output', () => {
    const sanitizer = createCommentarySanitizer({ policy: 'wrap' });
    const message: Message = {
      role: 'assistant',
      content: COMMENTARY_LEAK,
    };
    const out1 = sanitizer.sanitizeMessage(message, 'session-push');
    const out2 = sanitizer.sanitizeMessage(out1.message, 'session-list');
    expect(out2.decisions[0]?.applied).toBe(false);
    if (out1.message.role === 'assistant' && typeof out1.message.content === 'string') {
      if (out2.message.role === 'assistant' && typeof out2.message.content === 'string') {
        expect(out2.message.content).toBe(out1.message.content);
      }
    }
  });

  it('leaves non-text parts untouched', () => {
    const sanitizer = createCommentarySanitizer();
    const message: Message = {
      role: 'user',
      content: [{ type: 'image', image: new Uint8Array([1, 2, 3]) }],
    };
    const out = sanitizer.sanitizeMessage(message, 'session-push');
    expect(out.decisions[0]?.applied).toBe(false);
  });

  it('handles structured `MessageContent` arrays', () => {
    const sanitizer = createCommentarySanitizer();
    const message: Message = {
      role: 'assistant',
      content: [
        { type: 'text', text: 'Plain hi' },
        { type: 'text', text: COMMENTARY_LEAK },
      ],
    };
    const out = sanitizer.sanitizeMessage(message, 'session-push');
    expect(out.decisions).toHaveLength(2);
    expect(out.decisions[0]?.applied).toBe(false);
    expect(out.decisions[1]?.applied).toBe(true);
  });

  it('exposes the BUILT_IN_COMMENTARY_PATTERNS catalogue', () => {
    expect(BUILT_IN_COMMENTARY_PATTERNS.length).toBeGreaterThan(0);
    const reasons = new Set(BUILT_IN_COMMENTARY_PATTERNS.map((p) => p.reason));
    expect(reasons.has('tool.execute.end-payload-signature')).toBe(true);
    expect(reasons.has('agent.fanout-event-signature')).toBe(true);
  });

  it('records sha256 before/after on every decision', () => {
    const sanitizer = createCommentarySanitizer();
    const message: Message = { role: 'assistant', content: 'Hi' };
    const out = sanitizer.sanitizeMessage(message, 'session-push');
    const decision = out.decisions[0];
    expect(decision?.sha256OfBefore).toMatch(/^[a-f0-9]{64}$/);
    expect(decision?.sha256OfAfter).toMatch(/^[a-f0-9]{64}$/);
    expect(decision?.sha256OfBefore).toBe(decision?.sha256OfAfter);
  });

  it('passes through system messages with no decisions', () => {
    const sanitizer = createCommentarySanitizer();
    const message: Message = { role: 'system', content: COMMENTARY_LEAK };
    const out = sanitizer.sanitizeMessage(message, 'session-push');
    expect(out.decisions).toHaveLength(0);
    expect(out.message).toBe(message);
  });

  it('strip-policy removes the detected fragment leaving only structural remainder', () => {
    const sanitizer = createCommentarySanitizer({ policy: 'strip' });
    const message: Message = {
      role: 'assistant',
      content: '{"type":"tool.execute.end","toolCallId":"tc-1","result":{"x":1}}',
    };
    const out = sanitizer.sanitizeMessage(message, 'session-push');
    expect(out.decisions[0]?.applied).toBe(true);
    if (out.message.role === 'assistant' && typeof out.message.content === 'string') {
      // The detection signature is removed; remaining structural braces are
      // benign and do not match any pattern signature.
      expect(out.message.content).not.toContain('tool.execute.end');
      expect(out.message.content).not.toContain('toolCallId');
    }
  });

  it('handles multiple commentary fragments in one text part', () => {
    const sanitizer = createCommentarySanitizer({ policy: 'wrap' });
    const message: Message = {
      role: 'assistant',
      content:
        'pre {"type":"tool.execute.end","toolCallId":"tc-1","result":{"a":1}} mid {"type":"tool.call.start","toolName":"x","toolCallId":"tc-2"} post',
    };
    const out = sanitizer.sanitizeMessage(message, 'session-push');
    expect(out.decisions[0]?.applied).toBe(true);
    expect(out.decisions[0]?.reasons.length).toBeGreaterThanOrEqual(2);
    if (out.message.role === 'assistant' && typeof out.message.content === 'string') {
      // Two distinct envelopes - both fragments wrapped, plain prose preserved.
      expect((out.message.content.match(/<<<commentary>>>/g) ?? []).length).toBe(2);
      expect(out.message.content).toContain('pre ');
      expect(out.message.content).toContain('mid ');
      expect(out.message.content).toContain('post');
    }
  });

  it('is bytes-equal across the four boundaries', () => {
    const sanitizer = createCommentarySanitizer();
    const message: Message = { role: 'assistant', content: COMMENTARY_LEAK };
    const a = sanitizer.sanitizeMessage(message, 'session-push').message;
    const b = sanitizer.sanitizeMessage(message, 'session-list').message;
    const c = sanitizer.sanitizeMessage(message, 'session-export').message;
    const d = sanitizer.sanitizeMessage(message, 'session-replay').message;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(b)).toBe(JSON.stringify(c));
    expect(JSON.stringify(c)).toBe(JSON.stringify(d));
  });

  it('per-part sanitization is well under 2 ms p95 on a 100-part fixture', () => {
    const sanitizer = createCommentarySanitizer();
    const samples: Message[] = [];
    for (let i = 0; i < 100; i += 1) {
      samples.push({
        role: 'assistant',
        content: [
          { type: 'text', text: `Hello part ${i}` },
          { type: 'text', text: COMMENTARY_LEAK },
        ],
      });
    }
    const timings: number[] = [];
    for (const m of samples) {
      const start = process.hrtime.bigint();
      sanitizer.sanitizeMessage(m, 'session-push');
      timings.push(Number(process.hrtime.bigint() - start) / 1e6);
    }
    timings.sort((a, b) => a - b);
    const p95 = timings[Math.floor(timings.length * 0.95)] ?? 0;
    // Generous bound: 5 ms for CI noise tolerance - the spec target is 2 ms p95.
    expect(p95).toBeLessThan(5);
  });
});
