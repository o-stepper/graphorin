/**
 * HaluMem-format dataset loader (operation-level memory eval,
 * arXiv:2511.03506). Where the QA-level loaders ({@link loadLongMemEvalDataset},
 * `loadLocomoDataset`) grade only final answers, a HaluMem-format file
 * carries per-operation ground truth - the memory points a correct
 * system must extract, update or delete per session - so the staged
 * scorers can grade the write pipeline itself.
 *
 * Canonical file shape (a JSON **array** of samples):
 *
 * ```jsonc
 * [
 *   {
 *     "case_id": "user-1",
 *     "sessions": [
 *       { "id": "s1", "turns": [ { "role": "user", "content": "...", "timestamp": "..." } ] }
 *     ],
 *     "memory_points": [
 *       { "kind": "extract", "content": "User lives in Berlin", "session_id": "s1" },
 *       { "kind": "update",  "content": "User lives in Kyiv", "previous": "User lives in Berlin" },
 *       { "kind": "delete",  "content": "User is job hunting" }
 *     ],
 *     "questions": [
 *       { "question": "Where does the user live?", "answer": "Kyiv", "asked_at": "...", "unanswerable": false }
 *     ]
 *   }
 * ]
 * ```
 *
 * The loader reads a user-supplied local JSON path (DEC-154: no
 * network downloads - obtaining the real dataset is documented, not
 * automated). Small synthetic fixtures in this format keep the staged
 * scorers deterministic in CI.
 *
 * @packageDocumentation
 */

import { readFile } from 'node:fs/promises';

import type { Case, Dataset } from '@graphorin/observability/eval';

import type {
  MemoryEvalAbility,
  MemoryEvalSession,
  MemoryEvalTurn,
  MemoryGoldPoint,
  MemoryOperationKind,
  MemoryOperationsEvalInput,
  MemoryOperationsObservation,
} from './memory-eval.js';

/**
 * Which cases a HaluMem-format file expands into: `'operations'`
 * yields one case per sample carrying the gold memory points (for the
 * extraction / update scorers); `'qa'` yields one case per probe
 * question (for the QA hallucination scorer).
 *
 * @stable
 */
export type HaluMemStage = 'operations' | 'qa';

/** @stable */
export interface LoadHaluMemOptions {
  /** Local path to the dataset JSON (under `benchmarks/.datasets/`). */
  readonly path: string;
  /** Case expansion - see {@link HaluMemStage}. */
  readonly stage: HaluMemStage;
  /** Optional dataset name surfaced in `Dataset.metadata.name`. */
  readonly name?: string;
  /** Optional description surfaced in `Dataset.metadata.description`. */
  readonly description?: string;
}

/**
 * Read a HaluMem-format JSON file and return a fully-materialised
 * {@link Dataset} of {@link MemoryOperationsEvalInput} cases.
 *
 * @stable
 */
