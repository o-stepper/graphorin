import { describe, expect, it } from 'vitest';

import {
  AuthFailedError,
  ClientAbortedError,
  ClientNotConnectedError,
  GraphorinClientError,
  InvalidServerFrameError,
  ProtocolViolationError,
  SubprotocolMismatchError,
  SubscriptionNotFoundError,
  TransportFailedError,
} from '../src/errors.js';

describe('GraphorinClientError hierarchy', () => {
  it('preserves the kind discriminator on every subclass', () => {
    expect(new ClientNotConnectedError().kind).toBe('client-not-connected');
    expect(new TransportFailedError('x').kind).toBe('transport-failed');
    expect(new SubprotocolMismatchError('a', 'b').kind).toBe('subprotocol-mismatch');
    expect(new AuthFailedError().kind).toBe('auth-failed');
    expect(new ProtocolViolationError('x').kind).toBe('protocol-violation');
    expect(new SubscriptionNotFoundError('sub').kind).toBe('subscription-not-found');
    expect(new ClientAbortedError().kind).toBe('aborted');
    expect(new InvalidServerFrameError('x', []).kind).toBe('invalid-server-frame');
  });

  it('propagates the cause chain on TransportFailedError', () => {
    const cause = new Error('underlying');
    const err = new TransportFailedError('top', { cause });
    expect(err.cause).toBe(cause);
    expect(err).toBeInstanceOf(GraphorinClientError);
  });

  it('records the expected/actual pair on SubprotocolMismatchError', () => {
    const err = new SubprotocolMismatchError('graphorin.protocol.v1', null);
    expect(err.expected).toBe('graphorin.protocol.v1');
    expect(err.actual).toBeNull();
    expect(err.message).toContain('graphorin.protocol.v1');
  });

  it('records the subscription id on SubscriptionNotFoundError', () => {
    const err = new SubscriptionNotFoundError('sub-1');
    expect(err.subscriptionId).toBe('sub-1');
    expect(err.message).toContain('sub-1');
  });
});
