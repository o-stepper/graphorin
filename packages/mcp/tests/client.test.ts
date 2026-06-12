import { getCounterForTesting, resetCountersForTesting } from '@graphorin/tools/audit';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createMCPClientFromSdkTransport } from '../src/client/client.js';
import type { MCPClient } from '../src/client/index.js';
import { MCPProtocolError, MCPToolNotFoundError } from '../src/errors/index.js';
import { startInMemoryServer } from './__fixtures__/in-memory-server.js';

describe('MCPClient — integration against the in-memory MCP server', () => {
  let client: MCPClient | undefined;
  let dispose: (() => Promise<void>) | undefined;

  beforeEach(() => {
    resetCountersForTesting();
  });

  afterEach(async () => {
    if (client !== undefined) {
      await client.close();
      client = undefined;
    }
    if (dispose !== undefined) {
      await dispose();
      dispose = undefined;
    }
  });

  it('listTools returns the registered tool catalogue', async () => {
    const fixture = await startInMemoryServer({
      tools: [
        {
          name: 'search',
          description: 'Search for issues.',
          inputSchema: {
            type: 'object',
            properties: { query: { type: 'string' } },
            required: ['query'],
          },
        },
      ],
    });
    dispose = fixture.close;
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
    });
    const tools = await client.listTools();
    expect(tools.length).toBe(1);
    expect(tools[0]?.name).toBe('search');
    expect(tools[0]?.description).toBe('Search for issues.');
  });

  it('callTool delegates to the configured handler and returns the content', async () => {
    const fixture = await startInMemoryServer({
      tools: [
        {
          name: 'echo',
          inputSchema: {
            type: 'object',
            properties: { message: { type: 'string' } },
            required: ['message'],
          },
        },
      ],
      callToolHandler: async (name, args) => {
        const message = (args as { message?: string } | undefined)?.message ?? '';
        return {
          content: [{ type: 'text', text: `${name}:${message}` }],
        };
      },
    });
    dispose = fixture.close;
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
    });
    const out = await client.callTool('echo', { message: 'hello' });
    expect(out.content[0]).toEqual({ type: 'text', text: 'echo:hello' });
    expect(
      getCounterForTesting('mcp.call.invoked.total', {
        server: client.serverIdentity.id,
        tool: 'echo',
      }),
    ).toBeGreaterThanOrEqual(1);
  });

  it('callTool surfaces tool-not-found errors as MCPToolNotFoundError', async () => {
    const fixture = await startInMemoryServer({
      tools: [
        {
          name: 'noop',
          inputSchema: { type: 'object' },
        },
      ],
      callToolHandler: async (name) => {
        throw new Error(`tool not found: ${name}`);
      },
    });
    dispose = fixture.close;
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
    });
    await expect(client.callTool('noop', {})).rejects.toBeInstanceOf(MCPToolNotFoundError);
  });

  it('listResources + readResource return the registered resource bytes', async () => {
    const fixture = await startInMemoryServer({
      resources: [
        {
          uri: 'mem://greeting',
          name: 'greeting',
          mimeType: 'text/plain',
          content: { text: 'Hello, world.' },
        },
      ],
    });
    dispose = fixture.close;
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
    });
    const list = await client.listResources();
    expect(list.length).toBe(1);
    expect(list[0]?.uri).toBe('mem://greeting');
    const content = await client.readResource('mem://greeting');
    expect(content.text).toBe('Hello, world.');
  });

  it('listPrompts + getPrompt return the registered prompt bytes', async () => {
    const fixture = await startInMemoryServer({
      prompts: [{ name: 'greeting', description: 'A friendly greeting.' }],
      getPromptHandler: async (name) => ({
        messages: [{ role: 'user', content: { type: 'text', text: `prompt:${name}` } }],
      }),
    });
    dispose = fixture.close;
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
    });
    const list = await client.listPrompts();
    expect(list[0]?.name).toBe('greeting');
    const result = await client.getPrompt('greeting');
    expect(result.messages[0]?.content).toEqual({ type: 'text', text: 'prompt:greeting' });
  });

  it('readResource throws MCPProtocolError when the server returns no contents', async () => {
    const fixture = await startInMemoryServer({
      resources: [
        {
          uri: 'mem://nope',
          // No content body — the fixture returns `contents: [...]` with
          // a single entry; we test the empty-array branch by using a
          // missing resource.
        },
      ],
    });
    dispose = fixture.close;
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
    });
    await expect(client.readResource('mem://does-not-exist')).rejects.toBeInstanceOf(
      MCPProtocolError,
    );
  });

  it('the resumable property is false when the underlying transport is in-memory', async () => {
    const fixture = await startInMemoryServer();
    dispose = fixture.close;
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
    });
    expect(client.resumable).toBe(false);
  });

  it('the operator-supplied logger receives the session-id INFO line', async () => {
    const fixture = await startInMemoryServer();
    dispose = fixture.close;
    const lines: { level: string; message: string }[] = [];
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
      logger: (level, message) => {
        lines.push({ level, message });
      },
    });
    expect(lines.some((l) => l.message === 'mcp.session.session-id.resolved')).toBe(true);
  });

  it('close() is idempotent under double invocation', async () => {
    const fixture = await startInMemoryServer();
    dispose = fixture.close;
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
    });
    await client.close();
    await client.close();
    client = undefined;
  });
});
