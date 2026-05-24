/**
 * `@graphorin/sessions` — hybrid facade-with-state session module
 * for the Graphorin framework.
 *
 * Headline capabilities:
 *
 *  - `createSessionManager({...})` + `Session` facade. `Session.push
 *    / list / search / compact` are 1-line wrappers over
 *    `@graphorin/memory.session` (single source of truth). The
 *    sessions package owns sessions / agents / handoffs / workflow
 *    attachments / audit metadata.
 *  - `AgentRegistry` singleton with `register / retire / delete /
 *    resolveOrPlaceholder` semantics.
 *  - Multi-agent first-class: `Session.list({ agentId })`, automatic
 *    handoff records with input-filter + secrets-inheritance metadata,
 *    `handoffsByAgent(agentId, direction)`.
 *  - Per-message commentary-phase trace sanitization at four
 *    session-output boundaries (`push`, `list`, `export`, `replay`).
 *  - JSONL session export schema 1.0 (`graphorin-session-export/1.0`)
 *    with sentinel header + footer, N-2 backwards-compat,
 *    lenient-forward-parse, opt-in `--hash` / `--encrypt`.
 *  - Tool cassette schema 1.0 (`graphorin-tool-cassette/1.0`) with
 *    `Session.recordToolCassette({...})` companion API.
 *  - `Session.replay({...})` sanitized-by-default + audit + cassette
 *    extension under `toolReplayMode: 'auto' | 'live' | 'recorded' |
 *    'mixed'` honouring per-tool `sideEffectClass`.
 *
 * @packageDocumentation
 */

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.3.0';

export {
  AgentRegistry,
  type AgentRegistryLookup,
  type DeleteAgentOptions,
  type RegisterAgentOptions,
  type RetireAgentOptions,
} from './agent-registry.js';
export * from './cassette/index.js';
export * from './commentary/index.js';
export * from './errors/index.js';
export * from './export/index.js';
export {
  type CreateSessionManagerOptions,
  createSessionManager,
  type Session,
  type SessionCounters,
  type SessionExportOptions,
  type SessionManager,
  type SessionMemoryFacade,
  type SessionRecordCassetteOptions,
} from './facade.js';
export {
  _resetExportMigratorsForTesting,
  type ExportMigrator,
  listExportMigrators,
  migrateExport,
  registerExportMigrator,
} from './migrations/index.js';
export * from './replay/index.js';
