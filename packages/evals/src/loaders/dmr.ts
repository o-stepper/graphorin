/**
 * DMR (Deep Memory Retrieval) loader - the MemGPT/Letta continuity set
 * derived from Multi-Session Chat (arXiv:2310.08560). DMR's published
 * shape is less standardised than LongMemEval/LOCOMO, so this loader is
 * deliberately tolerant: it accepts a JSON **array** of items, each
 * exposing a `question`, an `answer`, and the prior conversation under
 * either `sessions` or `haystack_sessions`. Sessions may be a bare
 * array of turns or an object wrapping the turns under
 * `turns` / `messages` / `dialog`; a turn may use `role` or `speaker`
 * and `content` or `text`.
 *
 * ```jsonc
 * {
 *   "id": "dmr-1",
 *   "question": "What is the user's sister's name?",
 *   "answer": "Anna",
 *   "sessions": [
 *     { "id": "s1", "turns": [ { "role": "user", "content": "..." } ] },
 *     [ { "speaker": "assistant", "text": "..." } ]
 *   ]
 * }
 * ```
 *
 * Every DMR case is treated as `multi-session` (its defining ability).
 * The exact field names should be reconciled against the downloaded
 * file the first time `scripts/fetch-eval-datasets.mjs` is run.
 *
 * @packageDocumentation
 */

import { readFile } from 'node:fs/promises';

import type { Case, Dataset } from '@graphorin/observability/eval';

import type { MemoryEvalInput, MemoryEvalSession, MemoryEvalTurn } from './memory-eval.js';

/** @stable */
export interface LoadDmrOptions {
  /** Local path to the DMR JSON (under `benchmarks/.datasets/`). */
  readonly path: string;
  /** Optional dataset name surfaced in `Dataset.metadata.name`. */
  readonly name?: string;
  /** Optional description surfaced in `Dataset.metadata.description`. */
  readonly description?: string;
}

/**
 * Read a DMR JSON file and return a fully-materialised {@link Dataset}
 * of multi-session retrieval cases scored against the reference answer.
 *
 * @stable
 */
export async function loadDmrDataset(
  options: LoadDmrOptions,
): Promise<Dataset<MemoryEvalInput, string>> {
  const text = await readFile(options.path, 'utf8');
  const cases = parseDmr(text);
  return {
    cases,
    metadata: {
      name: options.name ?? 'dmr',
      ...(options.description !== undefined ? { description: options.description } : {}),
      createdAt: new Date(),
    },
  };
}

/**
 * Pure parser. Exported so tests can exercise the mapping without
 * touching the filesystem.
 *
 * @stable
 */
export function parseDmr(text: string): ReadonlyArray<Case<MemoryEvalInput, string>> {
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error('[graphorin/evals] DMR dataset must be a JSON array of items.');
  }
  const items = parsed as ReadonlyArray<unknown>;
  const out: Case<MemoryEvalInput, string>[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!isRecord(item)) {
      throw new Error(`[graphorin/evals] DMR item ${i} is not an object.`);
    }
    const question = asString(item.question);
    if (question === undefined) {
      throw new Error(`[graphorin/evals] DMR item ${i} is missing a 'question'.`);
    }
    const sessions = coerceSessions(item.sessions ?? item.haystack_sessions);
    out.push({
      id: asString(item.id) ?? `dmr-${i}`,
      input: { haystackSessions: sessions, question, ability: 'multi-session' },
      expected: asString(item.answer) ?? '',
      metadata: { datasetName: 'dmr', ability: 'multi-session' },
    });
  }
  return out;
}

function coerceSessions(value: unknown): MemoryEvalSession[] {
  const rawSessions = asArray(value);
  const sessions: MemoryEvalSession[] = [];
  for (let s = 0; s < rawSessions.length; s++) {
    const raw = rawSessions[s];
    const rawTurns = Array.isArray(raw)
      ? (raw as ReadonlyArray<unknown>)
      : isRecord(raw)
        ? asArray(raw.turns ?? raw.messages ?? raw.dialog)
        : [];
    const id = isRecord(raw) ? (asString(raw.id) ?? `session-${s}`) : `session-${s}`;
    const turns: MemoryEvalTurn[] = [];
    for (const t of rawTurns) {
      if (!isRecord(t)) continue;
      const content = asString(t.content) ?? asString(t.text);
      if (content === undefined) continue;
      const speaker = asString(t.role) ?? asString(t.speaker);
      const role = speaker === 'assistant' ? 'assistant' : 'user';
      const timestamp = asString(t.timestamp);
      turns.push({ role, content, ...(timestamp !== undefined ? { timestamp } : {}) });
    }
    sessions.push({ id, turns });
  }
  return sessions;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asArray(value: unknown): ReadonlyArray<unknown> {
  return Array.isArray(value) ? (value as ReadonlyArray<unknown>) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
