/**
 * WF-10: non-JSON-safe state must fail FAST and identically on every
 * store. `structuredClone` happily round-trips Map/Set/Date with the
 * in-memory store while the production SQLite store JSON.stringify-es
 * them into `{}` / ISO strings without an error — a workflow that
 * resumed fine all dev cycle silently loses state in production.
 */

import { collect } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { createNode, createWorkflow, InMemoryCheckpointStore, latestValue } from '../src/index.js';

interface BagState {
  bag?: unknown;
}

function bagWorkflow(value: () => unknown) {
  return createWorkflow<BagState>({
    name: 'json-safety',
    channels: { bag: latestValue<unknown>() },
    nodes: {
      writer: createNode<BagState>({ name: 'writer', run: () => ({ bag: value() }) }),
    },
    edges: [
      { from: '__start__', to: 'writer' },
      { from: 'writer', to: '__end__' },
    ],
    checkpointStore: new InMemoryCheckpointStore(),
  });
}

describe('WF-10 — checkpoint state must be JSON-safe on EVERY store', () => {
  it('a Map in state fails the checkpoint with a typed error naming the channel — even in-memory', async () => {
    const events = await collect(
      bagWorkflow(() => new Map([['k', 'v']])).execute({}, { threadId: 'js-1' }),
    );
    expect(events.at(-1)?.type).not.toBe('workflow.end');
    const error = events.find((e) => e.type === 'workflow.error');
    expect(error).toBeDefined();
    if (error?.type === 'workflow.error') {
      expect(error.error.code).toBe('state-not-serializable');
      expect(error.error.message).toContain('bag');
    }
  });

  it('Set and Date are rejected the same way', async () => {
    for (const offender of [() => new Set([1, 2]), () => new Date()]) {
      const events = await collect(bagWorkflow(offender).execute({}));
      const error = events.find((e) => e.type === 'workflow.error');
      expect(error).toBeDefined();
      if (error?.type === 'workflow.error') {
        expect(error.error.code).toBe('state-not-serializable');
      }
    }
  });

  it('plain JSON state (nested objects, arrays, null) passes untouched', async () => {
    const events = await collect(
      bagWorkflow(() => ({ nested: { list: [1, 'two', null, { deep: true }] } })).execute(
        {},
        { threadId: 'js-ok' },
      ),
    );
    const end = events.at(-1);
    expect(end?.type).toBe('workflow.end');
    if (end?.type === 'workflow.end') {
      expect(end.state.bag).toEqual({ nested: { list: [1, 'two', null, { deep: true }] } });
    }
  });
});
