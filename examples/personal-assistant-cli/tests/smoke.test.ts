import testPkg from '../package.json' with { type: 'json' };

const pkgVersion: string = testPkg.version;

/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Smoke coverage for `examples/personal-assistant-cli`. Exercises the
 * stub provider end-to-end (so CI never depends on a live LLM), the
 * deterministic echo contract, and the `GRAPHORIN_OFFLINE=1` guard
 * for the `'ollama'` recipe.
 */

import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ASSISTANT_RULE_TEXT,
  buildProvider,
  createAssistant,
  isOfflineMode,
  OfflineRecipeUnreachableError,
  resolveContextWindow,
  resolveRecipe,
  runChatTurn,
  VERSION,
} from '../src/main.js';
import { createStubEmbedder } from '../src/stub-embedder.js';
import { STUB_ECHO_PREFIX } from '../src/stub-provider.js';

describe('examples/personal-assistant-cli - smoke', () => {
  it('exposes the package.json version', () => {
    expect(VERSION).toBe(pkgVersion);
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

  it('persists both turn messages and records a consolidator run (F-04 / E-23 regression)', async () => {
    const handle = await createAssistant({
      recipe: 'stub',
      storePath: ':memory:',
      sessionId: 'persist-session',
      userId: 'persist-user',
      env: { GRAPHORIN_LLM_RECIPE: 'stub' },
    });
    try {
      await runChatTurn(handle, 'remember I prefer metric units');
      const messages = await handle.memory.session.list(handle.scope);
      expect(messages.length).toBeGreaterThanOrEqual(2);
      expect(messages.map((m) => m.role)).toEqual(expect.arrayContaining(['user', 'assistant']));
      const persisted = handle.store.connection.get<{ n: number }>(
        'SELECT COUNT(*) AS n FROM session_messages',
      );
      expect(persisted?.n).toBeGreaterThanOrEqual(2);
      const runs = handle.store.connection.get<{ n: number }>(
        'SELECT COUNT(*) AS n FROM consolidator_runs',
      );
      expect(runs?.n).toBeGreaterThanOrEqual(1);
      // Read path: an active internal fact must surface in the assembled
      // system prompt for a plain question. Locks in the every-turn
      // autoRecall strategy + the loopback privacy trust (the framework
      // defaults - heuristic trigger phrases and 'public-tls' trust -
      // would skip recall and drop internal facts respectively).
      expect(handle.memory.consolidator.config().autoPromoteExtraction).toBe(true);
      await handle.memory.semantic.remember(handle.scope, {
        text: 'The cat of the user is named Biscuit.',
      });
      const assembled = await handle.memory.contextEngine.assemble(handle.memory, {
        scope: handle.scope,
        agentId: 'personal-assistant',
        sessionId: handle.sessionId,
        runId: 'smoke-run',
        agentInstructions: 'test instructions',
        lastUserMessage: 'What is my cat named?',
      });
      expect(assembled.systemMessage.content).toContain('Biscuit');
    } finally {
      await handle.close();
    }
  }, 15_000);

  it('seeds the procedural rule exactly once across restarts (F-03 regression)', async () => {
    const dbPath = join(tmpdir(), `personal-assistant-f03-${Date.now().toString(36)}.db`);
    const common = {
      recipe: 'stub' as const,
      storePath: dbPath,
      userId: 'rule-user',
      env: { GRAPHORIN_LLM_RECIPE: 'stub' },
    };
    try {
      const first = await createAssistant({ ...common, sessionId: 'rule-session-1' });
      await first.close();
      const second = await createAssistant({ ...common, sessionId: 'rule-session-2' });
      try {
        const rules = await second.memory.procedural.list(second.scope);
        const seeded = rules.filter((rule) => rule.text === ASSISTANT_RULE_TEXT);
        expect(seeded).toHaveLength(1);
      } finally {
        await second.close();
      }
    } finally {
      await rm(dbPath, { force: true });
      await rm(`${dbPath}-wal`, { force: true });
      await rm(`${dbPath}-shm`, { force: true });
    }
  }, 15_000);

  it('arms auto-compaction with a provider context window (CE-12 regression)', async () => {
    expect(resolveContextWindow('stub', {})).toBe(8_192);
    expect(resolveContextWindow('ollama', {})).toBe(32_768);
    expect(resolveContextWindow('llamacpp-server', { GRAPHORIN_CONTEXT_WINDOW: '4096' })).toBe(
      4_096,
    );
    expect(() => resolveContextWindow('ollama', { GRAPHORIN_CONTEXT_WINDOW: 'nope' })).toThrow(
      /GRAPHORIN_CONTEXT_WINDOW/,
    );
    const handle = await createAssistant({
      recipe: 'stub',
      storePath: ':memory:',
      sessionId: 'compaction-session',
      userId: 'compaction-user',
      env: { GRAPHORIN_LLM_RECIPE: 'stub' },
    });
    try {
      const config = handle.memory.contextEngine.config();
      expect(config.providerContextWindow).toBe(8_192);
      expect(config.compactionEffective).toBe(true);
    } finally {
      await handle.close();
    }
  }, 15_000);

  it("the 'stub' recipe wires the deterministic stub embedder (no model download)", async () => {
    const stub = createStubEmbedder();
    expect(stub.dim()).toBe(8);
    const [a, b] = await stub.embed(['hello', 'hello']);
    expect(a).toEqual(b);
    const handle = await createAssistant({
      recipe: 'stub',
      storePath: ':memory:',
      sessionId: 'embedder-session',
      userId: 'embedder-user',
      env: { GRAPHORIN_LLM_RECIPE: 'stub' },
    });
    try {
      await handle.memory.semantic.remember(handle.scope, { text: 'the sky is blue' });
      const meta = handle.store.connection.all<{ id: string }>('SELECT id FROM embedding_meta');
      expect(meta.map((row) => row.id)).toContain(stub.id());
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
