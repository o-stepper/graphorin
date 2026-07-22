import { describe, expect, it } from 'vitest';

import { AgentRuntimeError, InvalidAgentConfigError } from '../src/errors/index.js';

describe('AgentRuntimeError cause threading', () => {
  it('threads an explicit cause through the base constructor', () => {
    const root = new Error('root failure');
    const err = new AgentRuntimeError('invalid-config', 'wrapped', 'AgentRuntimeError', {
      cause: root,
    });
    expect(err.cause).toBe(root);
    expect(err.code).toBe('invalid-config');
    expect(err.name).toBe('AgentRuntimeError');
  });

  it('leaves cause undefined when not supplied (subclasses unchanged)', () => {
    const err = new InvalidAgentConfigError('bad config');
    expect(err.cause).toBeUndefined();
    expect(err).toBeInstanceOf(AgentRuntimeError);
  });
});
