/**
 * Delivery-layer commentary-phase trace sanitization for
 * `@graphorin/server`.
 *
 * @packageDocumentation
 */

export {
  DEFAULT_APPLY_TO_EVENTS,
  DEFAULT_DELIVERY_COMMENTARY_PATTERNS,
} from './built-in-patterns.js';
export {
  createDeliveryCommentarySanitizer,
  type DeliveryCommentarySanitizer,
} from './sanitizer.js';
export type {
  DeliveryCommentaryConfig,
  DeliveryCommentaryDecision,
  DeliveryCommentaryPattern,
  DeliveryCommentaryPolicy,
  DeliveryCommentaryReason,
  DeliveryCommentarySink,
  DeliveryCommentaryTransport,
} from './types.js';
