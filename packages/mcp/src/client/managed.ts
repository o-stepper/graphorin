/**
 * W-080: opt-in managed MCP client with automatic reconnection.
 *
 * `createMCPClient` connections are deliberately one-shot: transient
 * Streamable-HTTP hiccups are healed by the SDK itself (Last-Event-ID),
 * but a dead stdio child or a lost HTTP session kills the client for
 * good, and every `Tool` adapted from it closes over the corpse. The
 * managed wrapper fixes the long-running-agent story:
 *
 * - it holds the current inner client in a mutable ref and implements
 *   {@link MCPClient} by delegation, so ALL consumers (including every
 *   adapted `Tool.execute`, which the wrapper's `toTools()` binds to the
 *   WRAPPER, not the inner client) transparently follow a swap;
 * - on transport close it rebuilds the inner client with exponential
 *   backoff + jitter (`mcp.reconnect.attempt/success/gave-up.total`
 *   counters), then re-runs `toTools()` with the last-used options so
 *   the pin comparison (TOFU store / explicit pins) re-screens the
 *   post-reconnect catalogue - a rug-pull across a reconnect is caught;
 * - it NEVER retries an in-flight call: a call that died with the
 *   transport stays failed (retry policy belongs to the executor /
 *   model), only the CONNECTION heals;
 * - the operator's `onTransportClose` fires once, on FINAL failure
 *   (reconnect exhausted) - intermediate closes are the wrapper's job.
 *
 * The plain `createMCPClient` contract is unchanged; this wrapper is a
 * separate, additive entry point.
 *
 * @packageDocumentation
 */

import type { Tool } from '@graphorin/core';
import { incrementCounter } from '@graphorin/tools/audit';
import { createMCPClient } from './client.js';
import { runToTools, type ToolFingerprintRef } from './to-tools-run.js';
import type { CreateMCPClientOptions, MCPClient, MCPToToolsOptions } from './types.js';

/** Reconnection tuning for {@link createManagedMCPClient}. @stable */
export interface ManagedReconnectOptions {
  /** Attempts per outage before giving up. Default `5`. */
  readonly maxAttempts?: number;
  /** First backoff delay (doubles per attempt, jittered). Default `500` ms. */
  readonly initialDelayMs?: number;
  /** Backoff ceiling. Default `30_000` ms. */
  readonly maxDelayMs?: number;
}

/** Options for {@link createManagedMCPClient}. @stable */
export type CreateManagedMCPClientOptions = CreateMCPClientOptions & {
  readonly reconnect?: ManagedReconnectOptions;
  /**
   * Client factory seam - tests inject fake inner clients; production
   * uses {@link createMCPClient}.
   *
   * @internal
   */
  readonly _clientFactory?: (options: CreateMCPClientOptions) => Promise<MCPClient>;
};

/**
 * Open a managed (auto-reconnecting) MCP client. See the module doc for
 * the exact semantics. `close()` is terminal: it stops any in-progress
 * backoff and no further reconnects happen.
 *
 * @stable
 */
