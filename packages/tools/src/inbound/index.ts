/**
 * Inbound prompt-injection sanitization surface for `@graphorin/tools`.
 *
 * @packageDocumentation
 */

export type { InjectionClassifier } from '@graphorin/security/inspect';
export {
  type NeutralizeEnvelopeDelimitersOptions,
  neutralizeEnvelopeDelimiters,
  UNTRUSTED_CONTENT_CLOSE,
  UNTRUSTED_CONTENT_OPEN_PREFIX,
} from './envelope.js';
export {
  applyInboundSanitization,
  applyInboundSanitizationWithClassifier,
  type InboundSanitizationWithClassifierOptions,
  type SanitizationOutcome,
} from './sanitize.js';
