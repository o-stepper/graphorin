/**
 * `ServerMessage` - discriminated union of every frame a Graphorin
 * server may push to a client. Three families share the channel:
 *
 *   1. **RPC responses** (`{ jsonrpc, id, result | error }`) -
 *      correlate with a previously-issued client request.
 *   2. **Typed push events** (`{ kind: 'event', subject, type,
 *      payload, eventId }`) - the streaming-first data plane;
 *      consumers ignore unknown `type` strings per the agent-event
 *      extensibility convention.
 *   3. **Asynchronous server frames** (`{ kind: 'lifecycle' | 'error'
 *      | 'pong' | 'subscribed' | 'unsubscribed' | 'replay-marker' }`)
 *      - server-initiated messages that do not correlate with a
 *      single client RPC id.
 *
 * Every frame carries the `v: '1'` literal so future revisions can
 * negotiate forward-compatible additions without a subprotocol bump.
 *
 * @packageDocumentation
 */

import { z } from 'zod';

const RpcId = z.union([z.string().min(1), z.number().int()]);

const RpcError = z
  .object({
    code: z.number().int(),
    message: z.string().min(1),
    data: z.unknown().optional(),
  })
  .strict();

const RpcSuccess = z
  .object({
    v: z.literal('1'),
    jsonrpc: z.literal('2.0'),
    id: RpcId,
    result: z.unknown(),
  })
  .strict();

const RpcFailure = z
  .object({
    v: z.literal('1'),
    jsonrpc: z.literal('2.0'),
    id: RpcId,
    error: RpcError,
  })
  .strict();

const SubscribedFrame = z
  .object({
    v: z.literal('1'),
    kind: z.literal('subscribed'),
    subscriptionId: z.string().min(1),
    subject: z.string().min(1),
    snapshotEventId: z.string().min(1).optional(),
  })
  .strict();

const UnsubscribedFrame = z
  .object({
    v: z.literal('1'),
    kind: z.literal('unsubscribed'),
    subscriptionId: z.string().min(1),
  })
  .strict();

// The runtime schema keeps `payload` opaque so this package stays
// zod-only (no `@graphorin/core` dependency, not even type-only - it
// would force a resolvable dependency for the d.ts). For agent-run
// subjects the actual payload shape is the JSON-safe `WireAgentEvent`
// union documented in `@graphorin/core` (decode with
// `fromWireAgentEvent`); the cross-package round-trip is pinned by a
// gate test in core.
const EventFrame = z
  .object({
    v: z.literal('1'),
    kind: z.literal('event'),
    eventId: z.string().min(1),
    subscriptionId: z.string().min(1),
    subject: z.string().min(1),
    type: z.string().min(1),
    payload: z.unknown(),
  })
  .strict();

const LifecycleFrame = z
  .object({
    v: z.literal('1'),
    kind: z.literal('lifecycle'),
    subscriptionId: z.string().min(1),
    status: z.enum(['running', 'paused', 'completed', 'aborted', 'failed']),
    reason: z.string().min(1).optional(),
  })
  .strict();

const ErrorFrame = z
  .object({
    v: z.literal('1'),
    kind: z.literal('error'),
    code: z.string().min(1),
    message: z.string().min(1),
    fatal: z.boolean().optional(),
    subscriptionId: z.string().min(1).optional(),
    data: z.unknown().optional(),
  })
  .strict();

const PongFrame = z
  .object({
    v: z.literal('1'),
    kind: z.literal('pong'),
    nonce: z.string().min(1).optional(),
  })
  .strict();

const ReplayMarkerFrame = z
  .object({
    v: z.literal('1'),
    kind: z.literal('replay-marker'),
    subscriptionId: z.string().min(1),
    eventId: z.string().min(1),
    droppedCount: z.number().int().nonnegative().optional(),
    note: z.string().min(1).optional(),
  })
  .strict();

const KindedFrame = z.discriminatedUnion('kind', [
  SubscribedFrame,
  UnsubscribedFrame,
  EventFrame,
  LifecycleFrame,
  ErrorFrame,
  PongFrame,
  ReplayMarkerFrame,
]);

