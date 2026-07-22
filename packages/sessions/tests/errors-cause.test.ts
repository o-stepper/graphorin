import { describe, expect, it } from 'vitest';

import { ReplayAccessDeniedError, SessionError } from '../src/errors/index.js';

describe('SessionError cause threading', () => {
  it('threads an explicit cause through the base constructor', () => {
    const root = new Error('root failure');
    const err = new SessionError('replay-access-denied', 'wrapped', 'SessionError', {
      cause: root,
    });
    expect(err.cause).toBe(root);
    expect(err.code).toBe('replay-access-denied');
    expect(err.name).toBe('SessionError');
  });

  it('leaves cause undefined when not supplied (subclasses unchanged)', () => {
    const err = new ReplayAccessDeniedError('thread-1');
    expect(err.cause).toBeUndefined();
    expect(err).toBeInstanceOf(SessionError);
  });
});
