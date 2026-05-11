import { describe, expect, it } from 'vitest';

import {
  type ClientMessage,
  ClientMessageSchema,
  isCancelledNotification,
  isInitializeRequest,
  isPingRequest,
  isRunCancelRequest,
  isSubscribeRequest,
  isUnsubscribeRequest,
} from '../src/client-message.js';

const validInitialize: ClientMessage = {
  v: '1',
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    clientInfo: { name: 'graphorin-cli', version: '0.1.0' },
  },
};

const validSubscribe: ClientMessage = {
  v: '1',
  jsonrpc: '2.0',
  id: 'sub-1',
  method: 'subscription.subscribe',
  params: { subject: 'session:abc/events' },
};

const validUnsubscribe: ClientMessage = {
  v: '1',
  jsonrpc: '2.0',
  id: 2,
  method: 'subscription.unsubscribe',
  params: { subscriptionId: 'sub-1' },
};

const validRunCancel: ClientMessage = {
  v: '1',
  jsonrpc: '2.0',
  id: 3,
  method: 'run.cancel',
  params: { runId: 'run-x', drain: false },
};

const validPing: ClientMessage = {
  v: '1',
  jsonrpc: '2.0',
  id: 4,
  method: 'ping',
};

const validCancelled: ClientMessage = {
  v: '1',
  jsonrpc: '2.0',
  method: 'notifications/cancelled',
  params: { requestId: 'req-77' },
};

describe('ClientMessageSchema (positive paths)', () => {
  for (const [name, frame] of [
    ['initialize', validInitialize],
    ['subscribe', validSubscribe],
    ['unsubscribe', validUnsubscribe],
    ['run.cancel', validRunCancel],
    ['ping', validPing],
    ['notifications/cancelled', validCancelled],
  ] as const) {
    it(`accepts a well-formed ${name} frame`, () => {
      const parsed = ClientMessageSchema.safeParse(frame);
      expect(parsed.success).toBe(true);
    });
  }
});

describe('ClientMessageSchema (negative paths)', () => {
  it('rejects an unknown method', () => {
    const result = ClientMessageSchema.safeParse({
      v: '1',
      jsonrpc: '2.0',
      id: 9,
      method: 'unknown.method',
      params: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing v literal', () => {
    const result = ClientMessageSchema.safeParse({
      jsonrpc: '2.0',
      id: 9,
      method: 'ping',
    });
    expect(result.success).toBe(false);
  });

  it('rejects extra unknown fields (strict object check)', () => {
    const result = ClientMessageSchema.safeParse({
      ...validPing,
      extra: 'forbidden',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a subscribe with an empty subject', () => {
    const result = ClientMessageSchema.safeParse({
      ...validSubscribe,
      params: { subject: '' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a notifications/cancelled with an empty requestId', () => {
    const result = ClientMessageSchema.safeParse({
      ...validCancelled,
      params: { requestId: '' },
    });
    expect(result.success).toBe(false);
  });
});

describe('Type guards', () => {
  it('narrow each variant correctly', () => {
    expect(isInitializeRequest(validInitialize)).toBe(true);
    expect(isInitializeRequest(validPing)).toBe(false);

    expect(isSubscribeRequest(validSubscribe)).toBe(true);
    expect(isSubscribeRequest(validUnsubscribe)).toBe(false);

    expect(isUnsubscribeRequest(validUnsubscribe)).toBe(true);
    expect(isUnsubscribeRequest(validSubscribe)).toBe(false);

    expect(isRunCancelRequest(validRunCancel)).toBe(true);
    expect(isRunCancelRequest(validPing)).toBe(false);

    expect(isPingRequest(validPing)).toBe(true);
    expect(isPingRequest(validRunCancel)).toBe(false);

    expect(isCancelledNotification(validCancelled)).toBe(true);
    expect(isCancelledNotification(validInitialize)).toBe(false);
  });
});
