/**
 * Bundled pricing snapshot. The catalogue is intentionally small —
 * operators wanting the full upstream catalogue should run the opt-in
 * `refreshPricing(...)` flow at build time and persist the result to
 * a custom snapshot file.
 *
 * Prices are stored in **USD per token** (i.e. divide the per-million
 * upstream prices by 1_000_000). Numbers are accurate to the snapshot
 * date; consumers are expected to refresh on a regular cadence.
 *
 * @packageDocumentation
 */

import { createHash } from 'node:crypto';

import type { ModelPrice, PricingSnapshot } from '../types.js';

/** @internal — used for `lookupPrice` defaults. */
export const SNAPSHOT_DATE = '2026-04-30';

const ENTRIES: ReadonlyArray<ModelPrice> = Object.freeze([
  // -----------------------------------------------------------------
  // Anthropic
  // -----------------------------------------------------------------
  {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    inputUsdPerToken: 3 / 1_000_000,
    outputUsdPerToken: 15 / 1_000_000,
    cachedReadUsdPerToken: 0.3 / 1_000_000,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-5-haiku-20241022',
    inputUsdPerToken: 0.8 / 1_000_000,
    outputUsdPerToken: 4 / 1_000_000,
    cachedReadUsdPerToken: 0.08 / 1_000_000,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    inputUsdPerToken: 15 / 1_000_000,
    outputUsdPerToken: 75 / 1_000_000,
    cachedReadUsdPerToken: 1.5 / 1_000_000,
  },
  // -----------------------------------------------------------------
  // OpenAI
  // -----------------------------------------------------------------
  {
    provider: 'openai',
    model: 'gpt-4o-2024-11-20',
    inputUsdPerToken: 2.5 / 1_000_000,
    outputUsdPerToken: 10 / 1_000_000,
    cachedReadUsdPerToken: 1.25 / 1_000_000,
  },
  {
    provider: 'openai',
    model: 'gpt-4o-mini-2024-07-18',
    inputUsdPerToken: 0.15 / 1_000_000,
    outputUsdPerToken: 0.6 / 1_000_000,
    cachedReadUsdPerToken: 0.075 / 1_000_000,
  },
  {
    provider: 'openai',
    model: 'o1-2024-12-17',
    inputUsdPerToken: 15 / 1_000_000,
    outputUsdPerToken: 60 / 1_000_000,
    cachedReadUsdPerToken: 7.5 / 1_000_000,
  },
  {
    provider: 'openai',
    model: 'o3-mini-2025-01-31',
    inputUsdPerToken: 1.1 / 1_000_000,
    outputUsdPerToken: 4.4 / 1_000_000,
    cachedReadUsdPerToken: 0.55 / 1_000_000,
  },
  // -----------------------------------------------------------------
  // Google
  // -----------------------------------------------------------------
  {
    provider: 'google',
    model: 'gemini-1.5-pro-002',
    inputUsdPerToken: 1.25 / 1_000_000,
    outputUsdPerToken: 5 / 1_000_000,
    cachedReadUsdPerToken: 0.3125 / 1_000_000,
  },
  {
    provider: 'google',
    model: 'gemini-1.5-flash-002',
    inputUsdPerToken: 0.075 / 1_000_000,
    outputUsdPerToken: 0.3 / 1_000_000,
    cachedReadUsdPerToken: 0.01875 / 1_000_000,
  },
  // -----------------------------------------------------------------
  // Mistral
  // -----------------------------------------------------------------
  {
    provider: 'mistral',
    model: 'mistral-large-2411',
    inputUsdPerToken: 2 / 1_000_000,
    outputUsdPerToken: 6 / 1_000_000,
  },
  {
    provider: 'mistral',
    model: 'mistral-small-2503',
    inputUsdPerToken: 0.2 / 1_000_000,
    outputUsdPerToken: 0.6 / 1_000_000,
  },
  // -----------------------------------------------------------------
  // Cohere
  // -----------------------------------------------------------------
  {
    provider: 'cohere',
    model: 'command-r-plus-08-2024',
    inputUsdPerToken: 2.5 / 1_000_000,
    outputUsdPerToken: 10 / 1_000_000,
  },
  {
    provider: 'cohere',
    model: 'command-r-08-2024',
    inputUsdPerToken: 0.15 / 1_000_000,
    outputUsdPerToken: 0.6 / 1_000_000,
  },
  // -----------------------------------------------------------------
  // Local providers — documented as zero-cost so cost rollups still
  // include the call counts.
  // -----------------------------------------------------------------
  {
    provider: 'ollama',
    model: '*',
    inputUsdPerToken: 0,
    outputUsdPerToken: 0,
    notes: 'Local Ollama deployment — operator-priced.',
  },
  {
    provider: 'graphorin-llamacpp',
    model: '*',
    inputUsdPerToken: 0,
    outputUsdPerToken: 0,
    notes: 'Local llama.cpp deployment — operator-priced.',
  },
] as const);

/**
 * Compute a deterministic SHA-256 of the entries. Sorting the entry
 * keys before serialisation keeps the digest stable across Node
 * versions / object-property-iteration orderings.
 *
 * @internal
 */
export function computeEntriesDigest(entries: ReadonlyArray<ModelPrice>): string {
  const canonical = JSON.stringify(entries.map((entry) => sortKeys(entry as unknown)));
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sortKeys);
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    out[key] = sortKeys((value as Record<string, unknown>)[key]);
  }
  return out;
}

/**
 * The bundled snapshot. The `sha256` digest is computed over the
 * canonical JSON form of `entries` at module load time so consumers
 * can verify integrity without trusting the package metadata.
 *
 * @stable
 */
export const BUNDLED_SNAPSHOT: PricingSnapshot = Object.freeze({
  version: 'graphorin/0.1',
  source:
    'https://github.com/o-stepper/graphorin/tree/main/packages/pricing/src/snapshot/bundled.ts',
  snapshotDate: SNAPSHOT_DATE,
  currency: 'USD',
  sha256: computeEntriesDigest(ENTRIES),
  entries: ENTRIES,
});
