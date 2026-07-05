import { afterEach, describe, expect, it } from 'vitest';

import {
  OAuthAuthorizationError,
  OAuthCallbackError,
  OAuthFlowAbortedError,
  startLocalCallbackServer,
} from '../../src/oauth/index.js';

describe('@graphorin/security/oauth - callback server', () => {
  let activeServer: { close: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (activeServer !== undefined) {
      await activeServer.close().catch(() => undefined);
      activeServer = undefined;
    }
  });

  it('binds a localhost port and resolves on a successful callback', async () => {
    const server = await startLocalCallbackServer();
    activeServer = server;
    expect(server.port).toBeGreaterThanOrEqual(49152);
    expect(server.port).toBeLessThanOrEqual(65535);
    expect(server.redirectUri).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/callback$/u);

    const params = await Promise.race([
      server.waitForCallback(),
      fetch(`${server.redirectUri}?code=abc123&state=xyz`).then(() => undefined),
    ]);
    expect(params).toBeDefined();
    if (params !== undefined) {
      expect(params.code).toBe('abc123');
      expect(params.state).toBe('xyz');
    }
  });

  it('rejects when the callback receives an error response', async () => {
    const server = await startLocalCallbackServer();
    activeServer = server;
    const wait = server.waitForCallback();
    void fetch(`${server.redirectUri}?error=access_denied&error_description=denied%20by%20user`);
    await expect(wait).rejects.toBeInstanceOf(OAuthAuthorizationError);
  });

  it('rejects when the callback omits the code parameter', async () => {
    const server = await startLocalCallbackServer();
    activeServer = server;
    const wait = server.waitForCallback();
    void fetch(`${server.redirectUri}?state=xyz`);
    await expect(wait).rejects.toBeInstanceOf(OAuthCallbackError);
  });

  it('returns 404 for unrelated paths and 405 for non-GET requests', async () => {
    const server = await startLocalCallbackServer();
    activeServer = server;
    const notFound = await fetch(`http://127.0.0.1:${server.port}/other`);
    expect(notFound.status).toBe(404);
    const wrongMethod = await fetch(server.redirectUri, { method: 'POST' });
    expect(wrongMethod.status).toBe(405);
  });

  it('throws OAuthFlowAbortedError when the abort signal fires', async () => {
    const server = await startLocalCallbackServer();
    activeServer = server;
    const controller = new AbortController();
    const wait = server.waitForCallback(controller.signal);
    controller.abort();
    await expect(wait).rejects.toBeInstanceOf(OAuthFlowAbortedError);
  });

  it('rejects invalid configuration', async () => {
    await expect(startLocalCallbackServer({ portRange: [10, 5] })).rejects.toBeInstanceOf(
      RangeError,
    );
    await expect(startLocalCallbackServer({ path: 'no-leading-slash' })).rejects.toBeInstanceOf(
      RangeError,
    );
  });

  it('retries until it finds a free port', async () => {
    const first = await startLocalCallbackServer();
    activeServer = first;
    // Re-bind on the dynamic port range - the existing listener
    // occupies one port; the random-port retry has to skip it.
    const second = await startLocalCallbackServer({
      portRange: [49152, 65535],
      maxAttempts: 5,
    });
    expect(second.port).not.toBe(first.port);
    expect(second.redirectUri).toBe(`http://127.0.0.1:${second.port}/callback`);
    await second.close();
  });

  it('throws OAuthCallbackPortError when no port in the range can be bound', async () => {
    // Reserve a single-port range, then try to re-bind on the same
    // port - every attempt fails so the helper raises the typed error.
    const first = await startLocalCallbackServer();
    activeServer = first;
    await expect(
      startLocalCallbackServer({ portRange: [first.port, first.port], maxAttempts: 3 }),
    ).rejects.toThrow(/Could not bind any localhost port/u);
  });
});
