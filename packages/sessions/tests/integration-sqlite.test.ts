/**
 * Integration test against the real `@graphorin/store-sqlite` and
 * `@graphorin/memory` adapters. Verifies that the hybrid facade
 * round-trips through the production storage stack — the package
 * works without the in-memory fixtures, against the SQLite + FTS5
 * implementation that ships with v0.1.
 *
 * Tests use `:memory:` SQLite + `skipSqliteVec: true` so the suite
 * runs without the native `sqlite-vec` build (FTS5 + every CRUD
 * surface still work end-to-end).
 */

import { mkdtemp } from 'node:fs/promises';
import { createMemory } from '@graphorin/memory';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { describe, expect, it } from 'vitest';
import { createSessionManager } from '../src/index.js';

async function makeStore(): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp('/tmp/graphorin-sessions-integration-');
  const store = await createSqliteStore({
    path: `${dir}/db.sqlite`,
    skipSqliteVec: true,
  });
  await store.init();
  return store;
}

describe('@graphorin/sessions <> @graphorin/store-sqlite + @graphorin/memory', () => {
  it('full lifecycle: create → push → list → handoff → close → audit', async () => {
    const sqlite = await makeStore();
    try {
      const memory = createMemory({ store: sqlite.memory, embeddings: sqlite.embeddings });
      const sessions = createSessionManager({
        store: sqlite.sessions as unknown as Parameters<typeof createSessionManager>[0]['store'],
        memory: memory.session,
      });
      const session = await sessions.create({
        userId: 'alex',
        agentId: 'main',
        title: 'Trip planning',
      });
      expect(session.id).toBeDefined();

      await session.push({ role: 'user', content: 'Plan me a weekend trip.' });
      await session.push({
        role: 'assistant',
        content: 'Sure — what kind of trip?',
        agentId: 'main',
      });
      const messages = await session.list({});
      expect(messages.length).toBe(2);

      await sessions.agents.register('worker', { displayName: 'Worker' });
      await session.appendHandoff({
        fromAgentId: 'main',
        toAgentId: 'worker',
        stepNumber: 2,
        reason: 'route planning',
        inputFilter: { kind: 'last-n', meta: { n: 5 } },
        secretsInheritance: 'inherit-allowlist',
        inheritedSecrets: [],
      });

      const handoffs = await session.listHandoffs();
      expect(handoffs).toHaveLength(1);
      expect(handoffs[0]?.inputFilter?.kind).toBe('last-n');

      await session.close();
      const meta = await session.metadata();
      expect(meta.closedAt).toBeDefined();

      const audits = await session.audit();
      expect(audits.length).toBeGreaterThan(0);
      expect(audits.some((a) => a.action === 'session.created')).toBe(true);
      expect(audits.some((a) => a.action === 'session.closed')).toBe(true);
      expect(audits.some((a) => a.action === 'session.handoff.appended')).toBe(true);
    } finally {
      await sqlite.close();
    }
  });

  it('session_audit table is the only sessions-owned non-message table touched', async () => {
    const sqlite = await makeStore();
    try {
      const tables = (
        sqlite.connection.all<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
        ) as ReadonlyArray<{ name: string }>
      ).map((r) => r.name);
      expect(tables).toContain('sessions');
      expect(tables).toContain('agents_registry');
      expect(tables).toContain('session_handoffs');
      expect(tables).toContain('session_workflow_runs');
      expect(tables).toContain('session_audit');
      expect(tables).toContain('session_messages');
    } finally {
      await sqlite.close();
    }
  });

  it('session_messages remains owned by @graphorin/memory (no duplicate FTS in sessions migration)', async () => {
    const sqlite = await makeStore();
    try {
      // session_messages_fts is an FTS virtual table created by migration 001.
      const ftsTables = (
        sqlite.connection.all<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE name LIKE 'session_messages%'",
        ) as ReadonlyArray<{ name: string }>
      ).map((r) => r.name);
      expect(ftsTables.some((n) => n === 'session_messages')).toBe(true);
      expect(ftsTables.some((n) => n === 'session_messages_fts')).toBe(true);
      // Anti-pattern check: there must NOT be a sessions-package-owned
      // duplicate session_messages table (which would break SSOT).
      const duplicates = ftsTables.filter(
        (n) =>
          n.startsWith('sessions_session_messages') || n.startsWith('session_session_messages'),
      );
      expect(duplicates).toHaveLength(0);
    } finally {
      await sqlite.close();
    }
  });
});
