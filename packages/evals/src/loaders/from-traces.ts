/**
 * `loadDatasetFromTraces` — distil a dataset from the framework's
 * replay log. The caller supplies the JSONL replay file and a small
 * extraction function that pulls the `(input, output)` pair out of
 * each event group; the loader handles the JSONL parsing + grouping
 * by `runId`.
 *
 * @packageDocumentation
 */

import { readFile } from 'node:fs/promises';

import type { Case, Dataset } from '@graphorin/observability/eval';

/** @stable */
export interface TraceEvent {
  readonly runId: string;
  readonly type: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly timestamp?: string;
}

/** @stable */
export interface FromTracesOptions<I, O> {
  /** Distil one `Case<I, O>` from every group of events sharing a `runId`. */
  readonly extract: (events: ReadonlyArray<TraceEvent>) => Case<I, O> | null;
  /** Optional name surfaced in `Dataset.metadata.name`. */
  readonly name?: string;
  /** Optional description surfaced in `Dataset.metadata.description`. */
  readonly description?: string;
}

/** @stable */
export async function loadDatasetFromTraces<I, O>(
  path: string,
  options: FromTracesOptions<I, O>,
): Promise<Dataset<I, O>> {
  const text = await readFile(path, 'utf8');
  return groupAndExtract<I, O>(text, options);
}

/**
 * Pure parser for the trace JSONL format. Exported so tests can
 * exercise the extraction without touching the filesystem.
 *
 * @stable
 */
export function groupAndExtract<I, O>(
  text: string,
  options: FromTracesOptions<I, O>,
): Dataset<I, O> {
  const lines = text.split(/\r?\n/);
  const groups = new Map<string, TraceEvent[]>();
  for (const raw of lines) {
    if (raw.trim().length === 0) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) continue;
    const obj = parsed as Record<string, unknown>;
    const runId = typeof obj.runId === 'string' ? obj.runId : null;
    const type = typeof obj.type === 'string' ? obj.type : null;
    if (runId === null || type === null) continue;
    const payload =
      obj.payload !== null && typeof obj.payload === 'object' && !Array.isArray(obj.payload)
        ? (obj.payload as Readonly<Record<string, unknown>>)
        : ({} as Readonly<Record<string, unknown>>);
    const event: TraceEvent = {
      runId,
      type,
      payload,
      ...(typeof obj.timestamp === 'string' ? { timestamp: obj.timestamp } : {}),
    };
    const existing = groups.get(runId);
    if (existing === undefined) groups.set(runId, [event]);
    else existing.push(event);
  }
  const cases: Case<I, O>[] = [];
  for (const events of groups.values()) {
    const sample = options.extract(events);
    if (sample !== null) cases.push(sample);
  }
  const meta: Dataset<I, O>['metadata'] = {
    ...(options.name !== undefined ? { name: options.name } : {}),
    ...(options.description !== undefined ? { description: options.description } : {}),
    createdAt: new Date(),
  };
  return { cases, metadata: meta };
}
