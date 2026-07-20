/**
 * App-compose module loading (`graphorin start` + config `app` field):
 * the loader unit surface, the mount-through-createServer integration,
 * and a REAL boot of the `graphorin init --app` scaffold - the shipped
 * template must compose a working store + memory + sessions server,
 * not just parse.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { createServer } from '@graphorin/server';
import { afterEach, describe, expect, it } from 'vitest';

import { runInit } from '../src/commands/init.js';
import { AppModuleError, loadAppModule } from '../src/internal/app-module.js';

const TMP_ROOT = join(import.meta.dirname, '.tmp-app-module');
let seq = 0;

async function tempDir(): Promise<string> {
  seq += 1;
  const dir = join(TMP_ROOT, `case-${seq}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

afterEach(async () => {
  await rm(TMP_ROOT, { recursive: true, force: true });
});

const BASE_CONFIG = {
  auth: { kind: 'none' },
  storage: { path: ':memory:', mode: 'lib' },
  server: { rateLimit: { enabled: false }, csrf: { enabled: false } },
} as const;

describe('loadAppModule', () => {
  it('imports a default-export factory and hands it the validated context', async () => {
    const dir = await tempDir();
    const appPath = join(dir, 'app.mjs');
    await writeFile(
      appPath,
      `export default async function createApp(ctx) {
        return { sessions: { marker: ctx.configDir, port: ctx.config.server.port } };
      }`,
    );
    const configPath = join(dir, 'graphorin.config.json');
    const { bag, close } = await loadAppModule('./app.mjs', configPath, BASE_CONFIG);
    expect(close).toBeUndefined();
    const sessions = bag.sessions as unknown as { marker: string; port: number };
    expect(sessions.marker).toBe(dir);
    // parseServerConfig applied the defaults before the factory ran.
    expect(sessions.port).toBe(8080);
  });

  it('falls back to the named createApp export', async () => {
    const dir = await tempDir();
    await writeFile(join(dir, 'app.mjs'), `export function createApp() { return { runs: 'r' }; }`);
    const { bag } = await loadAppModule('./app.mjs', join(dir, 'g.json'), BASE_CONFIG);
    expect(bag.runs).toBe('r');
  });

  it('splits the close hook out of the bag', async () => {
    const dir = await tempDir();
    await writeFile(
      join(dir, 'app.mjs'),
      `export default () => ({ sessions: 's', close: () => 'closed' });`,
    );
    const { bag, close } = await loadAppModule('./app.mjs', join(dir, 'g.json'), BASE_CONFIG);
    expect(bag).toEqual({ sessions: 's' });
    expect(close?.()).toBe('closed');
  });

  it('rejects a missing module with the resolved path in the message', async () => {
    const dir = await tempDir();
    await expect(loadAppModule('./nope.mjs', join(dir, 'g.json'), BASE_CONFIG)).rejects.toThrow(
      AppModuleError,
    );
    await expect(loadAppModule('./nope.mjs', join(dir, 'g.json'), BASE_CONFIG)).rejects.toThrow(
      join(dir, 'nope.mjs'),
    );
  });

  it('rejects a module without a factory export', async () => {
    const dir = await tempDir();
    await writeFile(join(dir, 'app.mjs'), `export const answer = 42;`);
    await expect(loadAppModule('./app.mjs', join(dir, 'g.json'), BASE_CONFIG)).rejects.toThrow(
      /must default-export a factory function/,
    );
  });

  it('rejects a factory that returns a non-object', async () => {
    const dir = await tempDir();
    await writeFile(join(dir, 'app.mjs'), `export default () => 'nope';`);
    await expect(loadAppModule('./app.mjs', join(dir, 'g.json'), BASE_CONFIG)).rejects.toThrow(
      /must return an adapter bag object/,
    );
  });

  it('rejects a non-function close', async () => {
    const dir = await tempDir();
    await writeFile(join(dir, 'app.mjs'), `export default () => ({ close: 'later' });`);
    await expect(loadAppModule('./app.mjs', join(dir, 'g.json'), BASE_CONFIG)).rejects.toThrow(
      /non-function `close`/,
    );
  });
});

describe('app bag mounts the domain surface', () => {
  it('a bare server 404s /v1/sessions; the composed bag serves it', async () => {
    const bare = await createServer({
      config: BASE_CONFIG,
      skipHardening: true,
      skipListen: true,
    });
    await bare.start();
    try {
      const res = await bare.app.request('/v1/sessions');
      expect(res.status).toBe(404);
    } finally {
      await bare.stop();
    }

    const dir = await tempDir();
    await writeFile(
      join(dir, 'app.mjs'),
      `export default () => ({
        sessions: {
          list: async () => [{ id: 'sess-1' }],
          get: async () => null,
          create: async (input) => ({ id: 'sess-new', ...input }),
          remove: async () => false,
          listMessages: async () => [],
          listHandoffs: async () => [],
        },
      });`,
    );
    const { bag } = await loadAppModule('./app.mjs', join(dir, 'g.json'), BASE_CONFIG);
    const composed = await createServer({
      config: BASE_CONFIG,
      ...bag,
      skipHardening: true,
      skipListen: true,
    });
    await composed.start();
    try {
      const res = await composed.app.request('/v1/sessions');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ sessions: [{ id: 'sess-1' }] });
    } finally {
      await composed.stop();
    }
  });
});

describe('init --app scaffold boots for real', () => {
  it('the scaffolded module composes store + memory + sessions and serves them', async () => {
    const dir = await tempDir();
    const result = await runInit({
      cwd: dir,
      format: 'json',
      nonInteractive: true,
      app: true,
      print: () => undefined,
    });
    expect(result.appPath).toBe(join(dir, 'graphorin.app.mjs'));
    const written = (await import('node:fs/promises')).readFile;
    const config = JSON.parse(await written(result.configPath, 'utf8')) as Record<string, unknown>;
    expect(config.app).toBe('./graphorin.app.mjs');

    // Boot through the scaffold with an in-memory store (the written
    // config points at a file DB; the test swaps storage only).
    const testConfig = { ...config, ...BASE_CONFIG };
    const { bag, close } = await loadAppModule(
      './graphorin.app.mjs',
      result.configPath,
      testConfig,
    );
    expect(close).toBeTypeOf('function');
    const server = await createServer({
      config: testConfig,
      ...bag,
      skipHardening: true,
      skipListen: true,
    });
    await server.start();
    try {
      const created = await server.app.request('/v1/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: 'u-1', agentId: 'a-1' }),
      });
      expect(created.status).toBe(201);
      const listed = await server.app.request('/v1/sessions?userId=u-1');
      expect(listed.status).toBe(200);
      expect(((await listed.json()) as { sessions: unknown[] }).sessions).toHaveLength(1);
    } finally {
      await server.stop();
      await close?.();
    }
  });

  it('refuses to overwrite an existing app module', async () => {
    const dir = await tempDir();
    await writeFile(join(dir, 'graphorin.app.mjs'), '// existing');
    await expect(
      runInit({
        cwd: dir,
        format: 'json',
        nonInteractive: true,
        app: true,
        print: () => undefined,
      }),
    ).rejects.toThrow(/refusing to overwrite existing/);
  });
});
