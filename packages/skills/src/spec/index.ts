/**
 * Bundled snapshot loader for the `SKILL.md` packaging-format
 * specification.
 *
 * The framework ships an offline copy of the upstream specification
 * so the loader can decide which frontmatter fields are recognised,
 * which `graphorin-*` extensions deprecate (or co-exist with) an
 * upstream field, and whether a skill author's
 * `graphorin-anthropic-spec` hint refers to a snapshot newer or older
 * than the bundled one. The snapshot is checked-in to the repository;
 * `pnpm run check-anthropic-spec` diffs it against an upstream snapshot
 * the maintainer supplies via `--upstream` (there is no scheduled CI
 * job and no auto-refresh - the release `mvp-readiness` gate runs the
 * helper in no-upstream skip mode, which only confirms the bundled
 * snapshot parses).
 *
 * Neither the loader nor the helper fetches the upstream specification;
 * the upstream snapshot is fetched manually. The snapshot lookup is
 * deterministic and side-effect free at runtime.
 *
 * @packageDocumentation
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Stability classification of a known upstream field. */
export type FieldStability = 'stable' | 'standardized' | 'experimental';

/** Migration policy applied to a `graphorin-*` field that maps to an upstream field. */
export type GraphorinFieldPolicy = 'deprecate-graphorin-prefix' | 'co-exist' | 'graphorin-only';

/** Single entry of the upstream-known fields map. */
export interface KnownFieldEntry {
  readonly since: string;
  readonly required: boolean;
  readonly type: string;
  readonly stability: FieldStability;
}

/** Single entry of the `graphorin-*` mapping map. */
export interface GraphorinMappingEntry {
  readonly anthropicEquivalent: string | null;
  readonly policy: GraphorinFieldPolicy;
  readonly since?: string;
  readonly rationale?: string;
  readonly deprecateAt?: string;
  readonly removeAt?: string;
}

/** Top-level shape of the bundled snapshot. */
export interface SpecSnapshot {
  readonly snapshotDate: string;
  readonly specSource: string;
  readonly specCommit: string | null;
  readonly rationale?: string;
  readonly knownFields: Readonly<Record<string, KnownFieldEntry>>;
  readonly graphorinMapping: Readonly<Record<string, GraphorinMappingEntry>>;
}

let cached: SpecSnapshot | null = null;
let overrideSnapshot: SpecSnapshot | null = null;

/**
 * Override the bundled snapshot. Used by tests that exercise the
 * "newer / older spec snapshot" branches of the validator.
 *
 * @experimental
 */
export function _setSpecSnapshotForTesting(snapshot: SpecSnapshot | null): void {
  overrideSnapshot = snapshot;
}

/**
 * Return the currently active snapshot. Loads the bundled JSON file
 * on first call, then caches the parsed object.
 *
 * @stable
 */
export function getSpecSnapshot(): SpecSnapshot {
  if (overrideSnapshot !== null) return overrideSnapshot;
  if (cached !== null) return cached;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const candidates = [
    // Source: packages/skills/src/spec/index.ts → ../../anthropic-spec-snapshot.json
    join(__dirname, '..', '..', 'anthropic-spec-snapshot.json'),
    // Built ESM: packages/skills/dist/spec/index.js → ../../anthropic-spec-snapshot.json
    join(__dirname, '..', '..', 'anthropic-spec-snapshot.json'),
  ];
  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      const raw = readFileSync(candidate, 'utf8');
      const parsed = JSON.parse(raw) as SpecSnapshot;
      cached = parsed;
      return parsed;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    `Failed to load bundled spec snapshot. Tried: ${candidates.join(', ')}. ` +
      `Cause: ${(lastError as Error).message}`,
  );
}

/**
 * Resolve a known-field entry by name. Returns `undefined` if the
 * field is not part of the upstream specification.
 *
 * @stable
 */
export function getKnownField(field: string): KnownFieldEntry | undefined {
  return getSpecSnapshot().knownFields[field];
}

/**
 * Resolve the mapping entry for a `graphorin-*` field. Returns
 * `undefined` if the field is not known to the snapshot.
 *
 * @stable
 */
export function getGraphorinMapping(field: string): GraphorinMappingEntry | undefined {
  return getSpecSnapshot().graphorinMapping[field];
}

/**
 * Compare an author's `graphorin-anthropic-spec` value against the
 * bundled snapshot date. Returns:
 *
 * - `'same'`        — the author targeted the same snapshot.
 * - `'older'`       — the author targeted an older snapshot.
 * - `'newer'`       — the author targeted a newer snapshot.
 * - `'unparseable'` — the author's value could not be interpreted as
 *   an ISO-8601 date.
 *
 * @stable
 */
export function compareAuthorSpecHint(
  authorValue: string,
): 'same' | 'older' | 'newer' | 'unparseable' {
  const snapshot = getSpecSnapshot();
  const author = parseDate(authorValue);
  const local = parseDate(snapshot.snapshotDate);
  if (author === null || local === null) return 'unparseable';
  if (author.getTime() === local.getTime()) return 'same';
  return author.getTime() > local.getTime() ? 'newer' : 'older';
}

function parseDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}/u.test(trimmed)) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}
