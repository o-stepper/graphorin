/**
 * Focused tests for {@link GraphorinClient.resume} (REST-based) and
 * for control-plane error paths the mock-WS suite does not exercise
 * directly.
 */

import { describe, expect, it } from 'vitest';

import { TransportFailedError } from '../src/errors.js';
import { GraphorinClient } from '../src/graphorin-client.js';

describe('GraphorinClient.resume', () => {
  it('POSTs to /v1/runs/:runId/resume with the bearer token + JSON body', async () => {
    const calls: { url: string; init: RequestInit | undefined }[] = [];
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      calls.push({
        url: typeof input === 'string' ? input : input.toString(),
        init,
      });
      return new Response(JSON.stringify({ runId: 'run-1', status: 'resumed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const client = new GraphorinClient({
      baseUrl: 'http://localhost:8080',
      auth: { kind: 'bearer', token: 'abc' },
      fetch: fetchImpl,
    });
    const result = (await client.resume('run-1', { reason: 'go' })) as {
      runId?: string;
      status?: string;
    };
    expect(result.runId).toBe('run-1');
    expect(calls).toHaveLength(1);
    const call = calls[0];
    expect(call?.url).toBe('http://localhost:8080/v1/runs/run-1/resume');
    expect(call?.init?.method).toBe('POST');
    const headers = call?.init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer abc');
    expect(headers['Content-Type']).toBe('application/json');
    expect(call?.init?.body).toBe(JSON.stringify({ directive: { reason: 'go' } }));
  });

  it('attaches an Idempotency-Key when provided', async () => {
    const calls: { headers: Record<string, string> }[] = [];
    const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      calls.push({ headers: (init?.headers ?? {}) as Record<string, string> });
      return new Response('null', { status: 200 });
    }) as typeof fetch;
    const client = new GraphorinClient({
      baseUrl: 'http://x',
      auth: { kind: 'bearer', token: 't' },
      fetch: fetchImpl,
    });
    await client.resume('run-1', undefined, { idempotencyKey: 'key-1' });
    expect(calls[0]?.headers['Idempotency-Key']).toBe('key-1');
  });

  it('rejects with TypeError when runId is empty', async () => {
    const client = new GraphorinClient({
      baseUrl: 'http://x',
      auth: { kind: 'bearer', token: 't' },
    });
    await expect(client.resume('')).rejects.toBeInstanceOf(TypeError);
  });

  it('rejects with TransportFailedError on a non-2xx response', async () => {
    const fetchImpl = (async (): Promise<Response> =>
      new Response('{"error":"forbidden"}', { status: 403 })) as typeof fetch;
    const client = new GraphorinClient({
      baseUrl: 'http://x',
      auth: { kind: 'bearer', token: 't' },
      fetch: fetchImpl,
    });
    await expect(client.resume('run-1')).rejects.toBeInstanceOf(TransportFailedError);
  });

  it('omits the Authorization header when the strategy is ticket', async () => {
    const calls: { headers: Record<string, string> }[] = [];
    const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      calls.push({ headers: (init?.headers ?? {}) as Record<string, string> });
      return new Response('null', { status: 200 });
    }) as typeof fetch;
    const client = new GraphorinClient({
      baseUrl: 'http://x',
      auth: { kind: 'ticket', ticketProvider: async () => 't' },
      fetch: fetchImpl,
    });
    await client.resume('run-1');
    expect(calls[0]?.headers.Authorization).toBeUndefined();
  });

  it('rejects when no fetch implementation is available', async () => {
    const client = new GraphorinClient({
      baseUrl: 'http://x',
      auth: { kind: 'bearer', token: 't' },
      // Exercise the runtime guard: an explicit undefined fetch is
      // illegal under exactOptionalPropertyTypes, hence the cast.
      fetch: undefined,
    } as unknown as ConstructorParameters<typeof GraphorinClient>[0]);
    const original = globalThis.fetch;
    // Temporarily delete globalThis.fetch so the guard fires.
    (globalThis as { fetch?: unknown }).fetch = undefined;
    try {
      await expect(client.resume('run-1')).rejects.toBeInstanceOf(TransportFailedError);
    } finally {
      (globalThis as { fetch?: unknown }).fetch = original;
    }
  });
});