const RpcFrame = z.union([RpcSuccess, RpcFailure]);

/**
 * Zod schema for every legal server → client frame. Validation runs
 * twice in the server pipeline: first when a route handler enqueues
 * the frame onto the dispatcher's send queue (so a malformed frame
 * never escapes the process), then again on the client side to
 * defend against protocol drift.
 *
 * @stable
 */
export const ServerMessageSchema = z.union([RpcFrame, KindedFrame]);

/**
 * Inferred TypeScript union for the `ServerMessage` discriminator.
 *
 * @stable
 */
export type ServerMessage = z.infer<typeof ServerMessageSchema>;

/**
 * Convenience type aliases for callers that want to reference an
 * individual variant without `z.infer<typeof X>`.
 *
 * @stable
 */
export type ServerEventFrame = z.infer<typeof EventFrame>;
/** @stable */
export type ServerLifecycleFrame = z.infer<typeof LifecycleFrame>;
/** @stable */
export type ServerErrorFrame = z.infer<typeof ErrorFrame>;
/** @stable */
export type ServerSubscribedFrame = z.infer<typeof SubscribedFrame>;
/** @stable */
export type ServerUnsubscribedFrame = z.infer<typeof UnsubscribedFrame>;
/** @stable */
export type ServerPongFrame = z.infer<typeof PongFrame>;
/** @stable */
export type ServerReplayMarkerFrame = z.infer<typeof ReplayMarkerFrame>;
/** @stable */
export type ServerRpcSuccess = z.infer<typeof RpcSuccess>;
/** @stable */
export type ServerRpcFailure = z.infer<typeof RpcFailure>;

/**
 * Type guard helpers, one per discriminator. The narrow over the
 * `ServerMessage` union without forcing consumers to memorize the
 * exact field names.
 *
 * @stable
 */
export function isEventFrame(message: ServerMessage): message is ServerEventFrame {
  return 'kind' in message && message.kind === 'event';
}

/** @stable */
export function isLifecycleFrame(message: ServerMessage): message is ServerLifecycleFrame {
  return 'kind' in message && message.kind === 'lifecycle';
}

/** @stable */
export function isErrorFrame(message: ServerMessage): message is ServerErrorFrame {
  return 'kind' in message && message.kind === 'error';
}

/** @stable */
export function isSubscribedFrame(message: ServerMessage): message is ServerSubscribedFrame {
  return 'kind' in message && message.kind === 'subscribed';
}

/** @stable */
export function isUnsubscribedFrame(message: ServerMessage): message is ServerUnsubscribedFrame {
  return 'kind' in message && message.kind === 'unsubscribed';
}

/** @stable */
export function isPongFrame(message: ServerMessage): message is ServerPongFrame {
  return 'kind' in message && message.kind === 'pong';
}

/** @stable */
export function isReplayMarkerFrame(message: ServerMessage): message is ServerReplayMarkerFrame {
  return 'kind' in message && message.kind === 'replay-marker';
}

/** @stable */
export function isRpcSuccess(message: ServerMessage): message is ServerRpcSuccess {
  return 'jsonrpc' in message && message.jsonrpc === '2.0' && 'result' in message;
}

/** @stable */
export function isRpcFailure(message: ServerMessage): message is ServerRpcFailure {
  return 'jsonrpc' in message && message.jsonrpc === '2.0' && 'error' in message;
}

/**
 * Stable JSON-RPC error code catalogue used by the server when
 * surfacing routine failures (per JSON-RPC 2.0 § 5.1 + Graphorin
 * extensions). Application-level errors use codes in the
 * implementation-defined range (`-32000` … `-32099`).
 *
 * @stable
 */
export const RPC_ERROR_CODES = Object.freeze({
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  AUTH_REQUIRED: -32001,
  AUTH_INVALID: -32002,
  SCOPE_DENIED: -32003,
  RATE_LIMITED: -32004,
  PROTOCOL_VIOLATION: -32005,
  RUN_NOT_FOUND: -32010,
  SUBSCRIPTION_NOT_FOUND: -32011,
} as const);
