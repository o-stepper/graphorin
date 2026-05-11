import { describe, expect, it } from 'vitest';

import {
  type ConsolidatorLike,
  type ConsolidatorStatusLike,
  createConsolidatorDaemon,
} from '../src/consolidator/daemon.js';

function buildStub(overrides: Partial<ConsolidatorLike> = {}): {
  consolidator: ConsolidatorLike;
  starts: number;
  stops: number;
  setStop: (impl: () => Promise<void>) => void;
} {
  let starts = 0;
  let stops = 0;
  let stopImpl: () => Promise<void> = async () => {
    stops += 1;
  };
  const consolidator: ConsolidatorLike = {
    async start() {
      starts += 1;
    },
    async stop() {
      await stopImpl();
    },
    async status(): Promise<ConsolidatorStatusLike> {
      return {
        tier: 'free',
        running: false,
        paused: false,
        queueDepth: 0,
        dlqSize: 0,
        deferredRuns: 0,
        emptyExtractions: 0,
        budget: {
          tokensUsedToday: 0,
          costUsedToday: 0,
          tokensRemaining: 0,
          costRemaining: 0,
          resetAt: new Date(0).toISOString(),
        },
      };
    },
    ...overrides,
  };
  return {
    consolidator,
    get starts() {
      return starts;
    },
    get stops() {
      return stops;
    },
    setStop(impl: () => Promise<void>) {
      stopImpl = impl;
    },
  } as unknown as {
    consolidator: ConsolidatorLike;
    starts: number;
    stops: number;
    setStop: (impl: () => Promise<void>) => void;
  };
}

describe('ConsolidatorDaemon', () => {
  it('start() / stop() lifecycle is idempotent', async () => {
    const stub = buildStub();
    const daemon = createConsolidatorDaemon({ consolidator: stub.consolidator, warn: () => {} });
    await daemon.start();
    await daemon.start();
    await daemon.stop();
    await daemon.stop();
    expect(stub.starts).toBe(1);
    expect(stub.stops).toBe(1);
  });

  it('forces shutdown after stopTimeoutMs when stop() hangs', async () => {
    const stub = buildStub();
    stub.setStop(
      async () =>
        new Promise<void>((resolve) => {
          setTimeout(resolve, 1_000);
        }),
    );
    const warnings: string[] = [];
    const daemon = createConsolidatorDaemon({
      consolidator: stub.consolidator,
      stopTimeoutMs: 25,
      warn: (m) => warnings.push(m),
    });
    await daemon.start();
    const start = Date.now();
    await daemon.stop();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(800);
    expect(warnings.some((w) => w.includes('exceeded'))).toBe(true);
  });

  it('status() delegates to the wrapped consolidator', async () => {
    const stub = buildStub();
    const daemon = createConsolidatorDaemon({ consolidator: stub.consolidator, warn: () => {} });
    const status = await daemon.status();
    expect(status.tier).toBe('free');
    expect(status.queueDepth).toBe(0);
  });
});
