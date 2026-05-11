/**
 * Commentary-phase trace sanitization types. The four session-output
 * boundaries (`session-push`, `session-list`, `session-export`,
 * `session-replay`) all funnel through the same sanitizer and emit
 * the same audit + counter shapes.
 *
 * @packageDocumentation
 */

/**
 * Operator-facing policy for handling detected commentary fragments.
 *
 *  - `'wrap'` (default) wraps every detection in a
 *    `<<<commentary>>>...<<</commentary>>>` envelope so downstream
 *    consumers can choose to render or hide based on context.
 *  - `'strip'` removes the detected fragment entirely.
 *  - `'pass-through'` disables the sanitization (operator opt-in for
 *    deployments that handle commentary at a different layer).
 *
 * @stable
 */
export type CommentaryPolicy = 'wrap' | 'strip' | 'pass-through';

/**
 * The four boundaries the sanitizer fires at.
 *
 * @stable
 */
export type CommentaryBoundary =
  | 'session-push'
  | 'session-list'
  | 'session-export'
  | 'session-replay';

/**
 * Stable label for each detection pattern. Surfaced in the audit row +
 * the counter label cardinality is bounded.
 *
 * @stable
 */
export type CommentaryReason =
  | 'tool.call.start-payload-signature'
  | 'tool.call.delta-payload-signature'
  | 'tool.call.end-payload-signature'
  | 'tool.execute.end-payload-signature'
  | 'agent.fanout-event-signature'
  | 'context.compacted-event-signature'
  | 'agent.model.fellback-event-signature';

/**
 * Single sanitization decision recorded by the sanitizer for an
 * outbound `MessageContent` part.
 *
 * @stable
 */
export interface CommentarySanitizationDecision {
  readonly boundary: CommentaryBoundary;
  readonly policy: CommentaryPolicy;
  readonly applied: boolean;
  readonly reasons: ReadonlyArray<CommentaryReason>;
  readonly sha256OfBefore: string;
  readonly sha256OfAfter: string;
}

/**
 * Single pattern entry in the {@link BUILT_IN_COMMENTARY_PATTERNS}
 * catalogue. Keeping the array exported so consumers can inspect the
 * shape and add their own regex extensions in custom deployments.
 *
 * @stable
 */
export interface CommentaryPattern {
  readonly reason: CommentaryReason;
  readonly regex: RegExp;
  readonly description: string;
}
