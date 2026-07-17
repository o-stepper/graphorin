/**
 * SQLite-backed durability delegate for the {@link RunStateTracker}'s
 * suspended (`awaiting_approval`) runs. Wired by `createServer` on top
 * of `store.suspendedRuns` (migration 038):
 *
 *   - `suspended` serializes the parked RunState through the OWNING
 *     agent's `serializeState` codec (version-stamped, binary-safe,
 *     secret-redacted) and upserts the row. A string state (boot
 *     hydration re-registering a persisted row) is persisted verbatim.
 *   - `settled` drops the row when the resume flow settles the run.
 *
 * Everything is best-effort: a persistence failure logs a WARN and the
 * in-memory tracker keeps working exactly as before.
 *
 * @packageDocumentation
 */

import type { AgentRegistry } from '../registry/index.js';
import type { RunDescriptor, SuspendedRunPersistenceHooks } from './run-state.js';

/**
 * Structural slice of `@graphorin/store-sqlite`'s `SuspendedRunStore`
 * the delegate needs (kept local so tests wire plain objects).
 *
 * @stable
 */
export interface SuspendedRunPersistenceStore {
  put(record: {
    readonly runId: string;
    readonly agentId: string;
    readonly sessionId?: string;
    readonly userId?: string;
    readonly stateJson: string;
    readonly suspendedAt: number;
  }): Promise<void>;
  delete(runId: string): Promise<void>;
}

/**
 * Options for {@link createSuspendedRunPersistence}.
 *
 * @stable
 */
export interface SuspendedRunPersistenceOptions {
  readonly agents: AgentRegistry;
  readonly store: SuspendedRunPersistenceStore;
  readonly now?: () => number;
  /** WARN sink. Default `console.warn`. */
  readonly warn?: (message: string) => void;
}

/**
 * Build the {@link SuspendedRunPersistenceHooks} delegate the server
 * installs via `runs.setSuspendedRunPersistence(...)`.
 *
 * @stable
 */
export function createSuspendedRunPersistence(
  options: SuspendedRunPersistenceOptions,
): SuspendedRunPersistenceHooks {
  const now = options.now ?? Date.now;
  const warn = options.warn ?? ((message: string) => console.warn(message));
  // A registry agent without the serializeState codec (a hand-rolled
  // ServerAgentLike) cannot be made durable - warn once per agent id,
  // not once per suspension.
  const warnedAgents = new Set<string>();
  return {
    suspended(runId, descriptor, state): void {
      if (descriptor.kind !== 'agent') {
        // Workflow runs are durable through their own CheckpointStore -
        // the sidecar only covers agent HITL parks.
        return;
      }
      const stateJson = resolveStateJson(runId, descriptor, state);
      if (stateJson === undefined) return;
      void options.store
        .put({
          runId,
          agentId: descriptor.agentId,
          ...(descriptor.sessionId !== undefined ? { sessionId: descriptor.sessionId } : {}),
          ...(descriptor.userId !== undefined ? { userId: descriptor.userId } : {}),
          stateJson,
          suspendedAt: now(),
        })
        .catch((err: unknown) => {
          warn(
            `[graphorin/server] failed to persist suspended run '${runId}' - it will not survive a restart: ${describe(err)}`,
          );
        });
    },
    settled(runId): void {
      void options.store.delete(runId).catch((err: unknown) => {
        warn(
          `[graphorin/server] failed to drop settled suspended-run row '${runId}': ${describe(err)}`,
        );
      });
    },
  };

  function resolveStateJson(
    runId: string,
    descriptor: Extract<RunDescriptor, { kind: 'agent' }>,
    state: unknown,
  ): string | undefined {
    // Boot hydration re-registers the persisted row with its raw JSON
    // string - persist it verbatim (idempotent re-put).
    if (typeof state === 'string') return state;
    const agent = options.agents.get(descriptor.agentId);
    const serialize = (agent as { serializeState?: (state: unknown) => string } | undefined)
      ?.serializeState;
    if (typeof serialize !== 'function') {
      if (!warnedAgents.has(descriptor.agentId)) {
        warnedAgents.add(descriptor.agentId);
        warn(
          `[graphorin/server] agent '${descriptor.agentId}' exposes no serializeState codec - ` +
            `its suspended runs stay in-memory only and will not survive a restart.`,
        );
      }
      return undefined;
    }
    try {
      return serialize.call(agent, state);
    } catch (err) {
      warn(
        `[graphorin/server] agent '${descriptor.agentId}' failed to serialize suspended run '${runId}': ${describe(err)}`,
      );
      return undefined;
    }
  }
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
