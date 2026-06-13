/**
 * Graphorin v0.5.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Smoke coverage for `examples/personal-assistant-cli`. Exercises the
 * stub provider end-to-end (so CI never depends on a live LLM), the
 * deterministic echo contract, and the `GRAPHORIN_OFFLINE=1` guard
 * for the `'ollama'` recipe.
 */

import { describe, expect, it } from 'vitest';
import {
  buildProvider,
  createAssistant,
  isOfflineMode,
  OfflineRecipeUnreachableError,
  resolveRecipe,
  runChatTurn,
  VERSION,
} from '../src/main.js';
import { STUB_ECHO_PREFIX } from '../src/stub-provider.js';

describe('examples/personal-assistant-cli — smoke', () => {
  it('exposes VERSION = 0.5.0', () => {
    expect(VERSION).toBe('0.5.0');
  });

  it('runChatTurn echoes the input deterministically through the stub provider', async () => {
    const handle = await createAssistant({
      recipe: 'stub',
      storePath: ':memory:',
      sessionId: 'smoke-session',
      userId: 'smoke-user',
      embedder: null,
      env: { GRAPHORIN_LLM_RECIPE: 'stub' },
    });
    try {
      const reply = await runChatTurn(handle, 'ping');
      expect(reply).toBe(`${STUB_ECHO_PREFIX}ping`);
      expect(handle.recipe).toBe('stub');
      expect(handle.provider.name).toBe('stub');
    } finally {
      await handle.close();
    }
  }, 15_000);

  it('GRAPHORIN_OFFLINE=1 + unreachable ollama daemon raises a helpful error', async () => {
    const env = {
      GRAPHORIN_OFFLINE: '1',
      GRAPHORIN_LLM_RECIPE: 'ollama',
      GRAPHORIN_LLM_BASEURL: 'http://127.0.0.1:1', // reserved low-numbered port
    };
    expect(isOfflineMode(env)).toBe(true);
    expect(resolveRecipe(env)).toBe('ollama');
    await expect(
      buildProvider('ollama', {
        env,
        reachabilityProbe: async () => false,
      }),
    ).rejects.toBeInstanceOf(OfflineRecipeUnreachableError);
    await expect(
      buildProvider('ollama', {
        env,
        reachabilityProbe: async () => false,
      }),
    ).rejects.toThrow(/GRAPHORIN_OFFLINE=1/);
  }, 5_000);
});
