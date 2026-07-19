import { realpathSync } from 'node:fs';
import pkg from '../package.json' with { type: 'json' };
/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Dialogue smoke test: a few fixed turns carry one structured fact;
 * assistant lines echo acknowledgement. After the turns, the fact should
 * be recoverable from semantic memory via hybrid search (FTS-only when no
 * embedder is configured). This is a wiring smoke check - NOT the published
 * DialSim benchmark (arXiv:2406.13144).
 */

import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SessionScope } from '@graphorin/core';
import { createMemory } from '@graphorin/memory';
import { createSqliteStore } from '@graphorin/store-sqlite';

export const VERSION: string = pkg.version;

function pkgRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

export async function runDialogueSmoke(): Promise<{ pass: boolean; accuracy: number }> {
  const store = await createSqliteStore({ path: ':memory:', disableWalHardening: true });
  await store.init();
  const scope: SessionScope = { userId: 'dial-user', sessionId: 'dial-sess' };
  const memory = createMemory({
    store: store.memory as never,
    embeddings: store.embeddings,
    resolveScope: () => scope,
    conflictPipeline: { mode: 'off' },
    consolidator: { enabled: false },
  });

  const turns = [
    'Reservation code ZZ-7741 for tonight.',
    'I stored reservation code ZZ-7741 in the profile.',
    'Check-in opens at 15:00 local time.',
    'Noted check-in at 15:00.',
  ];

  for (const text of turns) {
    await memory.semantic.remember(scope, {
      text,
      sensitivity: 'internal',
    });
  }

  const q = 'ZZ-7741';
  const hits = await memory.semantic.search(scope, q, { topK: 5 });
  const blob = hits.map((h) => h.record.text).join('\n');
  const pass = blob.includes('ZZ-7741');
  await store.close();
  return { pass, accuracy: pass ? 1 : 0 };
}

export async function main(): Promise<void> {
  const { pass, accuracy } = await runDialogueSmoke();
  await writeFile(
    join(pkgRoot(), 'RESULTS.md'),
    [
      '# Dialogue smoke test - results',
      '',
      `**Graphorin** v${VERSION} · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>`,
      '',
      `_Generated: ${new Date().toISOString()}_`,
      '',
      '| Metric | Value |',
      '| --- | --- |',
      `| Accuracy | ${String(accuracy)} |`,
      '',
    ].join('\n'),
    'utf8',
  );
  console.log(`[benchmark-dialogue-smoke] pass=${pass} accuracy=${accuracy}`);
  if (!pass) process.exitCode = 1;
}

if (
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) ===
    (() => {
      try {
        return realpathSync(process.argv[1]);
      } catch {
        return process.argv[1];
      }
    })()
) {
  await main();
}
