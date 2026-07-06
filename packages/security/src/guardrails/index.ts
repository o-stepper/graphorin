/**
 * Guardrails subsystem of `@graphorin/security`. Exposes the
 * declarative `defineInputGuardrail` / `defineOutputGuardrail`
 * builders, the `composeGuardrails(...)` runner with documented
 * short-circuit semantics, and seven built-ins covering input length,
 * inbound prompt-injection heuristics, PII redaction, language
 * whitelisting, LLM moderation (input + output), and tool-usage
 * validation.
 *
 * @packageDocumentation
 */

export * from './builders.js';
export * from './builtins/index.js';
export { normalizeForMatching, normalizeForPiiMatching } from './normalize.js';
export type {
  ComposedGuardrailResult,
  GuardrailAction,
  GuardrailContext,
  GuardrailDefinition,
  GuardrailResult,
  GuardrailStage,
  InputGuardrail,
  OutputGuardrail,
} from './types.js';

import {
  type DetectedLanguage,
  detectLanguage,
  type LanguageWhitelistOptions,
  languageWhitelist,
} from './builtins/language-whitelist.js';
import {
  llmModeration,
  type ModerationDecision,
  type ModerationGuardrailOptions,
  type ModerationProvider,
  outputModeration,
} from './builtins/llm-moderation.js';
import { type MaxLengthOptions, maxLength } from './builtins/max-length.js';
import {
  DEFAULT_PII_PATTERNS,
  type PiiDetectionOptions,
  type PiiPattern,
  piiDetection,
} from './builtins/pii-detection.js';
import {
  DEFAULT_INJECTION_PATTERNS,
  type PromptInjectionHeuristicsOptions,
  promptInjectionHeuristics,
} from './builtins/prompt-injection-heuristics.js';
import {
  type ObservedToolCall,
  type ToolUsageValidatorOptions,
  toolUsageValidator,
} from './builtins/tool-usage-validator.js';

/**
 * Bundled namespace of built-in guardrail factories. Mirrors the
 * `guardrails.maxLength({ ... })` style used by the framework's
 * documented quick-start.
 *
 * @stable
 */
export const guardrails = Object.freeze({
  maxLength,
  promptInjectionHeuristics,
  piiDetection,
  languageWhitelist,
  llmModeration,
  outputModeration,
  toolUsageValidator,
});

export type {
  DetectedLanguage,
  LanguageWhitelistOptions,
  MaxLengthOptions,
  ModerationDecision,
  ModerationGuardrailOptions,
  ModerationProvider,
  ObservedToolCall,
  PiiDetectionOptions,
  PiiPattern,
  PromptInjectionHeuristicsOptions,
  ToolUsageValidatorOptions,
};

export { DEFAULT_INJECTION_PATTERNS, DEFAULT_PII_PATTERNS, detectLanguage };
