/**
 * `@graphorin/cli` — operator CLI for the Graphorin framework.
 *
 * Phase 14a shipped the minimal `graphorin` binary with three
 * lifecycle commands: `start`, `init`, and `migrate`. Phase 15
 * extended the same binary with the operator surface (`doctor`,
 * `token`, `secrets`, `audit`, `storage`, `memory`, `consolidator`,
 * `triggers`, `auth`, `pricing`, `skills`, `traces`,
 * `migrate-export`, `migrate-config`, `guard`, `telemetry`,
 * `tools lint`).
 *
 * Every subcommand is exported as a typed library function so
 * downstream automations can call them directly without spawning a
 * child process.
 *
 * @packageDocumentation
 */

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.5.0';

export * from './commands/index.js';
export {
  assertNoNetworkInOfflineMode,
  checkOfflineModeBlocked,
  isOfflineMode,
  OfflineModeViolationError,
} from './internal/offline.js';
