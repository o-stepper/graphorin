[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / guardrails

# guardrails

Guardrails subsystem of `@graphorin/security`. Exposes the
declarative `defineInputGuardrail` / `defineOutputGuardrail`
builders, the `composeGuardrails(...)` runner with documented
short-circuit semantics, and seven built-ins covering input length,
inbound prompt-injection heuristics, PII redaction, language
whitelisting, LLM moderation (input + output), and tool-usage
validation.

## Variables

| Variable | Description |
| ------ | ------ |
| [guardrails](/api/@graphorin/security/guardrails/variables/guardrails.md) | Bundled namespace of built-in guardrail factories. Mirrors the `guardrails.maxLength({ ... })` style used by the framework's documented quick-start. |

## Functions

| Function | Description |
| ------ | ------ |
| [languageWhitelist](/api/@graphorin/security/guardrails/functions/languageWhitelist.md) | Construct the language-whitelist guardrail. |
| [llmModeration](/api/@graphorin/security/guardrails/functions/llmModeration.md) | Construct an input-side moderation guardrail. |
| [maxLength](/api/@graphorin/security/guardrails/functions/maxLength.md) | Construct a `maxLength` guardrail. Returns an input or output variant depending on the `stage` option. |
| [outputModeration](/api/@graphorin/security/guardrails/functions/outputModeration.md) | Construct an output-side moderation guardrail. |
| [piiDetection](/api/@graphorin/security/guardrails/functions/piiDetection.md) | Construct the PII detection guardrail. |
| [promptInjectionHeuristics](/api/@graphorin/security/guardrails/functions/promptInjectionHeuristics.md) | Construct the heuristics input guardrail. |
| [toolUsageValidator](/api/@graphorin/security/guardrails/functions/toolUsageValidator.md) | Construct the tool-usage validator. |

## References

### ComposedGuardrailResult

Re-exports [ComposedGuardrailResult](/api/@graphorin/security/type-aliases/ComposedGuardrailResult.md)

***

### composeGuardrails

Re-exports [composeGuardrails](/api/@graphorin/security/functions/composeGuardrails.md)

***

### containsPii

Re-exports [containsPii](/api/@graphorin/security/functions/containsPii.md)

***

### DEFAULT\_INJECTION\_PATTERNS

Re-exports [DEFAULT_INJECTION_PATTERNS](/api/@graphorin/security/variables/DEFAULT_INJECTION_PATTERNS.md)

***

### DEFAULT\_PII\_PATTERNS

Re-exports [DEFAULT_PII_PATTERNS](/api/@graphorin/security/variables/DEFAULT_PII_PATTERNS.md)

***

### defineInputGuardrail

Re-exports [defineInputGuardrail](/api/@graphorin/security/functions/defineInputGuardrail.md)

***

### defineOutputGuardrail

Re-exports [defineOutputGuardrail](/api/@graphorin/security/functions/defineOutputGuardrail.md)

***

### DetectedLanguage

Re-exports [DetectedLanguage](/api/@graphorin/security/type-aliases/DetectedLanguage.md)

***

### detectLanguage

Re-exports [detectLanguage](/api/@graphorin/security/functions/detectLanguage.md)

***

### GuardrailAction

Re-exports [GuardrailAction](/api/@graphorin/security/type-aliases/GuardrailAction.md)

***

### GuardrailContext

Re-exports [GuardrailContext](/api/@graphorin/security/interfaces/GuardrailContext.md)

***

### GuardrailDefinition

Re-exports [GuardrailDefinition](/api/@graphorin/security/interfaces/GuardrailDefinition.md)

***

### GuardrailResult

Re-exports [GuardrailResult](/api/@graphorin/security/type-aliases/GuardrailResult.md)

***

### GuardrailStage

Re-exports [GuardrailStage](/api/@graphorin/security/type-aliases/GuardrailStage.md)

***

### InputGuardrail

Re-exports [InputGuardrail](/api/@graphorin/security/type-aliases/InputGuardrail.md)

***

### LanguageWhitelistOptions

Re-exports [LanguageWhitelistOptions](/api/@graphorin/security/interfaces/LanguageWhitelistOptions.md)

***

### luhn

Re-exports [luhn](/api/@graphorin/security/functions/luhn.md)

***

### MaxLengthOptions

Re-exports [MaxLengthOptions](/api/@graphorin/security/interfaces/MaxLengthOptions.md)

***

### ModerationDecision

Re-exports [ModerationDecision](/api/@graphorin/security/interfaces/ModerationDecision.md)

***

### ModerationGuardrailOptions

Re-exports [ModerationGuardrailOptions](/api/@graphorin/security/interfaces/ModerationGuardrailOptions.md)

***

### ModerationProvider

Re-exports [ModerationProvider](/api/@graphorin/security/type-aliases/ModerationProvider.md)

***

### normalizeForMatching

Re-exports [normalizeForMatching](/api/@graphorin/security/functions/normalizeForMatching.md)

***

### normalizeForPiiMatching

Re-exports [normalizeForPiiMatching](/api/@graphorin/security/functions/normalizeForPiiMatching.md)

***

### ObservedToolCall

Re-exports [ObservedToolCall](/api/@graphorin/security/interfaces/ObservedToolCall.md)

***

### OutputGuardrail

Re-exports [OutputGuardrail](/api/@graphorin/security/type-aliases/OutputGuardrail.md)

***

### PiiDetectionOptions

Re-exports [PiiDetectionOptions](/api/@graphorin/security/interfaces/PiiDetectionOptions.md)

***

### PiiPattern

Re-exports [PiiPattern](/api/@graphorin/security/interfaces/PiiPattern.md)

***

### PromptInjectionHeuristicsOptions

Re-exports [PromptInjectionHeuristicsOptions](/api/@graphorin/security/interfaces/PromptInjectionHeuristicsOptions.md)

***

### ToolUsageValidatorOptions

Re-exports [ToolUsageValidatorOptions](/api/@graphorin/security/interfaces/ToolUsageValidatorOptions.md)
