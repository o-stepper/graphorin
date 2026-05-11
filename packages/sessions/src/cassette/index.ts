/**
 * Barrel for the tool-cassette schema 1.0 surface.
 *
 * @packageDocumentation
 */

export { readToolCassette, type ToolCassetteReadResult } from './reader.js';
export {
  createToolCassetteRecorder,
  type ToolCassetteRecorder,
  type ToolCassetteRecorderOptions,
} from './recorder.js';
export {
  type CassetteLiveInvocation,
  type CassetteReplayDecision,
  type CassetteReplayPolicyOptions,
  type CassetteReplayReason,
  decideToolReplay,
  sha256OfValue,
} from './replay.js';
export {
  type CassetteAuditRecord,
  type CompactionRecord,
  type ModelFallbackRecord,
  type PerToolReplayMode,
  type ProgressArtifactRefRecord,
  TOOL_CASSETTE_BACKWARDS_COMPAT_MAJORS,
  TOOL_CASSETTE_FORMAT,
  TOOL_CASSETTE_SCHEMA_CURRENT,
  type ToolCallRecord,
  type ToolCallRecordStatus,
  type ToolCassetteFooterRecord,
  type ToolCassetteMetaRecord,
  type ToolCassetteParsedRecord,
  type ToolCassetteRecord,
  type ToolCassetteRecordKind,
  type ToolCassetteSource,
  type ToolCassetteUnknownRecord,
  type ToolReplayMode,
  type ToolSearchResolvedRecord,
} from './types.js';
export {
  createCassetteBufferSink,
  createToolCassetteWriter,
  type ToolCassetteSink,
  type ToolCassetteWriter,
  type ToolCassetteWriterOptions,
} from './writer.js';
