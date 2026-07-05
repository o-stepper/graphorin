/**
 * Types for the delivery-layer commentary-phase trace sanitization
 * applied by the WebSocket dispatcher (`@graphorin/server/ws`) and
 * the SSE event-emission boundary (`@graphorin/server/sse`).
 *
 * The catalogue + per-policy enum + audit row shape is intentionally
 * structural so the server's delivery layer stays self-contained. A
 * deployment that wants to share patterns with the session-output
 * boundary in `@graphorin/sessions` can pass that package's
 * `BUILT_IN_COMMENTARY_PATTERNS` through {@link DeliveryCommentaryConfig}.patterns;
 * the shape is bytes-equal across the two layers (the
 * defense-in-depth posture is the load-bearing property - see
 * Phase 11 sanitizer for the storage-write boundary, this module
 * for the wire-emission boundary).
 *
 * @packageDocumentation
 */

/**
 * Operator-facing policy. Identical semantics to the session-output
 * sanitizer in `@graphorin/sessions/commentary` so the two layers
 * are bytes-equal on idempotent re-application.
 *
 *  - `'wrap'` (default) - wraps the matched fragment in a
 *    `<<<commentary>>>...<<</commentary>>>` envelope so downstream
 *    consumers can choose to render or hide based on context.
 *  - `'strip'` - removes the matched fragment entirely.
 *  - `'pass-through'` - disables the sanitization (operator opt-in
 *    for trusted deployments).
 *
 * @stable
 */
export type DeliveryCommentaryPolicy = 'wrap' | 'strip' | 'pass-through';

/**
 * Discriminator surfaced on audit rows + counter labels for the
 * transport that produced the sanitization decision. The cardinality
 * is bounded (3-valued).
 *
 * @stable
 */
export type DeliveryCommentaryTransport = 'ws' | 'sse' | 'rest';

/**
 * Stable label for each detection pattern. Surfaced in the audit row
 * + the counter label cardinality is bounded.
 *
 * @stable
 */
export type DeliveryCommentaryReason =
  | 'tool.call.start-payload-signature'
  | 'tool.call.delta-payload-signature'
  | 'tool.call.end-payload-signature'
  | 'tool.execute.end-payload-signature'
  | 'agent.fanout-event-signature'
  | 'context.compacted-event-signature'
  | 'agent.model.fellback-event-signature';

/**
 * Single pattern entry in the {@link DEFAULT_DELIVERY_COMMENTARY_PATTERNS}
 * catalogue. The `regex` is matched against the JSON payload of the
 * `event` frame (after `JSON.stringify(payload)`); deployments that
 * want to match against the wire-format string instead can supply
 * their own catalogue.
 *
 * @stable
 */
export interface DeliveryCommentaryPattern {
  readonly reason: DeliveryCommentaryReason;
  readonly regex: RegExp;
  readonly description: string;
}

/**
 * Per-emission decision recorded by the sanitizer. Mirrored on the
 * audit row + the counter increment.
 *
 * @stable
 */
export interface DeliveryCommentaryDecision {
  readonly transport: DeliveryCommentaryTransport;
  readonly boundary: 'event-emission';
  readonly policy: DeliveryCommentaryPolicy;
  readonly applied: boolean;
  readonly reasons: ReadonlyArray<DeliveryCommentaryReason>;
  readonly matchedPattern: string | undefined;
  readonly sha256OfBefore: string;
  readonly sha256OfAfter: string;
  readonly eventType: string;
}

/**
 * Single audit + counter sink consumed by the sanitizer when a
 * decision fires. Wiring is optional - operators that do not need
 * audit telemetry can skip the sink and the sanitizer becomes a
 * pure transform.
 *
 * @stable
 */
export interface DeliveryCommentarySink {
  /**
   * Called once per applied decision. Implementations should be
   * non-throwing; the sanitizer wraps the call in `try/catch` so a
   * misbehaving sink never blocks the wire.
   */
  onDecision(decision: DeliveryCommentaryDecision): void;
}

/**
 * Public configuration accepted by the WS / SSE / REST event-
 * emission sanitizer. Shape mirrors the per-server
 * `WsConfig.commentarySanitization` field documented in the runtime
 * spec.
 *
 * @stable
 */
export interface DeliveryCommentaryConfig {
  readonly policy?: DeliveryCommentaryPolicy;
  /**
   * Whitelist of `event.type` literals to sanitize. The default
   * covers the user-visible commentary surface (`text.delta` plus
   * the two tool-result variants); operators extend the list as
   * their UI rendering boundary expands.
   */
  readonly applyToEvents?: ReadonlyArray<string>;
  readonly patterns?: ReadonlyArray<DeliveryCommentaryPattern>;
  readonly wrapOpen?: string;
  readonly wrapClose?: string;
  readonly sink?: DeliveryCommentarySink;
}
