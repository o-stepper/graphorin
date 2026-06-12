import { getCounterForTesting, resetCountersForTesting } from '@graphorin/tools/audit';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMCPClientFromSdkTransport } from '../src/client/client.js';
import {
  createMcpResourceReader,
  type MCPClient,
  type MCPElicitationRequest,
  type MCPSamplingRequest,
} from '../src/client/index.js';
import { adaptCallResult } from '../src/client/to-tools.js';
import type { ServerIdentity } from '../src/transport/types.js';
import { startInMemoryServer } from './__fixtures__/in-memory-server.js';

const TRANSPORT = { kind: 'streamable-http', url: 'https://example.com/mcp' } as const;

const dummyServerIdentity: ServerIdentity = Object.freeze({
  kind: 'mcp-streamable-http',
  id: 'fixture',
  urlHostname: 'fixture',
  urlPath: '/',
});

// --- shared lifecycle -------------------------------------------------------

let teardowns: Array<() => Promise<void>>;
beforeEach(() => {
  resetCountersForTesting();
  teardowns = [];
});
afterEach(async () => {
  for (const t of teardowns.splice(0).reverse()) await t();
});

async function build(
  opts: Parameters<typeof startInMemoryServer>[0],
  clientOpts?: Partial<Parameters<typeof createMCPClientFromSdkTransport>[0]>,
): Promise<MCPClient> {
  const fixture = await startInMemoryServer(opts);
  teardowns.push(fixture.close);
  const client = await createMCPClientFromSdkTransport({
    transport: fixture.clientTransport,
    transportConfig: TRANSPORT,
    ...clientOpts,
  });
  teardowns.push(() => client.close());
  return client;
}

// --- resource_link → result handle ------------------------------------------

describe('WI-13 — resource_link → result handle (adaptCallResult)', () => {
  it('surfaces a resource_link as a preview + handle instead of inlining the body', () => {
    const out = adaptCallResult({
      result: {
        content: [
          {
            type: 'resource_link',
            uri: 'file:///big.json',
            name: 'big.json',
            title: 'Quarterly export',
            description: 'A very large dataset',
            mimeType: 'application/json',
            size: 1_048_576,
          },
        ],
      },
      serverIdentity: dummyServerIdentity,
      toolName: 'fetch_export',
    });
    const text = out.output as string;
    expect(typeof out.output).toBe('string');
    expect(text).toContain('resource_link');
    expect(text).toContain('Quarterly export');
    expect(text).toContain('application/json');
    expect(text).toContain('file:///big.json');
    expect(text).toContain('read_result');
    // The 1 MiB body is NOT inlined — only a compact preview.
    expect(text.length).toBeLessThan(500);
    expect(
      getCounterForTesting('mcp.resource-link.emitted.total', {
        server: 'fixture',
        tool: 'fetch_export',
      }),
    ).toBe(1);
  });

  it('keeps inlining a small embedded text resource (unchanged behaviour)', () => {
    const out = adaptCallResult({
      result: { content: [{ type: 'text', text: 'plain body' }] },
      serverIdentity: dummyServerIdentity,
      toolName: 'echo',
    });
    expect(out.output).toBe('plain body');
  });
});

// --- createMcpResourceReader ------------------------------------------------

describe('WI-13 — createMcpResourceReader', () => {
  it('resolves an MCP resource URI via readResource and pages it', async () => {
    const client = await build({
      resources: [
        {
          uri: 'file:///doc.txt',
          name: 'doc',
          mimeType: 'text/plain',
          content: { text: 'line1\nline2\nline3' },
        },
      ],
    });
    const reader = createMcpResourceReader({ clients: [client] });

    const whole = await reader.read('file:///doc.txt');
    expect(whole.content).toBe('line1\nline2\nline3');
    expect(whole.totalBytes).toBe(17);
    expect(whole.eof).toBe(true);

    const oneLine = await reader.read('file:///doc.txt', { startLine: 2, endLine: 2 });
    expect(oneLine.content).toBe('line2');

    expect(getCounterForTesting('mcp.resource-link.resolved.total', { server: client.id })).toBe(2);
  });

  it('throws when no configured server resolves the URI', async () => {
    const client = await build({ resources: [] });
    const reader = createMcpResourceReader({ clients: [client] });
    await expect(reader.read('file:///missing.txt')).rejects.toThrow(/no configured MCP server/);
  });

  it('throws when no clients are configured', async () => {
    const reader = createMcpResourceReader({ clients: [] });
    await expect(reader.read('file:///x')).rejects.toThrow(/no MCP clients configured/);
  });
});

// --- elicitation ------------------------------------------------------------

