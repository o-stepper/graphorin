/**
 * Tiny dependency-free helpers used across the @graphorin/* packages.
 *
 * @packageDocumentation
 */

export { assertNever } from './assert-never.js';
export type { AsyncContext } from './async-context.js';
export { createAsyncContext } from './async-context.js';
export type {
  EncodedBinary,
  EncodedBytes,
  EncodedUrl,
  WireAssistantMessage,
  WireAudioContent,
  WireCompletedToolCall,
  WireFileContent,
  WireImageContent,
  WireMessage,
  WireMessageContent,
  WireRunState,
  WireRunStep,
  WireToolMessage,
  WireToolOutcome,
  WireToolResult,
  WireUserMessage,
} from './binary-json.js';
export {
  base64ToBytes,
  bytesToBase64,
  fromJsonSafeContentParts,
  fromJsonSafeMessage,
  fromJsonSafeRunState,
  toJsonSafeContentParts,
  toJsonSafeMessage,
  toJsonSafeRunState,
} from './binary-json.js';
export { md5, xxhash } from './hash.js';
export {
  collect,
  filter,
  mapStream,
  merge,
  take,
  takeWhile,
  withSignal,
} from './streams.js';
export type {
  ValidationResult,
  ZodLikeError,
  ZodLikeSafeParseResult,
  ZodLikeSchema,
} from './validation.js';
export {
  validate,
  validateOrThrow,
} from './validation.js';
