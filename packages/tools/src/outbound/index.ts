/**
 * `@graphorin/tools/outbound` - single-source outbound commentary
 * pattern catalogue + envelope helpers shared by the server delivery
 * layer, the session-output boundary and the channel gateway.
 *
 * @packageDocumentation
 */

export {
  COMMENTARY_WRAP_CLOSE,
  COMMENTARY_WRAP_OPEN,
  freshRegex,
  OUTBOUND_COMMENTARY_PATTERNS,
  type OutboundCommentaryPattern,
  type OutboundCommentaryPolicy,
  type OutboundCommentaryReason,
  sha256Hex,
  splitByWrapEnvelope,
} from './commentary-patterns.js';
