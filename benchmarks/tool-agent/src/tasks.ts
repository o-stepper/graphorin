/**
 * Graphorin — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * The benchmark task set. Each task pins a deterministic provider script
 * (the model's fixed "plan" of tool calls) plus the goal-state and the
 * tools the harness is expected to select. The good tasks cover the loop's
 * core behaviours: ordered multi-tool flow, parallel dispatch (WI-04), and
 * recovery from a surfaced tool error. `brokenTask` is a deliberately wrong
 * plan used by the smoke test to prove the pass^k gate trips.
 */

import {
  type MockProviderScript,
  multiToolCallScript,
  textOnlyScript,
  toolCallScript,
} from './mock-provider.js';
import type { WorldSnapshot } from './world.js';

export interface ToolAgentTask {
  readonly id: string;
  readonly input: string;
  /** Tool names seeded to throw exactly once (recovery scenarios). */
  readonly failOnce?: ReadonlyArray<string>;
  /** The deterministic provider plan: one script per loop step. */
  readonly scripts: ReadonlyArray<MockProviderScript>;
  /** Tools the harness is expected to select (see `correctToolSelected`). */
  readonly expectedTools: ReadonlyArray<string>;
  /** Require the expected tools as an ordered subsequence. */
  readonly requireOrder?: boolean;
  /** Goal predicate over the final world snapshot (see `finalStateCorrect`). */
  readonly goal: (snapshot: WorldSnapshot) => boolean;
  readonly goalDescription: string;
}

/** Task 1 — a simple ordered three-tool purchase flow. */
const placeSingleOrder: ToolAgentTask = {
  id: 'place-single-order',
  input: 'Find a blue tee and order one.',
  scripts: [
    toolCallScript({ toolCallId: 't1-search', toolName: 'catalog.search', args: { query: 'tee' } }),
    toolCallScript({
      toolCallId: 't1-add',
      toolName: 'cart.add',
      args: { sku: 'tee-blue', qty: 1 },
    }),
    toolCallScript({ toolCallId: 't1-place', toolName: 'order.place', args: {} }),
    textOnlyScript('Your blue tee is ordered.', 8),
  ],
  expectedTools: ['catalog.search', 'cart.add', 'order.place'],
  requireOrder: true,
  goal: (s) =>
    s.orderCount === 1 &&
    s.cartSize === 0 &&
    s.orders[0]?.status === 'placed' &&
    s.orders[0]?.itemCount === 1,
  goalDescription: 'exactly one placed order with one item and an empty cart',
};

/** Task 2 — recover from a transient payment failure, then settle the order. */
const recoverFromPaymentFailure: ToolAgentTask = {
  id: 'recover-from-payment-failure',
  input: 'Order a red mug and pay for it.',
  failOnce: ['payment.charge'],
  scripts: [
    toolCallScript({
      toolCallId: 't2-add',
      toolName: 'cart.add',
      args: { sku: 'mug-red', qty: 1 },
    }),
    toolCallScript({ toolCallId: 't2-place', toolName: 'order.place', args: {} }),
    // First charge throws (failOnce); the loop surfaces the error and continues.
    toolCallScript({ toolCallId: 't2-pay1', toolName: 'payment.charge', args: { orderId: 'o1' } }),
    // Retry succeeds and settles the order.
    toolCallScript({ toolCallId: 't2-pay2', toolName: 'payment.charge', args: { orderId: 'o1' } }),
    textOnlyScript('Payment captured.', 8),
  ],
  expectedTools: ['cart.add', 'order.place', 'payment.charge'],
  requireOrder: true,
  goal: (s) => s.orderCount === 1 && s.orders[0]?.status === 'paid',
  goalDescription: 'one order, settled to paid after a retried charge',
};

/** Task 3 — two cart adds dispatched in one step (parallel), then order. */
const parallelMultiAdd: ToolAgentTask = {
  id: 'parallel-multi-add',
  input: 'Add a red mug and a green cap, then order.',
  scripts: [
    multiToolCallScript([
      { toolCallId: 't3-add1', toolName: 'cart.add', args: { sku: 'mug-red', qty: 1 } },
      { toolCallId: 't3-add2', toolName: 'cart.add', args: { sku: 'cap-green', qty: 2 } },
    ]),
    toolCallScript({ toolCallId: 't3-place', toolName: 'order.place', args: {} }),
    textOnlyScript('Both items ordered.', 8),
  ],
  expectedTools: ['cart.add', 'order.place'],
  goal: (s) => s.orderCount === 1 && s.cartSize === 0 && s.orders[0]?.itemCount === 2,
  goalDescription: 'one order containing both line items',
};

export const DEFAULT_TASKS: ReadonlyArray<ToolAgentTask> = [
  placeSingleOrder,
  recoverFromPaymentFailure,
  parallelMultiAdd,
];

/**
 * A deliberately broken plan: it inspects the cart instead of adding to it,
 * so `order.place` errors (empty cart), the goal is never reached, and the
 * expected `cart.add` is never selected. Used by the smoke test to prove the
 * pass^k gate fails on a tool-selection / goal regression.
 */
export const brokenTask: ToolAgentTask = {
  id: 'broken-wrong-tool',
  input: 'Order a blue tee (but the plan is wrong).',
  scripts: [
    toolCallScript({ toolCallId: 'b-view', toolName: 'cart.view', args: {} }),
    toolCallScript({ toolCallId: 'b-place', toolName: 'order.place', args: {} }),
    textOnlyScript('Tried.', 4),
  ],
  expectedTools: ['cart.add', 'order.place'],
  requireOrder: true,
  goal: (s) => s.orderCount === 1 && s.orders[0]?.status === 'placed',
  goalDescription: 'one placed order (never reached — the plan never adds to the cart)',
};