describe('WI-13 — elicitation', () => {
  it('round-trips a server-initiated elicitation through the client handler', async () => {
    let seen: MCPElicitationRequest | undefined;
    const client = await build(
      {
        tools: [{ name: 'book', inputSchema: {} }],
        callToolHandler: async (_name, _args, extra) => {
          const r = await extra.elicit({
            message: 'Confirm the booking?',
            requestedSchema: {
              type: 'object',
              properties: { confirm: { type: 'boolean' } },
              required: ['confirm'],
            },
          });
          return {
            content: [
              { type: 'text', text: `elicit:${r.action}:${JSON.stringify(r.content ?? {})}` },
            ],
          };
        },
      },
      {
        elicitation: async (req) => {
          seen = req;
          return { action: 'accept', content: { confirm: true } };
        },
      },
    );

    const result = await client.callTool('book', {});
    expect(seen?.message).toBe('Confirm the booking?');
    expect(seen?.requestedSchema).toMatchObject({ type: 'object' });
    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('elicit:accept');
    expect(text).toContain('"confirm":true');
    expect(getCounterForTesting('mcp.elicitation.accepted.total', { server: client.id })).toBe(1);
  });

  it('forwards a decline back to the server', async () => {
    const client = await build(
      {
        tools: [{ name: 'book', inputSchema: {} }],
        callToolHandler: async (_n, _a, extra) => {
          const r = await extra.elicit({
            message: 'Confirm?',
            requestedSchema: { type: 'object', properties: {} },
          });
          return { content: [{ type: 'text', text: `action:${r.action}` }] };
        },
      },
      { elicitation: async () => ({ action: 'decline' }) },
    );
    const result = await client.callTool('book', {});
    expect((result.content[0] as { type: 'text'; text: string }).text).toBe('action:decline');
  });

  it('is gated: without a handler the server cannot elicit', async () => {
    const client = await build({
      tools: [{ name: 'book', inputSchema: {} }],
      callToolHandler: async (_n, _a, extra) => {
        try {
          await extra.elicit({
            message: 'hi',
            requestedSchema: { type: 'object', properties: {} },
          });
          return { content: [{ type: 'text', text: 'elicited' }] };
        } catch (e) {
          return {
            content: [{ type: 'text', text: `blocked:${(e as Error).message}` }],
            isError: true,
          };
        }
      },
    });
    const result = await client.callTool('book', {});
    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('blocked');
  });
});

// --- sampling ---------------------------------------------------------------

describe('WI-13 — sampling', () => {
  it('round-trips a server-initiated sampling request through the client handler', async () => {
    let seen: MCPSamplingRequest | undefined;
    const client = await build(
      {
        tools: [{ name: 'summarize', inputSchema: {} }],
        callToolHandler: async (_n, _a, extra) => {
          const r = await extra.sample({
            messages: [{ role: 'user', content: { type: 'text', text: 'Summarize: hello world' } }],
            systemPrompt: 'You are concise.',
            maxTokens: 128,
          });
          return {
            content: [
              {
                type: 'text',
                text: `model:${r.model}|${(r.content as unknown as { text: string }).text}`,
              },
            ],
          };
        },
      },
      {
        sampling: async (req) => {
          seen = req;
          return {
            role: 'assistant',
            content: { type: 'text', text: 'a terse summary' },
            model: 'stub-model-1',
            stopReason: 'endTurn',
          };
        },
      },
    );

    const result = await client.callTool('summarize', {});
    expect(seen?.maxTokens).toBe(128);
    expect(seen?.systemPrompt).toBe('You are concise.');
    expect(seen?.messages[0]?.content).toEqual({ type: 'text', text: 'Summarize: hello world' });
    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('model:stub-model-1');
    expect(text).toContain('a terse summary');
    expect(getCounterForTesting('mcp.sampling.completed.total', { server: client.id })).toBe(1);
  });

  it('is gated: without a handler the server cannot sample', async () => {
    const client = await build({
      tools: [{ name: 'summarize', inputSchema: {} }],
      callToolHandler: async (_n, _a, extra) => {
        try {
          await extra.sample({
            messages: [{ role: 'user', content: { type: 'text', text: 'hi' } }],
            maxTokens: 16,
          });
          return { content: [{ type: 'text', text: 'sampled' }] };
        } catch (e) {
          return {
            content: [{ type: 'text', text: `blocked:${(e as Error).message}` }],
            isError: true,
          };
        }
      },
    });
    const result = await client.callTool('summarize', {});
    expect((result.content[0] as { type: 'text'; text: string }).text).toContain('blocked');
  });
});
