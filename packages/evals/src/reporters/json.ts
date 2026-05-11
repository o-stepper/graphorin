/**
 * JSON reporter. Returns the canonical JSON-serialised representation
 * of an {@link EvalReport} so downstream tooling (dashboards,
 * spreadsheets, regression checkers) can consume it deterministically.
 *
 * @packageDocumentation
 */

import type { EvalReport } from '@graphorin/observability/eval';

/** @stable */
export function renderJsonReport<I, O>(
  report: EvalReport<I, O>,
  options: { readonly pretty?: boolean } = {},
): string {
  const indent = options.pretty === true ? 2 : 0;
  return JSON.stringify(report, null, indent);
}
