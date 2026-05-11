import { describe, expect, it } from 'vitest';

import {
  formatTicketSubprotocol,
  negotiateSubprotocol,
  PROTOCOL_VERSION,
  parseTicketSubprotocol,
  SUBPROTOCOL_NAME,
  TICKET_SUBPROTOCOL_PREFIX,
} from '../src/subprotocol.js';

describe('subprotocol constants', () => {
  it('exposes the v1 identifier', () => {
    expect(SUBPROTOCOL_NAME).toBe('graphorin.protocol.v1');
    expect(PROTOCOL_VERSION).toBe('1');
    expect(TICKET_SUBPROTOCOL_PREFIX).toBe('ticket.');
  });
});

describe('negotiateSubprotocol', () => {
  it('selects the v1 protocol when offered as a comma-separated string', () => {
    expect(negotiateSubprotocol('graphorin.protocol.v1, ticket.abc-123')).toBe(
      'graphorin.protocol.v1',
    );
  });

  it('selects the v1 protocol when offered as a list', () => {
    expect(negotiateSubprotocol(['graphorin.protocol.v1', 'ticket.x'])).toBe(
      'graphorin.protocol.v1',
    );
  });

  it('returns null when the v1 protocol is not advertised', () => {
    expect(negotiateSubprotocol('mqtt, ticket.something')).toBeNull();
    expect(negotiateSubprotocol([])).toBeNull();
    expect(negotiateSubprotocol('')).toBeNull();
  });

  it('ignores extra whitespace around tokens', () => {
    expect(negotiateSubprotocol('   graphorin.protocol.v1  ,   ticket.q  ')).toBe(
      'graphorin.protocol.v1',
    );
  });

  it('handles non-string inputs by returning null', () => {
    // @ts-expect-error — runtime guard
    expect(negotiateSubprotocol(null)).toBeNull();
  });
});

describe('formatTicketSubprotocol / parseTicketSubprotocol', () => {
  it('round-trips a ticket value', () => {
    const formatted = formatTicketSubprotocol('abc-123');
    expect(formatted).toBe('ticket.abc-123');
    expect(parseTicketSubprotocol(`graphorin.protocol.v1, ${formatted}`)).toBe('abc-123');
  });

  it('returns undefined when no ticket token is present', () => {
    expect(parseTicketSubprotocol('graphorin.protocol.v1')).toBeUndefined();
    expect(parseTicketSubprotocol([])).toBeUndefined();
  });

  it('rejects empty ticket values at format time', () => {
    expect(() => formatTicketSubprotocol('')).toThrow(TypeError);
    // @ts-expect-error — runtime guard
    expect(() => formatTicketSubprotocol(undefined)).toThrow(TypeError);
  });

  it('skips a malformed empty ticket token at parse time', () => {
    expect(parseTicketSubprotocol('graphorin.protocol.v1, ticket.')).toBeUndefined();
  });

  it('honours the first ticket token if multiple are present', () => {
    expect(parseTicketSubprotocol(['graphorin.protocol.v1', 'ticket.first', 'ticket.second'])).toBe(
      'first',
    );
  });
});
