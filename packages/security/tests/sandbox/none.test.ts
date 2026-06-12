import { describe, expect, it, vi } from 'vitest';

import { createNoneSandbox } from '../../src/sandbox/none.js';

describe('NoneSandbox', () => {
  it('runs a registered handler and returns the typed output', async () => {
    const handler = vi.fn(async (input: { n: number }) => ({ doubled: input.n * 2 }));
    const sandbox = createNoneSandbox({
      resolveHandler: () => handler as never,
    });
    const result = await sandbox.run<{ n: number }, { doubled: number }>(
      { kind: 'handler', module: '__fixture__', export: 'double' },
      { input: { n: 21 } },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.output).toEqual({ doubled: 42 });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('refuses to run inline source code', async () => {
    const sandbox = createNoneSandbox({ resolveHandler: () => undefined });
    const result = await sandbox.run({ kind: 'source', source: 'return 1' }, { input: undefined });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('sandbox-violation');
  });

  it('returns a sandbox-violation when no handler is registered', async () => {
    const sandbox = createNoneSandbox({ resolveHandler: () => undefined });
    const result = await sandbox.run(
      { kind: 'handler', module: 'unregistered', export: 'noop' },
      { input: undefined },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('sandbox-violation');
      expect(result.error.message).toContain('no registered handler');
    }
  });

  it('captures execution-failed errors with the original message', async () => {
    const sandbox = createNoneSandbox({
      resolveHandler: () => () => {
        throw new Error('boom');
      },
    });
    const result = await sandbox.run(
      { kind: 'handler', module: 'm', export: 'h' },
      { input: undefined },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('execution-failed');
      expect(result.error.message).toBe('boom');
    }
  });

  it('returns aborted when the AbortSignal is already aborted before dispatch', async () => {
    const sandbox = createNoneSandbox({ resolveHandler: () => async () => 'never' });
    const controller = new AbortController();
    controller.abort();
    const result = await sandbox.run(
      { kind: 'handler', module: 'm', export: 'h' },
      { input: undefined, signal: controller.signal },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('aborted');
  });

  it('advertises minimal capabilities and the canonical id', () => {
    const sandbox = createNoneSandbox({ resolveHandler: () => undefined });
    expect(sandbox.id).toBe('none');
    expect(sandbox.kind).toBe('none');
    expect(sandbox.capabilities.canBlockNetwork).toBe(false);
    expect(sandbox.capabilities.canBlockFilesystem).toBe(false);
    expect(sandbox.capabilities.canEnforceTimeout).toBe(false);
    expect(sandbox.capabilities.canEnforceMemoryLimit).toBe(false);
  });
});
