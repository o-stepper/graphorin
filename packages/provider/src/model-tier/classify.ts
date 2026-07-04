/**
 * Per-provider model-tier auto-classifier — returns
 * `'fast' | 'balanced' | 'smart' | undefined` for any model id. The
 * classifier is consumed by the agent runtime (Phase 12) to validate
 * operator-supplied tier mappings and to surface tier-not-mapped
 * recommendations.
 *
 * The dispatcher is a pure function; it reads from a small static
 * rule table keyed on regex patterns matched against the lowercased
 * model id. The table can be inspected via {@link CLASSIFIER_RULES}
 * for debugging and downstream tooling (CLI, dashboard, lint rules).
 *
 * @packageDocumentation
 */

import type { ModelHint, ProviderLike } from '@graphorin/core';

import { InvalidProviderError } from '../errors/errors.js';

/**
 * Single entry in the classifier rule table.
 *
 * @stable
 */
export interface ClassifierRule {
  readonly tier: ModelHint;
  readonly pattern: RegExp;
  /** Human-readable family label (`'anthropic-claude-haiku'`, …). */
  readonly family: string;
}

/**
 * The static rule table. Order matters — higher-specificity entries
 * come first (e.g. `claude-haiku` before `claude-`). Tests assert
 * that the table covers the canonical 2026 model families.
 *
 * @stable
 */
export const CLASSIFIER_RULES: readonly ClassifierRule[] = Object.freeze([
  // Anthropic — direct. PS-20: the version segment between `claude` and the
  // family word can be multi-part (`claude-3-5-haiku`, `claude-3-7-sonnet`) or
  // absent (`claude-haiku-4-5`), so allow zero-or-more `-<digits/dots>` groups.
  { tier: 'fast', family: 'anthropic-haiku', pattern: /^claude(?:-[\d.]+)*-?haiku/ },
  { tier: 'balanced', family: 'anthropic-sonnet', pattern: /^claude(?:-[\d.]+)*-?sonnet/ },
  { tier: 'smart', family: 'anthropic-opus', pattern: /^claude(?:-[\d.]+)*-?opus/ },
  { tier: 'smart', family: 'anthropic-fable', pattern: /^claude.*fable/ },
  { tier: 'smart', family: 'anthropic-mythos', pattern: /^claude.*mythos/ },
  // Anthropic — via Bedrock.
  {
    tier: 'fast',
    family: 'bedrock-claude-haiku',
    pattern: /^anthropic\.claude(?:-[\d.]+)*-?haiku/,
  },
  {
    tier: 'balanced',
    family: 'bedrock-claude-sonnet',
    pattern: /^anthropic\.claude(?:-[\d.]+)*-?sonnet/,
  },
  {
    tier: 'smart',
    family: 'bedrock-claude-opus',
    pattern: /^anthropic\.claude(?:-[\d.]+)*-?opus/,
  },
  // OpenAI.
  { tier: 'fast', family: 'openai-mini', pattern: /^gpt-(\d|\d+\.\d+)-?mini/ },
  { tier: 'fast', family: 'openai-nano', pattern: /^gpt-(\d|\d+\.\d+)-?nano/ },
  { tier: 'balanced', family: 'openai-gpt', pattern: /^gpt-(?!.*(?:mini|nano))/ },
  { tier: 'smart', family: 'openai-reasoning', pattern: /^o[1-9]\b/ },
  { tier: 'smart', family: 'openai-reasoning-extended', pattern: /^o[1-9][a-z-]/ },
  // Google Gemini.
  { tier: 'fast', family: 'gemini-flash', pattern: /^gemini.*flash/ },
  { tier: 'balanced', family: 'gemini-pro', pattern: /^gemini.*pro\b/ },
  { tier: 'smart', family: 'gemini-ultra', pattern: /^gemini.*ultra/ },
]);

/**
 * Classify a `Provider`'s `modelId` into one of `'fast' | 'balanced' |
 * 'smart'`. Returns `undefined` when the model id matches none of the
 * canonical 2026 mappings (Ollama / OpenAI-compatible / unknown).
 *
 * @stable
 */
export function classifyModelTier(provider: ProviderLike): ModelHint | undefined {
  if (provider === null || typeof provider !== 'object') {
    throw new InvalidProviderError('classifyModelTier: argument must be a Provider-shaped object.');
  }
  const modelId = provider.modelId;
  if (typeof modelId !== 'string' || modelId.length === 0) {
    throw new InvalidProviderError(
      'classifyModelTier: provider.modelId must be a non-empty string.',
    );
  }
  const normalised = stripFamilyPrefix(modelId.toLowerCase());
  for (const rule of CLASSIFIER_RULES) {
    if (rule.pattern.test(normalised)) return rule.tier;
  }
  return undefined;
}

/**
 * Bedrock cross-region inference-profile prefix (`us.anthropic.claude-…`).
 * Stripped so region-qualified ids hit the `^anthropic\.claude` rules
 * (core-provider-11).
 */
const BEDROCK_REGION_PREFIX = /^(?:us|eu|apac|jp|au|us-gov)\./;

function stripFamilyPrefix(model: string): string {
  // Common prefixes used by adapters: `anthropic/...`, `openai/...`,
  // `google/...`, `provider:model`, etc. Strip them so the rule
  // patterns can stay anchored at `^`.
  const slash = model.indexOf('/');
  if (slash !== -1) return model.slice(slash + 1).replace(BEDROCK_REGION_PREFIX, '');
  const deRegioned = model.replace(BEDROCK_REGION_PREFIX, '');
  // Bedrock ids end in ':<version>' (`anthropic.claude-...-v1:0`) — the
  // colon there is a version separator, not a provider/model split, and
  // the rule patterns are prefix-anchored so the suffix is harmless.
  if (deRegioned.startsWith('anthropic.')) return deRegioned;
  const colon = deRegioned.indexOf(':');
  if (colon !== -1 && !deRegioned.startsWith('http')) {
    // Skip URL-like values (`http://localhost:8080`) — `:` there is a
    // port separator, not a provider/model split.
    return deRegioned.slice(colon + 1);
  }
  return deRegioned;
}
