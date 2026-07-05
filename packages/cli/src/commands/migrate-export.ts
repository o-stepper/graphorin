/**
 * `graphorin migrate-export <input> --to-schema <X.Y>` - schema-version
 * migration for `graphorin-session-export/N.N` JSONL files (DEC-155 /
 * ADR-042).
 *
 * The exporter ships schema 1.0 in v0.1; the migrator's main job today
 * is to validate that the supplied input file is a well-formed session
 * export with a schema in the framework's N-2 backwards-compat band
 * and to round-trip the records through the writer with the desired
 * target schema. When the runtime reaches MAJOR 2.x / 3.x the
 * migrator extends the per-record transforms in place.
 *
 * The output path is required (`--to <file>`); the helper never
 * overwrites the input.
 *
 * @packageDocumentation
 */

import { readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import process from 'node:process';

import {
  createBufferSink,
  createSessionExportWriter,
  readSessionExport,
  SESSION_EXPORT_SCHEMA_CURRENT,
  type SessionExportRecord,
} from '@graphorin/sessions';

import { EXIT_CODES } from '../internal/exit.js';
import {
  brand,
  type CommonOutputOptions,
  defaultPrintSink,
  emitReport,
  statusMarker,
} from '../internal/output.js';

/** @stable */
export interface MigrateExportOptions extends CommonOutputOptions {
  readonly input: string;
  readonly to: string;
  /** Defaults to the writer's current schema (e.g. `'1.0'`). */
  readonly toSchema?: string;
  /** Surfaced on the meta header. Defaults to `'graphorin-cli@0.6.0'`. */
  readonly writer?: string;
}

/** @stable */
export interface MigrateExportResult {
  readonly input: string;
  readonly output: string;
  readonly schemaIn: string;
  readonly schemaOut: string;
  readonly records: number;
}

/** @stable */
export async function runMigrateExport(
  options: MigrateExportOptions,
): Promise<MigrateExportResult> {
  const cwd = process.cwd();
  const inputPath = isAbsolute(options.input) ? options.input : resolve(cwd, options.input);
  const outputPath = isAbsolute(options.to) ? options.to : resolve(cwd, options.to);
  const targetSchema = options.toSchema ?? SESSION_EXPORT_SCHEMA_CURRENT;

  if (inputPath === outputPath) {
    throw new Error(
      `[graphorin/cli] migrate-export refuses to overwrite the input file '${inputPath}'.`,
    );
  }
  if (targetSchema !== SESSION_EXPORT_SCHEMA_CURRENT) {
    const print = options.print ?? defaultPrintSink;
    print(
      brand(
        `requested target schema '${targetSchema}' is not the writer's current schema (${SESSION_EXPORT_SCHEMA_CURRENT}); v0.1 supports the current schema only.`,
      ),
    );
    process.exit(EXIT_CODES.UNSUPPORTED);
  }

  const raw = await readFile(inputPath, 'utf8');
  const parsed = readSessionExport(raw);

  const buffer = createBufferSink();
  const writer = createSessionExportWriter(buffer.sink, {
    writer: options.writer ?? 'graphorin-cli@0.6.0',
    ...(parsed.meta.embedderIds !== undefined ? { embedderIds: parsed.meta.embedderIds } : {}),
  });
  for (const record of parsed.records) {
    if (record.kind === 'unknown') continue;
    await writer.writeRecord(record as SessionExportRecord);
  }
  await writer.close();
  await writeFile(outputPath, buffer.toString(), { mode: 0o600 });

  const out: MigrateExportResult = Object.freeze({
    input: inputPath,
    output: outputPath,
    schemaIn: parsed.meta.version,
    schemaOut: targetSchema,
    records: parsed.records.length,
  });
  emitReport(options, out, () => {
    const print = options.print ?? defaultPrintSink;
    print(
      brand(
        `${statusMarker('ok')} migrated ${out.records} record(s) from schema ${out.schemaIn} -> ${out.schemaOut}`,
      ),
    );
    print(`  input:  ${out.input}`);
    print(`  output: ${out.output}`);
  });
  return out;
}
