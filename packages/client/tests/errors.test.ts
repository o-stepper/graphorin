import { RPC_ERROR_CODES } from '@graphorin/protocol';
import { describe, expect, it } from 'vitest';

import {
  AuthFailedError,
  ClientAbortedError,
  ClientNotConnectedError,
  GraphorinClientError,
  InvalidServerFrameError,
  kindForRpcCode,
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

describe('kindForRpcCode (IP-19) - RPC error code → discriminated kind', () => {
  it('maps each meaningful JSON-RPC error code to its own kind', () => {
    expect(kindForRpcCode(RPC_ERROR_CODES.RATE_LIMITED)).toBe('rate-limited');
    expect(kindForRpcCode(RPC_ERROR_CODES.SCOPE_DENIED)).toBe('scope-denied');
    expect(kindForRpcCode(RPC_ERROR_CODES.AUTH_REQUIRED)).toBe('auth-failed');
    expect(kindForRpcCode(RPC_ERROR_CODES.AUTH_INVALID)).toBe('auth-failed');
    expect(kindForRpcCode(RPC_ERROR_CODES.RUN_NOT_FOUND)).toBe('run-not-found');
    expect(kindForRpcCode(RPC_ERROR_CODES.SUBSCRIPTION_NOT_FOUND)).toBe('subscription-not-found');
    expect(kindForRpcCode(RPC_ERROR_CODES.INTERNAL_ERROR)).toBe('server-error');
  });

  it('collapses the generic JSON-RPC violations and unknown codes to protocol-violation', () => {
    expect(kindForRpcCode(RPC_ERROR_CODES.INVALID_REQUEST)).toBe('protocol-violation');
    expect(kindForRpcCode(RPC_ERROR_CODES.INVALID_PARAMS)).toBe('protocol-violation');
    expect(kindForRpcCode(RPC_ERROR_CODES.METHOD_NOT_FOUND)).toBe('protocol-violation');
    expect(kindForRpcCode(RPC_ERROR_CODES.PROTOCOL_VIOLATION)).toBe('protocol-violation');
    // An unrecognised code is treated conservatively as a protocol violation.
    expect(kindForRpcCode(-31000)).toBe('protocol-violation');
  });
});
