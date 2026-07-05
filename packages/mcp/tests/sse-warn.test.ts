import { getCounterForTesting, resetCountersForTesting } from '@graphorin/tools/audit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { _resetSseWarnDedupForTesting, createMCPClient } from '../src/client/index.js';
import { MCPConnectionError } from '../src/errors/index.js';

describe('SSE deprecated transport WARN - once per process', () => {
  let warnings: string[] = [];

  beforeEach(() => {
    resetCountersForTesting();
    _resetSseWarnDedupForTesting();
    warnings = [];
  });

  afterEach(() => {
    _resetSseWarnDedupForTesting();
    vi.restoreAllMocks();
  });

  it('emits exactly one WARN per process even across multiple createMCPClient calls', async () => {
    // The actual transport will fail to connect (no real server) - we
    // only care about the warning emission, not the connection.
    const tryOpen = async () => {
      try {
        await createMCPClient({
          transport: { kind: 'sse', url: 'https://does-not-exist.invalid/mcp' },
          logger: (level, message) => {
            if (level === 'warn') warnings.push(message);
          },
        });
      } catch {
        // Expected - no server is listening.
      }
    };
    await tryOpen();
    await tryOpen();
    await tryOpen();
    const sseWarnings = warnings.filter((w) => w.includes('SSE transport is deprecated'));
    expect(sseWarnings.length).toBe(1);
    expect(getCounterForTesting('mcp.transport.deprecated.warn.total', { transport: 'sse' })).toBe(
      1,
    );
  });

  it('the suppressDeprecatedTransportWarning flag prevents the WARN from emitting', async () => {
    try {
      await createMCPClient({
        transport: { kind: 'sse', url: 'https://does-not-exist.invalid/mcp' },
        suppressDeprecatedTransportWarning: true,
        logger: (level, message) => {
          if (level === 'warn') warnings.push(message);
        },
      });
    } catch {
      // Expected - no server is listening.
    }
    const sseWarnings = warnings.filter((w) => w.includes('SSE transport is deprecated'));
    expect(sseWarnings.length).toBe(0);
  });
});

describe('createMCPClient - connection failure surfaces as MCPConnectionError', () => {
  it('a refused stdio command surfaces as MCPConnectionError', async () => {
    await expect(
      createMCPClient({
        transport: { kind: 'stdio', command: '/path/that/does/not/exist/binary' },
      }),
    ).rejects.toBeInstanceOf(MCPConnectionError);
  });
});
