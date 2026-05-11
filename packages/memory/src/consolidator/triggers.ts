/**
 * Trigger spec parser. Translates the human-friendly
 * `'turn:N'` / `'idle:Xm'` / `'cron:EXPR'` / `'event:NAME'` /
 * `'budget:N'` declarations into the runtime structure used by the
 * consolidator.
 *
 * The parser is exhaustive: every shape recognised here must be
 * matched in {@link parseTriggerSpec}; unrecognised shapes throw a
 * `TypeError` so misconfigured triggers fail at registration time
 * rather than silently never firing.
 *
 * @packageDocumentation
 */

import type { ConsolidatorTriggerReason, ConsolidatorTriggerSpec } from './types.js';

/**
 * Parsed trigger declaration. The `kind` discriminator drives the
 * runtime dispatch; the `value` carries the spec-specific argument
 * already converted to a `number` (turns / millis / threshold) or a
 * string (cron expr / event name).
 *
 * @stable
 */
export type ParsedTrigger =
  | { readonly kind: 'turn'; readonly count: number; readonly raw: string }
  | { readonly kind: 'idle'; readonly idleMs: number; readonly raw: string }
  | { readonly kind: 'cron'; readonly expression: string; readonly raw: string }
  | { readonly kind: 'event'; readonly name: string; readonly raw: string }
  | { readonly kind: 'budget'; readonly threshold: number; readonly raw: string };

const IDLE_PATTERN = /^(\d+(?:\.\d+)?)(ms|s|m|h)?$/u;

/** Parse a {@link ConsolidatorTriggerSpec} into a {@link ParsedTrigger}. */
export function parseTriggerSpec(spec: ConsolidatorTriggerSpec): ParsedTrigger {
  if (typeof spec !== 'string' || spec.length === 0) {
    throw new TypeError(
      `[graphorin/memory] consolidator trigger spec must be a non-empty string, got ${typeof spec}`,
    );
  }
  const colon = spec.indexOf(':');
  if (colon < 0) {
    throw new TypeError(
      `[graphorin/memory] invalid trigger spec '${spec}' — expected 'kind:value'`,
    );
  }
  const kind = spec.slice(0, colon);
  const value = spec.slice(colon + 1);

  switch (kind) {
    case 'turn': {
      const count = Number.parseInt(value, 10);
      if (!Number.isFinite(count) || count <= 0) {
        throw new TypeError(
          `[graphorin/memory] invalid turn trigger '${spec}' — expected positive integer`,
        );
      }
      return { kind: 'turn', count, raw: spec };
    }
    case 'idle': {
      const match = IDLE_PATTERN.exec(value);
      if (match === null) {
        throw new TypeError(
          `[graphorin/memory] invalid idle trigger '${spec}' — expected '5m' / '30s' / '1h'`,
        );
      }
      const num = Number.parseFloat(match[1] ?? 'NaN');
      const unit = match[2] ?? 'ms';
      const idleMs = toMs(num, unit);
      if (!Number.isFinite(idleMs) || idleMs <= 0) {
        throw new TypeError(
          `[graphorin/memory] invalid idle trigger '${spec}' — non-positive duration`,
        );
      }
      return { kind: 'idle', idleMs, raw: spec };
    }
    case 'cron': {
      if (value.trim().length === 0) {
        throw new TypeError(`[graphorin/memory] invalid cron trigger '${spec}' — empty expression`);
      }
      return { kind: 'cron', expression: value, raw: spec };
    }
    case 'event': {
      if (value.length === 0) {
        throw new TypeError(
          `[graphorin/memory] invalid event trigger '${spec}' — empty event name`,
        );
      }
      return { kind: 'event', name: value, raw: spec };
    }
    case 'budget': {
      const threshold = Number.parseFloat(value);
      if (!Number.isFinite(threshold) || threshold <= 0 || threshold >= 1) {
        throw new TypeError(
          `[graphorin/memory] invalid budget trigger '${spec}' — expected fraction between 0 and 1`,
        );
      }
      return { kind: 'budget', threshold, raw: spec };
    }
    default:
      throw new TypeError(`[graphorin/memory] unknown consolidator trigger kind '${kind}'`);
  }
}

/** Build a {@link ConsolidatorTriggerReason} from a parsed trigger. */
export function reasonFromTrigger(trigger: ParsedTrigger): ConsolidatorTriggerReason {
  switch (trigger.kind) {
    case 'turn':
      return { kind: 'turn', value: trigger.count };
    case 'idle':
      return { kind: 'idle', value: trigger.raw };
    case 'cron':
      return { kind: 'cron', value: trigger.expression };
    case 'event':
      return { kind: 'event', value: trigger.name };
    case 'budget':
      return { kind: 'budget', value: trigger.threshold };
  }
}

function toMs(value: number, unit: string): number {
  switch (unit) {
    case 'ms':
      return value;
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    default:
      return Number.NaN;
  }
}
