/**
 * Cassette recorder. The high-level ergonomic API surfaced by
 * `Session.recordToolCassette({...})`.
 *
 * The recorder owns the JSONL writer + the running counters. RP-2: it is **not**
 * auto-wired into the agent runtime — the operator subscribes to the agent's
 * `RunContext` events and forwards each `tool.execute.end / .error` into
 * `recorder.recordToolCall(...)` (see `examples/multi-agent-crew`). The recorder
 * is a standalone primitive so tests + lower-level callers can drive it directly.
 *
 * @packageDocumentation
 */

import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { sha256OfValue } from './replay.js';
import type {
  CassetteAuditRecord,
  CompactionRecord,
  ModelFallbackRecord,
  ProgressArtifactRefRecord,
  ToolCallRecord,
  ToolCassetteFooterRecord,
  ToolSearchResolvedRecord,
} from './types.js';
import {
  createCassetteBufferSink,
  createToolCassetteWriter,
  type ToolCassetteSink,
  type ToolCassetteWriter,
  type ToolCassetteWriterOptions,
} from './writer.js';

/**
 * Options accepted by {@link createToolCassetteRecorder}.
 *
 * @stable
 */
export interface ToolCassetteRecorderOptions extends ToolCassetteWriterOptions {
  /** When `true`, the recorder copies content-part artifacts. */
  readonly includeArtifacts?: boolean;
  /** Filesystem path the cassette is destined for (used by `flushToFile`). */
  readonly outputPath?: string;
}

/**
 * Surface returned by {@link createToolCassetteRecorder}. The
 * recorder is async-only — every event the runtime drains is a
 * Promise so backpressure does not block the agent loop.
 *
 * @stable
 */
export interface ToolCassetteRecorder {
  /** Record a `tool-call` event. Computes hashes lazily. */
  recordToolCall(
    record: Omit<ToolCallRecord, 'kind' | 'sha256OfArgs' | 'sha256OfOutput'>,
  ): Promise<void>;
  /** Record a `tool-search-resolved` lazy-load event. */
  recordToolSearchResolved(record: Omit<ToolSearchResolvedRecord, 'kind'>): Promise<void>;
  /** Record a `model-fallback` chain advance. */
  recordModelFallback(record: Omit<ModelFallbackRecord, 'kind'>): Promise<void>;
  /** Record a `compaction` event. */
  recordCompaction(record: Omit<CompactionRecord, 'kind'>): Promise<void>;
  /** Record a `progress-artifact-ref` spilled-artifact event. */
  recordProgressArtifactRef(record: Omit<ProgressArtifactRefRecord, 'kind'>): Promise<void>;
  /** Record an `audit` chain segment. */
  recordAuditSegment(record: Omit<CassetteAuditRecord, 'kind'>): Promise<void>;
  /** Close the cassette + return the footer. Idempotent. */
  close(): Promise<ToolCassetteFooterRecord>;
  /**
   * Flush the cassette to the configured `outputPath`. Returns the
   * `{ path, recordCount, sha256 }` summary surfaced to the caller.
   */
  flushToFile(): Promise<{
    readonly path: string;
    readonly recordCount: number;
    readonly sha256: string;
  }>;
  /** Snapshot the buffered cassette body as a single string. */
  toString(): string;
}

/**
 * Build a recorder that buffers every record into memory and flushes
 * to disk on `flushToFile()`. The recorder is intentionally
 * memory-buffered for v0.1; a streaming variant (writes lines to disk
 * as they come in) is a follow-up once the agent runtime lands and
 * we have hard p95-overhead numbers.
 *
 * @stable
 */
export function createToolCassetteRecorder(
  options: ToolCassetteRecorderOptions,
): ToolCassetteRecorder {
  const buffer = createCassetteBufferSink();
  const writer = createToolCassetteWriter(buffer.sink, options);
  let footer: ToolCassetteFooterRecord | null = null;
  const includeArtifacts = options.includeArtifacts === true;
  const artifactCopies: { readonly source: string; readonly target: string }[] = [];

  async function recordToolCall(
    record: Omit<ToolCallRecord, 'kind' | 'sha256OfArgs' | 'sha256OfOutput'>,
  ): Promise<void> {
    const full: ToolCallRecord = {
      ...record,
      kind: 'tool-call',
      sha256OfArgs: sha256OfValue(record.args),
      sha256OfOutput: sha256OfValue(record.output),
    };
    if (
      includeArtifacts &&
      record.contentPartsRefs !== undefined &&
      options.outputPath !== undefined
    ) {
      const targetDir = `${options.outputPath}.artifacts`;
      for (const ref of record.contentPartsRefs) {
        artifactCopies.push({
          source: ref.path,
          target: join(targetDir, basename(ref.path)),
        });
      }
    }
    await writer.writeRecord(full);
  }

  async function recordToolSearchResolved(
    record: Omit<ToolSearchResolvedRecord, 'kind'>,
  ): Promise<void> {
    await writer.writeRecord({ ...record, kind: 'tool-search-resolved' });
  }

  async function recordModelFallback(record: Omit<ModelFallbackRecord, 'kind'>): Promise<void> {
    await writer.writeRecord({ ...record, kind: 'model-fallback' });
  }

  async function recordCompaction(record: Omit<CompactionRecord, 'kind'>): Promise<void> {
    await writer.writeRecord({ ...record, kind: 'compaction' });
  }

  async function recordProgressArtifactRef(
    record: Omit<ProgressArtifactRefRecord, 'kind'>,
  ): Promise<void> {
    await writer.writeRecord({ ...record, kind: 'progress-artifact-ref' });
  }

  async function recordAuditSegment(record: Omit<CassetteAuditRecord, 'kind'>): Promise<void> {
    await writer.writeRecord({ ...record, kind: 'audit' });
  }

  async function close(): Promise<ToolCassetteFooterRecord> {
    if (footer !== null) return footer;
    footer = await writer.close();
    return footer;
  }

  async function flushToFile(): Promise<{
    readonly path: string;
    readonly recordCount: number;
    readonly sha256: string;
  }> {
    if (options.outputPath === undefined) {
      throw new TypeError(
        '[graphorin/sessions] flushToFile() requires `outputPath` on createToolCassetteRecorder({...})',
      );
    }
    if (footer === null) await close();
    const body = buffer.toString();
    await mkdir(dirname(options.outputPath), { recursive: true });
    await writeFile(options.outputPath, body, 'utf8');
    if (artifactCopies.length > 0) {
      const targetDir = `${options.outputPath}.artifacts`;
      await mkdir(targetDir, { recursive: true });
      for (const copy of artifactCopies) {
        try {
          await copyFile(copy.source, copy.target);
        } catch {
          // The recorder is best-effort on artifact copying; missing
          // sources surface as missing-artifact errors at replay time
          // via the `onMissingArtifact` policy.
        }
      }
    }
    return {
      path: options.outputPath,
      recordCount: footer?.recordCount ?? 0,
      sha256: sha256OfValue(body),
    };
  }

  return {
    recordToolCall,
    recordToolSearchResolved,
    recordModelFallback,
    recordCompaction,
    recordProgressArtifactRef,
    recordAuditSegment,
    close,
    flushToFile,
    toString() {
      return buffer.toString();
    },
  };
}

export type { ToolCassetteSink, ToolCassetteWriter };
