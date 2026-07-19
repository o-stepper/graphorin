/**
 * The full `toTools()` pipeline (list -> adapt -> drift diff ->
 * pin comparison / TOFU store legs) extracted from `client.ts` and
 * parameterized by an {@link MCPClient}. Two callers:
 *
 * - the plain client's own `toTools()` (client = itself, the
 *   pre-extraction behaviour byte-for-byte), and
 * - the managed wrapper's `toTools()` (client = THE WRAPPER), so every
 *   adapted `Tool.execute` closes over the wrapper and keeps working
 *   after the wrapper swaps its inner client on reconnect - no
 *   re-registration required.
 *
 * @packageDocumentation
 */

import type { Tool } from '@graphorin/core';
import { incrementCounter } from '@graphorin/tools/audit';
import { MCPToolPinningError } from '../errors/index.js';
import { adaptMCPTools } from './to-tools.js';
import type { CreateMCPClientOptions, MCPClient, MCPToToolsOptions } from './types.js';

/** Mutable cross-snapshot fingerprint cell (drift tracking). */
export interface ToolFingerprintRef {
  current: ReadonlyMap<string, string> | undefined;
}

/** Arguments for {@link runToTools}. @internal */
export interface RunToToolsArgs {
  /** The client the adapted tools CLOSE OVER (wrapper for managed). */
  readonly client: MCPClient;
  /**
   * Cross-snapshot fingerprint cell. Owned by the caller so drift
   * tracking spans the caller's lifetime (for the managed wrapper that
   * includes reconnects - a rug-pull across a reconnect still diffs).
   */
  readonly fingerprintRef: ToolFingerprintRef;
  readonly logger?: CreateMCPClientOptions['logger'];
  readonly toolsOpts?: MCPToToolsOptions;
}

/**
 * Run the list -> adapt -> drift -> pin pipeline against `args.client`.
 *
 * @internal
 */
