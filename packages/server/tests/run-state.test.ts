import { describe, expect, it } from 'vitest';

import { RunStateTracker } from '../src/runtime/run-state.js';

describe('RunStateTracker', () => {
  it('tracks the lifecycle of a single run', () => {
    let now = 1_000;
    const runs = new RunStateTracker({ now: () => now });
    const handle = runs.start('run-1', { kind: 'agent', agentId: 'echo' });
    expect(handle.runId).toBe('run-1');
    expect(handle.signal.aborted).toBe(false);
    let snap = runs.snapshot('run-1');
    expect(snap?.status).toBe('running');
    expect(snap?.agentId).toBe('echo');
    now = 2_000;
    runs.complete('run-1', 'completed');
    snap = runs.snapshot('run-1');
    expect(snap?.status).toBe('completed');
    expect(snap?.completedAt).toBe(2_000);
  });

  it('aborts in-flight runs and cancels the AbortController', () => {
    const runs = new RunStateTracker();
    const handle = runs.start('run-2', { kind: 'workflow', workflowId: 'pipeline' });
    expect(runs.abort('run-2')).toBe(true);
    expect(handle.signal.aborted).toBe(true);
    expect(runs.snapshot('run-2')?.status).toBe('aborted');
    expect(runs.abort('missing')).toBe(false);
  });

  it('declare reserves an id without taking ownership', () => {
    const runs = new RunStateTracker();
    runs.declare('run-3', { kind: 'agent', agentId: 'x' });
    const snap = runs.snapshot('run-3');
    expect(snap?.status).toBe('pending');
    expect(snap?.agentId).toBe('x');
  });

  it('counts in-flight runs correctly', () => {
    const runs = new RunStateTracker();
    runs.start('a', { kind: 'agent', agentId: 'x' });
    runs.start('b', { kind: 'agent', agentId: 'y' });
    expect(runs.inflightCount()).toBe(2);
    runs.complete('a', 'completed');
    expect(runs.inflightCount()).toBe(1);
  });

  it('prune removes terminal records older than the cutoff', () => {
    let now = 0;
    const runs = new RunStateTracker({ now: () => now });
    runs.start('a', { kind: 'agent', agentId: 'x' });
    now = 100;
    runs.complete('a', 'completed');
    expect(runs.prune(50)).toBe(0);
    expect(runs.prune(150)).toBe(1);
    expect(runs.snapshot('a')).toBeUndefined();
  });

  it('abortAll cancels every in-flight run', () => {
    const runs = new RunStateTracker();
    const a = runs.start('a', { kind: 'agent', agentId: 'x' });
    const b = runs.start('b', { kind: 'agent', agentId: 'y' });
    expect(runs.abortAll()).toBe(2);
    expect(a.signal.aborted).toBe(true);
    expect(b.signal.aborted).toBe(true);
  });
});
