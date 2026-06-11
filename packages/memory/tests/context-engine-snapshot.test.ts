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

  it('emits a KV-cache-stable Layer 1-4 prefix; only metadata moves between turns (CE-9)', async () => {
    const memory = await buildFixtureMemory();
    const assembleOnce = (): Promise<string> =>
      memory.contextEngine
        .assemble(memory, {
          scope: FIXTURE_SCOPE,
          runId: 'r',
          sessionId: FIXTURE_SCOPE.sessionId,
          agentId: FIXTURE_SCOPE.agentId,
        })
        .then((out) => out.systemMessage.content);

    const t1 = await assembleOnce();
    // Move only the metadata counts (factCount 0 -> 2).
    await memory.semantic.remember(FIXTURE_SCOPE, { text: 'A fresh fact.' });
    await memory.semantic.remember(FIXTURE_SCOPE, { text: 'Another fresh fact.' });
    const t2 = await assembleOnce();

    const prefix = (c: string): string => c.split('<memory_metadata>')[0] ?? c;
    // The full prompt changed (the metadata counts moved)...
    expect(t1).not.toBe(t2);
    // ...but the Layer 1-4 prefix is byte-identical, so the KV-cache breakpoint
    // holds across turns (CE-9).
    expect(prefix(t1)).toBe(prefix(t2));
    expect(prefix(t1)).toContain('Always cite sources');
    // memoryMetadata is emitted AFTER the stable prefix, not second.
    expect(t2.indexOf('<memory_metadata>')).toBeGreaterThan(t2.indexOf('Always cite sources'));
  });
});