export async function createManagedMCPClient(
  options: CreateManagedMCPClientOptions,
): Promise<MCPClient> {
  const { reconnect, _clientFactory, ...clientOptions } = options;
  const factory = _clientFactory ?? createMCPClient;
  const maxAttempts = reconnect?.maxAttempts ?? 5;
  const initialDelayMs = reconnect?.initialDelayMs ?? 500;
  const maxDelayMs = reconnect?.maxDelayMs ?? 30_000;

  let closed = false;
  let reconnecting: Promise<void> | null = null;
  let toolsEverListed = false;
  let lastToToolsOpts: MCPToToolsOptions | undefined;
  // Drift tracking spans reconnects on purpose: a definition swapped
  // behind a reconnect still diffs against the pre-outage snapshot.
  const fingerprintRef: ToolFingerprintRef = { current: undefined };

  const innerOptions: CreateMCPClientOptions = {
    ...clientOptions,
    // The wrapper owns transport-close handling; the operator callback
    // fires once, on final (gave-up) failure - see the module doc.
    onTransportClose: (info) => {
      if (closed) return;
      void reconnectLoop(info);
    },
  };

  let current = await factory(innerOptions);

  async function reconnectLoop(info: { readonly server: string }): Promise<void> {
    if (closed || reconnecting !== null) return;
    const task = (async () => {
      const dead = current;
      let delay = initialDelayMs;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        if (closed) return;
        incrementCounter('mcp.reconnect.attempt.total', { server: info.server });
        try {
          const next = await factory(innerOptions);
          if (closed) {
            // close() raced the rebuild - do not resurrect.
            void next.close().catch(() => {});
            return;
          }
          current = next;
          incrementCounter('mcp.reconnect.success.total', { server: info.server });
          options.logger?.('info', 'mcp.reconnect.success: inner client rebuilt', {
            server: info.server,
            attempt,
          });
          // Best-effort close of the dead client (idempotent by contract).
          void dead.close().catch(() => {});
          // Re-screen the post-reconnect catalogue with the SAME options
          // the operator last used, so pin comparison + drift diff run
          // against it. A pin rejection here must not kill the reconnect
          // (the connection is healthy) - it is logged and counted by
          // the pipeline itself.
          if (toolsEverListed) {
            try {
              await managedToTools(lastToToolsOpts);
            } catch (cause) {
              options.logger?.(
                'warn',
                'mcp.reconnect.catalogue-rescreen-failed: post-reconnect toTools() rejected (pin mismatch or listing failure) - the previously adapted tools remain registered; investigate before trusting this server',
                {
                  server: info.server,
                  error: cause instanceof Error ? cause.message : String(cause),
                },
              );
            }
          }
          return;
        } catch (cause) {
          if (attempt >= maxAttempts) {
            incrementCounter('mcp.reconnect.gave-up.total', { server: info.server });
            options.logger?.('error', 'mcp.reconnect.gave-up: reconnect attempts exhausted', {
              server: info.server,
              attempts: attempt,
              error: cause instanceof Error ? cause.message : String(cause),
            });
            options.onTransportClose?.(info);
            return;
          }
          // Full jitter on an exponential ladder, capped at maxDelayMs.
          const jittered = Math.min(delay, maxDelayMs) * (0.5 + Math.random() * 0.5);
          await sleep(jittered);
          delay = Math.min(delay * 2, maxDelayMs);
        }
      }
    })().finally(() => {
      reconnecting = null;
    });
    reconnecting = task;
    await task;
  }

  async function managedToTools(toolsOpts?: MCPToToolsOptions): Promise<ReadonlyArray<Tool>> {
    toolsEverListed = true;
    lastToToolsOpts = toolsOpts;
    return runToTools({
      // THE point of the wrapper: adapted tools close over `managed`,
      // so their `execute` transparently follows an inner-client swap.
      client: managed,
      fingerprintRef,
      ...(options.logger === undefined ? {} : { logger: options.logger }),
      ...(toolsOpts === undefined ? {} : { toolsOpts }),
    });
  }

  // Data fields delegate through getters so a swap is instantly visible;
  // the cast bridges `priority?: number` vs an always-present getter
  // returning `number | undefined` (exactOptionalPropertyTypes).
  const managed = {
    get id() {
      return current.id;
    },
    get serverInfo() {
      return current.serverInfo;
    },
    get serverIdentity() {
      return current.serverIdentity;
    },
    get collisionStrategy() {
      return current.collisionStrategy;
    },
    get priority() {
      return current.priority;
    },
    get sessionIdPresent() {
      return current.sessionIdPresent;
    },
    get resumable() {
      return current.resumable;
    },
    listTools: (opts?: { signal?: AbortSignal }) => current.listTools(opts),
    listResources: (opts?: { signal?: AbortSignal }) => current.listResources(opts),
    listPrompts: (opts?: { signal?: AbortSignal }) => current.listPrompts(opts),
    callTool: (name: string, args: unknown, opts?: { signal?: AbortSignal; timeoutMs?: number }) =>
      current.callTool(name, args, opts),
    readResource: (uri: string, opts?: { signal?: AbortSignal }) => current.readResource(uri, opts),
    readResourceContents: (uri: string, opts?: { signal?: AbortSignal }) =>
      current.readResourceContents(uri, opts),
    getPrompt: (name: string, args?: unknown, opts?: { signal?: AbortSignal }) =>
      current.getPrompt(name, args, opts),
    toTools: managedToTools,
    close: async (): Promise<void> => {
      closed = true;
      await current.close();
    },
  } as MCPClient;

  return managed;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
