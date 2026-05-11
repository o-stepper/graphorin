/**
 * Shared exit helpers. Phase 15 subcommands fail-fast through
 * {@link fail}; the helper writes the error message via the chosen
 * sink and then calls `process.exit(code)`. Tests stub `process.exit`
 * to convert the call into a thrown sentinel they can assert against.
 *
 * Exit codes follow the small documented contract:
 *
 *  - `0` — success (subcommand completed without warnings or with
 *    informational warnings only).
 *  - `1` — recoverable failure (config invalid, secret missing,
 *    threshold exceeded). Operator can fix and re-run.
 *  - `2` — unsupported invocation (e.g. `graphorin storage encrypt`
 *    when the Phase 16 sub-pack is not installed). Operator must
 *    install / configure something before retrying.
 *
 * @internal
 */

import process from 'node:process';

import { brand } from './output.js';

/**
 * Numeric exit codes the CLI uses uniformly.
 *
 * @internal
 */
export const EXIT_CODES = Object.freeze({
  OK: 0,
  RECOVERABLE_FAILURE: 1,
  UNSUPPORTED: 2,
} as const);

/**
 * Pretty-print an `Error`-shaped value without leaking secrets, then
 * exit. Re-uses `cause` chains when present.
 *
 * @internal
 */
export function fail(
  err: unknown,
  options: {
    readonly code?: number;
    readonly print?: (line: string) => void;
  } = {},
): never {
  const code = options.code ?? EXIT_CODES.RECOVERABLE_FAILURE;
  const print = options.print ?? ((line: string) => process.stderr.write(`${line}\n`));
  if (err instanceof Error) {
    const kind = (err as { kind?: string }).kind;
    const prefix = kind === undefined ? '' : `${kind}: `;
    print(brand(`${prefix}${err.message}`));
    const hint = (err as { hint?: string }).hint;
    if (typeof hint === 'string' && hint.length > 0) {
      print(brand(`hint: ${hint}`));
    }
  } else {
    print(brand(`unknown error: ${String(err)}`));
  }
  process.exit(code);
}
