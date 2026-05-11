/**
 * `llmJudge` — asks a `Provider` to grade the candidate output
 * against a rubric. Default scale `0..10`; pass threshold `>= 7`.
 *
 * The scorer extracts the first integer from the model's reply (same
 * heuristic as `@graphorin/reranker-llm`) so off-by-one variations in
 * the model's response shape do not break the run.
 *
 * @packageDocumentation
 */

import type { Provider } from '@graphorin/core';
import type { Case, ScoreResult, Scorer } from '@graphorin/observability/eval';

/** @stable */
export interface LlmJudgeOptions<I, O> {
  readonly provider: Provider;
  /** Optional name override. Default `'llm-judge'`. */
  readonly name?: string;
  /** Default `10`. */
  readonly maxScore?: number;
  /** Pass threshold (raw score). Default `Math.ceil(maxScore * 0.7)`. */
  readonly passThreshold?: number;
  /** Default `0` for deterministic grading. */
  readonly temperature?: number;
  /** Default `8`. */
  readonly maxOutputTokens?: number;
  /** Override the scoring prompt. The default is English. */
  readonly buildPrompt?: (input: {
    readonly case: Case<I, O>;
    readonly output: O;
    readonly maxScore: number;
  }) => { readonly system: string; readonly user: string };
}

/** @stable */
export function llmJudge<I = unknown, O = unknown>(options: LlmJudgeOptions<I, O>): Scorer<I, O> {
  const name = options.name ?? 'llm-judge';
  const maxScore = options.maxScore ?? 10;
  const passThreshold = options.passThreshold ?? Math.ceil(maxScore * 0.7);
  const temperature = options.temperature ?? 0;
  const maxOutputTokens = options.maxOutputTokens ?? 8;
  const builder = options.buildPrompt ?? defaultPromptBuilder<I, O>;
  return {
    name,
    async score({ case: c, output }): Promise<ScoreResult> {
      const prompt = builder({ case: c, output, maxScore });
      const response = await options.provider.generate({
        systemMessage: prompt.system,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: prompt.user }],
          },
        ],
        temperature,
        maxTokens: maxOutputTokens,
      });
      const text = response.text ?? '';
      const raw = parseInteger(text);
      if (raw === null) {
        return {
          pass: false,
          reason: `judge returned an unparseable response: '${text.slice(0, 80)}'`,
        };
      }
      const clamped = Math.max(0, Math.min(maxScore, raw));
      const pass = clamped >= passThreshold;
      const metadata = { raw, clamped, passThreshold, maxScore };
      if (pass) return { pass, score: clamped / maxScore, metadata };
      return {
        pass,
        score: clamped / maxScore,
        reason: `judge score ${clamped} < threshold ${passThreshold}`,
        metadata,
      };
    },
  };
}

function parseInteger(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  const direct = /^-?\d+$/.exec(trimmed);
  if (direct !== null) {
    const v = Number.parseInt(direct[0], 10);
    return Number.isFinite(v) ? v : null;
  }
  const search = /\d+/.exec(trimmed);
  if (search === null) return null;
  const v = Number.parseInt(search[0], 10);
  return Number.isFinite(v) ? v : null;
}

function defaultPromptBuilder<I, O>(input: {
  readonly case: Case<I, O>;
  readonly output: O;
  readonly maxScore: number;
}): { readonly system: string; readonly user: string } {
  const expectedFragment =
    input.case.expected !== undefined
      ? `\n\nEXPECTED OUTPUT (reference):\n${stringify(input.case.expected)}`
      : '';
  return {
    system:
      'You are a precise evaluator. Grade the candidate output against the input on a scale ' +
      `of 0 to ${input.maxScore} (higher = better). Output ONLY the integer; no explanation.`,
    user:
      `INPUT:\n${stringify(input.case.input)}\n\n` +
      `CANDIDATE OUTPUT:\n${stringify(input.output)}` +
      expectedFragment +
      `\n\nINTEGER SCORE (0-${input.maxScore}):`,
  };
}

function stringify(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
