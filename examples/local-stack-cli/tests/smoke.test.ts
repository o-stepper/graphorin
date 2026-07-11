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

import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertLocalStackOllamaUrl,
  buildEmbedder,
  buildProvider,
  createAssistant,
  isOfflineMode,
  LOCAL_STACK_RULE_TEXT,
  OllamaUnreachableError,
  resolveContextWindow,
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

  it('persists both turn messages and records a consolidator run (F-04 regression)', async () => {
    const handle = await createAssistant({
      recipe: 'stub',
      storePath: ':memory:',
      sessionId: 'persist-session',
      userId: 'persist-user',
      env: { GRAPHORIN_LLM_RECIPE: 'stub' },
    });
    try {
      await runChatTurn(handle, 'remember that my favorite juice is celery');
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
        text: 'The favorite juice of the user is celery juice.',
      });
      const assembled = await handle.memory.contextEngine.assemble(handle.memory, {
        scope: handle.scope,
        agentId: 'local-stack-assistant',
        sessionId: handle.sessionId,
        runId: 'smoke-run',
        agentInstructions: 'test instructions',
        lastUserMessage: 'What is my favorite juice?',
      });
      expect(assembled.systemMessage.content).toContain('celery juice');
    } finally {
      await handle.close();
    }
  }, 15_000);

  it('seeds the procedural rule exactly once across restarts (F-03 regression)', async () => {
    const dbPath = join(tmpdir(), `local-stack-f03-${Date.now().toString(36)}.db`);
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
        const seeded = rules.filter((rule) => rule.text === LOCAL_STACK_RULE_TEXT);
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
    expect(resolveContextWindow('ollama', { GRAPHORIN_CONTEXT_WINDOW: '4096' })).toBe(4_096);
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
