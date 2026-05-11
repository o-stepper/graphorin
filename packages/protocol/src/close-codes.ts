/**
 * Custom WebSocket close-code taxonomy used by `@graphorin/server`
 * and `@graphorin/client`. The numeric values live in the 4xxx
 * application-private range per RFC 6455 § 7.4.
 *
 * @packageDocumentation
 */

/**
 * Discriminator for every Graphorin-defined close code. The
 * matching numeric value is exposed via {@link CLOSE_CODE_VALUES}.
 *
 * @stable
 */
export type GraphorinCloseReason =
  | 'auth.required'
  | 'auth.invalid'
  | 'auth.revoked'
  | 'auth.scope_denied'
  | 'rate.limited'
  | 'flow.throttled'
  | 'server.shutdown'
  | 'protocol.violation';

/**
 * Numeric close-code constants. The pair `(value, reason)` round-trips
 * via {@link closeCodeReason} / {@link closeCodeFor}.
 *
 * @stable
 */
export const CLOSE_CODE_VALUES = Object.freeze({
  'auth.required': 4001,
  'auth.invalid': 4002,
  'auth.revoked': 4003,
  'auth.scope_denied': 4004,
  'rate.limited': 4005,
  'flow.throttled': 4006,
  'server.shutdown': 4007,
  'protocol.violation': 4008,
} as const satisfies Record<GraphorinCloseReason, number>);

/**
 * Return the numeric close code for a Graphorin reason discriminator.
 *
 * @stable
 */
export function closeCodeFor(reason: GraphorinCloseReason): number {
  return CLOSE_CODE_VALUES[reason];
}

const REVERSE_LOOKUP: ReadonlyMap<number, GraphorinCloseReason> = new Map(
  (Object.entries(CLOSE_CODE_VALUES) as ReadonlyArray<[GraphorinCloseReason, number]>).map(
    ([reason, code]) => [code, reason],
  ),
);

/**
 * Resolve a numeric close code back to its Graphorin reason
 * discriminator. Returns `undefined` for codes outside the
 * Graphorin range so callers can still surface the raw RFC 6455
 * reason for unrelated codes.
 *
 * @stable
 */
export function closeCodeReason(code: number): GraphorinCloseReason | undefined {
  return REVERSE_LOOKUP.get(code);
}
