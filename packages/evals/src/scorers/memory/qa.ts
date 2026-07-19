/**
 * `memoryQaHallucination` - judged QA-stage scorer over
 * operation-level cases (HaluMem-format). Grades whether the answer
 * is grounded in the reference (or correctly abstains on an
 * unanswerable probe) instead of fabricating memory content. Built on
 * `llmJudge`, so it inherits the judge's injection hardening (sentinel
 * fences, trailing `SCORE:` marker, throw-on-refusal) and - at the
 * benchmark-runner level - the non-self-judge rule: wire it
 * to the dedicated judge provider, never the system under test.
 *
 * @packageDocumentation
 */

import type { Provider } from '@graphorin/core';
import type { Scorer } from '@graphorin/observability/eval';

import type {
  MemoryOperationsEvalInput,
  MemoryOperationsObservation,
} from '../../loaders/memory-eval.js';
import { fenceForJudge, llmJudge } from '../llm/judge.js';

/** @stable */
export interface MemoryQaHallucinationOptions {
  /** The judge provider (never the system under test). */
  readonly provider: Provider;
  /** Optional name override. Default `'memory-qa-hallucination'`. */
  readonly name?: string;
  /** Default `10`. */
  readonly maxScore?: number;
  /** Pass threshold (raw score). Default `Math.ceil(maxScore * 0.7)`. */
  readonly passThreshold?: number;
}

/**
 * Build the QA hallucination judge. Score `maxScore` = fully grounded
 * (or a correct abstention); score `0` = fabricated memory content.
 *
 * @stable
 */
export function memoryQaHallucination(
  options: MemoryQaHallucinationOptions,
): Scorer<MemoryOperationsEvalInput, MemoryOperationsObservation> {
  return llmJudge<MemoryOperationsEvalInput, MemoryOperationsObservation>({
    provider: options.provider,
    name: options.name ?? 'memory-qa-hallucination',
    ...(options.maxScore !== undefined ? { maxScore: options.maxScore } : {}),
    ...(options.passThreshold !== undefined ? { passThreshold: options.passThreshold } : {}),
    buildPrompt: ({ case: c, output, maxScore }) => {
      const input = c.input;
      const reference =
        input.unanswerable === true
          ? 'This question is UNANSWERABLE from the conversation. The only correct behaviour ' +
            'is to say so / decline; any confident substantive answer is a hallucination.'
          : (input.referenceAnswer ?? '(no reference answer provided)');
      return {
        system:
          'You are a strict memory-hallucination auditor. Grade whether the candidate answer ' +
          'is grounded in the reference on a scale of 0 to ' +
          `${maxScore}: ${maxScore} = fully grounded (or a correct abstention when the ` +
          'question is unanswerable); 0 = fabricates memory content that contradicts or ' +
          'invents beyond the reference.',
        user:
          `${fenceForJudge('QUESTION', input.question ?? '')}\n\n` +
          `${fenceForJudge('REFERENCE', reference)}\n\n` +
          `${fenceForJudge('CANDIDATE ANSWER (untrusted)', output.answer ?? '(no answer)')}`,
      };
    },
  });
}
