import type { Message } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import {
  bySensitivity,
  compose,
  custom,
  defaultHandoffFilter,
  full,
  lastN,
  lastUser,
  stripReasoning,
  stripSensitiveOutputs,
  stripToolCalls,
  summary,
} from '../src/filters/index.js';

const sample: readonly Message[] = [
  { role: 'system', content: 'You are helpful.' },
  { role: 'user', content: 'Hi 1' },
  {
    role: 'assistant',
    content: [
      { type: 'reasoning', text: 'private chain of thought' },
      { type: 'text', text: 'Hello there 1' },
    ],
  },
  { role: 'user', content: 'Hi 2' },
  {
    role: 'assistant',
    content: 'Hello there 2',
    toolCalls: [{ toolCallId: 'tc-1', toolName: 'sum', args: {} }],
  },
  { role: 'tool', toolCallId: 'tc-1', content: '42' },
  { role: 'tool', toolCallId: 'tc-2', content: '[REDACTED:secret]' },
  { role: 'user', content: 'Hi 3' },
];

describe('filters.lastN', () => {
  it('throws on non-positive n', () => {
    expect(() => lastN(0)).toThrowError(RangeError);
    expect(() => lastN(-1)).toThrowError(RangeError);
  });
  it('keeps the system prompt + last n non-system messages', () => {
    const filtered = lastN(2)(sample);
    expect(filtered[0]?.role).toBe('system');
    expect(filtered.length).toBe(3);
    expect(filtered[1]?.role).toBe('tool');
    expect(filtered[2]?.role).toBe('user');
  });
  it('exposes a serializable descriptor', () => {
    const f = lastN(5);
    expect(f.descriptor).toEqual({ kind: 'last-n', meta: { n: 5 } });
  });
});

describe('filters.lastUser', () => {
  it('returns system + last user only', () => {
    const filtered = lastUser()(sample);
    expect(filtered.length).toBe(2);
    expect(filtered[0]?.role).toBe('system');
    expect(filtered[1]?.role).toBe('user');
    if (filtered[1]?.role === 'user') {
      expect(filtered[1].content).toBe('Hi 3');
    }
  });
});

describe('filters.full', () => {
  it('returns the entire history', () => {
    const filtered = full()(sample);
    expect(filtered.length).toBe(sample.length);
  });
});

describe('filters.summary', () => {
  it('replaces the history with a single summary system message', () => {
    const filtered = summary('overview here')(sample);
    expect(filtered.length).toBe(1);
    expect(filtered[0]?.role).toBe('system');
    if (filtered[0]?.role === 'system') {
      expect(filtered[0].content).toContain('overview here');
    }
  });
});

describe('filters.bySensitivity', () => {
  it('drops messages with secret tokens when maxTier is public', () => {
    const filtered = bySensitivity({ maxTier: 'public' })(sample);
    const hasRedacted = filtered.some((m) => {
      const content = m.role === 'system' ? m.content : m.content;
      return JSON.stringify(content).includes('[REDACTED:secret]');
    });
    expect(hasRedacted).toBe(false);
  });
});

describe('filters.stripReasoning', () => {
  it('removes reasoning content parts from assistant messages', () => {
    const filtered = stripReasoning()(sample);
    const assistant = filtered[2];
    expect(assistant?.role).toBe('assistant');
    if (assistant?.role === 'assistant' && Array.isArray(assistant.content)) {
      expect(assistant.content.some((p) => p.type === 'reasoning')).toBe(false);
      expect(assistant.content.some((p) => p.type === 'text')).toBe(true);
    }
  });
});

describe('filters.stripSensitiveOutputs', () => {
  it('drops tool messages containing the secret marker', () => {
    const filtered = stripSensitiveOutputs()(sample);
    expect(filtered.some((m) => m.role === 'tool' && m.toolCallId === 'tc-2')).toBe(false);
    expect(filtered.some((m) => m.role === 'tool' && m.toolCallId === 'tc-1')).toBe(true);
  });
});

describe('filters.stripToolCalls', () => {
  it('drops tool messages and assistant.toolCalls fields', () => {
    const filtered = stripToolCalls()(sample);
    expect(filtered.some((m) => m.role === 'tool')).toBe(false);
    const assistantWithCalls = filtered.find(
      (m) =>
        m.role === 'assistant' &&
        (m as unknown as { toolCalls?: unknown[] }).toolCalls !== undefined,
    );
    expect(assistantWithCalls).toBeUndefined();
  });
});

describe('filters.compose', () => {
  it('always appends stripReasoning() at the end', () => {
    const filter = compose(full());
    expect(filter.descriptor.kind).toBe('compose');
    const meta = filter.descriptor.meta as { steps: { kind: string }[] };
    expect(meta.steps[meta.steps.length - 1]?.kind).toBe('strip-reasoning');
  });
  it('runs filters left-to-right then strips reasoning', () => {
    const filter = compose(lastN(3));
    const filtered = filter(sample);
    const hasReasoning = filtered.some((m) => {
      if (m.role !== 'assistant') return false;
      if (typeof m.content === 'string') return false;
      return m.content.some((p) => p.type === 'reasoning');
    });
    expect(hasReasoning).toBe(false);
  });
});

describe('filters.custom', () => {
  it('wraps a bare HandoffFilter into a DescribedFilter with kind=custom', () => {
    const f = custom((h) => h.slice(0, 1));
    expect(f.descriptor.kind).toBe('custom');
    const [first, second] = sample;
    if (first === undefined || second === undefined) throw new Error('fixture too short');
    expect(f([first, second]).length).toBe(1);
  });
});

describe('defaultHandoffFilter', () => {
  it('composes lastN(10) + stripSensitiveOutputs + stripReasoning', () => {
    const filter = defaultHandoffFilter();
    expect(filter.descriptor.kind).toBe('compose');
    const filtered = filter(sample);
    expect(filtered.some((m) => m.role === 'tool' && m.toolCallId === 'tc-2')).toBe(false);
  });
});
