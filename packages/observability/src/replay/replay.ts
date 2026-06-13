/**
 * `createReplay(...)` — sanitized-by-default replay primitives.
 *
 * Replay never opens the underlying file directly; callers feed it an
 * iterable of `SpanRecord`s. The {@link createTraceLogReader} helper
 * (file-backed JSONL) and `getTraceLog(...)` aggregate utility live
 * alongside this module.
 *
 * @packageDocumentation
 */

import type { Sensitivity } from '@graphorin/core';

import type { SpanRecord } from '../exporters/types.js';
import { sanitizeRecord } from '../exporters/with-validation.js';
import type { RedactionValidatorInstance } from '../redaction/types.js';
import { compareSensitivityTiers, createRedactionValidator } from '../redaction/validator.js';

import type {
  ReplayAuditBridge,
  ReplayAuditEvent,
  ReplayEvent,
  ReplayOptions,
  ReplayRunInput,
} from './types.js';

const DEFAULT_VALIDATOR = createRedactionValidator({ minTier: 'public' });
const DEFAULT_ACTOR: ReplayAuditEvent['actor'] = { kind: 'system', id: 'in-process' };

/**
 * @stable
 */
export interface Replay {
  run(input: ReplayRunInput): AsyncIterable<ReplayEvent>;
}

/**
 * Build a replay primitive. The returned object exposes a single
 * `run(...)` async iterator that yields {@link ReplayEvent} records.
 *
 * Sanitized mode is the default and applies the configured
 * {@link RedactionValidatorInstance} to every record. Raw mode
 * requires the `canReadRaw` callback to return `true` AND emits an
 * audit log entry on every invocation.
 *
 * @stable
 */
export function createReplay(opts: ReplayOptions = {}): Replay {
  const validator: RedactionValidatorInstance = opts.validator ?? DEFAULT_VALIDATOR;
  const audit: ReplayAuditBridge | undefined = opts.audit;
  const defaultActor = opts.defaultActor ?? DEFAULT_ACTOR;
  const canReadRaw = opts.canReadRaw ?? (() => true);

  return {
    async *run(input: ReplayRunInput): AsyncIterable<ReplayEvent> {
      const mode = input.mode ?? 'sanitized';
      const minSensitivity: Sensitivity = input.minSensitivity ?? 'public';
      const actor = input.actor ?? defaultActor;
      const start = Date.now();

      if (mode === 'raw' && !canReadRaw({ target: input.target })) {
        emitAudit(audit, {
          action: 'trace.replay.accessed',
          actor,
          target: input.target,
          decision: 'denied',
          metadata: { mode, minSensitivity, eventCount: 0, durationMs: Date.now() - start },
        });
        yield { type: 'replay.start', target: input.target, mode };
        yield { type: 'replay.skipped', reason: 'access-denied', spanId: input.target };
        yield {
          type: 'replay.end',
          durationMs: Date.now() - start,
          eventsEmitted: 0,
          eventsSkipped: 1,
        };
        return;
      }

      let emitted = 0;
      let skipped = 0;
      let started = false;
      let reachedFrom = input.fromSpanId === undefined;

      const iterator = isAsyncIterable(input.source)
        ? input.source[Symbol.asyncIterator]()
        : asAsync(input.source[Symbol.iterator]());

      try {
        while (true) {
          const next = await iterator.next();
          if (next.done === true) break;
          const record = next.value;

          if (!started) {
            started = true;
            yield { type: 'replay.start', target: input.target, mode };
          }

          if (!reachedFrom) {
            if (record.id === input.fromSpanId) reachedFrom = true;
            else continue;
          }

          if (mode === 'raw') {
            yield { type: 'replay.event', span: record, sanitized: false };
            emitted += 1;
            continue;
          }

          if (skipBySensitivity(record, minSensitivity)) {
            skipped += 1;
            yield { type: 'replay.skipped', reason: 'sensitivity', spanId: record.id };
            continue;
          }

          const sanitized = sanitizeRecord(record, validator);
          // RP-18: sanitization is attribute-granular and never drops the whole
          // span. A record arrives pre-flagged with `droppedReason` only if an
          // upstream stage marked it; honour that, otherwise replay the
          // stripped span.
          if (sanitized.droppedReason !== undefined) {
            skipped += 1;
            yield {
              type: 'replay.skipped',
              reason: 'redaction-violation',
              spanId: record.id,
            };
            continue;
          }

          yield { type: 'replay.event', span: sanitized, sanitized: true };
          emitted += 1;
        }
      } finally {
        const durationMs = Date.now() - start;
        if (!started) {
          yield { type: 'replay.start', target: input.target, mode };
        }
        emitAudit(audit, {
          action: 'trace.replay.accessed',
          actor,
          target: input.target,
          decision: 'success',
          metadata: {
            mode,
            minSensitivity,
            ...(input.fromSpanId === undefined ? {} : { fromSpanId: input.fromSpanId }),
            eventCount: emitted,
            durationMs,
          },
        });
        yield {
          type: 'replay.end',
          durationMs,
          eventsEmitted: emitted,
          eventsSkipped: skipped,
        };
      }
    },
  };
}

function emitAudit(bridge: ReplayAuditBridge | undefined, event: ReplayAuditEvent): void {
  if (bridge === undefined) return;
  try {
    bridge.emit(event);
  } catch {
    // Audit listener errors must never break the replay pipeline.
  }
}

function skipBySensitivity(record: SpanRecord, floor: Sensitivity): boolean {
  if (record.sensitivityByAttribute === undefined) return false;
  for (const value of Object.values(record.sensitivityByAttribute)) {
    if (typeof value === 'string') {
      const tier = value as Sensitivity;
      if (tier === 'public' || tier === 'internal' || tier === 'secret') {
        if (compareSensitivityTiers(tier, floor) > 0) return true;
      }
    }
  }
  return false;
}

function isAsyncIterable<T>(value: unknown): value is AsyncIterable<T> {
  return value !== null && typeof value === 'object' && Symbol.asyncIterator in (value as object);
}

function asAsync<T>(it: Iterator<T>): AsyncIterator<T> {
  return {
    next(): Promise<IteratorResult<T>> {
      return Promise.resolve(it.next());
    },
  };
}
