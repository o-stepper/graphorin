import { describe, expect, it } from 'vitest';

import { type BridgedToolCall, runBridgedSource } from '../../src/sandbox/bridged-source.js';

/** A dispatch that records every bridged call and answers from a table. */
function recordingDispatch(table: Record<string, (args: unknown) => unknown>): {
  dispatch: (c: BridgedToolCall) => Promise<unknown>;
  calls: BridgedToolCall[];
} {
  const calls: BridgedToolCall[] = [];
  return {
    calls,
    dispatch: async (c) => {
      calls.push(c);
      const fn = table[c.name];
      if (fn === undefined) throw new Error(`no such tool: ${c.name}`);
      return fn(c.args);
    },
  };
}

describe('runBridgedSource', () => {
  it('round-trips a single tool call and returns the final value', async () => {
    const { dispatch, calls } = recordingDispatch({
      add: (args) => {
        const { a, b } = args as { a: number; b: number };
        return a + b;
      },
    });
    const result = await runBridgedSource({
      source: 'const s = await tools.add({ a: 2, b: 3 }); return s * 10;',
      allowedTools: ['add'],
      dispatch,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.output).toBe(50);
    expect(result.toolCalls).toBe(1);
    expect(calls).toEqual([{ name: 'add', args: { a: 2, b: 3 } }]);
  });

  it('keeps intermediate values in the worker — only the final result crosses back', async () => {
    // `big` would be ~200 KB if inlined; the script reduces it to a count.
    const { dispatch } = recordingDispatch({
      fetchBig: () => 'X'.repeat(200_000),
      fetchBig2: () => 'Y'.repeat(200_000),
    });
    const result = await runBridgedSource({
      source: `
        const a = await tools.fetchBig({});
        const b = await tools.fetchBig2({});
        return { totalLength: a.length + b.length, sample: a.slice(0, 3) };
      `,
      allowedTools: ['fetchBig', 'fetchBig2'],
      dispatch,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toEqual({ totalLength: 400_000, sample: 'XXX' });
      // The 400 KB of intermediate data never appears in the returned value.
      expect(JSON.stringify(result.output).length).toBeLessThan(100);
    }
    expect(result.toolCalls).toBe(2);
  });

  it('refuses a tool name that is not in allowedTools (dispatch never sees it)', async () => {
    const { dispatch, calls } = recordingDispatch({ allowed: () => 'ok' });
    const result = await runBridgedSource({
      // `tools.secret` is not even defined on the frozen `tools` object,
      // so calling it throws a TypeError inside the worker.
      source: 'return await tools.secret({});',
      allowedTools: ['allowed'],
      dispatch,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('execution-failed');
    expect(calls).toEqual([]); // the host bridge was never consulted
  });

  it('enforces the tool-call budget', async () => {
    const { dispatch } = recordingDispatch({ ping: () => 1 });
    const result = await runBridgedSource({
      source: 'let n = 0; for (let i = 0; i < 10; i++) n += await tools.ping({}); return n;',
      allowedTools: ['ping'],
      dispatch,
      maxToolCalls: 3,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('execution-failed');
      expect(result.error.message).toMatch(/budget exceeded/);
    }
  });

  it('surfaces a host tool error to the script, which can catch it', async () => {
    const { dispatch } = recordingDispatch({
      mayFail: () => {
        throw new Error('charge declined');
      },
    });
    const result = await runBridgedSource({
      source: `
        try { await tools.mayFail({}); return 'unreachable'; }
        catch (e) { return 'caught: ' + e.message; }
      `,
      allowedTools: ['mayFail'],
      dispatch,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.output).toBe('caught: charge declined');
  });

  it('blocks filesystem imports by default (sandbox-violation)', async () => {
    const { dispatch } = recordingDispatch({});
    const result = await runBridgedSource({
      source: "await import('node:fs'); return 'leaked';",
      allowedTools: [],
      dispatch,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('sandbox-violation');
  });

  it('blocks the child_process escape via import (D4 / tools-05)', async () => {
    const { dispatch } = recordingDispatch({});
    const result = await runBridgedSource({
      source: "const cp = await import('node:child_process'); cp.execSync('id'); return 'escaped';",
      allowedTools: [],
      dispatch,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('sandbox-violation');
  });

  it('blocks the child_process escape via CJS require (D4 / tools-05)', async () => {
    const { dispatch } = recordingDispatch({});
    const result = await runBridgedSource({
      source:
        "const { createRequire } = await import('node:module');" +
        "const req = createRequire(process.cwd() + '/x.js');" +
        "req('child_process').execSync('id'); return 'escaped';",
      allowedTools: [],
      dispatch,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('sandbox-violation');
  });

  it('blocks vm and worker_threads nested escapes (D4 / tools-05)', async () => {
    const { dispatch } = recordingDispatch({});
    for (const mod of ['node:vm', 'node:worker_threads']) {
      const result = await runBridgedSource({
        source: `await import('${mod}'); return 'escaped';`,
        allowedTools: [],
        dispatch,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.kind).toBe('sandbox-violation');
    }
  });

  it('enforces a wall-clock timeout on a non-terminating script', async () => {
    const { dispatch } = recordingDispatch({});
    const result = await runBridgedSource({
      source: 'while (true) {} ',
      allowedTools: [],
      dispatch,
      timeoutMs: 200,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('timeout');
  });

  it('does not expose host environment variables to the script (TL-9)', async () => {
    process.env.GRAPHORIN_TL9_PROBE = 'host-secret';
    try {
      const { dispatch } = recordingDispatch({});
      const result = await runBridgedSource({
        source:
          'return { probe: process.env.GRAPHORIN_TL9_PROBE ?? null, keys: Object.keys(process.env) };',
        allowedTools: [],
        dispatch,
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.output).toEqual({ probe: null, keys: [] });
    } finally {
      delete process.env.GRAPHORIN_TL9_PROBE;
    }
  });

  it('aborts when the signal fires before dispatch', async () => {
    const { dispatch } = recordingDispatch({});
    const controller = new AbortController();
    controller.abort();
    const result = await runBridgedSource({
      source: 'return 1;',
      allowedTools: [],
      dispatch,
      signal: controller.signal,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('aborted');
  });
});
