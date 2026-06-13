/**
 * `ClientMessage` — discriminated union of every frame a Graphorin
 * WebSocket client may send to the server. The wire is hybrid: the
 * control plane uses JSON-RPC-shaped requests / notifications; the
 * data plane uses typed push events emitted exclusively by the server
 * (see `./server-message.ts`).
 *
 * Every frame carries the `v: '1'` literal so future revisions can
 * negotiate forward-compatible additions without a subprotocol bump.
 * The matching subprotocol identifier is `graphorin.protocol.v1`
 * (see `./subprotocol.ts`).
 *
 * @packageDocumentation
 */

import { z } from 'zod';

const RpcId = z.union([z.string().min(1), z.number().int()]);

const InitializeParams = z
  .object({
    clientInfo: z
      .object({
        name: z.string().min(1),
        version: z.string().min(1),
      })
      .strict(),
    capabilities: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

const SubscribeParams = z
  .object({
    subject: z.string().min(1),
    // IP-21: `sinceEventId` is the resumption cursor. `lastSequenceId` was a
    // dead wire field — the client never set it and the server never read it.
    sinceEventId: z.string().min(1).optional(),
  })
  .strict();

const UnsubscribeParams = z
  .object({
    subscriptionId: z.string().min(1),
  })
  .strict();

const RunCancelParams = z
  .object({
    runId: z.string().min(1),
    reason: z.string().min(1).optional(),
    drain: z.boolean().optional(),
    onPendingApprovals: z.enum(['deny', 'preserve']).optional(),
  })
  .strict();

const PingParams = z
  .object({
    nonce: z.string().min(1).optional(),
  })
  .strict()
  .optional();

const InitializeRequest = z
  .object({
    v: z.literal('1'),
    jsonrpc: z.literal('2.0'),
    id: RpcId,
    method: z.literal('initialize'),
    params: InitializeParams,
  })
  .strict();

const SubscribeRequest = z
  .object({
    v: z.literal('1'),
    jsonrpc: z.literal('2.0'),
    id: RpcId,
    method: z.literal('subscription.subscribe'),
    params: SubscribeParams,
  })
  .strict();

const UnsubscribeRequest = z
  .object({
    v: z.literal('1'),
    jsonrpc: z.literal('2.0'),
    id: RpcId,
    method: z.literal('subscription.unsubscribe'),
    params: UnsubscribeParams,
  })
  .strict();

const RunCancelRequest = z
  .object({
    v: z.literal('1'),
    jsonrpc: z.literal('2.0'),
    id: RpcId,
    method: z.literal('run.cancel'),
    params: RunCancelParams,
  })
  .strict();

const PingRequest = z
  .object({
    v: z.literal('1'),
    jsonrpc: z.literal('2.0'),
    id: RpcId,
    method: z.literal('ping'),
    params: PingParams,
  })
  .strict();

const CancelledNotification = z
  .object({
    v: z.literal('1'),
    jsonrpc: z.literal('2.0'),
    method: z.literal('notifications/cancelled'),
    params: z.object({ requestId: z.string().min(1) }).strict(),
  })
  .strict();

/**
 * Zod schema for every legal client → server frame. Use
 * {@link ClientMessageSchema}.safeParse() inside the server upgrade
 * handler before dispatching to the corresponding subscription /
 * cancel / ping handler.
 *
 * @stable
 */
export const ClientMessageSchema = z.discriminatedUnion('method', [
  InitializeRequest,
  SubscribeRequest,
  UnsubscribeRequest,
  RunCancelRequest,
  PingRequest,
  CancelledNotification,
]);

/**
 * Inferred TypeScript union for the `ClientMessage` discriminator. A
 * value satisfying this type round-trips through
 * {@link ClientMessageSchema} without throwing.
 *
 * @stable
 */
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

/**
 * Convenience type for the JSON-RPC `id` slot. Matches the Graphorin
 * subset (string + integer; no `null`, no float).
 *
 * @stable
 */
export type ClientMessageId = z.infer<typeof RpcId>;

/**
 * Type guard helpers — one per `method` literal — so consumers can
 * narrow the `ClientMessage` union without re-stringifying the
 * discriminator.
 *
 * @stable
 */
export function isInitializeRequest(
  message: ClientMessage,
): message is z.infer<typeof InitializeRequest> {
  return message.method === 'initialize';
}

/** @stable */
export function isSubscribeRequest(
  message: ClientMessage,
): message is z.infer<typeof SubscribeRequest> {
  return message.method === 'subscription.subscribe';
}

/** @stable */
export function isUnsubscribeRequest(
  message: ClientMessage,
): message is z.infer<typeof UnsubscribeRequest> {
  return message.method === 'subscription.unsubscribe';
}

/** @stable */
export function isRunCancelRequest(
  message: ClientMessage,
): message is z.infer<typeof RunCancelRequest> {
  return message.method === 'run.cancel';
}

/** @stable */
export function isPingRequest(message: ClientMessage): message is z.infer<typeof PingRequest> {
  return message.method === 'ping';
}

/** @stable */
export function isCancelledNotification(
  message: ClientMessage,
): message is z.infer<typeof CancelledNotification> {
  return message.method === 'notifications/cancelled';
}
