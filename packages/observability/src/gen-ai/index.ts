/**
 * OpenTelemetry GenAI semantic-conventions conformance helpers.
 *
 * @packageDocumentation
 */

export { emitGenAIAttributes, emitGenAIMessageEvents } from './emit.js';
export {
  OPERATION_NAME_TABLE,
  operationNameFor,
} from './operation-mapping.js';
export {
  _resetGenAISystemWarningsForTesting,
  deriveGenAISystem,
  PROVIDER_CLASS_TO_GEN_AI_SYSTEM,
  setGenAISystemWarnSink,
} from './system-derivation.js';
export type {
  GenAIAttributes,
  GenAIMessage,
  GenAIMessageRole,
  GenAIOperationName,
  GenAISystem,
  GenAIToolType,
  SpanTypeToOperationName,
} from './types.js';
