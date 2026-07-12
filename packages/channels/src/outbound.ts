/**
 * Outbound scaffolding sanitization for channel delivery - the third
 * consumer of the shared catalogue in `@graphorin/tools/outbound`
 * (after the server delivery layer and the session-output boundary).
 *
 * Every `deliver()` the gateway performs runs the payload text
 * through this pass, so tool-call payloads, fan-out events and other
 * internal scaffolding never reach a messenger peer on ANY channel -
 * the messenger-deployment lesson: a boundary that is scrubbed on
 * one surface but raw on another leaks on the raw one.
 *
 * Unlike the server/session boundaries the channel default is
 * `'strip'`, not `'wrap'`: a messenger peer has no UI that could
 * collapse a `<<<commentary>>>` envelope, so wrapped fragments are
 * dropped entirely (previously-wrapped segments from an upstream
 * boundary included).
 *
 * @packageDocumentation
 */

import {
  COMMENTARY_WRAP_CLOSE,
  COMMENTARY_WRAP_OPEN,
  freshRegex,
  OUTBOUND_COMMENTARY_PATTERNS,
  type OutboundCommentaryPolicy,
  type OutboundCommentaryReason,
  splitByWrapEnvelope,
} from '@graphorin/tools/outbound';

export type { OutboundCommentaryPolicy, OutboundCommentaryReason } from '@graphorin/tools/outbound';

/** Result of one outbound sanitization pass. @stable */
export interface OutboundSanitizationResult {
  readonly text: string;
  readonly modified: boolean;
  /** Distinct pattern reasons that matched (bounded cardinality). */
  readonly reasons: ReadonlyArray<OutboundCommentaryReason>;
}

/**
 * Sanitize one outbound channel text. `'strip'` (default) removes
 * matched fragments AND drops segments an upstream boundary already
 * wrapped; `'wrap'` behaves like the server/session boundaries
 * (idempotent envelope); `'pass-through'` disables the pass.
 *
 * @stable
 */
export function sanitizeChannelOutbound(
  text: string,
  policy: OutboundCommentaryPolicy = 'strip',
): OutboundSanitizationResult {
  if (policy === 'pass-through' || text.length === 0) {
    return { text, modified: false, reasons: [] };
  }
  const segments = splitByWrapEnvelope(text, COMMENTARY_WRAP_OPEN, COMMENTARY_WRAP_CLOSE);
  const reasons = new Set<OutboundCommentaryReason>();
  const out: string[] = [];
  for (const segment of segments) {
    if (segment.kind === 'wrapped') {
      // An upstream boundary already flagged this as internal
      // commentary. 'strip' drops it for the peer; 'wrap' keeps the
      // envelope untouched (idempotency).
      if (policy === 'wrap') out.push(segment.text);
      continue;
    }
    let segText = segment.text;
    for (const pattern of OUTBOUND_COMMENTARY_PATTERNS) {
      const regex = freshRegex(pattern.regex);
      let didMatch = false;
      segText = segText.replace(regex, (match) => {
        didMatch = true;
        if (policy === 'strip') return '';
        return `${COMMENTARY_WRAP_OPEN}${match}${COMMENTARY_WRAP_CLOSE}`;
      });
      if (didMatch) reasons.add(pattern.reason);
    }
    out.push(segText);
  }
  const next = out.join('');
  return { text: next, modified: next !== text, reasons: [...reasons] };
}
