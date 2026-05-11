import { describe, expect, it } from 'vitest';

import {
  collect,
  filter,
  mapStream,
  merge,
  take,
  takeWhile,
  withSignal,
} from '../src/utils/streams.js';

async function* range(n: number): AsyncIterable<number> {
  for (let i = 0; i < n; i++) yield i;
}

describe('collect', () => {
  it('drains an async iterable into an array', async () => {
    expect(await collect(range(3))).toEqual([0, 1, 2]);
  });

  it('returns an empty array for an empty iterable', async () => {
    expect(await collect(range(0))).toEqual([]);
  });
});

describe('mapStream', () => {
  it('applies the mapper sequentially with index', async () => {
    const out = await collect(mapStream(range(3), (v, i) => v * 10 + i));
    expect(out).toEqual([0, 11, 22]);
  });
});

describe('filter', () => {
  it('keeps values where predicate returns true', async () => {
    const out = await collect(filter(range(5), (v) => v % 2 === 0));
    expect(out).toEqual([0, 2, 4]);
  });
});

describe('take', () => {
  it('yields the first n items', async () => {
    const out = await collect(take(range(10), 3));
    expect(out).toEqual([0, 1, 2]);
  });

  it('returns nothing for n <= 0', async () => {
    expect(await collect(take(range(10), 0))).toEqual([]);
    expect(await collect(take(range(10), -1))).toEqual([]);
  });
});

describe('takeWhile', () => {
  it('stops at the first falsy predicate', async () => {
    const out = await collect(takeWhile(range(10), (v) => v < 3));
    expect(out).toEqual([0, 1, 2]);
  });
});

describe('merge', () => {
  it('produces the union of source iterables', async () => {
    const out = (await collect(merge<number>([range(3), range(3)]))).sort();
    expect(out).toEqual([0, 0, 1, 1, 2, 2]);
  });

  it('handles an empty source list', async () => {
    expect(await collect(merge<number>([]))).toEqual([]);
  });
});

describe('withSignal', () => {
  it('passes through the source when no signal is supplied', async () => {
    expect(await collect(withSignal(range(2)))).toEqual([0, 1]);
  });

  it('returns nothing when the signal is already aborted', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    expect(await collect(withSignal(range(10), ctrl.signal))).toEqual([]);
  });

  it('aborts mid-stream and exits cleanly', async () => {
    const ctrl = new AbortController();
    let yielded = 0;
    let returnedCleanly = false;

    async function* slow(): AsyncIterable<number> {
      try {
        for (let i = 0; i < 1000; i++) {
          yield i;
          yielded++;
          await new Promise((r) => setTimeout(r, 5));
        }
      } finally {
        returnedCleanly = true;
      }
    }

    const out: number[] = [];
    const wrapped = withSignal(slow(), ctrl.signal);
    setTimeout(() => ctrl.abort(), 25);
    for await (const v of wrapped) {
      out.push(v);
      if (out.length > 100) break;
    }
    expect(out.length).toBeGreaterThan(0);
    expect(out.length).toBeLessThan(yielded + 5);
    expect(returnedCleanly).toBe(true);
  });
});

describe('merge cancellation', () => {
  it('honors AbortSignal across multiple sources', async () => {
    const ctrl = new AbortController();
    let cleanedUp = 0;

    async function* slow(): AsyncIterable<number> {
      try {
        for (let i = 0; i < 1000; i++) {
          yield i;
          await new Promise((r) => setTimeout(r, 5));
        }
      } finally {
        cleanedUp++;
      }
    }

    const merged = merge<number>([slow(), slow()], ctrl.signal);
    const out: number[] = [];
    setTimeout(() => ctrl.abort(), 20);
    for await (const v of merged) {
      out.push(v);
      if (out.length > 50) break;
    }
    // Both upstream iterators should have run their `finally` blocks.
    expect(cleanedUp).toBe(2);
  });

  it('returns immediately when the signal is already aborted', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    let cleanedUp = 0;
    async function* src(): AsyncIterable<number> {
      try {
        yield 1;
      } finally {
        cleanedUp++;
      }
    }
    const out = await collect(merge<number>([src(), src()], ctrl.signal));
    expect(out).toEqual([]);
    // Iterators that have not started yet do not need cleanup; this just
    // asserts merge returns without throwing on a pre-aborted signal.
    expect(cleanedUp).toBeGreaterThanOrEqual(0);
  });
});

/* ------------------------------------------------------------------ *
 * Explicit per-helper AbortSignal propagation tests (Phase 02 DoD).
 * ------------------------------------------------------------------ */

async function* slowRange(n: number, stepMs = 5): AsyncIterable<number> {
  for (let i = 0; i < n; i++) {
    yield i;
    await new Promise((r) => setTimeout(r, stepMs));
  }
}

describe('AbortSignal propagation', () => {
  it('collect honors a pre-aborted signal', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    expect(await collect(slowRange(100), ctrl.signal)).toEqual([]);
  });

  it('collect aborts mid-stream', async () => {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 15);
    const out = await collect(slowRange(1000), ctrl.signal);
    expect(out.length).toBeLessThan(1000);
  });

  it('mapStream stops on a pre-aborted signal', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    let mapped = 0;
    const out = await collect(
      mapStream(
        slowRange(100),
        (v) => {
          mapped++;
          return v;
        },
        ctrl.signal,
      ),
    );
    expect(out).toEqual([]);
    expect(mapped).toBe(0);
  });

  it('mapStream aborts mid-stream and exits cleanly', async () => {
    const ctrl = new AbortController();
    let cleanedUp = 0;
    async function* src(): AsyncIterable<number> {
      try {
        for (let i = 0; i < 1000; i++) {
          yield i;
          await new Promise((r) => setTimeout(r, 5));
        }
      } finally {
        cleanedUp++;
      }
    }
    const out: number[] = [];
    setTimeout(() => ctrl.abort(), 20);
    for await (const v of mapStream(src(), (v) => v * 2, ctrl.signal)) {
      out.push(v);
    }
    expect(out.length).toBeLessThan(1000);
    expect(cleanedUp).toBe(1);
  });

  it('filter aborts mid-stream', async () => {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 15);
    const out: number[] = [];
    for await (const v of filter(slowRange(1000), (v) => v % 2 === 0, ctrl.signal)) {
      out.push(v);
    }
    expect(out.length).toBeLessThan(500);
  });

  it('take honors AbortSignal', async () => {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 10);
    const out: number[] = [];
    for await (const v of take(slowRange(1000), 1000, ctrl.signal)) {
      out.push(v);
    }
    expect(out.length).toBeLessThan(1000);
  });

  it('takeWhile honors AbortSignal', async () => {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 10);
    const out: number[] = [];
    for await (const v of takeWhile(slowRange(1000), () => true, ctrl.signal)) {
      out.push(v);
    }
    expect(out.length).toBeLessThan(1000);
  });
});
