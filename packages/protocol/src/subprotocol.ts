/**
 * Subprotocol identifier + negotiation helpers for the Graphorin
 * WebSocket protocol.
 *
 * Clients announce supported subprotocols in the
 * `Sec-WebSocket-Protocol` upgrade header. The server is expected to
 * pick exactly one and echo it back; mismatches abort the handshake
 * per RFC 6455 § 4. Browsers also accept additional comma-separated
 * tokens — Graphorin uses this slot to attach a single-use ticket
 * via the `ticket.<value>` form (the WebSocket browser API does not
 * accept arbitrary headers, so the ticket has to ride the
 * subprotocol channel).
 *
 * @packageDocumentation
 */

/**
 * Canonical subprotocol identifier for the v1 wire format.
 *
 * @stable
 */
export const SUBPROTOCOL_NAME = 'graphorin.protocol.v1';

/**
 * Wire-format major version literal carried on every message body.
 * The pair `(SUBPROTOCOL_NAME, PROTOCOL_VERSION)` is the binding
 * contract a client commits to when it receives a successful upgrade.
 *
 * @stable
 */
export const PROTOCOL_VERSION = '1';

/**
 * Prefix for the single-use ticket that browser clients attach to
 * the `Sec-WebSocket-Protocol` header. The server's upgrade handler
 * splits the comma-separated list, finds the first
 * `ticket.<value>` token, and validates the value against the
 * in-memory ticket store before granting the connection.
 *
 * @stable
 */
export const TICKET_SUBPROTOCOL_PREFIX = 'ticket.';

/**
 * Format a ticket value as a `Sec-WebSocket-Protocol` token suitable
 * for browser clients (which cannot attach an `Authorization`
 * header on the WebSocket upgrade). The companion server helper is
 * {@link parseTicketSubprotocol}.
 *
 * @stable
 */
export function formatTicketSubprotocol(ticket: string): string {
  if (typeof ticket !== 'string' || ticket.length === 0) {
    throw new TypeError('formatTicketSubprotocol: ticket must be a non-empty string.');
  }
  return `${TICKET_SUBPROTOCOL_PREFIX}${ticket}`;
}

/**
 * Extract the ticket value from a single comma-separated client list
 * (e.g. `'graphorin.protocol.v1, ticket.abc-123'`). Returns
 * `undefined` if no `ticket.*` token is present. Whitespace around
 * each comma-separated token is ignored.
 *
 * @stable
 */
export function parseTicketSubprotocol(
  clientList: string | ReadonlyArray<string>,
): string | undefined {
  for (const token of normalizeTokens(clientList)) {
    if (token.startsWith(TICKET_SUBPROTOCOL_PREFIX)) {
      const value = token.slice(TICKET_SUBPROTOCOL_PREFIX.length);
      if (value.length > 0) return value;
    }
  }
  return undefined;
}

/**
 * Pick the single subprotocol the server should echo back. Returns
 * `SUBPROTOCOL_NAME` when the client offered it, or `null` when no
 * compatible variant was advertised. The function ignores `ticket.*`
 * tokens — those are handled separately via {@link parseTicketSubprotocol}.
 *
 * @stable
 */
export function negotiateSubprotocol(clientList: string | ReadonlyArray<string>): string | null {
  for (const token of normalizeTokens(clientList)) {
    if (token === SUBPROTOCOL_NAME) return SUBPROTOCOL_NAME;
  }
  return null;
}

function normalizeTokens(input: string | ReadonlyArray<string>): ReadonlyArray<string> {
  if (Array.isArray(input)) {
    return input
      .flatMap((entry) => entry.split(','))
      .map((token) => token.trim())
      .filter((token) => token.length > 0);
  }
  if (typeof input !== 'string') return [];
  return input
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}
