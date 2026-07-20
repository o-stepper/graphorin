/**
 * Token-counter dispatcher and per-vendor strategies.
 *
 * @packageDocumentation
 */

export {
  AnthropicAPICounter,
  type AnthropicAPICounterOptions,
} from './anthropic.js';
export {
  BedrockAPICounter,
  type BedrockAPICounterOptions,
} from './bedrock.js';
export {
  type CreateDefaultCounterOptions,
  createDefaultCounter,
} from './dispatcher.js';
export {
  __resetGlobalTokenCounter,
  getGlobalTokenCounter,
  setGlobalTokenCounter,
} from './global.js';
export { GoogleAPICounter, type GoogleAPICounterOptions } from './google.js';
export { HeuristicCounter, type HeuristicCounterOptions } from './heuristic.js';
export {
  __resetTiktokenCache,
  JsTiktokenCounter,
  type JsTiktokenCounterOptions,
  type TiktokenEncoding,
  type TiktokenModule,
} from './js-tiktoken.js';
export {
  type SerializedMessage,
  serialiseMessageForCount,
  serializedToString,
} from './serialize.js';
