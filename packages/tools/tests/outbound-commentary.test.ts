import { describe, expect, it } from 'vitest';
import {
  COMMENTARY_WRAP_CLOSE,
  COMMENTARY_WRAP_OPEN,
  freshRegex,
  OUTBOUND_COMMENTARY_PATTERNS,
  sha256Hex,
  splitByWrapEnvelope,
} from '../src/outbound/index.js';

describe('OUTBOUND_COMMENTARY_PATTERNS (shared catalogue)', () => {
  it('ships exactly the seven bounded reasons', () => {
    expect(OUTBOUND_COMMENTARY_PATTERNS.map((p) => p.reason)).toEqual([
      'tool.call.start-payload-signature',
      'tool.call.delta-payload-signature',
      'tool.call.end-payload-signature',
      'tool.execute.end-payload-signature',
      'agent.fanout-event-signature',
      'context.compacted-event-signature',
      'agent.model.fellback-event-signature',
    ]);
  });

  it('is deeply frozen and every regex carries the g flag', () => {
    expect(Object.isFrozen(OUTBOUND_COMMENTARY_PATTERNS)).toBe(true);
    for (const pattern of OUTBOUND_COMMENTARY_PATTERNS) {
      expect(Object.isFrozen(pattern)).toBe(true);
      expect(pattern.regex.flags).toContain('g');
      expect(pattern.description.length).toBeGreaterThan(0);
    }
  });

  it('no pattern matches the wrap envelope itself (idempotency prerequisite)', () => {
    const wrapped = `${COMMENTARY_WRAP_OPEN}anything${COMMENTARY_WRAP_CLOSE}`;
    for (const pattern of OUTBOUND_COMMENTARY_PATTERNS) {
      expect(freshRegex(pattern.regex).test(wrapped)).toBe(false);
    }
  });
});

describe('envelope helpers', () => {
  it('freshRegex clones so shared g-flagged instances stay stateless', () => {
    const pattern = OUTBOUND_COMMENTARY_PATTERNS[0] as { regex: RegExp };
    const a = freshRegex(pattern.regex);
    const b = freshRegex(pattern.regex);
    expect(a).not.toBe(pattern.regex);
    expect(a).not.toBe(b);
    expect(a.source).toBe(pattern.regex.source);
    expect(a.flags).toBe(pattern.regex.flags);
    // Consuming one clone must not advance the other's lastIndex.
    a.exec('{"type":"tool.call.start","toolName":"x"}');
    expect(b.lastIndex).toBe(0);
  });

  it('splitByWrapEnvelope separates plain and wrapped segments', () => {
    const open = COMMENTARY_WRAP_OPEN;
    const close = COMMENTARY_WRAP_CLOSE;
    const segments = splitByWrapEnvelope(`a${open}b${close}c`, open, close);
    expect(segments).toEqual([
      { kind: 'plain', text: 'a' },
      { kind: 'wrapped', text: `${open}b${close}` },
      { kind: 'plain', text: 'c' },
    ]);
  });

  it('splitByWrapEnvelope treats a malformed (unclosed) wrap as plain text', () => {
    const open = COMMENTARY_WRAP_OPEN;
    const segments = splitByWrapEnvelope(`a${open}dangling`, open, COMMENTARY_WRAP_CLOSE);
    expect(segments).toEqual([
      { kind: 'plain', text: 'a' },
      { kind: 'plain', text: `${open}dangling` },
    ]);
  });

  it('sha256Hex produces the well-known digest of the empty string', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
});
