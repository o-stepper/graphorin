/**
 * Real-provider soak compose module (documented in
 * documentation/guide/operations.md "Published soak runs").
 *
 * Same shape as soak.app.mjs, but the agent pool is backed by a REAL
 * OpenAI-compatible cloud provider instead of the deterministic stub,
 * so a paced multi-hour run proves the full turn path - TLS, streaming,
 * retry middleware, run tracking, SQLite - against live provider
 * latency and error behaviour. Costs real money: the driver paces to
 * SOAK_RPS (1-2 rps is realistic LLM-bound traffic) and the agent's
 * per-call output ceiling bounds worst-case spend.
 *
 * Model comes from SOAK_REAL_MODEL (default gpt-4.1-nano: cheap and
 * non-reasoning, so latency reflects transport + inference, not
 * hidden thinking). The API key comes from OPENAI_API_KEY - env-only,
 * never config, never logged.
 *
 * Copied into examples/assistant-bot/ at run time (as
 * .soak-real.app.mjs) so its bare `@graphorin/*` imports resolve
 * through that example's workspace node_modules.
 */
import { resolve } from 'node:path';

import { createAgent } from '@graphorin/agent';
import { createProvider, openAICompatibleAdapter, withRetry } from '@graphorin/provider';
import { AgentRegistry } from '@graphorin/server';
import { createSqliteStore } from '@graphorin/store-sqlite';

/**
 * An `Agent` instance is single-flight by contract - the pool size
 * caps the driver's usable concurrency; each driver worker targets
 * `soak-agent-<i % POOL>` (same contract as the stub soak app).
 */
export const AGENT_POOL = 16;

function createRealProvider() {
  const model = process.env.SOAK_REAL_MODEL ?? 'gpt-4.1-nano';
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey === undefined || apiKey === '') {
    throw new Error('soak-real.app.mjs: OPENAI_API_KEY is required (env-only, never config)');
  }
  return withRetry({ maxRetries: 3 })(
    createProvider(
      openAICompatibleAdapter({
        model,
        baseUrl: 'https://api.openai.com/v1',
        apiKey,
        timeoutMs: 60_000,
      }),
      { acceptsSensitivity: ['public', 'internal'] },
    ),
  );
}

export default async function createApp({ config, configDir }) {
  const store = await createSqliteStore({
    path: config.storage.path === ':memory:' ? ':memory:' : resolve(configDir, config.storage.path),
    mode: config.storage.mode,
  });
  await store.init();

  const provider = createRealProvider();
  const agents = new AgentRegistry();
  for (let i = 0; i < AGENT_POOL; i++) {
    agents.register({
      id: `soak-agent-${i}`,
      description: 'real-provider soak agent (live OpenAI-compatible endpoint)',
      agent: createAgent({
        name: `soak-agent-${i}`,
        instructions: 'Answer in one short sentence.',
        provider,
        // Output ceiling bounds worst-case spend and latency per turn.
        prepareStep: () => ({ maxTokens: 128 }),
      }),
    });
  }

  return {
    store,
    agents,
    close: async () => {
      await store.close();
    },
  };
}
