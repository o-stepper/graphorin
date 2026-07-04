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
  // a non-canonical alias (e.g. `legacy-thinking-router`). Prefix /
  // substring matching because the AI SDK reports dotted provider ids
  // (`'anthropic.messages'`, `'amazon-bedrock.messages'`), not the
  // bare vendor name (core-provider-11).
  if (
    provider !== undefined &&
    (provider.startsWith('anthropic') || provider.includes('bedrock'))
  ) {
    return 'round-trip-required';
  }
  const normalised = stripPrefix(input.modelId.toLowerCase());
  for (const rule of REASONING_CONTRACT_RULES) {
    if (rule.pattern.test(normalised)) return rule.contract;
  }
  return 'optional';
}

/**
 * Bedrock cross-region inference-profile prefix (`us.anthropic.claude-…`,
 * the standard way to invoke Claude on Bedrock since 2025). Stripped
 * before pattern matching so the `^anthropic\.claude` rules still fire
 * (core-provider-11).
 */
const BEDROCK_REGION_PREFIX = /^(?:us|eu|apac|jp|au|us-gov)\./;

function stripPrefix(model: string): string {
  const slash = model.indexOf('/');
  if (slash !== -1) return model.slice(slash + 1).replace(BEDROCK_REGION_PREFIX, '');
  const deRegioned = model.replace(BEDROCK_REGION_PREFIX, '');
  // Bedrock ids end in ':<version>' (`anthropic.claude-...-v1:0`) — the
  // colon there is a version separator, not a provider/model split, and
  // the rule patterns are prefix-anchored so the suffix is harmless.
  if (deRegioned.startsWith('anthropic.')) return deRegioned;
  const colon = deRegioned.indexOf(':');
  if (colon !== -1 && !deRegioned.startsWith('http')) {
    return deRegioned.slice(colon + 1);
  }
  return deRegioned;
}
