import { describe, expect, it } from 'vitest';

import { toWireError } from '../src/internal/wire-error.js';

describe('toWireError (W-052)', () => {
  it("prefers a string `code` (agent/workflow error family) and carries WorkflowError's hint", () => {
    const err = Object.assign(new Error('checkpoint moved'), {
      code: 'checkpoint-version-conflict',
      hint: 'reload the thread state and retry',
    });
    expect(toWireError(err)).toEqual({
      code: 'checkpoint-version-conflict',
      message: 'checkpoint moved',
      hint: 'reload the thread state and retry',
    });
  });

  it('falls back to a string `kind` (tools/memory/provider/server family)', () => {
    const err = Object.assign(new Error('tool exploded'), { kind: 'tool-execution' });
    expect(toWireError(err)).toEqual({ code: 'tool-execution', message: 'tool exploded' });
  });

  it("maps a bare Error to code 'unknown' with the message preserved", () => {
    expect(toWireError(new Error('plain'))).toEqual({ code: 'unknown', message: 'plain' });
  });

  it('handles non-Error throws (strings, numbers, null) without crashing', () => {
    expect(toWireError('oops')).toEqual({ code: 'unknown', message: 'oops' });
    expect(toWireError(42)).toEqual({ code: 'unknown', message: '42' });
    expect(toWireError(null)).toEqual({ code: 'unknown', message: 'null' });
  });

  it('ignores non-string / empty discriminators instead of leaking them', () => {
    const numericCode = Object.assign(new Error('x'), { code: 500 });
    expect(toWireError(numericCode).code).toBe('unknown');
    const emptyCode = Object.assign(new Error('x'), { code: '', kind: 'fallback-kind' });
    expect(toWireError(emptyCode).code).toBe('fallback-kind');
  });
});
