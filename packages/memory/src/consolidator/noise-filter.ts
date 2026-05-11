/**
 * Built-in noise filter pipeline. Runs before LLM extraction in the
 * standard phase + every light-phase invocation. The defaults are
 * heuristic-only (no LLM); adapters may extend the pipeline through
 * `noiseFilters: [...customFilters]` once the public surface is wired
 * (post-MVP — DEC-134 carve-out).
 *
 * @packageDocumentation
 */

import type { Message } from '@graphorin/core';
import type { SessionMessageRecord } from '../internal/storage-adapter.js';

/**
 * Bundle level surfaced by {@link applyNoiseFilters}. The runtime
 * uses these to log + report `noise_filtered_count` per phase.
 *
 * @stable
 */
export type NoiseFilterPreset = 'default' | 'minimal' | 'none';

const MIN_LENGTH_DEFAULT = 10;
const MIN_LENGTH_MINIMAL = 4;
const MAX_LENGTH = 10_000;
const STOP_WORD_RATIO = 0.8;
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'can',
  'do',
  'does',
  'for',
  'from',
  'had',
  'has',
  'have',
  'he',
  'her',
  'his',
  'i',
  'if',
  'in',
  'is',
  'it',
  'its',
  'me',
  'my',
  'no',
  'not',
  'of',
  'on',
  'or',
  'our',
  'she',
  'so',
  'that',
  'the',
  'their',
  'them',
  'they',
  'this',
  'to',
  'too',
  'us',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'who',
  'will',
  'with',
  'would',
  'yes',
  'you',
  'your',
]);

/**
 * Result returned by {@link applyNoiseFilters}.
 *
 * @stable
 */
export interface NoiseFilterResult {
  readonly kept: ReadonlyArray<SessionMessageRecord>;
  readonly droppedCount: number;
  readonly droppedByReason: Readonly<Record<string, number>>;
}

/**
 * Run the configured filter chain against the supplied messages.
 * Filters short-circuit at the first hit so the cheapest checks
 * always run first.
 *
 * @stable
 */
export function applyNoiseFilters(
  messages: ReadonlyArray<SessionMessageRecord>,
  presets: ReadonlyArray<NoiseFilterPreset> = ['default'],
): NoiseFilterResult {
  if (presets.length === 0 || presets.every((p) => p === 'none')) {
    return { kept: messages, droppedCount: 0, droppedByReason: Object.freeze({}) };
  }
  const minimal = presets.includes('minimal') && !presets.includes('default');
  const minLength = minimal ? MIN_LENGTH_MINIMAL : MIN_LENGTH_DEFAULT;
  const droppedByReason: Record<string, number> = {};
  const kept: SessionMessageRecord[] = [];
  const recentTexts: string[] = [];

  for (const record of messages) {
    const reason = classify(record.message, recentTexts, minLength, minimal);
    if (reason === null) {
      kept.push(record);
      const text = renderText(record.message);
      if (text.length > 0) {
        recentTexts.push(text);
        if (recentTexts.length > 5) recentTexts.shift();
      }
    } else {
      droppedByReason[reason] = (droppedByReason[reason] ?? 0) + 1;
    }
  }
  return {
    kept,
    droppedCount: messages.length - kept.length,
    droppedByReason: Object.freeze({ ...droppedByReason }),
  };
}

function classify(
  message: Message,
  recentTexts: ReadonlyArray<string>,
  minLength: number,
  minimal: boolean,
): string | null {
  if (message.role === 'system') return 'role-system';
  if (message.role === 'tool' && minimal) return null;
  const text = renderText(message);
  const trimmed = text.trim();
  if (trimmed.length === 0) return 'empty';
  if (trimmed.length < minLength) return 'too-short';
  if (trimmed.length > MAX_LENGTH) return 'too-long';
  if (looksLikeCodeOrJson(trimmed)) return 'code-block';
  if (!minimal && stopWordRatio(trimmed) > STOP_WORD_RATIO) return 'stop-word-ratio';
  if (!minimal && isNearDuplicate(trimmed, recentTexts)) return 'near-duplicate';
  return null;
}

/**
 * Render a message as a single text blob for the heuristic filters.
 *
 * @internal
 */
export function renderText(message: Message): string {
  if (message.role === 'system') return message.content;
  const c = message.content;
  if (typeof c === 'string') return c;
  let out = '';
  for (const part of c) {
    if (part.type === 'text' || part.type === 'reasoning') {
      out += `${part.text} `;
    }
  }
  return out.trim();
}

function looksLikeCodeOrJson(text: string): boolean {
  if (text.startsWith('```')) return true;
  const trimmed = text.trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      // Not actually JSON — fall through.
    }
  }
  return false;
}

function stopWordRatio(text: string): number {
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter((t) => t.length > 0);
  if (tokens.length === 0) return 0;
  let stop = 0;
  for (const t of tokens) if (STOP_WORDS.has(t)) stop += 1;
  return stop / tokens.length;
}

function isNearDuplicate(text: string, recent: ReadonlyArray<string>): boolean {
  const normalised = text.replace(/\s+/gu, ' ').toLowerCase().trim();
  for (const prior of recent) {
    const priorNorm = prior.replace(/\s+/gu, ' ').toLowerCase().trim();
    if (priorNorm.length === 0) continue;
    if (priorNorm === normalised) return true;
    const similarity = trigramSimilarity(priorNorm, normalised);
    if (similarity >= 0.9) return true;
  }
  return false;
}

function trigramSimilarity(a: string, b: string): number {
  const setA = trigramSet(a);
  const setB = trigramSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter += 1;
  return inter / Math.max(setA.size, setB.size);
}

function trigramSet(text: string): Set<string> {
  const out = new Set<string>();
  if (text.length < 3) {
    out.add(text);
    return out;
  }
  for (let i = 0; i < text.length - 2; i++) {
    out.add(text.slice(i, i + 3));
  }
  return out;
}
