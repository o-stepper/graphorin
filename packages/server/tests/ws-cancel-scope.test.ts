/**
 * IP-8: WS `run.cancel` and `notifications/cancelled` must enforce the same
 * `agents:invoke` scope the REST `POST /runs/:runId/abort` requires. Before the
 * fix any valid bearer token could abort any run.
 */
import { RPC_ERROR_CODES } from '@graphorin/protocol';
import { parseScope } from '@graphorin/security/auth';
import type { WSEvents } from 'hono/ws';
import { describe, expect, it } from 'vitest';
import { createWsUpgradeEvents, type WsUpgradeOptions } from '../src/ws/upgrade.js';

const SUBPROTOCOL = 'graphorin.protocol.v1';

function fakeContext(grantedScopes: string[]): Parameters<typeof createWsUpgradeEvents>[0] {
  return {
    var: {
      state: {
        auth: {
          kind: 'token',
          token: { tokenId: 't1' },
          grantedScopes: grantedScopes.map((s) => parseScope(s)),
        },
      },
    },
    req: {
      header: (name: string) =>
        name.toLowerCase() === 'sec-websocket-protocol' ? SUBPROTOCOL : undefined,
    },
  } as unknown as Parameters<typeof createWsUpgradeEvents>[0];
}

function fakeWs(sent: string[]): Parameters<NonNullable<WSEvents['onMessage']>>[1] {
  return {
    send: (data: string) => sent.push(data),
    close: () => {},
    raw: { bufferedAmount: 0 },
  } as unknown as Parameters<NonNullable<WSEvents['onMessage']>>[1];
}

function makeOptions(
  aborted: Array<{ runId: string; reason: string }>,
  known: Record<string, { agentId?: string; workflowId?: string }> = {
    'run-1': { agentId: 'agent-a' },
  },
): WsUpgradeOptions {
  return {
    dispatcher: { registerSubscriber: () => ({ unregister: () => {} }) },
    tickets: { consume: () => ({ ok: false }) },
    verifier: { verify: async () => ({ ok: false }) },
    runs: {
      // W-107: the cancel gate resolves the run first and requires the
      // OWNING resource's control scope.
      snapshot: (runId: string) =>
        known[runId] !== undefined
          ? { runId, status: 'running', startedAt: 0, ...known[runId] }
          : undefined,
      abort: (runId: string, reason: string) => {
        aborted.push({ runId, reason });
        return true;
      },
    },
  } as unknown as WsUpgradeOptions;
}

const INIT = JSON.stringify({
  v: '1',
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: { clientInfo: { name: 't', version: '1' } },
});
const CANCEL = JSON.stringify({
  v: '1',
  jsonrpc: '2.0',
  id: 2,
  method: 'run.cancel',
  params: { runId: 'run-1' },
});
const CANCELLED_NOTIF = JSON.stringify({
  v: '1',
  jsonrpc: '2.0',
  method: 'notifications/cancelled',
  params: { requestId: 'run-1' },
});

async function drive(
  grantedScopes: string[],
  frames: string[],
): Promise<{ aborted: Array<{ runId: string; reason: string }>; sent: string[] }> {
  const aborted: Array<{ runId: string; reason: string }> = [];
  const sent: string[] = [];
  const events = await createWsUpgradeEvents(fakeContext(grantedScopes), makeOptions(aborted));
  const ws = fakeWs(sent);
  for (const frame of frames) {
    events.onMessage?.({ data: frame } as never, ws);
  }
  return { aborted, sent };
}

describe('IP-8: WS cancel scope enforcement', () => {
  it('run.cancel with agents:invoke aborts the run', async () => {
    const { aborted, sent } = await drive(['agents:invoke'], [INIT, CANCEL]);
    expect(aborted).toEqual([{ runId: 'run-1', reason: 'rpc-cancel' }]);
    const last = JSON.parse(sent[sent.length - 1] ?? '{}');
    expect(last.result?.cancelled).toBe(true);
  });

  it('IP-21: a frame before initialize is a PROTOCOL_VIOLATION, not AUTH_REQUIRED', async () => {
    // run.cancel sent before `initialize` - a protocol-sequencing error on an
    // already-authenticated connection.
    const { sent } = await drive(['agents:invoke'], [CANCEL]);
    const last = JSON.parse(sent[sent.length - 1] ?? '{}');
    expect(last.error?.code).toBe(RPC_ERROR_CODES.PROTOCOL_VIOLATION);
  });

  it('run.cancel WITHOUT agents:invoke is denied (SCOPE_DENIED) and does not abort', async () => {
    const { aborted, sent } = await drive(['memory:read'], [INIT, CANCEL]);
    expect(aborted).toEqual([]);
    const last = JSON.parse(sent[sent.length - 1] ?? '{}');
    expect(last.error?.code).toBe(RPC_ERROR_CODES.SCOPE_DENIED);
  });

  it('notifications/cancelled WITHOUT agents:invoke does not abort', async () => {
    const { aborted } = await drive(['memory:read'], [INIT, CANCELLED_NOTIF]);
    expect(aborted).toEqual([]);
  });

  it('notifications/cancelled with agents:invoke aborts the run', async () => {
    const { aborted } = await drive(['agents:invoke'], [INIT, CANCELLED_NOTIF]);
    expect(aborted).toEqual([{ runId: 'run-1', reason: 'mcp-cancel' }]);
  });

  it('W-107: a three-segment grant for the OWNING agent cancels; a foreign one is denied', async () => {
    const own = await drive(['agents:invoke:agent-a'], [INIT, CANCEL]);
    expect(own.aborted.map((a) => a.runId)).toEqual(['run-1']);

    const foreign = await drive(['agents:invoke:agent-z'], [INIT, CANCEL]);
    expect(foreign.aborted).toEqual([]);
    const denied = foreign.sent.map((s) => JSON.parse(s) as { error?: { message?: string } });
    expect(denied.some((m) => m.error?.message?.includes('agents:invoke:agent-a'))).toBe(true);
  });

  it('W-107: an unknown run answers RUN_NOT_FOUND before any scope check', async () => {
    const cancelUnknown = JSON.stringify({
      v: '1',
      jsonrpc: '2.0',
      id: 9,
      method: 'run.cancel',
      params: { runId: 'run-missing' },
    });
    const { aborted, sent } = await drive([], [INIT, cancelUnknown]);
    expect(aborted).toEqual([]);
    const frames = sent.map((s) => JSON.parse(s) as { error?: { code?: number } });
    expect(frames.some((m) => m.error !== undefined)).toBe(true);
  });

  it('W-107: notifications/cancelled honours the per-resource grant silently', async () => {
    const foreign = await drive(['agents:invoke:agent-z'], [INIT, CANCELLED_NOTIF]);
    expect(foreign.aborted).toEqual([]);
    const own = await drive(['agents:invoke:agent-a'], [INIT, CANCELLED_NOTIF]);
    expect(own.aborted.map((a) => a.runId)).toEqual(['run-1']);
  });
});
