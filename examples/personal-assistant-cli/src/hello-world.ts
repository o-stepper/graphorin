/**
 * Graphorin v0.6.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Hello-world snippet embedded in the example README. Wires
 * `createAgent` + `Memory` + the deterministic stub provider with the
 * documented `acceptsSensitivity: ['public', 'internal']` first-run
 * choice, then streams a single user turn so a reader can run
 * `tsx src/hello-world.ts` and watch the echoed reply scroll by.
 */

import { createAgent } from '@graphorin/agent';
import { createMemory } from '@graphorin/memory';
import { createProvider } from '@graphorin/provider';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { createStubProvider } from './stub-provider.js';

const store = await createSqliteStore({ path: ':memory:', disableWalHardening: true });
await store.init();
const memory = createMemory({ store: store.memory as never, embeddings: store.embeddings });
const provider = createProvider(createStubProvider(), {
  acceptsSensitivity: ['public', 'internal'],
});
const agent = createAgent({ name: 'hello', instructions: 'Be brief.', provider, memory });
for await (const ev of agent.stream('Hi!', { sessionId: 's1', userId: 'u1' })) {
  if (ev.type === 'text.delta') process.stdout.write(ev.delta);
}
await store.close();
