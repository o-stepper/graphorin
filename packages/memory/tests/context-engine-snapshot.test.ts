import { describe, expect, it } from 'vitest';
import { createMemory, defineBlock } from '../src/index.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

const FIXTURE_SCOPE = {
  userId: 'fixture-user',
  sessionId: 'fixture-session',
  agentId: 'fixture-agent',
};

async function buildFixtureMemory() {
  const memory = createMemory({
    store: createInMemoryStore(),
    embeddings: new InMemoryEmbeddingRegistry(),
    workingBlocks: [
      defineBlock({ label: 'persona', charLimit: 200, sensitivity: 'public' }),
      defineBlock({ label: 'user_profile', charLimit: 200, sensitivity: 'public' }),
    ],
    contextEngine: {
      providerContextWindow: 200_000,
      privacy: { providerTrust: 'public-tls' },
    },
  });
  await memory.working.write(FIXTURE_SCOPE, 'persona', 'Friendly tone, succinct replies.');
  await memory.working.write(
    FIXTURE_SCOPE,
    'user_profile',
    'Senior developer; prefers terse answers.',
  );
  await memory.procedural.define(FIXTURE_SCOPE, {
    text: 'Always cite sources for non-obvious claims.',
    priority: 80,
  });
  return memory;
}

describe('context-engine — deterministic snapshot (Phase 10d)', () => {
  it('produces a stable layered prompt for the canonical fixture (full mode)', async () => {
    const memory = await buildFixtureMemory();
    const out = await memory.contextEngine.assemble(memory, {
      scope: FIXTURE_SCOPE,
      runId: 'r',
      sessionId: FIXTURE_SCOPE.sessionId,
      agentId: FIXTURE_SCOPE.agentId,
      agentInstructions: 'Help the user write tests.',
      skills: [{ name: 'pdf-processing', description: 'Extract text from PDFs' }],
    });
    expect(out.systemMessage.content).toMatchSnapshot();
  });
});
