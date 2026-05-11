/**
 * `GRAPHORIN_OFFLINE=1` enforcement. The framework promises zero
 * implicit network calls (DEC-154 / ADR-041); the CLI mirrors the
 * promise on the operator-facing side by surfacing the same flag
 * every subcommand obeys.
 *
 * The flag is informational in Phase 14a — the three commands the
 * binary ships do NOT make any outbound network calls. A future
 * phase that exposes a network-using subcommand (e.g. `graphorin
 * pricing refresh`) reads {@link isOfflineMode} to short-circuit.
 *
 * @internal
 */

/**
 * `true` when `process.env.GRAPHORIN_OFFLINE` is set to `'1'` or
 * `'true'` (case-insensitive). Mirrors the documented contract.
 *
 * @stable
 */
export function isOfflineMode(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env.GRAPHORIN_OFFLINE;
  if (raw === undefined) return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

/**
 * Throws when the operator opted into offline mode. Phase 14a calls
 * this from every subcommand entry point so the contract is
 * enforced uniformly.
 *
 * @stable
 */
export function assertNoNetworkInOfflineMode(operation: string): void {
  if (!isOfflineMode()) return;
  throw new OfflineModeViolationError(operation);
}

/**
 * Phase 15 helper for subcommands that informationally **may** make
 * network calls (e.g. `graphorin auth login`, `graphorin pricing
 * refresh`, `graphorin skills install`). When `GRAPHORIN_OFFLINE=1`
 * is set the helper writes an explanatory branded line through the
 * supplied sink (default: `process.stderr`) and returns `false`,
 * letting the caller short-circuit cleanly without throwing. Returns
 * `true` when the network is permitted.
 *
 * @stable
 */
export function checkOfflineModeBlocked(
  operation: string,
  options: { readonly print?: (line: string) => void; readonly env?: NodeJS.ProcessEnv } = {},
): boolean {
  const env = options.env ?? process.env;
  if (!isOfflineMode(env)) return true;
  const sink = options.print ?? ((line: string) => process.stderr.write(`${line}\n`));
  sink(
    `[graphorin/cli] GRAPHORIN_OFFLINE=1 — refusing to perform '${operation}'. Unset GRAPHORIN_OFFLINE to opt back in.`,
  );
  return false;
}

/**
 * Raised when a CLI subcommand attempts a network call while
 * `GRAPHORIN_OFFLINE=1` is set.
 *
 * @stable
 */
export class OfflineModeViolationError extends Error {
  readonly kind = 'offline-mode-violation' as const;
  readonly operation: string;

  constructor(operation: string) {
    super(
      `[graphorin/cli] GRAPHORIN_OFFLINE=1 is set; refusing to perform a network operation: ${operation}.`,
    );
    this.name = 'OfflineModeViolationError';
    this.operation = operation;
  }
}
