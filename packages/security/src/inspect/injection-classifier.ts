/**
 * Pluggable prompt-injection classifier seam (D-12, item 14).
 *
 * The framework's three regex layers (inbound tool sanitization,
 * SDF-4 output guardrails, the memory write-time quarantine
 * heuristics) catch KNOWN imperative patterns; a classifier catches
 * paraphrases and novel phrasings. This module defines the seam
 * only - the framework ships NO classifier (offline default off);
 * engines (an ONNX model, an LLM judge, a cloud API) live in
 * application repositories.
 *
 * Resilience contract: a classifier error must never fail the
 * surface that consulted it. Call classifiers through
 * {@link runInjectionClassifier}, which swallows errors into `null`.
 *
 * Named `InjectionClassifier` (module `inspect/`) deliberately - the
 * existing `guard/classifier.ts` is the DEC-153 memory-guard TIER
 * classifier, an unrelated concept.
 *
 * @packageDocumentation
 */

import type { OutputGuardrail } from '../guardrails/types.js';

/** The surface a classification request originates from. @stable */
export type InjectionClassifierSurface = 'tool-inbound' | 'assistant-output' | 'memory-write';

/** One classification request. @stable */
export interface InjectionClassifierInput {
  readonly text: string;
  readonly surface: InjectionClassifierSurface;
  /** Optional provenance label, e.g. `'channel:telegram'`. */
  readonly origin?: string;
}

/** One classification verdict. @stable */
export interface InjectionClassification {
  readonly flagged: boolean;
  /** Confidence in [0, 1], when the engine reports one. */
  readonly score?: number;
  /** Bounded descriptive labels (audit counters). */
  readonly labels?: ReadonlyArray<string>;
}

/**
 * The pluggable classifier contract.
 *
 * @stable
 */
export interface InjectionClassifier {
  /** Stable engine id for audit rows, e.g. `'deberta-injection-v2'`. */
  readonly id: string;
  classify(input: InjectionClassifierInput): Promise<InjectionClassification>;
}

/**
 * Resilient invocation helper: `undefined` classifier, a rejected
 * promise or a thrown error all yield `null` - the calling surface
 * proceeds on its regex verdict alone. This is the ONLY sanctioned
 * way framework surfaces consult a classifier.
 *
 * @stable
 */
export async function runInjectionClassifier(
  classifier: InjectionClassifier | undefined | null,
  input: InjectionClassifierInput,
): Promise<InjectionClassification | null> {
  if (classifier === undefined || classifier === null) return null;
  try {
    return await classifier.classify(input);
  } catch {
    return null;
  }
}

/** Options for {@link injectionClassifierOutputGuardrail}. @stable */
export interface InjectionClassifierGuardrailOptions {
  /**
   * What a flagged output does to the run: `'warn'` (default) logs
   * and continues, `'block'` fails the run.
   */
  readonly action?: 'warn' | 'block';
}

/**
 * Adapter for the SDF-4 output-guardrail surface: wrap a classifier
 * as an `OutputGuardrail` and add it to
 * `createAgent({ guardrails: { output: [...] } })`. Non-string
 * outputs pass through; classifier errors pass through (resilience
 * contract).
 *
 * @stable
 */
export function injectionClassifierOutputGuardrail(
  classifier: InjectionClassifier,
  options: InjectionClassifierGuardrailOptions = {},
): OutputGuardrail<unknown> {
  const action = options.action ?? 'warn';
  return {
    kind: 'output',
    name: `injection-classifier:${classifier.id}`,
    check: async (value) => {
      if (typeof value !== 'string' || value.length === 0) return { ok: true };
      const verdict = await runInjectionClassifier(classifier, {
        text: value,
        surface: 'assistant-output',
      });
      if (verdict === null || !verdict.flagged) return { ok: true };
      return {
        ok: false,
        action,
        message:
          `injection classifier '${classifier.id}' flagged the output` +
          (verdict.labels !== undefined && verdict.labels.length > 0
            ? ` (${verdict.labels.join(', ')})`
            : ''),
      };
    },
  };
}
