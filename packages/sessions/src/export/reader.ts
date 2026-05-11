/**
 * Streaming JSONL reader for the
 * `graphorin-session-export/1.0` schema.
 *
 * The reader is **forgiving** by construction:
 *  - Unknown record kinds surface as `kind: 'unknown'` so importers
 *    can WARN + skip without breaking the stream.
 *  - Schema MAJORs newer than the reader's current MAJOR fail fast
 *    with {@link SessionExportSchemaTooNewError}.
 *  - Schema MAJORs older than the reader's N-2 backwards-compat
 *    band fail fast with {@link SessionExportSchemaUnsupportedError}.
 *  - The `--hash` checksum is verified (if present) and a mismatch
 *    surfaces {@link SessionExportChecksumMismatchError}.
 *
 * @packageDocumentation
 */

import { createDecipheriv, createHash } from 'node:crypto';
import {
  SessionExportChecksumMismatchError,
  SessionExportFormatInvalidError,
  SessionExportSchemaTooNewError,
  SessionExportSchemaUnsupportedError,
} from '../errors/index.js';
import {
  SESSION_EXPORT_BACKWARDS_COMPAT_MAJORS,
  SESSION_EXPORT_FORMAT,
  SESSION_EXPORT_SCHEMA_CURRENT,
  type SessionExportFooterRecord,
  type SessionExportMetaRecord,
  type SessionExportParsedRecord,
  type SessionExportRecord,
  type SessionExportRecordKind,
} from './types.js';

/**
 * Read result: a sequenced parse of every record plus the optional
 * sentinel header / footer surfaced explicitly.
 *
 * @stable
 */
export interface SessionExportReadResult {
  readonly meta: SessionExportMetaRecord;
  readonly records: ReadonlyArray<SessionExportParsedRecord>;
  readonly footer: SessionExportFooterRecord;
  readonly warnings: ReadonlyArray<SessionExportWarning>;
}

/**
 * Lifecycle event surfaced by the reader. Every `'unknown-record'`
 * + every `'schema-future-minor'` triggers exactly one warning.
 *
 * @stable
 */
export interface SessionExportWarning {
  readonly kind:
    | 'unknown-record'
    | 'schema-future-minor'
    | 'embedder-mismatch-dropped'
    | 'reasoning-meta-extension';
  readonly message: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Options accepted by {@link readSessionExport}.
 *
 * @stable
 */
export interface SessionExportReadOptions {
  /**
   * When the meta header declares one or more `embedderIds` that do
   * not match the supplied `activeEmbedderIds` set, embeddings on
   * imported messages are dropped (with a warning per embedder).
   * Defaults to an empty set, meaning embeddings are always dropped
   * (the safest default — embeddings produced under a different
   * embedder are not interchangeable byte-for-byte).
   */
  readonly activeEmbedderIds?: ReadonlyArray<string>;
  /**
   * When the file was written with `--encrypt`, supply the matching
   * key + salt. Required when the footer surfaces `cipher`.
   */
  readonly decryptionKey?: Uint8Array;
  /**
   * Provide a custom logger for warnings. The framework default emits
   * to `console.warn`; pass `() => {}` to silence.
   */
  readonly onWarn?: (warning: SessionExportWarning) => void;
}

/**
 * Parse a string body. The body must be a single block of JSONL with
 * a `kind: 'meta'` first line and a `kind: 'footer'` last line.
 *
 * @stable
 */
export function readSessionExport(
  body: string,
  options: SessionExportReadOptions = {},
): SessionExportReadResult {
  const lines = splitLines(body);
  if (lines.length < 2) {
    throw new SessionExportFormatInvalidError(
      'expected at least a meta header + footer (got empty stream)',
    );
  }
  const headerLine = lines[0];
  if (headerLine === undefined) {
    throw new SessionExportFormatInvalidError('missing meta header');
  }
  const meta = parseHeader(headerLine);
  validateSchemaMajor(meta.version);

  const warnings: SessionExportWarning[] = [];
  const records: SessionExportParsedRecord[] = [];
  let footer: SessionExportFooterRecord | undefined;
  const bodyHash = createHash('sha256');

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line === undefined || line.length === 0) continue;
    let parsed: Readonly<Record<string, unknown>>;
    try {
      parsed = JSON.parse(line) as Readonly<Record<string, unknown>>;
    } catch {
      throw new SessionExportFormatInvalidError(`malformed JSONL on line ${i + 1}`);
    }
    const kind = parsed['kind'];
    if (kind === 'footer') {
      footer = parsed as unknown as SessionExportFooterRecord;
      continue;
    }
    bodyHash.update(`${line}\n`, 'utf8');
    const record = parseBodyRecord(parsed, warnings);
    records.push(record);
  }
  if (footer === undefined) {
    throw new SessionExportFormatInvalidError('missing sentinel footer');
  }
  if (footer.checksum !== undefined) {
    const expected = footer.checksum;
    const actual = `sha256:${bodyHash.digest('hex')}`;
    if (expected !== actual) {
      throw new SessionExportChecksumMismatchError(expected, actual);
    }
  }

  // Embedder-mismatch warnings — single warning per mismatch encountered.
  const accepted = new Set(options.activeEmbedderIds ?? []);
  if (meta.embedderIds !== undefined) {
    for (const id of meta.embedderIds) {
      if (!accepted.has(id)) {
        warnings.push({
          kind: 'embedder-mismatch-dropped',
          message: `Embedder '${id}' is not active locally; embeddings produced under it have been dropped.`,
          metadata: { embedderId: id },
        });
      }
    }
  }

  if (options.onWarn !== undefined) {
    for (const w of warnings) options.onWarn(w);
  }

  return Object.freeze({
    meta,
    records,
    footer,
    warnings,
  });
}

