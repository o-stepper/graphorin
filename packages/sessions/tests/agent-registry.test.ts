import { describe, expect, it } from 'vitest';
import { AgentRegistry } from '../src/agent-registry.js';
import { AgentNotFoundError } from '../src/errors/index.js';
import { InMemorySessionStore } from './fixtures/in-memory-stores.js';

describe('AgentRegistry', () => {
  const fixedNow = (): number => Date.parse('2026-05-08T10:00:00Z');

  it('registers idempotently and refreshes display name on repeat', async () => {
    const store = new InMemorySessionStore();
    const registry = new AgentRegistry({ store, now: fixedNow });
    const first = await registry.register('agent-1', { displayName: 'Worker' });
    expect(first.id).toBe('agent-1');
    expect(first.displayName).toBe('Worker');
    const second = await registry.register('agent-1', { displayName: 'Worker (renamed)' });
    expect(second.id).toBe('agent-1');
    expect(second.displayName).toBe('Worker (renamed)');
    expect(second.registeredAt).toBe(first.registeredAt);
    expect(store.agents.size).toBe(1);
  });

  it('soft-retires an agent and surfaces it via resolveOrPlaceholder', async () => {
    const store = new InMemorySessionStore();
    const registry = new AgentRegistry({ store, now: fixedNow });
    await registry.register('agent-1', { displayName: 'Worker' });
    await registry.retire('agent-1', { reason: 'sunset' });
    const lookup = await registry.resolveOrPlaceholder('agent-1');
    expect(lookup.kind).toBe('agent');
    if (lookup.kind === 'agent') expect(lookup.agent.retiredAt).toBeDefined();
  });

  it('hard-deletes an agent and surfaces a placeholder via resolveOrPlaceholder', async () => {
    const store = new InMemorySessionStore();
    const registry = new AgentRegistry({ store, now: fixedNow });
    await registry.register('agent-1', { displayName: 'Worker' });
    await registry.delete('agent-1');
    const lookup = await registry.resolveOrPlaceholder('agent-1');
    expect(lookup).toEqual({ kind: 'unknown', id: 'agent-1' });
  });

  it('throws AgentNotFoundError on unknown id when assertExists: true', async () => {
    const store = new InMemorySessionStore();
    const registry = new AgentRegistry({ store, now: fixedNow });
    await expect(registry.retire('ghost', { assertExists: true })).rejects.toThrow(
      AgentNotFoundError,
    );
    await expect(registry.delete('ghost', { assertExists: true })).rejects.toThrow(
      AgentNotFoundError,
    );
  });

  it('returns null for unknown id when assertExists is unset', async () => {
    const store = new InMemorySessionStore();
    const registry = new AgentRegistry({ store, now: fixedNow });
    await expect(registry.retire('ghost')).resolves.toBeUndefined();
    await expect(registry.delete('ghost')).resolves.toBeUndefined();
    const lookup = await registry.resolveOrPlaceholder('ghost');
    expect(lookup).toEqual({ kind: 'unknown', id: 'ghost' });
  });

  it('hydrates the cache from the store', async () => {
    const store = new InMemorySessionStore();
    await store.registerAgent({
      id: 'pre-existing',
      displayName: 'Pre-existing',
      registeredAt: '2026-01-01T00:00:00Z',
    });
    const registry = new AgentRegistry({ store, now: fixedNow });
    await registry.hydrate();
    const snapshot = registry.snapshot();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]?.id).toBe('pre-existing');
  });

  it('list() returns all registered agents from the store', async () => {
    const store = new InMemorySessionStore();
    const registry = new AgentRegistry({ store, now: fixedNow });
    await registry.register('a', { displayName: 'A' });
    await registry.register('b', { displayName: 'B' });
    const list = await registry.list();
    expect(list.map((r) => r.id).sort()).toEqual(['a', 'b']);
  });
});
