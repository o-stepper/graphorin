import { describe, expect, it } from 'vitest';
import { LockManager } from '../src/consolidator/index.js';
import type {
  ConsolidatorMemoryStoreExt,
  ConsolidatorRunFinish,
  ConsolidatorRunInput,
  ConsolidatorStatePatch,
  ConsolidatorStateRow,
  DlqBatchInput,
  DlqBatchRow,
} from '../src/internal/storage-adapter.js';

class FakeStore implements ConsolidatorMemoryStoreExt {
  state = new Map<string, ConsolidatorStateRow>();
  runs: ConsolidatorRunInput[] = [];
  dlq = new Map<string, DlqBatchRow>();
  static key(scope: { userId: string; sessionId?: string; agentId?: string }): string {
    return `${scope.userId}|${scope.sessionId ?? ''}|${scope.agentId ?? ''}`;
  }
  async getState(scope: { userId: string }) {
    return this.state.get(FakeStore.key(scope)) ?? null;
  }
  async upsertState(scope: { userId: string }, patch: ConsolidatorStatePatch) {
    const key = FakeStore.key(scope);
    const current: ConsolidatorStateRow = this.state.get(key) ?? {
      scope: { userId: scope.userId },
      lastProcessedMessageId: null,
      lastPhase: null,
      lastCompletedAt: null,
      nextEligibleAt: null,
      activeLockHeldBy: null,
      activeLockAcquiredAt: null,
    };
    const next: ConsolidatorStateRow = {
      ...current,
      ...(patch as ConsolidatorStateRow),
    };
    this.state.set(key, next);
    return next;
  }
  async acquireLock(
    scope: { userId: string },
    runId: string,
    now: number,
    maxAgeMs: number,
  ): Promise<boolean> {
    const key = FakeStore.key(scope);
    const current = this.state.get(key);
    if (current === undefined || current.activeLockHeldBy === null) {
      this.state.set(key, {
        scope: { userId: scope.userId },
        lastProcessedMessageId: current?.lastProcessedMessageId ?? null,
        lastPhase: current?.lastPhase ?? null,
        lastCompletedAt: current?.lastCompletedAt ?? null,
        nextEligibleAt: current?.nextEligibleAt ?? null,
        activeLockHeldBy: runId,
        activeLockAcquiredAt: now,
      });
      return true;
    }
    if (current.activeLockHeldBy === runId) return true;
    if (
      maxAgeMs > 0 &&
      current.activeLockAcquiredAt !== null &&
      now - current.activeLockAcquiredAt > maxAgeMs
    ) {
      this.state.set(key, { ...current, activeLockHeldBy: runId, activeLockAcquiredAt: now });
      return true;
    }
    return false;
  }
  async releaseLock(scope: { userId: string }, runId: string) {
    const key = FakeStore.key(scope);
    const current = this.state.get(key);
    if (current !== undefined && current.activeLockHeldBy === runId) {
      this.state.set(key, { ...current, activeLockHeldBy: null, activeLockAcquiredAt: null });
    }
  }
  async recordRunStart(input: ConsolidatorRunInput) {
    this.runs.push(input);
  }
  async recordRunFinish(_finish: ConsolidatorRunFinish) {}
  async listRecentRuns() {
    return [];
  }
  async enqueueFailedBatch(input: DlqBatchInput) {
    this.dlq.set(input.id, {
      id: input.id,
      consolidatorRunId: input.consolidatorRunId,
      scope: input.scope,
      messageIds: [...input.messageIds],
      errorKind: input.errorKind,
      errorMessage: input.errorMessage,
      failedAt: input.failedAt,
      nextRetryAt: input.nextRetryAt,
      retryCount: input.retryCount,
    });
  }
  async claimReadyBatches() {
    return [];
  }
  async markBatchSucceeded(id: string) {
    this.dlq.delete(id);
  }
  async rescheduleBatch() {}
  async markBatchExhausted() {}
  async listFailedBatches() {
    return [...this.dlq.values()];
  }
}

describe('consolidator/lock', () => {
  const scope = { userId: 'alex' };

  it('acquires the lock when unlocked', async () => {
    const store = new FakeStore();
    const lock = new LockManager({
      store,
      waitMs: 0,
      maxRunDurationMs: 60_000,
      now: () => 0,
      randomId: () => 'run_1',
    });
    const out = await lock.acquire(scope);
    expect(out.kind).toBe('acquired');
  });

  it('defers when the lock is held by another run', async () => {
    const store = new FakeStore();
    let now = 0;
    const sleeps: number[] = [];
    const lock = new LockManager({
      store,
      waitMs: 50,
      maxRunDurationMs: 60_000,
      now: () => now,
      randomId: () => 'run_2',
      sleep: async (ms: number) => {
        sleeps.push(ms);
        now += ms;
      },
    });
    await store.acquireLock(scope, 'someone-else', 0, 60_000);
    const out = await lock.acquire(scope);
    expect(out.kind).toBe('deferred');
    if (out.kind === 'deferred') {
      expect(out.heldBy).toBe('someone-else');
    }
    expect(sleeps.length).toBeGreaterThan(0);
  });

  it('reclaims a stale lock past maxRunDurationMs', async () => {
    const store = new FakeStore();
    await store.acquireLock(scope, 'old', 0, 60_000);
    let now = 200_000;
    const lock = new LockManager({
      store,
      waitMs: 0,
      maxRunDurationMs: 60_000,
      now: () => now,
      randomId: () => 'run_3',
      sleep: async () => {
        now += 1;
      },
    });
    const out = await lock.acquire(scope);
    expect(out.kind).toBe('acquired');
  });

  it('falls back to a per-process map when no store is provided', async () => {
    let counter = 0;
    const lock = new LockManager({
      store: null,
      waitMs: 0,
      maxRunDurationMs: 60_000,
      now: () => 0,
      randomId: () => `run_${++counter}`,
    });
    const a = await lock.acquire(scope);
    const b = await lock.acquire(scope);
    expect(a.kind).toBe('acquired');
    expect(b.kind).toBe('deferred');
    if (a.kind === 'acquired') {
      await lock.release(scope, a.runId);
    }
    const c = await lock.acquire(scope);
    expect(c.kind).toBe('acquired');
  });
});
