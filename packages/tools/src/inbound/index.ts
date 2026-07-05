/**
 * Inbound prompt-injection sanitization surface for `@graphorin/tools`.
 *
 * @packageDocumentation
 */

export {
  type NeutralizeEnvelopeDelimitersOptions,
  neutralizeEnvelopeDelimiters,
  UNTRUSTED_CONTENT_CLOSE,
  UNTRUSTED_CONTENT_OPEN_PREFIX,
} from './envelope.js';
export { applyInboundSanitization, type SanitizationOutcome } from './sanitize.js';
