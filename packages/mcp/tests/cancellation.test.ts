import { resetCountersForTesting } from '@graphorin/tools/audit';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createMCPClientFromSdkTransport } from '../src/client/client.js';
import type { MCPClient } from '../src/client/index.js';
import { MCPCancelledError } from '../src/errors/index.js';
import { startInMemoryServer } from './__fixtures__/in-memory-server.js';

/**
 * Sleep duration for the slow tool handler. Picked far above
 * `CANCEL_BUDGET_MS` so a real regression — abort failing to
 * short-circuit the call — manifests as a deterministic test failure
 * regardless of runner speed: the test would have to wait the full
 * sleep before the handler resolves.
 */
const HANDLER_SLEEP_MS = 5_000;

/**
 * Wall-clock budget for "abort short-circuited the call". GitHub-hosted
 * macOS / Ubuntu runners routinely add hundreds of ms of host-scheduler
 * latency between `abort()` and the rejected promise even when the
 * application code itself is instant (saw 230 ms on macos-latest with a
 * 250 ms handler sleep, blowing the original 200 ms gate).
 *
 * Mirror the `CI`-aware pattern from
 * `packages/security/tests/oauth/cancellation-timing.test.ts`: keep the
 * tight bound locally so a real cancellation regression still trips it,
 * widen on shared CI so transient runner load does not.
 */
const CANCEL_BUDGET_MS = process.env.CI === 'true' ? 1_500 : 200;

describe('MCPClient — AbortSignal cancellation discipline', () => {
  let client: MCPClient | undefined;
  let dispose: (() => Promise<void>) | undefined;

  beforeEach(() => {
    resetCountersForTesting();
  });

  afterEach(async () => {
    if (client !== undefined) {
      try {
        await client.close();
      } catch {
        // The cancellation paths may have already torn the transport down.
      }
      client = undefined;
    }
    if (dispose !== undefined) {
      await dispose();
      dispose = undefined;
    }
  });

  it('callTool rejects with MCPCancelledError when the AbortSignal aborts mid-call', async () => {
    const fixture = await startInMemoryServer({
      tools: [{ name: 'slow', inputSchema: {} }],
      callToolHandler: async () => {
        // Simulate a long-running tool call. The sleep length is far
        // above CANCEL_BUDGET_MS so a regression where the abort
        // fails to short-circuit the call is detected deterministically
        // — the handler would resolve only after HANDLER_SLEEP_MS,
        // well past every plausible CI scheduling jitter.
        await new Promise((resolve) => setTimeout(resolve, HANDLER_SLEEP_MS));
        return { content: [{ type: 'text', text: 'done' }] };
      },
    });
    dispose = fixture.close;
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
    });
    const ctrl = new AbortController();
    const start = performance.now();
    const callPromise = client.callTool('slow', {}, { signal: ctrl.signal });
    // Abort almost immediately. The behavioural assertion below
    // (rejection is `MCPCancelledError`) is the spec; the wall-clock
    // bound is the regression gate.
    setTimeout(() => ctrl.abort(), 5);
    await expect(callPromise).rejects.toBeInstanceOf(MCPCancelledError);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(CANCEL_BUDGET_MS);
  });

  it('listTools propagates AbortSignal abort as MCPCancelledError', async () => {
    const fixture = await startInMemoryServer({
      tools: [{ name: 't', inputSchema: {} }],
    });
    dispose = fixture.close;
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
    });
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(client.listTools({ signal: ctrl.signal })).rejects.toBeInstanceOf(
      MCPCancelledError,
    );
  });
});
