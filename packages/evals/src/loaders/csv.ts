/**
 * CSV dataset loader. Implements RFC 4180 strict subset:
 *
 *  - Comma separator (configurable).
 *  - Optional `"`-quoted cells; doubled `""` to embed a literal `"`.
 *  - Header row required by default.
 *
 * Columns map to `Case` fields by name: `input`, `expected`, `id`,
 * `metadata` (parsed as JSON when present). Unknown columns are
 * ignored unless a `mapper` is supplied.
 *
 * @packageDocumentation
 */

import { readFile } from 'node:fs/promises';

import type { Case, Dataset } from '@graphorin/observability/eval';

/** @stable */
export interface LoadCsvOptions {
  readonly delimiter?: string;
  readonly name?: string;
  readonly description?: string;
  readonly mapper?: (row: Record<string, string>, index: number) => Case<unknown, unknown>;
}

/** @stable */
export async function loadCsvDataset(
  path: string,
  options: LoadCsvOptions = {},
): Promise<Dataset<unknown, unknown>> {
  const text = await readFile(path, 'utf8');
  const cases = parseCsv(text, options);
  const meta: Dataset<unknown, unknown>['metadata'] = {
    ...(options.name !== undefined ? { name: options.name } : {}),
    ...(options.description !== undefined ? { description: options.description } : {}),
    createdAt: new Date(),
  };
  return { cases, metadata: meta };
}

/**
 * Pure parser. Exported separately so tests can exercise the
 * column-mapping behaviour without touching the filesystem.
 *
 * @stable
 */
export function parseCsv(
  text: string,
  options: LoadCsvOptions = {},
): ReadonlyArray<Case<unknown, unknown>> {
  const delimiter = options.delimiter ?? ',';
  const rows = parseCsvRows(text, delimiter);
  if (rows.length === 0) return [];
  const header = rows[0];
  if (header === undefined) return [];
  const dataRows = rows.slice(1);
  const out: Case<unknown, unknown>[] = [];
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i] ?? [];
    if (row.every((cell) => cell.length === 0)) continue;
    const record: Record<string, string> = {};
    for (let c = 0; c < header.length; c++) {
      const key = header[c] ?? '';
      const value = row[c] ?? '';
      record[key] = value;
    }
    if (options.mapper !== undefined) {
      out.push(options.mapper(record, i));
      continue;
    }
    if (record.input === undefined) {
      throw new Error(`[graphorin/evals] CSV row ${i + 1} missing required 'input' column.`);
    }
    const sampleCase: Case<unknown, unknown> = {
      ...(record.id !== undefined && record.id.length > 0 ? { id: record.id } : {}),
      input: record.input,
      ...('expected' in record && record.expected !== undefined && record.expected.length > 0
        ? { expected: record.expected }
        : {}),
      ...(record.metadata !== undefined && record.metadata.length > 0
        ? { metadata: parseMetadata(record.metadata) }
        : {}),
    };
    out.push(sampleCase);
  }
  return out;
}

function parseMetadata(raw: string): Readonly<Record<string, unknown>> {
  try {
    const parsed = JSON.parse(raw);
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Readonly<Record<string, unknown>>;
    }
    return { value: parsed } as Readonly<Record<string, unknown>>;
  } catch {
    return { raw } as Readonly<Record<string, unknown>>;
  }
}

function parseCsvRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1];
        if (next === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === delimiter) {
      current.push(cell);
      cell = '';
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      current.push(cell);
      rows.push(current);
      current = [];
      cell = '';
      continue;
    }
    cell += ch;
  }
  if (cell.length > 0 || current.length > 0) {
    current.push(cell);
    rows.push(current);
  }
  return rows;
}
