/**
 * Streaming JSONL writer for the
 * `graphorin-session-export/1.0` schema.
 *
 * The writer is async-iterable + push-friendly so callers can stream
 * megabytes of session history without buffering the full set into
 * memory. The CLI's `graphorin export session ...` command is a thin
 * shell over this.
 *
 * @packageDocumentation
 */

import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import {
  SESSION_EXPORT_FORMAT,
  SESSION_EXPORT_SCHEMA_CURRENT,
  type SessionExportFooterRecord,
  type SessionExportMetaRecord,
  type SessionExportRecord,
} from './types.js';

/**
 * Options accepted by {@link createSessionExportWriter}.
 *
 * @stable
 */
export interface SessionExportWriterOptions {
  /** Writer identifier surfaced in the meta header (e.g. `'graphorin@0.6.0'`). */
  readonly writer: string;
  /** Minimum runtime version that can read the resulting file. */
  readonly minRuntimeVersion?: string;
  /**
   * Optional `schemaUrl` to embed in the meta header. Conventionally a
   * stable URL that serves the JSON Schema document for the session
   * export format - for example a `raw.githubusercontent.com` URL
   * pointing at the schema file in this repository.
   */
  readonly schemaUrl?: string;
  /** Active embedder ids, surfaced for embedder-mismatch import handling. */
  readonly embedderIds?: ReadonlyArray<string>;
  /** Compute a SHA-256 of the body bytes and write it on the footer. */
  readonly hash?: boolean;
  /**
   * AES-256-GCM passphrase. When supplied the writer XORs every body
   * byte with the keystream and writes the cipher metadata on the
   * footer. The key is derived via `crypto.scryptSync(passphrase,
   * salt, 32)` for forward compatibility with Node's crypto APIs.
   *
   * Encryption is intentionally header-and-footer aware: the meta
   * header + footer remain plaintext so importers can fail fast
   * with a precise error before consuming the body.
   */
  readonly encrypt?: SessionExportEncryptionConfig;
  /** Override `Date.now()` for tests. */
  readonly now?: () => number;
}

/**
 * Configuration for opt-in `--encrypt` / `--sign`.
 *
 * @stable
 */
export interface SessionExportEncryptionConfig {
  readonly cipher?: 'aes256gcm';
  /**
   * Pre-derived 32-byte key. Mutually exclusive with `passphrase`.
   * Use {@link deriveSessionExportKey} to pre-derive deterministically
   * from a passphrase.
   */
  readonly key?: Uint8Array;
  /**
   * Passphrase + salt the writer derives a key from at write time.
   * The same salt MUST be supplied to the importer.
   */
  readonly passphrase?: Uint8Array | string;
  readonly salt?: Uint8Array;
}

/**
 * Streaming writer. Call `writeRecord(...)` per body record (in any
 * order, but `kind: 'meta'` and `kind: 'footer'` are owned by the
 * writer) and `close()` to emit the footer. The writer itself does
 * not own the destination - every emission is delivered via the
 * caller-supplied `sink`.
 *
 * @stable
 */
export interface SessionExportWriter {
  /** Write a single body record. The header is emitted lazily. */
  writeRecord(record: SessionExportRecord): Promise<void>;
  /** Emit the footer + any opt-in `--hash` body checksum. Idempotent. */
  close(): Promise<SessionExportFooterRecord>;
}

/**
 * Sink that consumes already-serialized JSONL lines (each carrying its
 * trailing newline). The default {@link createBufferSink} accumulates
 * the full body in memory; production deployments pass a streaming
 * sink built on `node:stream`.
 *
 * @stable
 */
export interface SessionExportSink {
  write(line: string): Promise<void>;
}

/**
 * Build a writer that emits to the supplied sink.
 *
 * @stable
 */
