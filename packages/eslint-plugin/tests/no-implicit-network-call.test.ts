import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { lintSource } from './_lint.js';

const FRAMEWORK_PATH = '/repo/packages/agent/src/runtime.js';
const APP_PATH = '/home/user/projects/myapp/src/main.js';

describe('@graphorin/no-implicit-network-call', () => {
  it('flags a bare fetch() in framework code', () => {
    const messages = lintSource({
      source: `await fetch('https://example.com');`,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe('forbidden');
  });

  it('flags axios.get / axios.post / axios calls', () => {
    const messages = lintSource({
      source: `
        await axios.get('/x');
        await axios.post('/y');
        await axios({ url: '/z' });
      `,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(messages.length).toBe(3);
    expect(messages.every((m) => m.messageId === 'forbidden')).toBe(true);
  });

  it('flags https.request / http.request', () => {
    const messages = lintSource({
      source: `
        const req = https.request({ host: 'example.com' });
        const req2 = http.request({ host: 'example.com' });
      `,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(messages.length).toBeGreaterThanOrEqual(2);
  });

  it('flags new XMLHttpRequest()', () => {
    const messages = lintSource({
      source: `const xhr = new XMLHttpRequest();`,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(messages).toHaveLength(1);
  });

  it('respects the graphorin-allow-network opt-out comment', () => {
    const messages = lintSource({
      source: `
        // graphorin-allow-network: provider adapter; user explicitly initiated
        await fetch('https://api.openai.com/v1/chat/completions');
      `,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(messages).toEqual([]);
  });

  it('does NOT flag fetch() in non-framework consumer code', () => {
    const messages = lintSource({
      source: `await fetch('/api/data');`,
      rule: 'no-implicit-network-call',
      filename: APP_PATH,
    });
    expect(messages).toEqual([]);
  });

  it('ignores unrelated function calls', () => {
    const messages = lintSource({
      source: `
        Promise.resolve();
        myAdapter.send({ data: 'ok' });
      `,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(messages).toEqual([]);
  });

  // EB-10 parity: the rule must stay in lockstep with
  // scripts/check-no-network.mjs, which also catches undici/got calls,
  // raw sockets, WebSocket/EventSource, and HTTP-client imports.
  it('flags undici.request / got.get namespace calls', () => {
    const messages = lintSource({
      source: `
        await undici.request('https://example.com');
        await got.get('https://example.com');
        await undici.stream('https://example.com');
      `,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(messages.length).toBe(3);
    expect(messages.every((m) => m.messageId === 'forbidden')).toBe(true);
  });

  it('flags raw socket primitives (net/tls/dgram)', () => {
    const messages = lintSource({
      source: `
        const a = net.createConnection({ port: 80 });
        const b = net.connect(80, 'example.com');
        const c = tls.connect({ port: 443 });
        const d = dgram.createSocket('udp4');
      `,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(messages.length).toBe(4);
  });

  it('flags new WebSocket() and new EventSource()', () => {
    const messages = lintSource({
      source: `
        const ws = new WebSocket('wss://example.com');
        const es = new EventSource('https://example.com/stream');
      `,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(messages.length).toBe(2);
    expect(messages.every((m) => m.messageId === 'forbidden')).toBe(true);
  });

  it('flags static, dynamic, and require() imports of HTTP clients', () => {
    const staticImport = lintSource({
      source: `import { request } from 'undici';`,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(staticImport).toHaveLength(1);
    expect(staticImport[0]?.messageId).toBe('forbiddenImport');

    const dynamicImport = lintSource({
      source: `const got = await import('got');`,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(dynamicImport).toHaveLength(1);
    expect(dynamicImport[0]?.messageId).toBe('forbiddenImport');

    const required = lintSource({
      source: `const ky = require('ky');`,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(required).toHaveLength(1);
    expect(required[0]?.messageId).toBe('forbiddenImport');
  });

  it('honours the opt-out comment on imports and does not flag benign imports', () => {
    const allowed = lintSource({
      source: `
        // graphorin-allow-network: MCP websocket transport; user-configured endpoint
        import WebSocket from 'ws';
      `,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(allowed).toEqual([]);

    const benign = lintSource({
      source: `
        import { readFile } from 'node:fs/promises';
        const path = await import('node:path');
        const util = require('node:util');
      `,
      rule: 'no-implicit-network-call',
      filename: FRAMEWORK_PATH,
    });
    expect(benign).toEqual([]);
  });

  it('does NOT flag the new shapes in non-framework consumer code', () => {
    const messages = lintSource({
      source: `
        import { request } from 'undici';
        const ws = new WebSocket('wss://example.com');
        await got.get('https://example.com');
        const sock = net.createConnection({ port: 80 });
      `,
      rule: 'no-implicit-network-call',
      filename: APP_PATH,
    });
    expect(messages).toEqual([]);
  });
});

/**
 * W-039 two-stage activation: real fixture trees on disk, so the
 * nearest-package.json walk actually resolves (unlike the virtual
 * /repo/... paths above, which exercise the fail-open branch).
 */
describe('@graphorin/no-implicit-network-call - W-039 activation', () => {
  const acmeApp = fileURLToPath(
    new URL('./fixtures/acme-monorepo/packages/x/src/app.js', import.meta.url),
  );
  const acmeSecond = fileURLToPath(
    new URL('./fixtures/acme-monorepo/packages/x/src/second.js', import.meta.url),
  );
  const graphorinLike = fileURLToPath(
    new URL('./fixtures/graphorin-like/packages/y/src/app.js', import.meta.url),
  );

  const read = (p: string) => readFileSync(p, 'utf8');

  it('does not report a third-party scope (@acme/x) under packages/*/src by default', () => {
    const messages = lintSource({
      source: read(acmeApp),
      rule: 'no-implicit-network-call',
      filename: acmeApp,
    });
    expect(messages).toEqual([]);
  });

  it('reports @acme/x when packagePrefixes opts the scope in', () => {
    const messages = lintSource({
      source: read(acmeApp),
      rule: 'no-implicit-network-call',
      filename: acmeApp,
      options: [{ packagePrefixes: ['@acme/'] }],
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe('forbidden');
  });

  it('reports @graphorin/y by default (prefix match)', () => {
    const messages = lintSource({
      source: read(graphorinLike),
      rule: 'no-implicit-network-call',
      filename: graphorinLike,
    });
    expect(messages).toHaveLength(1);
  });

  it('stays consistent for a second file of the same package (cached walk-up)', () => {
    const first = lintSource({
      source: read(acmeApp),
      rule: 'no-implicit-network-call',
      filename: acmeApp,
    });
    const second = lintSource({
      source: read(acmeSecond),
      rule: 'no-implicit-network-call',
      filename: acmeSecond,
    });
    expect(first).toEqual([]);
    expect(second).toEqual([]);
  });
});
