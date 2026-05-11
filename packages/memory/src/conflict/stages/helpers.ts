/**
 * Internal helpers shared across the five pipeline stages.
 *
 * @packageDocumentation
 * @internal
 */

import { md5 } from '@graphorin/core';
import type { LocalePack } from '../locale-packs/index.js';

/**
 * Lowercase + collapse whitespace + trim. Used by Stage 1 (exact
 * dedup) to compute the canonical fact body that feeds the MD5
 * comparison.
 */
export function canonicaliseFactBody(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Stable hash for a canonical fact body. We re-use the framework's
 * MD5 helper to stay consistent with the storage layer's existing
 * dedup hash column (see `facts.hash`).
 */
export function fastFactHash(text: string): string {
  return md5(text);
}

/** Strip leading articles + trim a candidate subject token. */
export function normaliseSubject(input: string, pack: LocalePack): string {
  const tokens = canonicaliseFactBody(input).split(' ');
  const stop = new Set(pack.subjectStopWords.map((s) => s.toLowerCase()));
  return tokens.filter((token) => token.length > 0 && !stop.has(token)).join(' ');
}

/**
 * Naive subject / predicate / object split. The locale pack supplies
 * the verb tokens used as predicate normalisers — the first matching
 * verb in the sentence becomes the predicate and splits the rest
 * into subject (left side) and object (right side). The split is
 * intentionally simple: anything more clever lives behind the entity-
 * linking layer (post-MVP).
 */
export function splitSubjectPredicateObject(
  text: string,
  pack: LocalePack,
): { readonly subject: string; readonly predicate: string; readonly object: string } | null {
  const canonical = canonicaliseFactBody(text);
  if (canonical.length === 0) return null;
  const tokens = canonical.split(' ');
  const verbs = new Set(pack.predicateNormalisers.map((v) => v.toLowerCase()));
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === undefined) continue;
    const stripped = token.replace(/[.,!?;:]/g, '');
    if (verbs.has(stripped)) {
      const subject = normaliseSubject(tokens.slice(0, i).join(' '), pack);
      const predicate = stripped;
      const object = canonicaliseFactBody(tokens.slice(i + 1).join(' '));
      if (subject.length === 0 || object.length === 0) continue;
      return { subject, predicate, object };
    }
  }
  return null;
}
