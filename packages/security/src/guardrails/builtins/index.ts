/**
 * Re-export bundle for the seven built-in guardrails. Consumers can
 * `import { guardrails } from '@graphorin/security/guardrails'` and
 * use `guardrails.maxLength({ ... })`, etc., to compose pipelines.
 *
 * @packageDocumentation
 */

export {
  type DetectedLanguage,
  detectLanguage,
  type LanguageWhitelistOptions,
  languageWhitelist,
} from './language-whitelist.js';
export {
  llmModeration,
  type ModerationDecision,
  type ModerationGuardrailOptions,
  type ModerationProvider,
  outputModeration,
} from './llm-moderation.js';
export { type MaxLengthOptions, maxLength } from './max-length.js';
export {
  containsPii,
  DEFAULT_PII_PATTERNS,
  luhn,
  type PiiDetectionOptions,
  type PiiPattern,
  piiDetection,
} from './pii-detection.js';
export {
  DEFAULT_INJECTION_PATTERNS,
  type PromptInjectionHeuristicsOptions,
  promptInjectionHeuristics,
} from './prompt-injection-heuristics.js';
export {
  type ObservedToolCall,
  type ToolUsageValidatorOptions,
  toolUsageValidator,
} from './tool-usage-validator.js';
