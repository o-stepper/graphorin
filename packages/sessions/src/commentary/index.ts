/**
 * Commentary-phase trace sanitization barrel for `@graphorin/sessions`.
 *
 * @packageDocumentation
 */

export { BUILT_IN_COMMENTARY_PATTERNS } from './built-in-patterns.js';
export {
  type CommentarySanitizationResult,
  type CommentarySanitizer,
  type CommentarySanitizerOptions,
  createCommentarySanitizer,
} from './sanitizer.js';
export type {
  CommentaryBoundary,
  CommentaryPattern,
  CommentaryPolicy,
  CommentaryReason,
  CommentarySanitizationDecision,
} from './types.js';
