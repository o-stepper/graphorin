/**
 * Session-level replay engine. Composes:
 *
 *  - The trace-log replay primitive from `@graphorin/observability`
 *    (sanitized-by-default + audit + scope check).
 *  - The cassette decision engine from `../cassette/replay.ts`
 *    (substitution-vs-live decisions per `sideEffectClass`).
 *
 * The actual provider re-invocation + tool re-execution is driven by
 * the agent runtime (`@graphorin/agent`); this layer owns the
 * **decision + event-stream surface** so callers can plug it together
 * with their own runtime under tests.
 *
 * @packageDocumentation
 */

import { stat } from 'node:fs/promises';
import type { Sensitivity } from '@graphorin/core';
import type { SpanRecord } from '@graphorin/observability/exporters';
import {
  createReplay,
  type Replay,
  type ReplayAuditBridge,
  type ReplayAuditEvent,
  type ReplayEvent,
  type ReplayMode,
  type ReplayRunInput,
} from '@graphorin/observability/replay';
import { readToolCassette } from '../cassette/reader.js';
import { type CassetteReplayDecision, decideToolReplay } from '../cassette/replay.js';
import type { ToolCallRecord, ToolCassetteSource, ToolReplayMode } from '../cassette/types.js';
import { CassetteArtifactMissingError, ReplayAccessDeniedError } from '../errors/index.js';
import type { SessionReplayEvent, SessionReplayOptions } from './types.js';

/**
 * Options accepted by {@link createSessionReplayer}.
 *
 * @stable
 */
export interface CreateSessionReplayerOptions {
  /** Underlying observability replay primitive. */
  readonly observability?: Replay;
  /** Audit bridge that fires once per replay invocation. */
  readonly audit?: ReplayAuditBridge;
  /** Default actor reported via `audit.actor` when none is supplied. */
  readonly defaultActor?: ReplayAuditEvent['actor'];
  /**
   * Scope check invoked when the caller asks for `raw: true`. Returns
   * `true` to allow, `false` to deny (the engine throws
   * {@link ReplayAccessDeniedError} on `false`).
   */
  readonly canReadRaw?: (context: { readonly target: string }) => boolean;
}

/**
 * Convenience surface returned by {@link createSessionReplayer}. The
 * replayer is async-iterable; the agent runtime drives it under
 * `for await`.
 *
 * @stable
 */
export interface SessionReplayer {
  /**
   * Run the replay engine. The caller threads in:
   *  - `traceSource`: an iterable of `SpanRecord`s (from the
   *    observability trace log).
   *  - `target`: e.g. `'session:<id>'`.
   *  - `liveInvocation(record)`: a callback the engine invokes for
   *    every cassette `tool-call` record so the runtime can supply
   *    the live `args` + the `idempotencyKey` callback output. The
   *    callback returns the live invocation surface; when omitted,
   *    the engine treats the recorded args as the live args.
   */
  run(
    options: SessionReplayOptions & {
      readonly target: string;
      readonly traceSource?: AsyncIterable<SpanRecord> | Iterable<SpanRecord>;
      readonly liveInvocation?: (record: ToolCallRecord) => Promise<{
        readonly args: unknown;
        readonly idempotencyKey?: string;
        readonly validateRecordedOutput?: (output: unknown) => string | null;
      }>;
    },
  ): AsyncIterable<SessionReplayEvent>;
}

/**
 * Build a session-level replayer.
 *
 * @stable
 */
