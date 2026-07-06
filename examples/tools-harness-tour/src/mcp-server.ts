/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * In-process MCP server for the tools-harness tour. Mirrors the
 * `packages/mcp/tests/__fixtures__/in-memory-server.ts` fixture: an SDK
 * `Server` bound to one half of an `InMemoryTransport.createLinkedPair()`,
 * with the other half returned as `clientTransport` for the client side.
 * No child process is spawned and no socket is opened - the linked pair
 * replaces the wire entirely, so the whole example stays offline.
 *
 * The catalogue is three deterministic tools:
 *
 * - `lookup_city`  - constant-table lookup returning a one-line JSON record.
 * - `count_cities` - returns the fixed table size.
 * - `render_atlas` - returns a LARGE (>100 KB) deterministic text payload,
 *   sized so the executor's `'spill-to-file'` truncation strategy always
 *   fires under a small `maxResultTokens`.
 */

import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

/** Display name the server self-reports on `initialize`. */
export const TOUR_SERVER_NAME = 'tools-harness-tour-server';

/** The large payload must clear this floor so the spill stage is honest. */
export const LARGE_PAYLOAD_MIN_BYTES = 100_000;

interface CityRecord {
  readonly id: string;
  readonly name: string;
  readonly region: string;
  readonly founded: number;
}

const CITY_TABLE: ReadonlyArray<CityRecord> = Object.freeze([
  Object.freeze({ id: 'kyiv', name: 'Kyiv', region: 'central', founded: 482 }),
  Object.freeze({ id: 'lviv', name: 'Lviv', region: 'western', founded: 1256 }),
  Object.freeze({ id: 'odesa', name: 'Odesa', region: 'southern', founded: 1794 }),
]);

const ATLAS_ROWS = 1_800;

/**
 * Build the deterministic >100 KB atlas payload: a header plus 1800
 * arithmetically derived rows (~64 bytes each). Same bytes on every
 * call, on every platform - no timestamps, no randomness.
 */
export function buildAtlasPayload(): string {
  const rows: string[] = ['atlas render v1 (deterministic fixture payload)'];
  for (let i = 0; i < ATLAS_ROWS; i++) {
    const city = CITY_TABLE[i % CITY_TABLE.length] as CityRecord;
    const marker = (i * 37) % 9973;
    rows.push(
      `atlas row ${String(i).padStart(4, '0')} | city=${city.id} | marker=${String(marker).padStart(4, '0')} | ${'.'.repeat(24)}`,
    );
  }
  return rows.join('\n');
}

/** Handle to the running in-process server. */
export interface TourMcpServer {
  /** The client half of the linked pair - hand this to the MCP client. */
  readonly clientTransport: Transport;
  /** Number of tools in the served catalogue. */
  readonly toolCount: number;
  /** Byte size of the `render_atlas` payload (always > 100 KB). */
  readonly largePayloadBytes: number;
  close(): Promise<void>;
}

const TOOL_DEFINITIONS = [
  {
    name: 'lookup_city',
    description: 'Look up one city record from a small constant table. Returns a one-line JSON.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'City id: kyiv, lviv, or odesa.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'count_cities',
    description: 'Return how many city records the constant table holds.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'render_atlas',
    description:
      'Render the full deterministic atlas as plain text. The payload is intentionally large (>100 KB).',
    inputSchema: { type: 'object', properties: {} },
  },
] as const;

/**
 * Start the in-process MCP server and return the client transport half.
 */
export async function startTourMcpServer(): Promise<TourMcpServer> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = new Server(
    { name: TOUR_SERVER_NAME, version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  const atlas = buildAtlasPayload();
  const largePayloadBytes = Buffer.byteLength(atlas, 'utf8');
  if (largePayloadBytes <= LARGE_PAYLOAD_MIN_BYTES) {
    throw new Error(
      `render_atlas payload is ${largePayloadBytes} bytes - expected > ${LARGE_PAYLOAD_MIN_BYTES}.`,
    );
  }

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_DEFINITIONS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    switch (name) {
      case 'lookup_city': {
        const id =
          typeof (args as { id?: unknown })?.id === 'string' ? (args as { id: string }).id : '';
        const record = CITY_TABLE.find((c) => c.id === id);
        if (record === undefined) {
          return {
            content: [{ type: 'text', text: `unknown city id '${id}' (try kyiv, lviv, odesa)` }],
            isError: true,
          };
        }
        return { content: [{ type: 'text', text: JSON.stringify(record) }] };
      }
      case 'count_cities':
        return { content: [{ type: 'text', text: `city count: ${CITY_TABLE.length}` }] };
      case 'render_atlas':
        return { content: [{ type: 'text', text: atlas }] };
      default:
        return { content: [{ type: 'text', text: `unknown tool '${name}'` }], isError: true };
    }
  });

  await server.connect(serverTransport);

  return {
    clientTransport,
    toolCount: TOOL_DEFINITIONS.length,
    largePayloadBytes,
    async close() {
      await server.close();
    },
  };
}
