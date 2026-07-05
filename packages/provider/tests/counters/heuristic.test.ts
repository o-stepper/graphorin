/**
 * Coverage for the heuristic chars/N token estimator.
 */
import type { Message } from '@graphorin/core';
import { afterEach, describe, expect, it } from 'vitest';

import { __resetHeuristicWarnCache, HeuristicCounter } from '../../src/counters/heuristic.js';

function userMessage(text: string): Message {
  return { role: 'user', content: text };
}

describe('HeuristicCounter', () => {
  afterEach(() => {
    __resetHeuristicWarnCache();
  });

  it('estimates count(messages) at chars/4 by default and accumulates across messages', async () => {
    const counter = new HeuristicCounter({ logger: () => undefined });
    const a = userMessage('abcdefgh');
    const b = userMessage('1234');
    const total = await counter.count([a, b]);
    // Each message serialises as `[user]\n<content>`; we don't assert
    // exact numbers (serialisation is internal) - we assert linearity:
    // counting the two together equals counting each individually.
    const single = await counter.count([a]);
    const single2 = await counter.count([b]);
    expect(total).toBe(single + single2);
  });

  it('honours a custom charsPerToken value', async () => {
    const dense = new HeuristicCounter({ charsPerToken: 1, logger: () => undefined });
    const loose = new HeuristicCounter({ charsPerToken: 8, logger: () => undefined });
    const denseCount = await dense.countText('abcdefgh');
    const looseCount = await loose.countText('abcdefgh');
    expect(denseCount).toBe(8);
    expect(looseCount).toBe(1);
  });

  it('returns 0 for empty text', async () => {
    const counter = new HeuristicCounter({ logger: () => undefined });
    expect(await counter.countText('')).toBe(0);
  });

  it('throws RangeError when charsPerToken is 0', () => {
    expect(() => new HeuristicCounter({ charsPerToken: 0 })).toThrow(RangeError);
  });

  it('throws RangeError when charsPerToken is negative', () => {
    expect(() => new HeuristicCounter({ charsPerToken: -1 })).toThrow(RangeError);
  });

  it('emits the WARN exactly once per (id, modelId) tuple', async () => {
    const calls: Array<{ message: string; meta?: object }> = [];
    const logger = (message: string, meta?: object): void => {
      calls.push({ message, ...(meta !== undefined ? { meta } : {}) });
    };
    const a = new HeuristicCounter({ modelId: 'm1', logger });
    await a.countText('abcd');
    await a.countText('efgh');
    expect(calls).toHaveLength(1);
    expect(calls[0]?.message).toContain('heuristic token counter active');

    const b = new HeuristicCounter({ modelId: 'm1', logger });
    await b.countText('xyz');
    expect(calls).toHaveLength(1);

    const c = new HeuristicCounter({ modelId: 'm2', logger });
    await c.countText('xyz');
    expect(calls).toHaveLength(2);
  });

  it('__resetHeuristicWarnCache lets the WARN fire again', async () => {
    const calls: string[] = [];
    const logger = (m: string): void => {
      calls.push(m);
    };
    const a = new HeuristicCounter({ modelId: 'm', logger });
    await a.countText('a');
    expect(calls).toHaveLength(1);
    __resetHeuristicWarnCache();
    const b = new HeuristicCounter({ modelId: 'm', logger });
    await b.countText('b');
    expect(calls).toHaveLength(2);
  });

  it('exposes a stable id and version including the chars-per-token value', () => {
    const counter = new HeuristicCounter({ charsPerToken: 5, logger: () => undefined });
    expect(counter.id).toBe('heuristic@5cpt');
    expect(counter.version).toBe('heuristic-5-cpt-v1');
  });
});
