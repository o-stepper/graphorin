/**
 * `inferReasoningContract` — derive the canonical
 * {@link ReasoningContract} value for a model id. Adapters that wrap
 * cloud-LLM language-model values call this at construction time so
 * the runtime can pick the correct
 * {@link import('@graphorin/core').ReasoningRetention} default.
 *
 * The classifier is a pure function with the same shape as the
 * `classifyModelTier` family: a small static rule table matched
 * against the lowercased + prefix-stripped model id.
 *
 * @packageDocumentation
 */

import type { ReasoningContract } from '@graphorin/core';

/**
 * Single entry in the contract-classifier rule table.
 *
 * @stable
 */
export interface ReasoningContractRule {
  readonly contract: ReasoningContract;
  readonly pattern: RegExp;
  /** Human-readable family label. */
  readonly family: string;
}

/**
 * Static rule table. Higher-specificity entries come first. Mirrors
 * the per-family matrix documented for the provider layer.
 *
 * @stable
 */
export const REASONING_CONTRACT_RULES: readonly ReasoningContractRule[] = Object.freeze([
  // Anthropic Claude families (and Bedrock-distributed equivalents).
  {
    contract: 'round-trip-required',
    family: 'anthropic-claude',
    pattern: /^claude(?:-\d|-)/,
  },
  {
    contract: 'round-trip-required',
    family: 'bedrock-claude',
    pattern: /^anthropic\.claude/,
  },
  // OpenAI hidden chain-of-thought reasoning models.
  { contract: 'hidden', family: 'openai-reasoning', pattern: /^o[1-9]\b/ },
  { contract: 'hidden', family: 'openai-reasoning-extended', pattern: /^o[1-9][a-z-]/ },
  // Google Gemini reasoning families (the dedicated thinking variants;
  // the regular pro / flash families do not require round-tripping).
  {
    contract: 'hidden',
    family: 'gemini-reasoning',
    pattern: /^gemini.*(?:thinking|reasoning)/,
  },
]);

/**
 * Inputs to {@link inferReasoningContract}.
 *
 * @stable
 */
export interface InferReasoningContractInput {
  readonly modelId: string;
  readonly provider?: string;
}

/**
 * Return the canonical {@link ReasoningContract} for a model id, or
 * `'optional'` for unknown / Ollama / OpenAI-compatible families.
 *
 * @stable
 */
export function inferReasoningContract(input: InferReasoningContractInput): ReasoningContract {
  if (typeof input.modelId !== 'string' || input.modelId.length === 0) {
    return 'optional';
  }
  const provider = input.provider?.toLowerCase();
  // Provider-explicit short-circuits — let cloud-LLM consumers tag
  // their model with `provider: 'anthropic'` even when the modelId is
  // a non-canonical alias (e.g. `legacy-thinking-router`).
  if (provider === 'anthropic' || provider === 'bedrock') {
    return 'round-trip-required';
  }
  const normalised = stripPrefix(input.modelId.toLowerCase());
  for (const rule of REASONING_CONTRACT_RULES) {
    if (rule.pattern.test(normalised)) return rule.contract;
  }
  return 'optional';
}

function stripPrefix(model: string): string {
  const slash = model.indexOf('/');
  if (slash !== -1) return model.slice(slash + 1);
  const colon = model.indexOf(':');
  if (colon !== -1 && !model.startsWith('http')) {
    return model.slice(colon + 1);
  }
  return model;
}