export async function runToTools(args: RunToToolsArgs): Promise<ReadonlyArray<Tool>> {
  const { client, fingerprintRef, logger, toolsOpts } = args;
  const serverIdentity = client.serverIdentity;
  const catalogue = await client.listTools();
  const adapted = adaptMCPTools({
    client,
    serverIdentity,
    catalogue,
    ...(toolsOpts === undefined ? {} : { options: toolsOpts }),
    ...(logger === undefined ? {} : { logger }),
  });
  // MC-6: cross-snapshot drift - a definition changing behind an
  // already-seen name within this client's lifetime is audited.
  if (fingerprintRef.current !== undefined) {
    for (const [name, hash] of adapted.fingerprints) {
      const previous = fingerprintRef.current.get(name);
      if (previous !== undefined && previous !== hash) {
        incrementCounter('mcp.tools.changed.total', {
          server: serverIdentity.id,
          tool: name,
        });
        logger?.('warn', 'mcp.tools.changed: definition drifted between snapshots', {
          server: serverIdentity.id,
          tool: name,
          previous,
          current: hash,
        });
      }
    }
  }
  fingerprintRef.current = adapted.fingerprints;
  // MC-6: operator pins from a previously approved snapshot - the
  // rug-pull (approve-then-swap across restarts) posture. C6 extends it
  // with durable trust-on-first-use via `pinStore`: the first snapshot
  // is RECORDED, later snapshots are COMPARED, and a store-backed
  // mismatch defaults to 'reject' (a persisted first approval is an
  // explicit trust decision).
  let pins = toolsOpts?.pinnedFingerprints;
  let mismatchAction = toolsOpts?.onPinMismatch ?? 'warn';
  // W-079: the added/removed lifecycle legs only apply to STORE pins -
  // a store snapshot covers the full catalogue by construction, while
  // explicit pinnedFingerprints may deliberately pin a subset.
  let pinsFromStore = false;
  const pinStore = toolsOpts?.pinStore;
  if (pins === undefined && pinStore !== undefined) {
    const stored = await pinStore.get(serverIdentity.id);
    if (stored === undefined) {
      const recorded: Record<string, string> = {};
      for (const [name, hash] of adapted.fingerprints) recorded[name] = hash;
      await pinStore.set(serverIdentity.id, recorded);
      incrementCounter('mcp.tools.pins-recorded.total', { server: serverIdentity.id });
      logger?.('info', 'mcp.tools.pins-recorded: first-use fingerprints stored', {
        server: serverIdentity.id,
        tools: Object.keys(recorded).length,
      });
    } else {
      pins = stored;
      pinsFromStore = true;
      mismatchAction = toolsOpts?.onPinMismatch ?? 'reject';
    }
  }
  if (pins !== undefined) {
    for (const [name, pinned] of Object.entries(pins)) {
      const current = adapted.fingerprints.get(name);
      if (current !== undefined && current !== pinned) {
        if (mismatchAction === 'reject') {
          throw new MCPToolPinningError(
            `MCP tool '${name}' no longer matches its pinned definition fingerprint - the server changed the definition behind an approved name.`,
            { metadata: { server: serverIdentity.id, tool: name } },
          );
        }
        incrementCounter('mcp.tools.pin-mismatch.total', {
          server: serverIdentity.id,
          tool: name,
        });
        logger?.('warn', 'mcp.tools.pin-mismatch: pinned fingerprint diverged', {
          server: serverIdentity.id,
          tool: name,
        });
      }
    }
    // W-079: the comparison loop above only sees names that were
    // pinned. A server that passed its first-use recording can later
    // ADD a poisoned tool (or rename one) - without this leg it would
    // enter the catalogue with no counter and no rejection.
    const pinnedNames = new Set(Object.keys(pins));
    for (const name of pinsFromStore ? adapted.fingerprints.keys() : []) {
      if (pinnedNames.has(name)) continue;
      if (mismatchAction === 'reject') {
        throw new MCPToolPinningError(
          `MCP server added tool '${name}' after its catalogue was pinned - a post-approval addition is rejected until the operator re-pins (onPinMismatch: 'accept-and-update').`,
          { metadata: { server: serverIdentity.id, tool: name } },
        );
      }
      incrementCounter('mcp.tools.pin-added.total', {
        server: serverIdentity.id,
        tool: name,
      });
      logger?.('warn', 'mcp.tools.pin-added: tool added after the catalogue was pinned', {
        server: serverIdentity.id,
        tool: name,
      });
    }
    // W-079: removals are not an injection by themselves, but they can
    // hide a rename (remove + add) - keep them observable.
    for (const name of pinsFromStore ? pinnedNames : []) {
      if (adapted.fingerprints.has(name)) continue;
      incrementCounter('mcp.tools.pin-removed.total', {
        server: serverIdentity.id,
        tool: name,
      });
      logger?.('info', 'mcp.tools.pin-removed: pinned tool disappeared from the catalogue', {
        server: serverIdentity.id,
        tool: name,
      });
    }
    // W-079: the explicit operator path to accept a changed catalogue -
    // overwrite the store with the CURRENT snapshot so subsequent
    // toTools() calls are clean. Explicit pinnedFingerprints stay
    // read-only (they are config, not a store).
    if (mismatchAction === 'accept-and-update' && pinsFromStore && pinStore !== undefined) {
      const refreshed: Record<string, string> = {};
      for (const [name, hash] of adapted.fingerprints) refreshed[name] = hash;
      await pinStore.set(serverIdentity.id, refreshed);
      incrementCounter('mcp.tools.pins-updated.total', { server: serverIdentity.id });
      logger?.('info', 'mcp.tools.pins-updated: operator accepted the current catalogue', {
        server: serverIdentity.id,
        tools: Object.keys(refreshed).length,
      });
    }
  }
  return adapted.tools;
}
