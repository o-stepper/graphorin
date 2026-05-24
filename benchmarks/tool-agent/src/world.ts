/**
 * Graphorin — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * The in-memory retail "world" the benchmark tools mutate, plus the plain
 * `Tool` objects that act on it. Tools are hand-rolled plain objects with a
 * Zod-like `inputSchema` (matching the agent test convention) so the
 * benchmark stays free of a schema dependency while still exercising the
 * executor's input validation. The `WorldSnapshot` is the goal state the
 * trajectory scorers compare against.
 */

import type { Tool } from '@graphorin/core';

type AnyTool = Tool<unknown, unknown, unknown>;

export interface CartLine {
  readonly sku: string;
  readonly qty: number;
}

export interface Order {
  readonly id: string;
  readonly lines: ReadonlyArray<CartLine>;
  status: 'placed' | 'paid';
}

export interface RetailWorld {
  cart: CartLine[];
  orders: Order[];
  readonly catalog: Readonly<Record<string, { readonly price: number; readonly stock: number }>>;
  /** Tool names scheduled to throw exactly once (drives recovery scenarios). */
  readonly failOnce: Set<string>;
  nextOrderId: number;
}

export function createWorld(opts: { readonly failOnce?: ReadonlyArray<string> } = {}): RetailWorld {
  return {
    cart: [],
    orders: [],
    catalog: {
      'tee-blue': { price: 19, stock: 10 },
      'mug-red': { price: 9, stock: 5 },
      'cap-green': { price: 14, stock: 7 },
    },
    failOnce: new Set(opts.failOnce ?? []),
    nextOrderId: 1,
  };
}

/** The goal-state snapshot compared by {@link finalStateCorrect}. */
export interface WorldSnapshot {
  readonly cartSize: number;
  readonly orderCount: number;
  readonly orders: ReadonlyArray<{
    readonly id: string;
    readonly itemCount: number;
    readonly status: string;
  }>;
}

export function snapshot(world: RetailWorld): WorldSnapshot {
  return {
    cartSize: world.cart.length,
    orderCount: world.orders.length,
    orders: world.orders.map((o) => ({ id: o.id, itemCount: o.lines.length, status: o.status })),
  };
}

/** Build a Zod-like object schema that the executor validates inputs against. */
function objectSchema(validate: (v: Record<string, unknown>) => boolean): AnyTool['inputSchema'] {
  const check = (v: unknown): boolean =>
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    validate(v as Record<string, unknown>);
  return {
    parse: (v: unknown) => {
      if (!check(v)) throw new Error('invalid tool input');
      return v;
    },
    safeParse: (v: unknown) =>
      check(v)
        ? { success: true, data: v }
        : { success: false, error: { name: 'ZodError', message: 'invalid tool input' } },
  } as AnyTool['inputSchema'];
}

/**
 * The retail tool set, bound to one `world`. A fresh set (and world) is
 * created per run so attempts are independent.
 */
export function makeRetailTools(world: RetailWorld): AnyTool[] {
  const catalogSearch: AnyTool = {
    name: 'catalog.search',
    description: 'Search the product catalog by keyword; returns matching SKUs.',
    inputSchema: objectSchema((v) => typeof v.query === 'string'),
    sideEffectClass: 'read-only',
    async execute(input) {
      const query = String((input as { query: string }).query).toLowerCase();
      const skus = Object.keys(world.catalog).filter((sku) => sku.includes(query));
      return { skus };
    },
  };

  const cartAdd: AnyTool = {
    name: 'cart.add',
    description: 'Add a line item (sku, qty) to the cart.',
    inputSchema: objectSchema((v) => typeof v.sku === 'string' && typeof v.qty === 'number'),
    sideEffectClass: 'side-effecting',
    async execute(input) {
      const { sku, qty } = input as { sku: string; qty: number };
      world.cart.push({ sku, qty });
      return { cartSize: world.cart.length };
    },
  };

  const cartView: AnyTool = {
    name: 'cart.view',
    description: 'View the current cart lines.',
    inputSchema: objectSchema(() => true),
    sideEffectClass: 'read-only',
    async execute() {
      return { lines: world.cart.slice() };
    },
  };

  const orderPlace: AnyTool = {
    name: 'order.place',
    description: 'Place an order for everything currently in the cart.',
    inputSchema: objectSchema(() => true),
    sideEffectClass: 'external-stateful',
    async execute() {
      if (world.cart.length === 0) throw new Error('cannot place an order: the cart is empty');
      const id = `o${world.nextOrderId++}`;
      world.orders.push({ id, lines: world.cart.slice(), status: 'placed' });
      world.cart = [];
      return { orderId: id, itemCount: world.orders[world.orders.length - 1]?.lines.length ?? 0 };
    },
  };

  const paymentCharge: AnyTool = {
    name: 'payment.charge',
    description: 'Charge the customer for a previously placed order.',
    inputSchema: objectSchema((v) => typeof v.orderId === 'string'),
    sideEffectClass: 'external-stateful',
    async execute(input) {
      // Simulate a transient gateway failure exactly once, exercising the
      // loop's error -> tool-message -> retry recovery path.
      if (world.failOnce.has('payment.charge')) {
        world.failOnce.delete('payment.charge');
        throw new Error('payment gateway timeout (transient)');
      }
      const { orderId } = input as { orderId: string };
      const order = world.orders.find((o) => o.id === orderId);
      if (order === undefined) throw new Error(`unknown order ${orderId}`);
      order.status = 'paid';
      return { orderId, status: 'paid' as const };
    },
  };

  return [catalogSearch, cartAdd, cartView, orderPlace, paymentCharge];
}

/** Tool name + inputSchema pairs for the `argumentValidity` scorer. */
export function retailToolSchemas(): ReadonlyArray<{
  readonly name: string;
  readonly inputSchema: { safeParse(v: unknown): { readonly success: boolean } };
}> {
  return makeRetailTools(createWorld()).map((t) => ({ name: t.name, inputSchema: t.inputSchema }));
}