export async function loadHaluMemDataset(
  options: LoadHaluMemOptions,
): Promise<Dataset<MemoryOperationsEvalInput, MemoryOperationsObservation>> {
  const text = await readFile(options.path, 'utf8');
  const cases = parseHaluMem(text, options.stage);
  return {
    cases,
    metadata: {
      name: options.name ?? `halumem-${options.stage}`,
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
export function parseHaluMem(
  text: string,
  stage: HaluMemStage,
): ReadonlyArray<Case<MemoryOperationsEvalInput, MemoryOperationsObservation>> {
  if (stage !== 'operations' && stage !== 'qa') {
    throw new Error(`[graphorin/evals] Unknown HaluMem stage ${JSON.stringify(stage)}.`);
  }
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error('[graphorin/evals] HaluMem dataset must be a JSON array of samples.');
  }
  const rows = parsed as ReadonlyArray<unknown>;
  const out: Case<MemoryOperationsEvalInput, MemoryOperationsObservation>[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row === null || typeof row !== 'object') {
      throw new Error(`[graphorin/evals] HaluMem sample ${i} is not an object.`);
    }
    const sample = row as Record<string, unknown>;
    const caseId = asString(sample.case_id) ?? `halumem-${i}`;
    const sessions = mapSessions(sample.sessions, i);
    const goldPoints = mapGoldPoints(sample.memory_points, i);
    if (stage === 'operations') {
      const ability: MemoryEvalAbility = goldPoints.some((p) => p.kind !== 'extract')
        ? 'knowledge-update'
        : 'info-extraction';
      out.push({
        id: caseId,
        input: { haystackSessions: sessions, goldPoints, ability },
        metadata: { datasetName: 'halumem', stage, ability },
      });
      continue;
    }
    const questions = asArray(sample.questions);
    for (let q = 0; q < questions.length; q++) {
      const raw = questions[q];
      if (raw === null || typeof raw !== 'object') continue;
      const record = raw as Record<string, unknown>;
      const question = asString(record.question);
      if (question === undefined) {
        throw new Error(`[graphorin/evals] HaluMem sample ${i} question ${q} has no 'question'.`);
      }
      const unanswerable = record.unanswerable === true;
      const referenceAnswer = asString(record.answer);
      const askedAt = asString(record.asked_at);
      const ability: MemoryEvalAbility = unanswerable ? 'abstention' : 'info-extraction';
      out.push({
        id: `${caseId}-q${q}`,
        input: {
          haystackSessions: sessions,
          goldPoints,
          question,
          ...(referenceAnswer !== undefined ? { referenceAnswer } : {}),
          unanswerable,
          ...(askedAt !== undefined ? { askedAt } : {}),
          ability,
        },
        metadata: { datasetName: 'halumem', stage, ability },
      });
    }
  }
  return out;
}

const OPERATION_KINDS: ReadonlySet<string> = new Set(['extract', 'update', 'delete']);

function mapSessions(value: unknown, sampleIndex: number): ReadonlyArray<MemoryEvalSession> {
  const rawSessions = asArray(value);
  const sessions: MemoryEvalSession[] = [];
  for (let s = 0; s < rawSessions.length; s++) {
    const raw = rawSessions[s];
    if (raw === null || typeof raw !== 'object') {
      throw new Error(
        `[graphorin/evals] HaluMem sample ${sampleIndex} session ${s} is not an object.`,
      );
    }
    const record = raw as Record<string, unknown>;
    const turns: MemoryEvalTurn[] = [];
    for (const t of asArray(record.turns)) {
      if (t === null || typeof t !== 'object') continue;
      const turn = t as Record<string, unknown>;
      const content = asString(turn.content);
      if (content === undefined) continue;
      const role = turn.role === 'assistant' ? 'assistant' : 'user';
      const timestamp = asString(turn.timestamp);
      turns.push({ role, content, ...(timestamp !== undefined ? { timestamp } : {}) });
    }
    sessions.push({ id: asString(record.id) ?? `session-${s}`, turns });
  }
  return sessions;
}

function mapGoldPoints(value: unknown, sampleIndex: number): ReadonlyArray<MemoryGoldPoint> {
  const rawPoints = asArray(value);
  const points: MemoryGoldPoint[] = [];
  for (let p = 0; p < rawPoints.length; p++) {
    const raw = rawPoints[p];
    if (raw === null || typeof raw !== 'object') {
      throw new Error(
        `[graphorin/evals] HaluMem sample ${sampleIndex} memory point ${p} is not an object.`,
      );
    }
    const record = raw as Record<string, unknown>;
    const kind = asString(record.kind);
    if (kind === undefined || !OPERATION_KINDS.has(kind)) {
      throw new Error(
        `[graphorin/evals] HaluMem sample ${sampleIndex} memory point ${p} has an unknown ` +
          `'kind' ${JSON.stringify(record.kind)} (expected extract | update | delete).`,
      );
    }
    const content = asString(record.content);
    if (content === undefined) {
      throw new Error(
        `[graphorin/evals] HaluMem sample ${sampleIndex} memory point ${p} is missing 'content'.`,
      );
    }
    const previous = asString(record.previous);
    const sessionId = asString(record.session_id);
    points.push({
      kind: kind as MemoryOperationKind,
      content,
      ...(previous !== undefined ? { previous } : {}),
      ...(sessionId !== undefined ? { sessionId } : {}),
    });
  }
  return points;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asArray(value: unknown): ReadonlyArray<unknown> {
  return Array.isArray(value) ? (value as ReadonlyArray<unknown>) : [];
}
