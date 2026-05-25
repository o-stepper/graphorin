/**
 * LongMemEval dataset loader (ICLR 2025, arXiv:2410.10813 —
 * https://github.com/xiaowu0162/LongMemEval). LongMemEval ships as a
 * JSON **array** of question objects:
 *
 * ```jsonc
 * {
 *   "question_id": "abc_abs",          // `_abs` suffix marks abstention
 *   "question_type": "temporal-reasoning",
 *   "question": "Where did I live in 2021?",
 *   "answer": "Berlin",
 *   "question_date": "2023/05/20 (Sat) 14:00",
 *   "haystack_session_ids": ["s1", "s2"],
 *   "haystack_dates": ["2021/03/01 ...", "2023/01/05 ..."],
 *   "haystack_sessions": [
 *     [ { "role": "user", "content": "..." }, { "role": "assistant", "content": "...", "has_answer": true } ],
 *     [ ... ]
 *   ]
 * }
 * ```
 *
 * The three parallel arrays (`haystack_session_ids` / `haystack_dates`
 * / `haystack_sessions`) are zipped by index; one date applies to every
 * turn in its session.
 *
 * @packageDocumentation
 */

import { readFile } from 'node:fs/promises';

import type { Case, Dataset } from '@graphorin/observability/eval';

import type {
  MemoryEvalAbility,
  MemoryEvalInput,
  MemoryEvalSession,
  MemoryEvalTurn,
} from './memory-eval.js';

/** @stable */
export interface LoadLongMemEvalOptions {
  /** Local path to the dataset JSON (under `benchmarks/.datasets/`). */
  readonly path: string;
  /** Which release this file is. `'S'` (~115 sessions) is the default target. */
  readonly variant?: 'S' | 'M';
  /** When set, keep only cases whose mapped ability is in this list. */
  readonly abilities?: ReadonlyArray<MemoryEvalAbility>;
  /** Optional dataset name surfaced in `Dataset.metadata.name`. */
  readonly name?: string;
  /** Optional description surfaced in `Dataset.metadata.description`. */
  readonly description?: string;
}

/**
 * Read a LongMemEval JSON file and return a fully-materialised
 * {@link Dataset} of {@link MemoryEvalInput} cases scored against the
 * reference `answer` string.
 *
 * @stable
 */
export async function loadLongMemEvalDataset(
  options: LoadLongMemEvalOptions,
): Promise<Dataset<MemoryEvalInput, string>> {
  const text = await readFile(options.path, 'utf8');
  const cases = parseLongMemEval(text, options.abilities);
  const variantSuffix = options.variant !== undefined ? `_${options.variant.toLowerCase()}` : '';
  return {
    cases,
    metadata: {
      name: options.name ?? `longmemeval${variantSuffix}`,
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
export function parseLongMemEval(
  text: string,
  abilities?: ReadonlyArray<MemoryEvalAbility>,
): ReadonlyArray<Case<MemoryEvalInput, string>> {
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error('[graphorin/evals] LongMemEval dataset must be a JSON array of questions.');
  }
  const rows = parsed as ReadonlyArray<unknown>;
  const out: Case<MemoryEvalInput, string>[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row === null || typeof row !== 'object') {
      throw new Error(`[graphorin/evals] LongMemEval row ${i} is not an object.`);
    }
    const mapped = mapRow(row as Record<string, unknown>, i);
    if (abilities !== undefined && !abilities.includes(mapped.input.ability ?? 'info-extraction')) {
      continue;
    }
    out.push(mapped);
  }
  return out;
}

function mapRow(row: Record<string, unknown>, index: number): Case<MemoryEvalInput, string> {
  const question = asString(row.question);
  if (question === undefined) {
    throw new Error(`[graphorin/evals] LongMemEval row ${index} is missing a 'question'.`);
  }
  const questionId = asString(row.question_id) ?? `longmemeval-${index}`;
  const questionType = asString(row.question_type) ?? '';
  const askedAt = asString(row.question_date);
  const ability = mapAbility(questionType, questionId);

  const rawSessions = asArray(row.haystack_sessions);
  const sessionIds = asArray(row.haystack_session_ids);
  const sessionDates = asArray(row.haystack_dates);
  const haystackSessions: MemoryEvalSession[] = [];
  for (let s = 0; s < rawSessions.length; s++) {
    const rawTurns = asArray(rawSessions[s]);
    const date = asString(sessionDates[s]);
    const turns: MemoryEvalTurn[] = [];
    for (const t of rawTurns) {
      if (t === null || typeof t !== 'object') continue;
      const content = asString((t as Record<string, unknown>).content);
      if (content === undefined) continue;
      const role = (t as Record<string, unknown>).role === 'assistant' ? 'assistant' : 'user';
      turns.push({ role, content, ...(date !== undefined ? { timestamp: date } : {}) });
    }
    haystackSessions.push({ id: asString(sessionIds[s]) ?? `session-${s}`, turns });
  }

  return {
    id: questionId,
    input: {
      haystackSessions,
      question,
      ...(askedAt !== undefined ? { askedAt } : {}),
      ability,
    },
    expected: asString(row.answer) ?? '',
    metadata: { datasetName: 'longmemeval', ability, questionType },
  };
}

/** Maps a LongMemEval `question_type` / `_abs` suffix onto a {@link MemoryEvalAbility}. */
function mapAbility(questionType: string, questionId: string): MemoryEvalAbility {
  const qt = questionType.toLowerCase();
  if (questionId.endsWith('_abs') || qt.includes('abstention')) return 'abstention';
  if (qt.includes('temporal')) return 'temporal';
  if (qt.includes('knowledge-update') || qt.includes('knowledge_update')) return 'knowledge-update';
  if (qt.includes('multi-session') || qt.includes('multi_session')) return 'multi-session';
  return 'info-extraction';
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asArray(value: unknown): ReadonlyArray<unknown> {
  return Array.isArray(value) ? (value as ReadonlyArray<unknown>) : [];
}
