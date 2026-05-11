/**
 * JSONL dataset loader. Each line is a JSON object with `input` and
 * optional `expected` / `metadata` / `id` fields.
 *
 * @packageDocumentation
 */

import { readFile } from 'node:fs/promises';

import type { Case, Dataset } from '@graphorin/observability/eval';

/** @stable */
export interface LoadJsonlOptions {
  /** Optional dataset name surfaced in `Dataset.metadata.name`. */
  readonly name?: string;
  /** Optional description surfaced in `Dataset.metadata.description`. */
  readonly description?: string;
  /**
   * Map a parsed line into a `Case`. Default forwards the line
   * verbatim. Override to translate column names or coerce types.
   */
  readonly mapper?: (line: Record<string, unknown>, index: number) => Case<unknown, unknown>;
}

/**
 * Read a JSONL file and return a fully-materialised {@link Dataset}.
 * Empty lines are skipped; malformed lines throw with the line
 * number.
 *
 * @stable
 */
export async function loadJsonlDataset(
  path: string,
  options: LoadJsonlOptions = {},
): Promise<Dataset<unknown, unknown>> {
  const text = await readFile(path, 'utf8');
  const cases = parseJsonl(text, options.mapper);
  const meta: Dataset<unknown, unknown>['metadata'] = {
    ...(options.name !== undefined ? { name: options.name } : {}),
    ...(options.description !== undefined ? { description: options.description } : {}),
    createdAt: new Date(),
  };
  return { cases, metadata: meta };
}

/**
 * Pure parser. Exported separately so tests can exercise the line-by-
 * line behaviour without touching the filesystem.
 *
 * @stable
 */
export function parseJsonl(
  text: string,
  mapper?: LoadJsonlOptions['mapper'],
): ReadonlyArray<Case<unknown, unknown>> {
  const out: Case<unknown, unknown>[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? '';
    if (raw.trim().length === 0) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(
        `[graphorin/evals] failed to parse JSONL at line ${i + 1}: ${(err as Error).message}`,
        { cause: err },
      );
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(
        `[graphorin/evals] JSONL line ${i + 1} must be a JSON object, got ${typeof parsed}.`,
      );
    }
    const obj = parsed as Record<string, unknown>;
    const mapped = mapper !== undefined ? mapper(obj, i) : defaultMapper(obj, i);
    out.push(mapped);
  }
  return out;
}

function defaultMapper(line: Record<string, unknown>, _index: number): Case<unknown, unknown> {
  if (!('input' in line)) {
    throw new Error(`[graphorin/evals] JSONL row missing required 'input' field.`);
  }
  return {
    ...(typeof line.id === 'string' ? { id: line.id } : {}),
    input: line.input,
    ...('expected' in line ? { expected: line.expected } : {}),
    ...(line.metadata !== undefined && typeof line.metadata === 'object' && line.metadata !== null
      ? { metadata: line.metadata as Readonly<Record<string, unknown>> }
      : {}),
  };
}
