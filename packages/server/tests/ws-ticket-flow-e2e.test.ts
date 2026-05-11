/**
 * End-to-end ticket flow against a live Graphorin server. Covers:
 *
 *  - `POST /v1/session/ws-ticket` issues a single-use ticket.
 *  - WS upgrade with the ticket attached as a `ticket.<value>` token
 *    in `Sec-WebSocket-Protocol` succeeds.
 *  - Reusing the same ticket against a second WS upgrade is rejected
 *    by the server with the Graphorin `auth.invalid` close code.
 */

import { _resetResolversForTesting, installBuiltinResolvers } from '@graphorin/security/secrets';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { createServer, type GraphorinServer } from '../src/app.js';

let server: GraphorinServer | undefined;
let port = 0;
let rawToken = '';

beforeAll(async () => {
  _resetResolversForTesting();
  installBuiltinResolvers();
  process.env.GRAPHORIN_TEST_PEPPER_TICKET_E2E = 'pepper-with-enough-entropy-TKT';
  const store = await createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
  server = await createServer({
    store,
    skipHardening: true,
    config: {
      auth: { kind: 'token', pepperRef: 'env:GRAPHORIN_TEST_PEPPER_TICKET_E2E' },
      storage: { path: ':memory:', mode: 'lib' },
      server: {
        host: '127.0.0.1',
        port: 0,
        rateLimit: { enabled: false },
        csrf: { enabled: false },
      },
    },
  });
  const listening = await server.start();
  port = listening.port;

  const { createToken } = await import('@graphorin/security');
  const { resolveSecret } = await import('@graphorin/security/secrets');
  const pepper = await resolveSecret('env:GRAPHORIN_TEST_PEPPER_TICKET_E2E');
  const minted = await createToken({
    tokenStore: store.authTokens,
    pepper,
    env: 'live',
    scopes: ['agents:invoke:*'],
  });
  rawToken = await minted.raw.use((value) => value);
});

afterAll(async () => {
  if (server !== undefined) await server.stop();
  delete process.env.GRAPHORIN_TEST_PEPPER_TICKET_E2E;
});

interface IssuedTicket {
  ticket: string;
  expiresAt: number;
  ttlMs: number;
}

async function mintTicket(): Promise<IssuedTicket> {
  if (server === undefined) throw new Error('server missing');
  const res = await server.app.request('/v1/session/ws-ticket', {
    method: 'POST',
    headers: { Authorization: `Bearer ${rawToken}` },
  });
  expect(res.status).toBe(201);
  return (await res.json()) as IssuedTicket;
}

interface UpgradeOutcome {
  opened: boolean;
  closeCode: number | undefined;
  protocol: string | undefined;
  error: Error | undefined;
}

async function attemptUpgrade(ticket: string, timeoutMs = 1_500): Promise<UpgradeOutcome> {
  return await new Promise<UpgradeOutcome>((resolve) => {
    const url = `ws://127.0.0.1:${port}/v1/ws`;
    const ws = new WebSocket(url, ['graphorin.protocol.v1', `ticket.${ticket}`]);
    let opened = false;
    let protocol: string | undefined;
    const timeout = setTimeout(() => {
      try {
        ws.terminate();
      } catch {
        // ignore
      }
      resolve({ opened, closeCode: undefined, protocol, error: new Error('timeout') });
    }, timeoutMs);
    ws.once('open', () => {
      opened = true;
      protocol = ws.protocol;
      clearTimeout(timeout);
      ws.close();
    });
    ws.once('close', (code) => {
      clearTimeout(timeout);
      resolve({ opened, closeCode: code, protocol, error: undefined });
    });
    ws.once('unexpected-response', (_req, res) => {
      clearTimeout(timeout);
      resolve({
        opened: false,
        closeCode: undefined,
        protocol: undefined,
        error: new Error(`unexpected-response ${res.statusCode}`),
      });
    });
    ws.once('error', () => {
      // The 'close' handler resolves with the close code; suppress
      // 'error' so the promise isn't double-resolved.
    });
  });
}

describe('WebSocket ticket flow end-to-end', () => {
  it('upgrades successfully when the ticket is valid + unused', async () => {
    const issued = await mintTicket();
    const outcome = await attemptUpgrade(issued.ticket);
    expect(outcome.opened).toBe(true);
    expect(outcome.protocol).toBe('graphorin.protocol.v1');
  });

  it('rejects a reused ticket with a Graphorin auth.invalid (4002) close', async () => {
    const issued = await mintTicket();
    const first = await attemptUpgrade(issued.ticket);
    expect(first.opened).toBe(true);
    // The upgrade handshake completes (so `open` does fire briefly),
    // then the upgrade handler closes the connection immediately
    // with the Graphorin auth.invalid close code (4002).
    const second = await attemptUpgrade(issued.ticket);
    expect(second.closeCode).toBe(4002);
  });

  it('rejects a non-existent ticket with auth.invalid (4002)', async () => {
    const outcome = await attemptUpgrade('not-a-real-ticket');
    expect(outcome.closeCode).toBe(4002);
  });

  it('rejects a previously-consumed ticket with auth.invalid (4002)', async () => {
    if (server === undefined) throw new Error('server missing');
    const tickets = server.wsTickets;
    if (tickets === undefined) throw new Error('tickets missing');
    // Mint a fresh ticket via the store + consume it directly, so the
    // upgrade attempt sees a `consumed` reason from the in-memory
    // ticket store. The handler maps both `consumed` and `expired` and
    // `unknown` onto the Graphorin `auth.invalid` close code (4002).
    const ticket = tickets.issue({ tokenId: 'tok-1', scopes: [] });
    expect(tickets.consume(ticket.value).ok).toBe(true);
    const outcome = await attemptUpgrade(ticket.value);
    expect(outcome.closeCode).toBe(4002);
  });
});
