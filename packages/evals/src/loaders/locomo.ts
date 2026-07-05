/**
 * Real LOCOMO dataset loader (arXiv:2402.17753 -
 * https://snap-research.github.io/locomo/). LOCOMO ships as a JSON
 * **array** of samples; each sample bundles one multi-session
 * conversation with many QA pairs over it:
 *
 * ```jsonc
 * {
 *   "sample_id": "conv-26",
 *   "conversation": {
 *     "speaker_a": "Caroline",
 *     "speaker_b": "Melanie",
 *     "session_1_date_time": "1:56 pm on 8 May, 2023",
 *     "session_1": [ { "speaker": "Caroline", "dia_id": "D1:1", "text": "..." }, ... ],
 *     "session_2_date_time": "...",
 *     "session_2": [ ... ]
 *   },
 *   "qa": [
 *     { "question": "...", "answer": "...", "evidence": ["D1:1"], "category": 1 },
 *     { "question": "...", "category": 5, "adversarial_answer": "Not mentioned ..." }
 *   ]
 * }
 * ```
 *
 * Each QA pair becomes one {@link MemoryEvalInput} case that shares the
 * sample's sessions. LOCOMO categories map to abilities as:
 * `1`→multi-session (multi-hop), `2`→temporal, `5`→abstention
 * (adversarial), everything else (`3` open-domain, `4` single-hop)
 * →info-extraction.
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
export interface LoadLocomoOptions {
  /** Local path to the LOCOMO JSON (under `benchmarks/.datasets/`). */
  readonly path: string;
  /** Optional dataset name surfaced in `Dataset.metadata.name`. */
  readonly name?: string;
  /** Optional description surfaced in `Dataset.metadata.description`. */
  readonly description?: string;
}

/**
 * Read a LOCOMO JSON file and return a fully-materialised
 * {@link Dataset} - one case per QA pair, scored against the reference
 * answer string (LLM-judge "J").
 *
 * @stable
 */
export async function loadLocomoDataset(
  options: LoadLocomoOptions,
): Promise<Dataset<MemoryEvalInput, string>> {
  const text = await readFile(options.path, 'utf8');
  const cases = parseLocomo(text);
  return {
    cases,
    metadata: {
      name: options.name ?? 'locomo',
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
export function parseLocomo(text: string): ReadonlyArray<Case<MemoryEvalInput, string>> {
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error('[graphorin/evals] LOCOMO dataset must be a JSON array of samples.');
  }
  const samples = parsed as ReadonlyArray<unknown>;
  const out: Case<MemoryEvalInput, string>[] = [];
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (sample === null || typeof sample !== 'object') {
      throw new Error(`[graphorin/evals] LOCOMO sample ${i} is not an object.`);
    }
    appendSampleCases(sample as Record<string, unknown>, i, out);
  }
  return out;
}

function appendSampleCases(
  sample: Record<string, unknown>,
  index: number,
  out: Case<MemoryEvalInput, string>[],
): void {
  const sampleId = asString(sample.sample_id) ?? `locomo-${index}`;
  const conversation = isRecord(sample.conversation) ? sample.conversation : {};
  const sessions = extractSessions(conversation);
  const qa = asArray(sample.qa);
  for (let q = 0; q < qa.length; q++) {
    const item = qa[q];
    if (!isRecord(item)) continue;
    const question = asString(item.question);
    if (question === undefined) continue;
    const category = typeof item.category === 'number' ? item.category : undefined;
    const ability = mapCategory(category);
    const answer = asString(item.answer) ?? asString(item.adversarial_answer) ?? '';
    const evidence = asArray(item.evidence).filter((e): e is string => typeof e === 'string');
    out.push({
      id: `${sampleId}-q${q}`,
      input: { haystackSessions: sessions, question, ability },
      expected: answer,
      metadata: {
        datasetName: 'locomo',
        sampleId,
        ability,
        ...(category !== undefined ? { category } : {}),
        evidence,
      },
    });
  }
}

function extractSessions(conversation: Record<string, unknown>): MemoryEvalSession[] {
  const speakerA = asString(conversation.speaker_a);
  const indices: number[] = [];
  for (const key of Object.keys(conversation)) {
    const m = /^session_(\d+)$/.exec(key);
    if (m?.[1] !== undefined) indices.push(Number.parseInt(m[1], 10));
  }
  indices.sort((a, b) => a - b);
  const sessions: MemoryEvalSession[] = [];
  for (const n of indices) {
    const raw = asArray(conversation[`session_${n}`]);
    const date = asString(conversation[`session_${n}_date_time`]);
    const turns: MemoryEvalTurn[] = [];
    for (const t of raw) {
      if (!isRecord(t)) continue;
      const content = asString(t.text) ?? asString(t.content);
      if (content === undefined) continue;
      const speaker = asString(t.speaker);
      const role: 'user' | 'assistant' =
        speakerA !== undefined && speaker !== undefined && speaker !== speakerA
          ? 'assistant'
          : 'user';
      turns.push({ role, content, ...(date !== undefined ? { timestamp: date } : {}) });
    }
    sessions.push({ id: `session_${n}`, turns });
  }
  return sessions;
}

/** Maps a LOCOMO numeric `category` onto a {@link MemoryEvalAbility}. */
function mapCategory(category: number | undefined): MemoryEvalAbility {
  switch (category) {
    case 1:
      return 'multi-session';
    case 2:
      return 'temporal';
    case 5:
      return 'abstention';
    default:
      return 'info-extraction';
  }
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
