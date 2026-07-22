/**
 * CI soak-leg compose module (soak.yml).
 *
 * Registers one agent, `soak-agent`, backed by an in-file
 * deterministic stub provider (no sockets, no API keys) so the weekly
 * soak exercises the FULL server turn path - auth middleware, agent
 * runtime, provider streaming, run tracking, SQLite persistence -
 * under sustained load without spending a token of any real model.
 *
 * Copied into examples/assistant-bot/ at run time (as .soak.app.mjs)
 * so its bare `@graphorin/*` imports resolve through that example's
 * workspace node_modules (the widest dependency surface in the repo:
 * agent + server + store-sqlite + core are all direct deps there);
 * referenced by the absolute `app` path in the generated soak config.
 */
import { resolve } from 'node:path';

import { createAgent } from '@graphorin/agent';
import { zeroUsage } from '@graphorin/core';
import { AgentRegistry } from '@graphorin/server';
import { createSqliteStore } from '@graphorin/store-sqlite';

const STUB_CAPABILITIES = Object.freeze({
  streaming: true,
  toolCalling: false,
  parallelToolCalls: false,
  multimodal: false,
  structuredOutput: false,
  reasoning: false,
  contextWindow: 8_192,
  maxOutput: 4_096,
  reasoningContract: 'optional',
});

/** Last user-message text, whatever the content shape. */
function lastUserText(messages) {
  const last = messages.at(-1);
  if (last === undefined) return 'ping';
  if (typeof last.content === 'string') return last.content;
  if (Array.isArray(last.content)) {
    const textPart = last.content.find((p) => p?.type === 'text');
    if (textPart?.text !== undefined) return textPart.text;
  }
  return 'ping';
}

function createSoakStubProvider() {
  return {
    name: 'soak-stub',
    modelId: 'soak-stub-1',
    capabilities: STUB_CAPABILITIES,
    async *stream(req) {
      const text = lastUserText(req.messages);
      yield {
        type: 'stream-start',
        metadata: { providerName: 'soak-stub', modelId: 'soak-stub-1' },
      };
      yield { type: 'text-delta', delta: `pong:${text.length}` };
      yield { type: 'finish', finishReason: 'stop', usage: zeroUsage() };
    },
    async generate(req) {
      const text = lastUserText(req.messages);
      return { text: `pong:${text.length}`, usage: zeroUsage(), finishReason: 'stop' };
    },
  };
}

/**
 * An `Agent` instance is single-flight by contract
 * (`ConcurrentRunError`: one run per instance) - a realistic server
 * deploys an instance pool. The pool size caps the driver's usable
 * concurrency; each driver worker targets `soak-agent-<i % POOL>` so
 * no instance ever sees overlapping runs.
 */
export const AGENT_POOL = 16;

export default async function createApp({ config, configDir }) {
  const store = await createSqliteStore({
    path: config.storage.path === ':memory:' ? ':memory:' : resolve(configDir, config.storage.path),
    mode: config.storage.mode,
  });
  await store.init();

  const agents = new AgentRegistry();
  for (let i = 0; i < AGENT_POOL; i++) {
    agents.register({
      id: `soak-agent-${i}`,
      description: 'soak-leg stub agent (deterministic, offline)',
      agent: createAgent({
        name: `soak-agent-${i}`,
        instructions: 'Reply to every message.',
        provider: createSoakStubProvider(),
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
