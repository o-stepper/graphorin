/**
 * Streaming JSONL writer for the
 * `graphorin-tool-cassette/1.0` schema.
 *
 * Mirrors the design of `../export/writer.ts` to keep the operator
 * surface uniform across the two sibling JSONL formats.
 *
 * @packageDocumentation
 */

import { createHash } from 'node:crypto';
import {
  TOOL_CASSETTE_FORMAT,
  TOOL_CASSETTE_SCHEMA_CURRENT,
  type ToolCassetteFooterRecord,
  type ToolCassetteMetaRecord,
  type ToolCassetteRecord,
} from './types.js';

/**
 * Sink that consumes already-serialized JSONL lines (each carrying
 * its trailing newline). Mirrors the export sink shape so callers
 * can plug a streaming `node:stream` writer in.
 *
 * @stable
 */
export interface ToolCassetteSink {
  write(line: string): Promise<void>;
}

/**
 * Options accepted by {@link createToolCassetteWriter}.
 *
 * @stable
 */
export interface ToolCassetteWriterOptions {
  readonly writer: string;
  readonly sessionId: string;
  readonly runId: string;
  readonly minRuntimeVersion?: string;
  readonly schemaUrl?: string;
  readonly hash?: boolean;
  readonly now?: () => number;
}

/**
 * Writer surface returned by {@link createToolCassetteWriter}. Call
 * `writeRecord(...)` per body record (any order, but `meta` and
 * `footer` are owned by the writer) and `close()` to emit the footer.
 *
 * @stable
 */
export interface ToolCassetteWriter {
  writeRecord(record: ToolCassetteRecord): Promise<void>;
  close(): Promise<ToolCassetteFooterRecord>;
}

/**
 * Build a streaming writer.
 *
 * @stable
 */
export function createToolCassetteWriter(
  sink: ToolCassetteSink,
  options: ToolCassetteWriterOptions,
): ToolCassetteWriter {
  const minRuntimeVersion = options.minRuntimeVersion ?? '0.1.0';
  const now = options.now ?? Date.now;
  let headerWritten = false;
  let closed = false;
  let toolCallCount = 0;
  let recordCount = 0;
  const hashBuilder = options.hash === true ? createHash('sha256') : null;

  async function writeLine(line: string): Promise<void> {
    if (hashBuilder !== null) hashBuilder.update(line, 'utf8');
    await sink.write(line);
  }

  async function emitHeader(): Promise<void> {
    const header: ToolCassetteMetaRecord = {
      kind: 'meta',
      version: TOOL_CASSETTE_SCHEMA_CURRENT,
      format: TOOL_CASSETTE_FORMAT,
      createdAt: new Date(now()).toISOString(),
      writer: options.writer,
      sessionId: options.sessionId,
      runId: options.runId,
      minRuntimeVersion,
      ...(options.schemaUrl !== undefined ? { schemaUrl: options.schemaUrl } : {}),
    };
    await sink.write(`${JSON.stringify(header)}\n`);
    headerWritten = true;
  }

  async function writeRecord(record: ToolCassetteRecord): Promise<void> {
    if (closed) {
      throw new TypeError('[graphorin/sessions] cassette writer already closed');
    }
    if (record.kind === 'meta' || record.kind === 'footer') {
      throw new TypeError(
        '[graphorin/sessions] cassette writer owns the meta header + footer; do not pass them via writeRecord(...)',
      );
    }
    if (!headerWritten) await emitHeader();
    if (record.kind === 'tool-call') toolCallCount += 1;
    recordCount += 1;
    await writeLine(`${JSON.stringify(record)}\n`);
  }

  async function close(): Promise<ToolCassetteFooterRecord> {
    if (closed) {
      throw new TypeError('[graphorin/sessions] cassette writer already closed');
    }
    if (!headerWritten) await emitHeader();
    closed = true;
    const footer: ToolCassetteFooterRecord = {
      kind: 'footer',
      recordCount: recordCount + 2, // include header + footer
      toolCallCount,
      writtenAtIso: new Date(now()).toISOString(),
      ...(hashBuilder !== null ? { checksum: `sha256:${hashBuilder.digest('hex')}` } : {}),
      // RP-1: the cassette writer never had a key / encryption pipeline, so it
      // must not stamp a `cipher` it can't honour. The footer type keeps the
      // field readable for forward compatibility; the writer never emits it.
    };
    await sink.write(`${JSON.stringify(footer)}\n`);
    return footer;
  }

  return { writeRecord, close };
}

/**
 * Convenience: a sink that buffers every line into a `string[]`.
 *
 * @stable
 */
export function createCassetteBufferSink(): {
  readonly sink: ToolCassetteSink;
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
