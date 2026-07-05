/**
 * Shared output helpers for Phase 15 subcommands. The CLI keeps three
 * output flavours uniform across every command:
 *
 *  1. **Human** - single-line `[graphorin/cli] ...` messages on stderr
 *     (the default path in Phase 14a; preserved for backward
 *     compatibility).
 *  2. **JSON** - one structured JSON document per subcommand emitted on
 *     stdout when `--json` is set. Phase 15 commands that produce a
 *     report (status / list / verify / lookup) ship a stable schema so
 *     CI pipelines can consume them.
 *  3. **Stub print sink** - every command accepts an optional
 *     `print(line: string)` callback so unit tests can capture output
 *     without spying on `process.stderr`.
 *
 * Helpers in this module are intentionally tiny - they exist so the
 * sixteen Phase 15 subcommand groups share one channel surface
 * (single-source-of-truth per Hard Rule 5 in the working plan).
 *
 * @internal
 */

import process from 'node:process';

/**
 * Sink the CLI subcommands write human-readable lines through. The
 * default sink writes a trailing newline to `process.stderr`. Tests
 * inject a buffer.
 *
 * @internal
 */
export type PrintSink = (line: string) => void;

/**
 * Default `PrintSink` - appends a newline and writes to `stderr` so it
 * never collides with the JSON document on `stdout`.
 *
 * @internal
 */
export function defaultPrintSink(line: string): void {
  process.stderr.write(`${line}\n`);
}

/**
 * Sink the CLI uses when emitting structured JSON documents. Defaults
 * to writing a single trailing newline to `process.stdout`. Tests
 * inject a buffer.
 *
 * @internal
 */
export type JsonSink = (payload: unknown) => void;

/**
 * Default `JsonSink` - writes a stable, two-space indented JSON
 * document to `stdout` plus a trailing newline so consumers can split
 * a multi-document stream by lines.
 *
 * @internal
 */
export function defaultJsonSink(payload: unknown): void {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

/**
 * Common output options every Phase 15 command honours.
 *
 * @stable
 */
export interface CommonOutputOptions {
  /** Emit a structured JSON document instead of human-readable text. */
  readonly json?: boolean;
  /** Force `--non-interactive` semantics (skip prompts; require flags / env). */
  readonly nonInteractive?: boolean;
  /** Test seam - capture human lines instead of writing to stderr. */
  readonly print?: PrintSink;
  /** Test seam - capture JSON documents instead of writing to stdout. */
  readonly jsonPrint?: JsonSink;
}

/**
 * Emit either the JSON document or the human report depending on
 * `--json`. Used by every Phase 15 subcommand that produces a single
 * status payload (e.g. `graphorin doctor`, `graphorin token list`).
 *
 * WARNING (W-002): `human()` runs ONLY in non-JSON mode. Side effects
 * that are part of the machine contract - `process.exitCode` above all
 * - are FORBIDDEN inside it: they would silently vanish for exactly
 * the `--json` consumers (CI) they exist for. Compute the failure
 * predicate before calling this and set the exit code after it.
 *
 * @internal
 */
export function emitReport(
  options: CommonOutputOptions,
  payload: unknown,
  human: () => void,
): void {
  if (options.json === true) {
    const sink = options.jsonPrint ?? defaultJsonSink;
    sink(payload);
    return;
  }
  human();
}

/**
 * Format a status icon for human reports. The CLI is ASCII-only per
 * the Phase 15 spec (no emoji); the markers are unambiguous so
 * operators see at a glance what a row means.
 *
 * @internal
 */
export function statusMarker(status: 'ok' | 'warn' | 'fail' | 'skip' | 'info'): string {
  switch (status) {
    case 'ok':
      return '[OK]';
    case 'warn':
      return '[WARN]';
    case 'fail':
      return '[FAIL]';
    case 'skip':
      return '[SKIP]';
    case 'info':
      return '[INFO]';
  }
}

/**
 * Standardised `[graphorin/cli] <message>` prefix every human-format
 * line carries. Centralised so every command renders the same brand.
 *
 * @internal
 */
export function brand(line: string): string {
  return `[graphorin/cli] ${line}`;
}

/**
 * Convenience helper - writes a branded message via the chosen sink.
 *
 * @internal
 */
export function brandedLine(options: CommonOutputOptions, line: string): void {
  const sink = options.print ?? defaultPrintSink;
  sink(brand(line));
}