export function createSessionReplayer(opts: CreateSessionReplayerOptions = {}): SessionReplayer {
  const observability =
    opts.observability ??
    createReplay({
      ...(opts.audit !== undefined ? { audit: opts.audit } : {}),
      ...(opts.defaultActor !== undefined ? { defaultActor: opts.defaultActor } : {}),
      ...(opts.canReadRaw !== undefined ? { canReadRaw: opts.canReadRaw } : {}),
    });
  const canReadRaw = opts.canReadRaw ?? (() => true);

  return {
    async *run(input): AsyncIterable<SessionReplayEvent> {
      const raw = input.raw === true;
      if (raw && !canReadRaw({ target: input.target })) {
        throw new ReplayAccessDeniedError(input.target);
      }
      const mode: ReplayMode = raw ? 'raw' : 'sanitized';
      const minSensitivity: Sensitivity = input.minSensitivity ?? 'public';
      const traceSource = input.traceSource ?? emptySource;
      const runInput: ReplayRunInput = {
        source: traceSource,
        target: input.target,
        mode,
        minSensitivity,
        ...(input.fromMessageId !== undefined ? { fromSpanId: input.fromMessageId } : {}),
        ...(input.actor !== undefined
          ? {
              actor: { kind: input.actor.kind, id: input.actor.id },
            }
          : {}),
      };
      const traceIter = observability.run(runInput)[Symbol.asyncIterator]();
      try {
        while (true) {
          const next = await traceIter.next();
          if (next.done === true) break;
          yield next.value as ReplayEvent;
        }
      } finally {
        if (traceIter.return !== undefined) {
          try {
            await traceIter.return(undefined);
          } catch {
            // ignore; the upstream replay primitive already cleaned up.
          }
        }
      }
      // Cassette events are produced AFTER the trace replay completes
      // so the consumer sees the deterministic sequence:
      //   replay.start → replay.event* → replay.end → cassette.*.
      if (input.cassette !== undefined) {
        const replayMode: ToolReplayMode = input.toolReplayMode ?? 'auto';
        const records = await collectCassetteRecords(input.cassette);
        const onMissingArtifact = input.onMissingArtifact ?? 'abort';
        for (const record of records) {
          // RP-3: when the record's content parts are referenced on disk (not
          // inlined), the artifacts must exist before we substitute the
          // recorded output. A moved / deleted artifact is honoured per
          // `onMissingArtifact`: 'abort' throws, 'fallback-live' surfaces a
          // decision so the caller re-runs the tool live.
          const missingArtifact =
            record.contentParts === undefined ? await firstMissingArtifact(record) : null;
          if (missingArtifact !== null) {
            if (onMissingArtifact === 'abort') {
              throw new CassetteArtifactMissingError(record.toolName, missingArtifact);
            }
            yield {
              type: 'tool.cassette.replay.artifact-missing',
              toolName: record.toolName,
              toolCallId: record.toolCallId,
              stepNumber: record.stepNumber,
              missingArtifactPath: missingArtifact,
              decision: 'fallback-live',
            };
            continue;
          }
          const live = (await (input.liveInvocation?.(record) ??
            Promise.resolve({ args: record.args }))) as {
            readonly args: unknown;
            readonly idempotencyKey?: string;
            readonly validateRecordedOutput?: (output: unknown) => string | null;
          };
          const decision: CassetteReplayDecision = decideToolReplay(
            record,
            {
              toolName: record.toolName,
              args: live.args,
              ...(live.idempotencyKey !== undefined ? { idempotencyKey: live.idempotencyKey } : {}),
              ...(live.validateRecordedOutput !== undefined
                ? { validateRecordedOutput: live.validateRecordedOutput }
                : {}),
            },
            {
              mode: replayMode,
              ...(input.perToolMode !== undefined ? { perToolMode: input.perToolMode } : {}),
              ...(input.failOnIdempotencyMismatch !== undefined
                ? { failOnIdempotencyMismatch: input.failOnIdempotencyMismatch }
                : {}),
              ...(input.failOnSchemaMismatch !== undefined
                ? { failOnSchemaMismatch: input.failOnSchemaMismatch }
                : {}),
            },
          );
          yield decision;
        }
      }
    },
  };
}

const emptySource: AsyncIterable<SpanRecord> = {
  async *[Symbol.asyncIterator](): AsyncIterator<SpanRecord> {
    // empty
  },
};

/**
 * RP-3: stat each referenced artifact for a tool-call record; return the first
 * path that cannot be opened, or `null` when every reference resolves (or the
 * record references none).
 */
async function firstMissingArtifact(record: ToolCallRecord): Promise<string | null> {
  if (record.contentPartsRefs === undefined) return null;
  for (const ref of record.contentPartsRefs) {
    try {
      await stat(ref.path);
    } catch {
      return ref.path;
    }
  }
  return null;
}

async function collectCassetteRecords(
  source: ToolCassetteSource,
): Promise<ReadonlyArray<ToolCallRecord>> {
  if (source.kind === 'inline') {
    return source.records.filter((r): r is ToolCallRecord => r.kind === 'tool-call');
  }
  if (source.kind === 'stream') {
    const collected: ToolCallRecord[] = [];
    for await (const record of source.stream) {
      if (record.kind === 'tool-call') collected.push(record);
    }
    return collected;
  }
  // file
  const { readFile } = await import('node:fs/promises');
  const body = await readFile(source.path, 'utf8');
  const parsed = readToolCassette(body);
  return parsed.toolCalls;
}
