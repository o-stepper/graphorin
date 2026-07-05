import type { ToolReturn } from '@graphorin/core';
import { afterEach, describe, expect, it } from 'vitest';

import { adaptCallResult } from '../src/client/adapt-result.js';
import { createMCPClientFromSdkTransport } from '../src/client/client.js';
import type { MCPClient } from '../src/client/index.js';
import { startInMemoryServer } from './__fixtures__/in-memory-server.js';

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]).toString('base64');

describe('MC-8/MC-11 - non-text content and structured payloads are never silently lost', () => {
  let client: MCPClient | undefined;
  let dispose: (() => Promise<void>) | undefined;

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

  async function buildTool(opts: Parameters<typeof startInMemoryServer>[0]) {
    const fixture = await startInMemoryServer(opts);
    dispose = fixture.close;
    client = await createMCPClientFromSdkTransport({
      transport: fixture.clientTransport,
      transportConfig: { kind: 'streamable-http', url: 'https://example.com/mcp' },
    });
    const tools = await client.toTools();
    const tool = tools[0];
    if (!tool) throw new Error('expected an adapted tool');
    return tool;
  }

  it('MC-8: an image-only result yields a descriptive output, not an empty string', async () => {
    const tool = await buildTool({
      tools: [{ name: 'screenshot', description: 'returns an image', inputSchema: {} }],
      callToolHandler: async () => ({
        content: [{ type: 'image', data: PNG_BYTES, mimeType: 'image/png' }],
      }),
    });
    const result = (await tool.execute({}, undefined as never)) as ToolReturn<unknown>;
    const output = String(result.output);
    expect(output.length).toBeGreaterThan(0);
    expect(output).toContain('[image image/png');
    expect(result.contentParts?.some((p) => p.type === 'image')).toBe(true);
  });

  it('MC-8: embedded resource TEXT joins the model-facing output', async () => {
    const tool = await buildTool({
      tools: [{ name: 'doc', description: 'returns an embedded resource', inputSchema: {} }],
      callToolHandler: async () => ({
        content: [
          {
            type: 'resource',
            resource: { uri: 'mem://doc/1', text: 'EMBEDDED BODY TEXT', mimeType: 'text/plain' },
          },
        ],
      }),
    });
    const result = (await tool.execute({}, undefined as never)) as ToolReturn<unknown>;
    expect(String(result.output)).toContain('EMBEDDED BODY TEXT');
  });

  it('MC-11: a structuredContent schema mismatch falls back to the JSON mirror, not an empty output', () => {
    // Unit-level: with a compliant server the SDK validates wire-side, so
    // the CLIENT fallback fires only when the two validators diverge -
    // exercised here with a stub schema that always rejects.
    const warnings: string[] = [];
    const result = adaptCallResult({
      result: { content: [], structuredContent: { y: 'present-but-wrong-shape' } },
      outputSchema: {
        parse: () => {
          throw new Error('mismatch');
        },
        safeParse: () => ({ success: false as const, error: new Error('mismatch') }),
        toJSON: () => ({ type: 'object' }),
      } as never,
      serverIdentity: { id: 'srv', url: 'https://example.com/mcp' } as never,
      toolName: 'typed',
      logger: (_level, message) => {
        warnings.push(message);
      },
    });
    const output = String(result.output);
    expect(output).toContain('present-but-wrong-shape'); // payload survives as JSON text
    expect(warnings.some((m) => m.includes('structured'))).toBe(true); // and is logged
  });
});