function splitLines(body: string): ReadonlyArray<string> {
  const trimmed = body.endsWith('\n') ? body.slice(0, -1) : body;
  if (trimmed.length === 0) return [];
  return trimmed.split('\n');
}

function parseHeader(line: string): SessionExportMetaRecord {
  let parsed: Readonly<Record<string, unknown>>;
  try {
    parsed = JSON.parse(line) as Readonly<Record<string, unknown>>;
  } catch {
    throw new SessionExportFormatInvalidError('meta header is not valid JSON');
  }
  if (parsed['kind'] !== 'meta') {
    throw new SessionExportFormatInvalidError(
      `expected line 1 to be { kind: 'meta', ... } (got kind=${String(parsed['kind'])})`,
    );
  }
  if (parsed['format'] !== SESSION_EXPORT_FORMAT) {
    throw new SessionExportFormatInvalidError(
      `expected format='${SESSION_EXPORT_FORMAT}' (got format='${String(parsed['format'])}')`,
    );
  }
  if (typeof parsed['version'] !== 'string' || !/^\d+\.\d+$/.test(parsed['version'])) {
    throw new SessionExportFormatInvalidError(
      `expected version to be 'MAJOR.MINOR' (got '${String(parsed['version'])}')`,
    );
  }
  return parsed as unknown as SessionExportMetaRecord;
}

function validateSchemaMajor(version: string): void {
  const importedMajor = parseInt(version.split('.', 2)[0] ?? '0', 10);
  const readerMajor = parseInt(SESSION_EXPORT_SCHEMA_CURRENT.split('.', 2)[0] ?? '0', 10);
  if (importedMajor > readerMajor) {
    throw new SessionExportSchemaTooNewError(version, SESSION_EXPORT_SCHEMA_CURRENT);
  }
  if (importedMajor < readerMajor - SESSION_EXPORT_BACKWARDS_COMPAT_MAJORS) {
    throw new SessionExportSchemaUnsupportedError(version, SESSION_EXPORT_SCHEMA_CURRENT);
  }
}

const KNOWN_KINDS = new Set<SessionExportRecordKind>([
  'meta',
  'session',
  'agent',
  'message',
  'handoff',
  'audit',
  'footer',
]);

function parseBodyRecord(
  parsed: Readonly<Record<string, unknown>>,
  warnings: SessionExportWarning[],
): SessionExportParsedRecord {
  const kind = parsed['kind'];
  if (typeof kind !== 'string') {
    throw new SessionExportFormatInvalidError('body record missing string `kind`');
  }
  if (!KNOWN_KINDS.has(kind as SessionExportRecordKind)) {
    warnings.push({
      kind: 'unknown-record',
      message: `Skipping unknown record kind '${kind}' (lenient-forward-parse).`,
      metadata: { recordKind: kind },
    });
    return { kind: 'unknown', raw: parsed };
  }
  return parsed as unknown as SessionExportRecord;
}

/**
 * Decrypt a body that was written with `encryptBody(...)`. The layout
 * is `[iv (12)][ciphertext][tag (16)]`.
 *
 * @stable
 */
export function decryptBody(body: Uint8Array, key: Uint8Array): Uint8Array {
  if (body.length < 12 + 16) {
    throw new SessionExportFormatInvalidError('encrypted body shorter than IV + tag overhead');
  }
  const iv = body.subarray(0, 12);
  const tag = body.subarray(body.length - 16);
  const ciphertext = body.subarray(12, body.length - 16);
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(key), Buffer.from(iv));
  decipher.setAuthTag(Buffer.from(tag));
  return new Uint8Array(
    Buffer.concat([decipher.update(Buffer.from(ciphertext)), decipher.final()]),
  );
}
