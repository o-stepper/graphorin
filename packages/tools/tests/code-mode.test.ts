import type { ToolExecutionContext } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  type CodeExecuteBridge,
  createCodeExecuteTool,
  createCodeSearchTool,
  projectToolApi,
} from '../src/code-mode/index.js';

/** Minimal execution context — the meta-tools only read `ctx.signal`. */
const ctx = { signal: new AbortController().signal } as unknown as ToolExecutionContext;

// --- projection -------------------------------------------------------------

describe('projectToolApi', () => {
  it('renders a catalogue grouped by source and a typed signature from JSON Schema', () => {
    const projection = projectToolApi([
      {
        name: 'list_orders',
        description: "List a customer's open orders. Returns an array.",
        inputSchema: {
          type: 'object',
          properties: { customerId: { type: 'string' }, limit: { type: 'integer' } },
          required: ['customerId'],
        },
        __source: { kind: 'first-party' },
      },
      {
        name: 'web_fetch',
        description: 'Fetch a URL.',
        inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] },
        __source: { kind: 'mcp', serverIdentity: 'browser' },
      },
    ]);

    expect(projection.names).toEqual(['list_orders', 'web_fetch']);
    expect(projection.catalogue).toContain('## first-party');
    expect(projection.catalogue).toContain('## mcp:browser');
    expect(projection.catalogue).toContain('- list_orders:');

    const sig = projection.signatureFor('list_orders');
    expect(sig).toContain('tools.list_orders');
    expect(sig).toContain('"customerId": string');
    expect(sig).toContain('"limit"?: number'); // optional (not in `required`)
  });

  it('falls back to `input: unknown` and bracket access for an opaque/odd-named schema', () => {
    const projection = projectToolApi([
      { name: 'weird.name', inputSchema: { parse() {}, safeParse() {} } },
    ]);
    const sig = projection.signatureFor('weird.name');
    expect(sig).toContain('tools["weird.name"]'); // dotted name → bracket form
    expect(sig).toContain('input: unknown'); // unreadable validator → unknown
  });

  it('renders a typed signature from a plain Zod schema (tools-01)', () => {
    // The documented way to declare a tool — no hand-written toJSON().
    const projection = projectToolApi([
      {
        name: 'search_orders',
        description: 'Search orders.',
        inputSchema: z.object({
          query: z.string(),
          limit: z.number().int().optional(),
        }),
        outputSchema: z.object({ ids: z.array(z.string()) }),
      },
    ]);
    const sig = projection.signatureFor('search_orders');
    expect(sig).toContain('"query": string');
    expect(sig).toContain('"limit"?: number');
    expect(sig).toContain('Promise<{ "ids": string[] }>');
    expect(sig).not.toContain('input: unknown');
  });

  it('search() matches name or description (case-insensitive)', () => {
    const projection = projectToolApi([
      { name: 'list_orders', description: 'List orders' },
      { name: 'charge_card', description: 'Charge a credit card' },
    ]);
    const hit = projection.search('ORDER');
    expect(hit).toContain('tools.list_orders');
    expect(hit).not.toContain('tools.charge_card');
  });
});

// --- code_search ------------------------------------------------------------

describe('createCodeSearchTool', () => {
  it('returns eager signatures for a matching query', async () => {
    const search = createCodeSearchTool({
      projection: projectToolApi([
        { name: 'list_orders', description: 'List orders' },
        { name: 'charge_card', description: 'Charge a card' },
      ]),
    });
    const out = await search.execute({ query: 'order' }, ctx);
    expect(out).toContain('tools.list_orders');
    expect(out).not.toContain('tools.charge_card');
  });

  it('folds in deferred-pool matches and projects their signatures', async () => {
    const search = createCodeSearchTool({
      projection: projectToolApi([]),
      searchDeferred: async () => [
        {
          name: 'refund',
          description: 'Refund an order',
          inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        },
      ],
    });
    const out = await search.execute({ query: 'refund' }, ctx);
    expect(out).toContain('tools.refund');
    expect(out).toContain('"id": string');
  });

  it('returns the catalogue when nothing matches', async () => {
    const search = createCodeSearchTool({
      projection: projectToolApi([{ name: 'list_orders', description: 'List orders' }]),
    });
    const out = await search.execute({ query: 'zzznope' }, ctx);
    expect(out).toContain('No tool matches');
    expect(out).toContain('list_orders');
  });
});

// --- code_execute -----------------------------------------------------------

describe('createCodeExecuteTool', () => {
  const adder: CodeExecuteBridge = async (call) => {
    const { a, b } = call.args as { a: number; b: number };
    if (call.name === 'add') return a + b;
    if (call.name === 'mul') return a * b;
    throw new Error(`no such tool: ${call.name}`);
  };

  function execTool(executeTool: CodeExecuteBridge) {
    return createCodeExecuteTool({
      projection: projectToolApi([{ name: 'add' }, { name: 'mul' }, { name: 'big' }]),
      allowedTools: ['add', 'mul', 'big'],
      executeTool,
    });
  }

  it('runs a real multi-tool script and returns only the final value', async () => {
    const out = await execTool(adder).execute(
      {
        source:
          'const s = await tools.add({ a: 2, b: 3 }); const m = await tools.mul({ a: s, b: 4 }); return { m };',
      },
      ctx,
    );
    expect(out).toBe(JSON.stringify({ m: 20 }, null, 2));
  });

  it('keeps a large intermediate out of the returned result', async () => {
    const bridge: CodeExecuteBridge = async (call) =>
      call.name === 'big' ? 'Z'.repeat(50_000) : undefined;
    const out = await execTool(bridge).execute(
      { source: 'const b = await tools.big({}); return { len: b.length };' },
      ctx,
    );
    expect(out).toBe(JSON.stringify({ len: 50_000 }, null, 2));
    expect(out).not.toContain('ZZZ'); // the 50 KB intermediate never surfaces
    expect(String(out).length).toBeLessThan(50);
  });

  it('returns a plain string result verbatim', async () => {
    const bridge: CodeExecuteBridge = async () => 'hi';
    const out = await execTool(bridge).execute(
      { source: 'return await tools.add({ a: 0, b: 0 }), "plain text";' },
      ctx,
    );
    expect(out).toBe('plain text');
  });

  it('throws when the script throws', async () => {
    await expect(
      execTool(adder).execute({ source: 'throw new Error("boom");' }, ctx),
    ).rejects.toThrow(/code_execute failed.*boom/);
  });

  it('uses the injected runner (no real worker needed for wiring tests)', async () => {
    const seen: string[] = [];
    const tool = createCodeExecuteTool({
      projection: projectToolApi([{ name: 'add' }]),
      allowedTools: ['add'],
      executeTool: adder,
      run: async (o) => {
        // Simulate the worker invoking one bridged call, then returning.
        const v = await o.dispatch({ name: 'add', args: { a: 1, b: 1 } });
        seen.push(o.source);
        return { ok: true as const, output: { doubled: v }, toolCalls: 1, durationMs: 1 };
      },
    });
    const out = await tool.execute({ source: 'IGNORED BY FAKE RUNNER' }, ctx);
    expect(out).toBe(JSON.stringify({ doubled: 2 }, null, 2));
    expect(seen).toEqual(['IGNORED BY FAKE RUNNER']);
  });
});
