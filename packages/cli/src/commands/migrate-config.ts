/**
 * `graphorin migrate-config <input>` — config-schema migration helper.
 *
 * v0.1 ships exactly one config schema; the migrator is therefore a
 * compatibility shell that round-trips the operator's config through
 * `parseServerConfig(...)` and writes the canonical-shape JSON back to
 * disk. Future MAJOR bumps replace this body with the rewriter that
 * upgrades old field shapes; the CLI surface stays the same.
 *
 * The output path is always derived from the input — `migrate-config`
 * writes `<input>.migrated` next to the source unless `--out` is
 * supplied. The original is never modified.
 *
 * @packageDocumentation
 */

import { writeFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import process from 'node:process';

import { parseServerConfig } from '@graphorin/server';

import { loadConfig } from '../internal/load-config.js';
import {
  brand,
  type CommonOutputOptions,
  defaultPrintSink,
  emitReport,
  statusMarker,
} from '../internal/output.js';

/** @stable */
export interface MigrateConfigOptions extends CommonOutputOptions {
  readonly input: string;
  readonly out?: string;
}

/** @stable */
export interface MigrateConfigResult {
  readonly input: string;
  readonly output: string;
  readonly schemaVersion: '0.1';
}

/** @stable */
export async function runMigrateConfig(
  options: MigrateConfigOptions,
): Promise<MigrateConfigResult> {
  const cwd = process.cwd();
  const inputPath = isAbsolute(options.input) ? options.input : resolve(cwd, options.input);
  const outputPath =
    options.out !== undefined
      ? isAbsolute(options.out)
        ? options.out
        : resolve(cwd, options.out)
      : `${inputPath}.migrated.json`;
  if (inputPath === outputPath) {
    throw new Error(
      `[graphorin/cli] migrate-config refuses to overwrite the input file '${inputPath}'.`,
    );
  }
  const loaded = await loadConfig(inputPath);
  const parsed = parseServerConfig(loaded.config);
  await writeFile(outputPath, `${JSON.stringify(parsed, null, 2)}\n`, { mode: 0o600 });
  const out: MigrateConfigResult = Object.freeze({
    input: inputPath,
    output: outputPath,
    schemaVersion: '0.1',
  });
  emitReport(options, out, () => {
    const print = options.print ?? defaultPrintSink;
    print(brand(`${statusMarker('ok')} migrated config v${out.schemaVersion}`));
    print(`  input:  ${out.input}`);
    print(`  output: ${out.output}`);
  });
  return out;
}
