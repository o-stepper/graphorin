/**
 * Structured progress-artifact IO. Persists UTF-8 text artifacts
 * under `<artifactRoot>/<runId>/progress/<role>.<seqPadded>.txt`
 * via atomic-write `.tmp + rename` discipline.
 *
 * Cross-session continuity flow:
 *
 * 1. The current agent calls `agent.progress.write(content)` —
 *    runtime persists the file and queues the
 *    `agent.progress.written` event (drained into the active or
 *    next consumed stream).
 * 2. A sibling / future agent calls
 *    `agent.progress.read({ runId: priorRunId })` — runtime
 *    discovers existing files (no implicit auto-discovery; the
 *    operator must supply the `runId` cursor).
 *
 * Auto-discovery across runs is deferred to v0.2.
 *
 * @packageDocumentation
 */

import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ProgressArtifactRef, Sensitivity } from '@graphorin/core';
import { ProgressWriteError } from '../errors/index.js';

const DEFAULT_ARTIFACT_DIR = 'graphorin-progress';
const SEQ_PAD_WIDTH = 3;

/**
 * Optional configuration accepted by {@link createProgressIO}.
 *
 * @stable
 */
export interface ProgressIOConfig {
  /** Filesystem root under which `<runId>/progress/<role>.<seq>.txt` files live. */
  readonly artifactRoot?: string;
  /** Default `Sensitivity` applied when the caller does not override. */
  readonly defaultSensitivity?: Sensitivity;
  /** Optional redaction transform applied to content before write. */
  readonly redact?: (content: string) => string;
}

/**
 * Per-call options for {@link ProgressIO.write}.
 *
 * @stable
 */
export interface ProgressWriteOptions {
  readonly role?: string;
  /** Explicit sequence number; default auto-increments per `(runId, role)`. */
  readonly seq?: number;
  readonly sensitivity?: Sensitivity;
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Per-call options for {@link ProgressIO.read}.
 *
 * @stable
 */
export interface ProgressReadOptions {
  readonly runId?: string;
  readonly role?: string;
  /** Skip artifacts whose `seq <= sinceSeq`. */
  readonly sinceSeq?: number;
  /** Default `100`. */
  readonly maxArtifacts?: number;
}

/**
 * Public surface returned by {@link createProgressIO}. Used by the
 * agent runtime to back `agent.progress.write / read`.
 *
 * @stable
 */
export interface ProgressIO {
  write(
    runId: string,
    content: string,
    options?: ProgressWriteOptions,
  ): Promise<ProgressArtifactRef>;
  read(
    currentRunId: string,
    options?: ProgressReadOptions,
  ): Promise<ReadonlyArray<ProgressArtifactRef>>;
  rootFor(runId: string): string;
}

interface InternalSeqState {
  next: number;
}

const seqWidth = (n: number): string => String(n).padStart(SEQ_PAD_WIDTH, '0');

const sha256Hex = (input: string): string =>
  createHash('sha256').update(input, 'utf8').digest('hex');

/**
 * Build a {@link ProgressIO} bound to a particular artifact root.
 *
 * @stable
 */
export function createProgressIO(config: ProgressIOConfig = {}): ProgressIO {
  const root = config.artifactRoot ?? join(tmpdir(), DEFAULT_ARTIFACT_DIR);
  const defaultSensitivity: Sensitivity = config.defaultSensitivity ?? 'internal';
  const redact: (s: string) => string = config.redact ?? ((s) => s);
  const seqState = new Map<string, InternalSeqState>();

  const directoryFor = (runId: string): string => join(root, runId, 'progress');

  const seqKey = (runId: string, role: string): string => `${runId}::${role}`;

  const ensureSeqState = async (runId: string, role: string): Promise<InternalSeqState> => {
    const key = seqKey(runId, role);
    let state = seqState.get(key);
    if (state !== undefined) return state;
    state = { next: 1 };
    try {
      const dir = directoryFor(runId);
      const entries = await readdir(dir);
      let max = 0;
      const prefix = `${role}.`;
      for (const entry of entries) {
        if (!entry.startsWith(prefix) || !entry.endsWith('.txt')) continue;
        const seqStr = entry.slice(prefix.length, entry.length - 4);
        const n = Number(seqStr);
        if (Number.isFinite(n) && n > max) max = n;
      }
      state.next = max + 1;
    } catch {
      // Directory does not exist yet — first write will create it.
    }
    seqState.set(key, state);
    return state;
  };

  const write = async (
    runId: string,
    rawContent: string,
    options: ProgressWriteOptions = {},
  ): Promise<ProgressArtifactRef> => {
    const role = options.role ?? 'agent';
    const sensitivity = options.sensitivity ?? defaultSensitivity;
    const tags = options.tags ?? [];
    const seqSource = await ensureSeqState(runId, role);
    const seq = options.seq ?? seqSource.next;
    seqSource.next = Math.max(seqSource.next, seq + 1);

    const content = redact(rawContent);
    const dir = directoryFor(runId);
    const filename = `${role}.${seqWidth(seq)}.txt`;
    const finalPath = join(dir, filename);
    const tmpPath = `${finalPath}.tmp`;

    try {
      await mkdir(dir, { recursive: true });
      await writeFile(tmpPath, content, { encoding: 'utf8' });
      await rename(tmpPath, finalPath);
    } catch (cause) {
      try {
        await unlink(tmpPath);
      } catch {
        // Best-effort cleanup; the write error is the operator-facing signal.
      }
      throw new ProgressWriteError(finalPath, cause);
    }

    const stats = await stat(finalPath);
    const sha256 = sha256Hex(content);
    return {
      path: finalPath,
      role,
      seq,
      sizeBytes: stats.size,
      sensitivity,
      ...(tags.length > 0 ? { tags } : {}),
      writtenAtIso: new Date().toISOString(),
      sha256,
    };
  };

  const read = async (
    currentRunId: string,
    options: ProgressReadOptions = {},
  ): Promise<ReadonlyArray<ProgressArtifactRef>> => {
    const runId = options.runId ?? currentRunId;
    const max = options.maxArtifacts ?? 100;
    const sinceSeq = options.sinceSeq ?? 0;
    const dir = directoryFor(runId);
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      return [];
    }
    const out: ProgressArtifactRef[] = [];
    const role = options.role;
    for (const entry of entries) {
      if (!entry.endsWith('.txt')) continue;
      const dot = entry.indexOf('.');
      if (dot < 0) continue;
      const entryRole = entry.slice(0, dot);
      const seqStr = entry.slice(dot + 1, entry.length - 4);
      const seq = Number(seqStr);
      if (!Number.isFinite(seq)) continue;
      if (role !== undefined && entryRole !== role) continue;
      if (seq <= sinceSeq) continue;
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);
      const content = await readFile(fullPath, { encoding: 'utf8' });
      const sha256 = sha256Hex(content);
      out.push({
        path: fullPath,
        role: entryRole,
        seq,
        sizeBytes: stats.size,
        sensitivity: 'internal',
        writtenAtIso: stats.mtime.toISOString(),
        sha256,
      });
      if (out.length >= max) break;
    }
    out.sort((a, b) => {
      if (a.role !== b.role) return a.role.localeCompare(b.role);
      return a.seq - b.seq;
    });
    return out;
  };

  return {
    write,
    read,
    rootFor: (runId) => directoryFor(runId),
  };
}
