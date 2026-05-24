import { describe, expect, it } from 'vitest';

import {
  argumentValidity,
  correctToolSelected,
  finalStateCorrect,
  recoveryAfterError,
  redundantCallDetection,
  type Trajectory,
  type TrajectoryToolCall,
} from '../src/scorers/index.js';

const noopCase = (input: unknown, expected?: unknown) => ({
  input,
  ...(expected !== undefined ? { expected } : {}),
});

let seq = 0;
const ok = (toolName: string, args: unknown = {}, result: unknown = null): TrajectoryToolCall => ({
  toolCallId: `c${seq++}`,
  toolName,
  args,
  status: 'ok',
  result,
});
const err = (toolName: string, args: unknown = {}, message = 'boom'): TrajectoryToolCall => ({
  toolCallId: `c${seq++}`,
  toolName,
  args,
  status: 'error',
  error: { kind: 'internal-error', message },
});
const traj = (
  calls: ReadonlyArray<TrajectoryToolCall>,
  extra: Partial<Trajectory> = {},
): Trajectory => ({
  calls,
  ...extra,
});

describe('correctToolSelected', () => {
  it('passes when every expected tool was called (unordered)', async () => {
    const scorer = correctToolSelected({ expected: ['catalog.search', 'order.place'] });
    const r = await scorer.score({
      case: noopCase('q') as never,
      output: traj([ok('order.place'), ok('catalog.search')]),
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
    expect(r.score).toBe(1);
  });

  it('fails and lists the missing tool', async () => {
    const scorer = correctToolSelected({ expected: ['catalog.search', 'order.place'] });
    const r = await scorer.score({
      case: noopCase('q') as never,
      output: traj([ok('catalog.search')]),
      durationMs: 0,
    });
    expect(r.pass).toBe(false);
    expect(r.score).toBe(0.5);
    expect(r.reason).toMatch(/order\.place/);
  });

  it('honours requireOrder as an ordered subsequence', async () => {
    const scorer = correctToolSelected({
      expected: ['catalog.search', 'cart.add', 'order.place'],
      requireOrder: true,
    });
    const pass = await scorer.score({
      case: noopCase('q') as never,
      output: traj([ok('catalog.search'), ok('cart.view'), ok('cart.add'), ok('order.place')]),
      durationMs: 0,
    });
    expect(pass.pass).toBe(true);

    const fail = await scorer.score({
      case: noopCase('q') as never,
      output: traj([ok('order.place'), ok('catalog.search'), ok('cart.add')]),
      durationMs: 0,
    });
    expect(fail.pass).toBe(false);
    expect(fail.reason).toMatch(/ordered subsequence/);
  });

  it('accepts a single tool name and an empty expectation', async () => {
    const single = await correctToolSelected({ expected: 'order.place' }).score({
      case: noopCase('q') as never,
      output: traj([ok('order.place')]),
      durationMs: 0,
    });
    expect(single.pass).toBe(true);

    const empty = await correctToolSelected({ expected: [] }).score({
      case: noopCase('q') as never,
      output: traj([]),
      durationMs: 0,
    });
    expect(empty.pass).toBe(true);
  });
});

describe('argumentValidity', () => {
  const tools = [
    {
      name: 'cart.add',
      inputSchema: {
        safeParse: (v: unknown) => ({
          success:
            typeof v === 'object' &&
            v !== null &&
            typeof (v as { sku?: unknown }).sku === 'string' &&
            typeof (v as { qty?: unknown }).qty === 'number',
        }),
      },
    },
  ];

  it('passes when all matching calls have valid arguments', async () => {
    const r = await argumentValidity({ tools }).score({
      case: noopCase('q') as never,
      output: traj([ok('cart.add', { sku: 'A1', qty: 2 }), ok('other.tool', { whatever: true })]),
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
    expect(r.score).toBe(1);
  });

  it('fails when a call has arguments rejected by its inputSchema', async () => {
    const r = await argumentValidity({ tools }).score({
      case: noopCase('q') as never,
      output: traj([ok('cart.add', { sku: 99 }), ok('cart.add', { sku: 'A1', qty: 1 })]),
      durationMs: 0,
    });
    expect(r.pass).toBe(false);
    expect(r.score).toBe(0.5);
    expect(r.reason).toMatch(/cart\.add/);
  });

  it('passes trivially when no call matches a known tool', async () => {
    const r = await argumentValidity({ tools }).score({
      case: noopCase('q') as never,
      output: traj([ok('unknown.tool', { x: 1 })]),
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
  });
});

describe('redundantCallDetection', () => {
  it('passes when no successful call repeats', async () => {
    const r = await redundantCallDetection().score({
      case: noopCase('q') as never,
      output: traj([ok('search', { q: 'a' }), ok('search', { q: 'b' })]),
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
    expect(r.score).toBe(1);
  });

  it('flags a repeated successful call with deep-equal (order-insensitive) args', async () => {
    const r = await redundantCallDetection().score({
      case: noopCase('q') as never,
      output: traj([ok('search', { a: 1, b: 2 }), ok('search', { b: 2, a: 1 })]),
      durationMs: 0,
    });
    expect(r.pass).toBe(false);
    expect(r.score).toBe(0.5);
    expect(r.reason).toMatch(/redundant/);
  });

  it('does not flag a retry after an error', async () => {
    const r = await redundantCallDetection().score({
      case: noopCase('q') as never,
      output: traj([err('charge', { id: 'o1' }), ok('charge', { id: 'o1' })]),
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
  });

  it('honours the ignore list and maxRedundant tolerance', async () => {
    const ignored = await redundantCallDetection({ ignore: ['ping'] }).score({
      case: noopCase('q') as never,
      output: traj([ok('ping', {}), ok('ping', {})]),
      durationMs: 0,
    });
    expect(ignored.pass).toBe(true);

    const tolerated = await redundantCallDetection({ maxRedundant: 1 }).score({
      case: noopCase('q') as never,
      output: traj([ok('search', { q: 'a' }), ok('search', { q: 'a' })]),
      durationMs: 0,
    });
    expect(tolerated.pass).toBe(true);
  });
});

describe('recoveryAfterError', () => {
  it('passes trivially with no errors', async () => {
    const r = await recoveryAfterError().score({
      case: noopCase('q') as never,
      output: traj([ok('a'), ok('b')]),
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
    expect(r.score).toBe(1);
  });

  it('passes when an error is followed by a successful call', async () => {
    const r = await recoveryAfterError().score({
      case: noopCase('q') as never,
      output: traj([err('charge'), ok('charge')]),
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
    expect(r.reason).toMatch(/recovered/);
  });

  it('fails when an error has no successful follow-up', async () => {
    const r = await recoveryAfterError().score({
      case: noopCase('q') as never,
      output: traj([ok('a'), err('charge')]),
      durationMs: 0,
    });
    expect(r.pass).toBe(false);
  });

  it('scores partial recovery across multiple errors', async () => {
    const r = await recoveryAfterError().score({
      case: noopCase('q') as never,
      output: traj([err('x'), ok('x'), err('y')]),
      durationMs: 0,
    });
    expect(r.pass).toBe(false);
    expect(r.score).toBe(0.5);
  });
});

describe('finalStateCorrect', () => {
  it('passes when finalState deep-equals expected', async () => {
    const r = await finalStateCorrect({ expected: { orders: 1, cart: 0 } }).score({
      case: noopCase('q') as never,
      output: traj([], { finalState: { cart: 0, orders: 1 } }),
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
  });

  it('reads a dot-path before comparing', async () => {
    const r = await finalStateCorrect({ path: 'orders.0.status', expected: 'placed' }).score({
      case: noopCase('q') as never,
      output: traj([], { finalState: { orders: [{ status: 'placed' }] } }),
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
  });

  it('supports a custom matches predicate', async () => {
    const scorer = finalStateCorrect({
      matches: (s) => Array.isArray((s as { orders?: unknown[] }).orders),
    });
    const r = await scorer.score({
      case: noopCase('q') as never,
      output: traj([], { finalState: { orders: [] } }),
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
  });

  it('fails with a descriptive reason on mismatch', async () => {
    const r = await finalStateCorrect({ path: 'orders.0.status', expected: 'paid' }).score({
      case: noopCase('q') as never,
      output: traj([], { finalState: { orders: [{ status: 'placed' }] } }),
      durationMs: 0,
    });
    expect(r.pass).toBe(false);
    expect(r.reason).toMatch(/expected.*paid/);
  });

  it('throws when neither expected nor matches is configured', () => {
    expect(() => finalStateCorrect({})).toThrow(/expected.*matches/);
  });
});
