/**
 * Tiny self-contained BM25 implementation used by the registry's
 * deferred-tool ranking chain.
 *
 * Uses Okapi BM25 with `k1 = 1.2`, `b = 0.75` per the canonical
 * defaults. Operators that need locale-tuned stopword lists pass
 * them through `defineBm25Index({ stopwords })`. The implementation
 * is intentionally small — the tool-search corpus is bounded by the
 * registry size, so a full inverted-index rebuild on every register /
 * unregister is acceptable.
 *
 * @packageDocumentation
 */

const DEFAULT_STOPWORDS = new Set<string>([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'for',
  'from',
  'has',
  'have',
  'in',
  'is',
  'it',
  'its',
  'of',
  'on',
  'or',
  'that',
  'the',
  'to',
  'was',
  'were',
  'will',
  'with',
]);

/** Tokenise a body — lowercase, alphanumeric runs only, drop stopwords. */
export function tokenise(
  text: string,
  stopwords: ReadonlySet<string> = DEFAULT_STOPWORDS,
): string[] {
  const tokens: string[] = [];
  const lower = text.toLowerCase();
  let buffer = '';
  for (const ch of lower) {
    if (/[a-z0-9_]/.test(ch)) {
      buffer += ch;
      continue;
    }
    if (buffer.length > 0 && !stopwords.has(buffer)) tokens.push(buffer);
    buffer = '';
  }
  if (buffer.length > 0 && !stopwords.has(buffer)) tokens.push(buffer);
  return tokens;
}

/** A single document the index knows about. */
export interface Bm25Document {
  readonly id: string;
  readonly text: string;
}

/** Configuration for {@link defineBm25Index}. */
export interface Bm25Options {
  readonly k1?: number;
  readonly b?: number;
  readonly stopwords?: ReadonlySet<string>;
}

interface CompiledIndex {
  readonly docCount: number;
  readonly avgdl: number;
  readonly docLengths: ReadonlyMap<string, number>;
  /** Per-token: docs that contain it + their term frequency. */
  readonly postings: ReadonlyMap<string, ReadonlyMap<string, number>>;
  readonly idf: ReadonlyMap<string, number>;
}

/** Score for a single match. */
export interface Bm25Match {
  readonly id: string;
  readonly score: number;
}

/**
 * Build a BM25 query function over `docs`. The returned function
 * runs in `O(query tokens × matching docs)` per invocation — bounded
 * by the registry size.
 *
 * @stable
 */
export function defineBm25Index(
  docs: ReadonlyArray<Bm25Document>,
  opts: Bm25Options = {},
): (query: string, k?: number) => Bm25Match[] {
  const k1 = opts.k1 ?? 1.2;
  const b = opts.b ?? 0.75;
  const stopwords = opts.stopwords ?? DEFAULT_STOPWORDS;
  const compiled = compileIndex(docs, stopwords);
  return function query(text: string, k = 5): Bm25Match[] {
    if (compiled.docCount === 0) return [];
    const queryTokens = tokenise(text, stopwords);
    if (queryTokens.length === 0) return [];
    const scoresPerDoc = new Map<string, number>();
    for (const token of queryTokens) {
      const idf = compiled.idf.get(token);
      if (idf === undefined || idf <= 0) continue;
      const posting = compiled.postings.get(token);
      if (posting === undefined) continue;
      for (const [docId, tf] of posting) {
        const dl = compiled.docLengths.get(docId) ?? 0;
        const norm = 1 - b + b * (dl / Math.max(1, compiled.avgdl));
        const numerator = tf * (k1 + 1);
        const denominator = tf + k1 * norm;
        const contribution = idf * (numerator / denominator);
        scoresPerDoc.set(docId, (scoresPerDoc.get(docId) ?? 0) + contribution);
      }
    }
    if (scoresPerDoc.size === 0) return [];
    // Normalise scores into [0, 1].
    let maxScore = 0;
    for (const v of scoresPerDoc.values()) if (v > maxScore) maxScore = v;
    const matches: Bm25Match[] = [];
    for (const [id, score] of scoresPerDoc) {
      matches.push({ id, score: maxScore > 0 ? score / maxScore : 0 });
    }
    matches.sort((a, b2) => b2.score - a.score);
    return matches.slice(0, k);
  };
}

function compileIndex(
  docs: ReadonlyArray<Bm25Document>,
  stopwords: ReadonlySet<string>,
): CompiledIndex {
  const docLengths = new Map<string, number>();
  const postings = new Map<string, Map<string, number>>();
  let totalLength = 0;
  for (const doc of docs) {
    const tokens = tokenise(doc.text, stopwords);
    docLengths.set(doc.id, tokens.length);
    totalLength += tokens.length;
    for (const token of tokens) {
      let perToken = postings.get(token);
      if (perToken === undefined) {
        perToken = new Map<string, number>();
        postings.set(token, perToken);
      }
      perToken.set(doc.id, (perToken.get(doc.id) ?? 0) + 1);
    }
  }
  const N = docs.length;
  const avgdl = N > 0 ? totalLength / N : 0;
  const idf = new Map<string, number>();
  for (const [token, perToken] of postings) {
    const df = perToken.size;
    // Robertson-Spärck Jones IDF (always positive — clamped to 0).
    const value = Math.log((N - df + 0.5) / (df + 0.5) + 1);
    idf.set(token, Math.max(0, value));
  }
  return {
    docCount: N,
    avgdl,
    docLengths,
    postings,
    idf,
  };
}
