import { describe, expect, it } from 'vitest';

import {
  isErrorFrame,
  isEventFrame,
  isLifecycleFrame,
  isPongFrame,
  isReplayMarkerFrame,
  isRpcFailure,
  isRpcSuccess,
  isSubscribedFrame,
  isUnsubscribedFrame,
  RPC_ERROR_CODES,
  type ServerMessage,
  ServerMessageSchema,
} from '../src/server-message.js';

const validSubscribed: ServerMessage = {
  v: '1',
  kind: 'subscribed',
  subscriptionId: 'sub-1',
  subject: 'session:abc/events',
  snapshotEventId: 'evt-001',
};

const validUnsubscribed: ServerMessage = {
  v: '1',
  kind: 'unsubscribed',
  subscriptionId: 'sub-1',
};

const validEvent: ServerMessage = {
  v: '1',
  kind: 'event',
  eventId: 'evt-002',
  subscriptionId: 'sub-1',
  subject: 'session:abc/events',
  type: 'text.delta',
  payload: { delta: 'Hello' },
};

const validLifecycle: ServerMessage = {
  v: '1',
  kind: 'lifecycle',
  subscriptionId: 'sub-1',
  status: 'completed',
};

const validErrorFrame: ServerMessage = {
  v: '1',
  kind: 'error',
  code: 'auth.scope_denied',
  message: 'Token lacks required scope.',
  fatal: true,
};

const validPong: ServerMessage = {
  v: '1',
  kind: 'pong',
};

const validReplayMarker: ServerMessage = {
  v: '1',
  kind: 'replay-marker',
  subscriptionId: 'sub-1',
  eventId: 'evt-100',
  droppedCount: 2,
};

const validRpcSuccess: ServerMessage = {
  v: '1',
  jsonrpc: '2.0',
  id: 'req-1',
  result: { ok: true },
};

const validRpcFailure: ServerMessage = {
  v: '1',
  jsonrpc: '2.0',
  id: 'req-1',
  error: { code: RPC_ERROR_CODES.SCOPE_DENIED, message: 'denied' },
};

describe('ServerMessageSchema (positive paths)', () => {
  for (const [name, frame] of [
    ['subscribed', validSubscribed],
    ['unsubscribed', validUnsubscribed],
    ['event', validEvent],
    ['lifecycle', validLifecycle],
    ['error', validErrorFrame],
    ['pong', validPong],
    ['replay-marker', validReplayMarker],
    ['rpc-success', validRpcSuccess],
    ['rpc-failure', validRpcFailure],
  ] as const) {
    it(`accepts a well-formed ${name} frame`, () => {
      const parsed = ServerMessageSchema.safeParse(frame);
      expect(parsed.success).toBe(true);
    });
  }
});

describe('ServerMessageSchema (negative paths)', () => {
  it('rejects unknown kind discriminators', () => {
    const result = ServerMessageSchema.safeParse({
      v: '1',
      kind: 'bogus',
      subscriptionId: 'sub-1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing v literal', () => {
    const result = ServerMessageSchema.safeParse({
      kind: 'pong',
    });
    expect(result.success).toBe(false);
  });

  it('rejects extra unknown fields on kinded frames', () => {
    const result = ServerMessageSchema.safeParse({
      ...validPong,
      surprise: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects rpc frames with both result and error', () => {
    const result = ServerMessageSchema.safeParse({
      v: '1',
      jsonrpc: '2.0',
      id: 'req-1',
      result: 1,
      error: { code: 0, message: 'no' },
    });
    expect(result.success).toBe(false);
  });

  it('CORE-PRO-01: rejects rpc frames with NEITHER result nor error', () => {
    const result = ServerMessageSchema.safeParse({
      v: '1',
      jsonrpc: '2.0',
      id: 'req-1',
    });
    expect(result.success).toBe(false);
  });

  it('CORE-PRO-01: accepts a success frame whose result is explicitly null', () => {
    const result = ServerMessageSchema.safeParse({
      v: '1',
      jsonrpc: '2.0',
      id: 'req-1',
      result: null,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(isRpcSuccess(result.data)).toBe(true);
  });
});

describe('W-109 - lockstep envelope vs additive extension points', () => {
  it('accepts an event frame with an UNKNOWN type and an arbitrary payload (additive point)', () => {
    const result = ServerMessageSchema.safeParse({
      v: '1',
      kind: 'event',
      subscriptionId: 'sub-1',
      subject: 'agent:a1:run:r1',
      type: 'some.future.event-type',
      payload: { anything: { nested: [1, 'x', null] } },
      eventId: 'evt-9',
    });
    expect(result.success).toBe(true);
  });

  it('accepts an arbitrary rpc result value (additive point)', () => {
    const result = ServerMessageSchema.safeParse({
      v: '1',
      jsonrpc: '2.0',
      id: 7,
      result: { future: ['shape', { deep: true }] },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an extra field on the EVENT envelope (strict envelope)', () => {
    const result = ServerMessageSchema.safeParse({
      v: '1',
      kind: 'event',
      subscriptionId: 'sub-1',
      subject: 'agent:a1:run:r1',
      type: 'text.delta',
      payload: {},
      eventId: 'evt-9',
      futureEnvelopeField: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects v: '2' - the version literal is lockstep, not negotiated", () => {
    const result = ServerMessageSchema.safeParse({
      v: '2',
      kind: 'pong',
    });
    expect(result.success).toBe(false);
  });
});

describe('Type guards', () => {
  it('narrow each variant correctly', () => {
    expect(isSubscribedFrame(validSubscribed)).toBe(true);
    expect(isSubscribedFrame(validEvent)).toBe(false);

    expect(isUnsubscribedFrame(validUnsubscribed)).toBe(true);
    expect(isUnsubscribedFrame(validSubscribed)).toBe(false);

    expect(isEventFrame(validEvent)).toBe(true);
    expect(isEventFrame(validLifecycle)).toBe(false);

    expect(isLifecycleFrame(validLifecycle)).toBe(true);
    expect(isLifecycleFrame(validEvent)).toBe(false);

    expect(isErrorFrame(validErrorFrame)).toBe(true);
    expect(isErrorFrame(validEvent)).toBe(false);

    expect(isPongFrame(validPong)).toBe(true);
    expect(isPongFrame(validEvent)).toBe(false);

    expect(isReplayMarkerFrame(validReplayMarker)).toBe(true);
    expect(isReplayMarkerFrame(validEvent)).toBe(false);

    expect(isRpcSuccess(validRpcSuccess)).toBe(true);
    expect(isRpcSuccess(validRpcFailure)).toBe(false);

    expect(isRpcFailure(validRpcFailure)).toBe(true);
    expect(isRpcFailure(validRpcSuccess)).toBe(false);
  });
});

describe('RPC_ERROR_CODES', () => {
  it('exposes the JSON-RPC standard + Graphorin extensions', () => {
    expect(RPC_ERROR_CODES.PARSE_ERROR).toBe(-32700);
    expect(RPC_ERROR_CODES.INVALID_REQUEST).toBe(-32600);
    expect(RPC_ERROR_CODES.METHOD_NOT_FOUND).toBe(-32601);
    expect(RPC_ERROR_CODES.INVALID_PARAMS).toBe(-32602);
    expect(RPC_ERROR_CODES.INTERNAL_ERROR).toBe(-32603);
    expect(RPC_ERROR_CODES.AUTH_REQUIRED).toBe(-32001);
    expect(RPC_ERROR_CODES.SCOPE_DENIED).toBe(-32003);
  });
});
