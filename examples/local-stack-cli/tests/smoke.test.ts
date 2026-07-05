import testPkg from '../package.json' with { type: 'json' };

const pkgVersion: string = testPkg.version;

/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Smoke coverage for `examples/local-stack-cli`. Exercises the
 * deterministic stub provider + stub embedder end-to-end (so CI never
 * needs a live Ollama daemon), the deterministic echo contract, and
 * the `GRAPHORIN_OFFLINE=1` guard for the `'ollama'` recipe.
 */

import { describe, expect, it } from 'vitest';
import {
  assertLocalStackOllamaUrl,
  buildEmbedder,
  buildProvider,
  createAssistant,
  isOfflineMode,
  OllamaUnreachableError,
  resolveRecipe,
  runChatTurn,
  VERSION,
} from '../src/main.js';
import { STUB_ECHO_PREFIX } from '../src/stub-provider.js';

describe('examples/local-stack-cli - smoke', () => {
  it('exposes the package.json version', () => {
    expect(VERSION).toBe(pkgVersion);
  });

  it('runChatTurn echoes the input deterministically through the stub stack', async () => {
    const handle = await createAssistant({
      recipe: 'stub',
      storePath: ':memory:',
      sessionId: 'smoke-session',
      userId: 'smoke-user',
      env: { GRAPHORIN_LLM_RECIPE: 'stub' },
    });
    try {
      const reply = await runChatTurn(handle, 'ping');
      expect(reply).toBe(`${STUB_ECHO_PREFIX}ping`);
      expect(handle.recipe).toBe('stub');
      expect(handle.provider.name).toBe('stub');
      expect(handle.embedder).not.toBeNull();
      expect(handle.embedder?.dim()).toBe(8);
      const stubEmbedder = buildEmbedder('stub');
      const vectors = await stubEmbedder.embed(['hello', 'hello']);
      expect(vectors).toHaveLength(2);
      expect(vectors[0]).toEqual(vectors[1]);
    } finally {
      await handle.close();
    }
  }, 15_000);

  it('rejects non-loopback Ollama URLs (fully-local stack contract)', () => {
    expect(() => assertLocalStackOllamaUrl('http://203.0.113.1:11434')).toThrow(/loopback-only/i);
    expect(() =>
      buildEmbedder('ollama', {
        env: { GRAPHORIN_OLLAMA_BASE_URL: 'https://example.com' },
      }),
    ).toThrow(/loopback-only/i);
  });

  it('GRAPHORIN_OFFLINE=1 + unreachable Ollama daemon raises OllamaUnreachableError', async () => {
    const env = {
      GRAPHORIN_OFFLINE: '1',
      GRAPHORIN_LLM_RECIPE: 'ollama',
      GRAPHORIN_OLLAMA_BASE_URL: 'http://127.0.0.1:1', // reserved low-numbered port
    };
    expect(isOfflineMode(env)).toBe(true);
    expect(resolveRecipe(env)).toBe('ollama');
    await expect(
      buildProvider('ollama', {
        env,
        reachabilityProbe: async () => false,
      }),
    ).rejects.toBeInstanceOf(OllamaUnreachableError);
    await expect(
      createAssistant({
        recipe: 'ollama',
        storePath: ':memory:',
        sessionId: 'smoke-session',
        userId: 'smoke-user',
        embedder: null,
        env,
        reachabilityProbe: async () => false,
      }),
    ).rejects.toThrow(/not reachable/i);
  }, 5_000);
});