export function createSessionExportWriter(
  sink: SessionExportSink,
  options: SessionExportWriterOptions,
): SessionExportWriter {
  const writerVersion = options.writer;
  const minRuntimeVersion = options.minRuntimeVersion ?? '0.1.0';
  const now = options.now ?? Date.now;
  let headerWritten = false;
  let closed = false;
  let messageCount = 0;
  let handoffCount = 0;
  let agentCount = 0;
  let recordCount = 0;
  const hashBuilder = options.hash === true ? createHash('sha256') : null;
  // RP-1: lazily resolve the body-encryption key (the writer factory is sync,
  // but key derivation is async). Memoised so it derives at most once.
  let encryptionKey: Promise<Uint8Array> | null = null;
  function resolveEncryptionKey(): Promise<Uint8Array> {
    const enc = options.encrypt;
    if (enc === undefined) {
      throw new TypeError('[graphorin/sessions] internal: resolveEncryptionKey without encrypt');
    }
    if (enc.key !== undefined) return Promise.resolve(enc.key);
    if (enc.passphrase !== undefined && enc.salt !== undefined) {
      return deriveSessionExportKey(enc.passphrase, enc.salt);
    }
    throw new TypeError(
      '[graphorin/sessions] encrypt requires either a pre-derived `key` or `passphrase` + `salt`.',
    );
  }

  async function writeLine(line: string): Promise<void> {
    if (hashBuilder !== null) hashBuilder.update(line, 'utf8');
    await sink.write(line);
  }

  // RP-1: when encryption is configured, the body record is AES-256-GCM
  // encrypted and emitted as a self-identifying `{"enc":"<base64>"}` line. The
  // meta header + footer stay plaintext so an importer can fail fast; the body
  // checksum (if any) covers the encrypted output line, matching the reader.
  async function writeBody(recordLine: string): Promise<void> {
    if (options.encrypt === undefined) {
      await writeLine(recordLine);
      return;
    }
    encryptionKey ??= resolveEncryptionKey();
    const key = await encryptionKey;
    const ciphertext = encryptBody(new TextEncoder().encode(recordLine.replace(/\n$/, '')), key);
    await writeLine(`${JSON.stringify({ enc: Buffer.from(ciphertext).toString('base64') })}\n`);
  }

  async function emitHeader(): Promise<void> {
    const header: SessionExportMetaRecord = {
      kind: 'meta',
      version: SESSION_EXPORT_SCHEMA_CURRENT,
      format: SESSION_EXPORT_FORMAT,
      createdAt: new Date(now()).toISOString(),
      writer: writerVersion,
      minRuntimeVersion,
      ...(options.schemaUrl !== undefined ? { schemaUrl: options.schemaUrl } : {}),
      ...(options.embedderIds !== undefined ? { embedderIds: [...options.embedderIds] } : {}),
    };
    const line = `${JSON.stringify(header)}\n`;
    // Header bytes are NOT counted in the body checksum.
    await sink.write(line);
    headerWritten = true;
  }

  async function writeRecord(record: SessionExportRecord): Promise<void> {
    if (closed) {
      throw new TypeError('[graphorin/sessions] writer already closed');
    }
    if (record.kind === 'meta' || record.kind === 'footer') {
      throw new TypeError(
        '[graphorin/sessions] writer owns the meta header + footer; do not pass them via writeRecord(...)',
      );
    }
    if (!headerWritten) await emitHeader();
    if (record.kind === 'message') messageCount += 1;
    else if (record.kind === 'handoff') handoffCount += 1;
    else if (record.kind === 'agent') agentCount += 1;
    recordCount += 1;
    await writeBody(`${JSON.stringify(record)}\n`);
  }

  async function close(): Promise<SessionExportFooterRecord> {
    if (closed) {
      throw new TypeError('[graphorin/sessions] writer already closed');
    }
    if (!headerWritten) await emitHeader();
    closed = true;
    const footer: SessionExportFooterRecord = {
      kind: 'footer',
      recordCount: recordCount + 2, // include header + footer
      messageCount,
      handoffCount,
      agentCount,
      writtenAtIso: new Date(now()).toISOString(),
      ...(hashBuilder !== null ? { checksum: `sha256:${hashBuilder.digest('hex')}` } : {}),
      ...(options.encrypt !== undefined ? { cipher: options.encrypt.cipher ?? 'aes256gcm' } : {}),
    };
    // Footer bytes are NOT counted in the body checksum.
    await sink.write(`${JSON.stringify(footer)}\n`);
    return footer;
  }

  return { writeRecord, close };
}

/**
 * Convenience: a sink that buffers every line into a `string[]`. Used
 * by tests + the simple in-memory export path.
 *
 * @stable
 */
export function createBufferSink(): {
  readonly sink: SessionExportSink;
  readonly lines: string[];
  toString(): string;
} {
  const lines: string[] = [];
  return {
    sink: {
      async write(line) {
        lines.push(line);
      },
    },
    lines,
    toString(): string {
      return lines.join('');
    },
  };
}

/**
 * Derive a 32-byte AES key from a passphrase + salt. Exposed for
 * symmetry with the importer, which must supply the same salt to
 * produce the same key.
 *
 * @stable
 */
export async function deriveSessionExportKey(
  passphrase: Uint8Array | string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  const { scryptSync } = await import('node:crypto');
  const passphraseBuf =
    typeof passphrase === 'string' ? Buffer.from(passphrase, 'utf8') : passphrase;
  return new Uint8Array(scryptSync(passphraseBuf, salt, 32));
}

/**
 * Convenience: AES-256-GCM encrypt a body buffer. The IV is generated
 * fresh and prepended; the auth tag is appended. Output layout:
 * `[iv (12)][ciphertext][tag (16)]`.
 *
 * @stable
 */
export function encryptBody(body: Uint8Array, key: Uint8Array): Uint8Array {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key), iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(body)), cipher.final()]);
  const tag = cipher.getAuthTag();
  return new Uint8Array(Buffer.concat([iv, encrypted, tag]));
}
