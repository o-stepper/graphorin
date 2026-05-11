/**
 * Barrel for the JSONL session-export schema 1.0 surface.
 *
 * @packageDocumentation
 */

export {
  decryptBody,
  readSessionExport,
  type SessionExportReadOptions,
  type SessionExportReadResult,
  type SessionExportWarning,
} from './reader.js';
export {
  SESSION_EXPORT_BACKWARDS_COMPAT_MAJORS,
  SESSION_EXPORT_FORMAT,
  SESSION_EXPORT_SCHEMA_CURRENT,
  type SessionExportAgentRecord,
  type SessionExportAuditRecord,
  type SessionExportFooterRecord,
  type SessionExportHandoffRecord,
  type SessionExportMessageRecord,
  type SessionExportMetaRecord,
  type SessionExportParsedRecord,
  type SessionExportRecord,
  type SessionExportRecordKind,
  type SessionExportSessionRecord,
  type SessionExportUnknownRecord,
} from './types.js';
export {
  createBufferSink,
  createSessionExportWriter,
  deriveSessionExportKey,
  encryptBody,
  type SessionExportEncryptionConfig,
  type SessionExportSink,
  type SessionExportWriter,
  type SessionExportWriterOptions,
} from './writer.js';
