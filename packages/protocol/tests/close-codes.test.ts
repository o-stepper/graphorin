import { describe, expect, it } from 'vitest';

import { CLOSE_CODE_VALUES, closeCodeFor, closeCodeReason } from '../src/close-codes.js';

describe('CLOSE_CODE_VALUES', () => {
  it('matches the ADR-031 numeric assignments', () => {
    expect(CLOSE_CODE_VALUES['auth.required']).toBe(4001);
    expect(CLOSE_CODE_VALUES['auth.invalid']).toBe(4002);
    expect(CLOSE_CODE_VALUES['auth.revoked']).toBe(4003);
    expect(CLOSE_CODE_VALUES['auth.scope_denied']).toBe(4004);
    expect(CLOSE_CODE_VALUES['rate.limited']).toBe(4005);
    expect(CLOSE_CODE_VALUES['flow.throttled']).toBe(4006);
    expect(CLOSE_CODE_VALUES['server.shutdown']).toBe(4007);
    expect(CLOSE_CODE_VALUES['protocol.violation']).toBe(4008);
  });
});

describe('closeCodeFor / closeCodeReason', () => {
  it('round-trips every Graphorin reason', () => {
    for (const [reason, code] of Object.entries(CLOSE_CODE_VALUES)) {
      expect(closeCodeFor(reason as never)).toBe(code);
      expect(closeCodeReason(code)).toBe(reason);
    }
  });

  it('returns undefined for codes outside the Graphorin range', () => {
    expect(closeCodeReason(1000)).toBeUndefined();
    expect(closeCodeReason(4999)).toBeUndefined();
  });
});
