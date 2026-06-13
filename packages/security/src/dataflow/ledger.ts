/**
 * Per-run taint ledger: records the provenance of tool outputs and
 * answers verbatim-carry probes for sink checks.
 *
 * @packageDocumentation
 */

import type { ArgsTaintProbe, TaintLabel, TaintLedger, TaintLedgerSnapshot } from './types.js';

/** Default minimum shared-span length (normalized chars). */
const DEFAULT_MIN_SPAN_LENGTH = 20;
/** Default total budget for recorded untrusted text (normalized chars). */
const DEFAULT_MAX_TRACKED_CHARS = 262_144;
/** Floor below which a verbatim probe is considered too trivial to trust. */
const MIN_TRUSTWORTHY_WINDOW = 8;

/** Lowercase + collapse whitespace runs to a single space + trim. */
function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** All length-`window` substrings of `text` (stride 1). */
function shingles(text: string, window: number): Set<string> {
  const out = new Set<string>();
  if (window <= 0 || text.length < window) return out;
  for (let i = 0; i + window <= text.length; i++) {
    out.add(text.slice(i, i + window));
  }
  return out;
}

/** `true` iff any length-`window` substring of `text` is in `grams`. */
function sharesAnyGram(text: string, grams: ReadonlySet<string>, window: number): boolean {
  if (window <= 0 || text.length < window) return false;
  for (let i = 0; i + window <= text.length; i++) {
    if (grams.has(text.slice(i, i + window))) return true;
  }
  return false;
}

interface TrackedSpan {
  readonly text: string;
  readonly sourceKind: string;
}

/**
 * Create a run-scoped {@link TaintLedger}.
 *
 * Verbatim detection is a bounded shingle intersection: an output is
 * tracked only when its normalized length is ≥ `minSpanLength`, and the
 * total tracked text is FIFO-capped at `maxTrackedChars` (oldest spans
 * evicted first). Detection is therefore **best-effort** — it catches
 * verbatim / near-verbatim forwarding of untrusted content, not
 * paraphrase, and degrades gracefully past the budget. The conservative
 * {@link TaintLedger.untrustedSeen}/`sensitiveSeen` flags are never lossy:
 * they are the load-bearing signal for the lethal-trifecta gate.
 *
 * @stable
 */
export function createTaintLedger(opts?: {
  readonly minSpanLength?: number;
  readonly maxTrackedChars?: number;
  /**
   * AG-19: rehydrate the coarse trifecta-gate flags from a prior
   * {@link TaintLedger.snapshot}, so a resumed run does not start with an empty
   * ledger that silently un-gates sinks exposed before the suspend. Spans are
   * not restored (they are untrusted text and are not persisted), so the
   * verbatim-carry probe restarts while the load-bearing gate is preserved.
   */
  readonly initial?: TaintLedgerSnapshot;
  /**
   * SDF-8 / FIDES-lattice: optional predicate run over each tool output. When it
   * returns `true`, the read counts toward `sensitiveSeen` even if the tool's
   * declared `sensitivity` is not `'secret'` — so PII/user-content exfiltration
   * trips the lethal-trifecta leg. Wire `containsPii` here to opt in; omit for
   * byte-identical behaviour.
   */
  readonly piiSensitivity?: (text: string) => boolean;
}): TaintLedger {
  // SDF-5: the verbatim probe needs a window of at least
  // MIN_TRUSTWORTHY_WINDOW chars to be meaningful — a sub-floor
  // minSpanLength used to silently make `inspectArgs` always-negative
  // (the opposite of the documented "lower = more sensitive"). Clamp
  // UP to the floor so detection stays on.
  const requestedMinSpan = Math.max(1, opts?.minSpanLength ?? DEFAULT_MIN_SPAN_LENGTH);
  const minSpanLength = Math.max(requestedMinSpan, MIN_TRUSTWORTHY_WINDOW);
  const maxTrackedChars = Math.max(
    minSpanLength,
    opts?.maxTrackedChars ?? DEFAULT_MAX_TRACKED_CHARS,
  );

  let untrustedSeen = opts?.initial?.untrustedSeen ?? false;
  let sensitiveSeen = opts?.initial?.sensitiveSeen ?? false;
  const untrustedSourceKinds = new Set<string>(opts?.initial?.untrustedSourceKinds ?? []);
  const piiSensitivity = opts?.piiSensitivity;
  const spans: TrackedSpan[] = [];
  let trackedChars = 0;

  return {
    recordOutput(label: TaintLabel, outputText: string): void {
      if (label.sensitive) {
        sensitiveSeen = true;
      } else if (!sensitiveSeen && piiSensitivity !== undefined && piiSensitivity(outputText)) {
        // FIDES-lattice (SDF-8): PII in the output is a sensitive read even
        // without a 'secret' tag. `sensitiveSeen` latches, so scan only while
        // it is still false.
        sensitiveSeen = true;
      }
      if (!label.untrusted) return;
      untrustedSeen = true;
      untrustedSourceKinds.add(label.sourceKind);

      const normalized = normalize(outputText);
      if (normalized.length < minSpanLength) return;
      // Cap a single oversized span to the total budget (store a prefix).
      const text =
        normalized.length > maxTrackedChars ? normalized.slice(0, maxTrackedChars) : normalized;
      spans.push({ text, sourceKind: label.sourceKind });
      trackedChars += text.length;
      // FIFO-evict oldest spans until within budget.
      while (trackedChars > maxTrackedChars && spans.length > 1) {
        const evicted = spans.shift();
        if (evicted !== undefined) trackedChars -= evicted.text.length;
      }
    },

    inspectArgs(argsText: string): ArgsTaintProbe {
      const argsNorm = normalize(argsText);
      const window = Math.min(minSpanLength, argsNorm.length);
      if (window < MIN_TRUSTWORTHY_WINDOW || spans.length === 0) {
        return { carriesUntrustedVerbatim: false, matchedSourceKinds: [] };
      }
      const argGrams = shingles(argsNorm, window);
      if (argGrams.size === 0) {
        return { carriesUntrustedVerbatim: false, matchedSourceKinds: [] };
      }
      const matched = new Set<string>();
      for (const span of spans) {
        if (sharesAnyGram(span.text, argGrams, window)) matched.add(span.sourceKind);
      }
      return {
        carriesUntrustedVerbatim: matched.size > 0,
        matchedSourceKinds: [...matched],
      };
    },

    get untrustedSeen(): boolean {
      return untrustedSeen;
    },
    get sensitiveSeen(): boolean {
      return sensitiveSeen;
    },
    get untrustedSourceKinds(): ReadonlyArray<string> {
      return [...untrustedSourceKinds];
    },

    snapshot(): TaintLedgerSnapshot {
      // Coarse flags only — never the tracked spans (untrusted text).
      return {
        untrustedSeen,
        sensitiveSeen,
        untrustedSourceKinds: [...untrustedSourceKinds],
      };
    },
  };
}
