import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Fact } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { createSqliteStore } from '../src/index.js';

/**
 * CS-12 - `supersede()` must not close the old fact (or point its
 * `superseded_by` at the new id) before the new fact is durably written. If the
 * new-fact write fails, the old fact must be left fully intact and still
 * resolvable, never closed in favour of a row that doesn't exist.
 */
const base = { kind: 'semantic' as const, userId: 'alex', sensitivity: 'internal' as const };

describe('CS-12 - supersede writes the successor before closing the old fact', () => {
  it('a failed new-fact write leaves the old fact open and unlinked', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cs12-'));
    const store = await createSqliteStore({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
    await store.init();
    const semantic = store.memory.semantic as unknown as {
      remember(f: Fact): Promise<void>;
      supersede(oldId: string, newFact: Fact, reason?: string): Promise<void>;
    };

    await semantic.remember({
      ...base,
      id: 'old',
      text: 'residence is berlin',
      createdAt: new Date().toISOString(),
    });

    // Inject a failure into the successor write (an own property shadows the
    // prototype method that `supersede` calls internally as `this.remember`).
    semantic.remember = async () => {
      throw new Error('boom: successor write failed');
    };

    const newFact: Fact = {
      ...base,
      id: 'new',
      text: 'residence is munich',
      supersedes: 'old',
      createdAt: new Date().toISOString(),
    };
    await expect(semantic.supersede('old', newFact)).rejects.toThrow('boom');

    // The old fact must be untouched: interval still open, no dangling pointer.
    const row = store.connection.get<{ superseded_by: string | null; valid_to: number | null }>(
      'SELECT superseded_by, valid_to FROM facts WHERE id = ?',
      ['old'],
    );
    expect(row?.superseded_by).toBeNull();
    expect(row?.valid_to).toBeNull();
    // And the successor must not exist (so nothing references a phantom row).
    const created = store.connection.get<{ id: string }>('SELECT id FROM facts WHERE id = ?', [
      'new',
    ]);
    expect(created).toBeUndefined();

    await store.close();
  });
});
