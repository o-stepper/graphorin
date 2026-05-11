/**
 * CLI integration helpers. Convenience wrappers that combine the
 * runner + a reporter + an exit-code mapping so consumer scripts can
 * stay short.
 *
 * Typical use from a `package.json` script:
 *
 * ```jsonc
 * {
 *   "scripts": {
 *     "eval": "node ./scripts/run-evals.mjs"
 *   }
 * }
 * ```
 *
 * Where `run-evals.mjs` looks like:
 *
 * ```ts
 * import { runEvals, exitOnFailures, renderTerminalReport } from '@graphorin/evals';
 *
 * const report = await runEvals({...});
 * console.log(renderTerminalReport(report));
 * exitOnFailures(report);
 * ```
 *
 * @packageDocumentation
 */

import { writeFile } from 'node:fs/promises';
import process from 'node:process';

import type { EvalReport } from '@graphorin/observability/eval';

import { detectRegressions } from '../regression.js';
import {
  renderHtmlReport,
  renderJsonReport,
  renderJunitReport,
  renderMarkdownReport,
  renderTerminalReport,
} from '../reporters/index.js';
import type { RegressionOptions, RegressionReport } from '../types.js';

/**
 * Set `process.exitCode` to `1` when at least one case failed, or
 * when a regression report contains findings. Uses `exitCode` rather
 * than `process.exit` so other async tasks finish cleanly.
 *
 * @stable
 */
export function exitOnFailures<I, O>(
  report: EvalReport<I, O>,
  regression?: RegressionReport<I, O>,
): void {
  if (report.summary.failed > 0) process.exitCode = 1;
  if (regression?.hasRegressions) process.exitCode = 1;
}

/**
 * Reporter ids accepted by {@link writeReports}.
 *
 * @stable
 */
export type ReporterFormat = 'terminal' | 'markdown' | 'json' | 'junit' | 'html';

/** @stable */
export interface WriteReportsOptions<I, O> {
  readonly report: EvalReport<I, O>;
  readonly outDir?: string;
  readonly formats: ReadonlyArray<ReporterFormat>;
  readonly basename?: string;
}

/** @stable */
export interface WrittenReport {
  readonly format: ReporterFormat;
  readonly path: string;
  readonly bytes: number;
}

/**
 * Render the report in every requested format and write each one to a
 * file. Returns the manifest of written files.
 *
 * @stable
 */
export async function writeReports<I, O>(
  options: WriteReportsOptions<I, O>,
): Promise<ReadonlyArray<WrittenReport>> {
  const out: WrittenReport[] = [];
  const dir = options.outDir ?? '.';
  const basename = options.basename ?? 'eval-report';
  for (const format of options.formats) {
    const { extension, body } = renderForFormat(format, options.report);
    const path = `${dir}/${basename}.${extension}`;
    await writeFile(path, body, 'utf8');
    out.push({ format, path, bytes: Buffer.byteLength(body, 'utf8') });
  }
  return out;
}

function renderForFormat<I, O>(
  format: ReporterFormat,
  report: EvalReport<I, O>,
): { extension: string; body: string } {
  switch (format) {
    case 'terminal':
      return { extension: 'txt', body: renderTerminalReport(report) };
    case 'markdown':
      return { extension: 'md', body: renderMarkdownReport(report) };
    case 'json':
      return { extension: 'json', body: renderJsonReport(report, { pretty: true }) };
    case 'junit':
      return { extension: 'xml', body: renderJunitReport(report) };
    case 'html':
      return { extension: 'html', body: renderHtmlReport(report) };
    default: {
      const exhaustive: never = format;
      throw new Error(`unknown reporter format '${exhaustive as string}'`);
    }
  }
}

export { detectRegressions, type RegressionOptions };
