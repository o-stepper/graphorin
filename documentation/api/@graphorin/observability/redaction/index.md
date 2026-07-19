[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / redaction

# redaction

Sensitivity-aware redaction surface for `@graphorin/observability`.

The validator is the building block for the mandatory `withValidation()`
wrapper applied to every exporter. It defaults to **default-deny
non-public** - values declared above the tier floor are dropped + counted
- and runs every value through the catalogue of built-in PII / secret
patterns.

## References

### ALL\_BUILT\_IN\_PATTERNS

Re-exports [ALL_BUILT_IN_PATTERNS](/api/@graphorin/observability/redaction/patterns/variables/ALL_BUILT_IN_PATTERNS.md)

***

### BUILT\_IN\_IMPERATIVE\_PATTERNS

Re-exports [BUILT_IN_IMPERATIVE_PATTERNS](/api/@graphorin/observability/redaction/imperative-patterns/variables/BUILT_IN_IMPERATIVE_PATTERNS.md)

***

### BUILT\_IN\_PATTERNS

Re-exports [BUILT_IN_PATTERNS](/api/@graphorin/observability/redaction/patterns/variables/BUILT_IN_PATTERNS.md)

***

### BuiltInPatternName

Re-exports [BuiltInPatternName](/api/@graphorin/observability/redaction/patterns/type-aliases/BuiltInPatternName.md)

***

### compareSensitivityTiers

Re-exports [compareSensitivityTiers](/api/@graphorin/observability/functions/compareSensitivityTiers.md)

***

### createRedactionValidator

Re-exports [createRedactionValidator](/api/@graphorin/observability/functions/createRedactionValidator.md)

***

### DEFAULT\_VALIDATION\_CONFIG

Re-exports [DEFAULT_VALIDATION_CONFIG](/api/@graphorin/observability/variables/DEFAULT_VALIDATION_CONFIG.md)

***

### IMPERATIVE\_PREFILTER\_SUBSTRINGS

Re-exports [IMPERATIVE_PREFILTER_SUBSTRINGS](/api/@graphorin/observability/redaction/imperative-patterns/variables/IMPERATIVE_PREFILTER_SUBSTRINGS.md)

***

### ImperativePattern

Re-exports [ImperativePattern](/api/@graphorin/observability/redaction/imperative-patterns/interfaces/ImperativePattern.md)

***

### ImperativePatternName

Re-exports [ImperativePatternName](/api/@graphorin/observability/redaction/imperative-patterns/type-aliases/ImperativePatternName.md)

***

### ImperativeScanResult

Renames and re-exports [ScanResult](/api/@graphorin/observability/redaction/imperative-patterns/interfaces/ScanResult.md)

***

### OPT\_IN\_PATTERNS

Re-exports [OPT_IN_PATTERNS](/api/@graphorin/observability/redaction/patterns/variables/OPT_IN_PATTERNS.md)

***

### PatternCategory

Re-exports [PatternCategory](/api/@graphorin/observability/redaction/patterns/type-aliases/PatternCategory.md)

***

### RedactionCounters

Re-exports [RedactionCounters](/api/@graphorin/observability/interfaces/RedactionCounters.md)

***

### RedactionInput

Re-exports [RedactionInput](/api/@graphorin/observability/interfaces/RedactionInput.md)

***

### RedactionOutput

Re-exports [RedactionOutput](/api/@graphorin/observability/interfaces/RedactionOutput.md)

***

### RedactionPattern

Re-exports [RedactionPattern](/api/@graphorin/observability/redaction/patterns/interfaces/RedactionPattern.md)

***

### RedactionValidationError

Re-exports [RedactionValidationError](/api/@graphorin/observability/classes/RedactionValidationError.md)

***

### RedactionValidator

Re-exports [RedactionValidator](/api/@graphorin/observability/interfaces/RedactionValidator.md)

***

### RedactionValidatorInstance

Re-exports [RedactionValidatorInstance](/api/@graphorin/observability/interfaces/RedactionValidatorInstance.md)

***

### RedactionValidatorOptions

Re-exports [RedactionValidatorOptions](/api/@graphorin/observability/interfaces/RedactionValidatorOptions.md)

***

### RedactionViolation

Re-exports [RedactionViolation](/api/@graphorin/observability/interfaces/RedactionViolation.md)

***

### RedactionViolationCallback

Re-exports [RedactionViolationCallback](/api/@graphorin/observability/type-aliases/RedactionViolationCallback.md)

***

### scanImperativePatterns

Re-exports [scanImperativePatterns](/api/@graphorin/observability/redaction/imperative-patterns/functions/scanImperativePatterns.md)

***

### stripImperativePatterns

Re-exports [stripImperativePatterns](/api/@graphorin/observability/redaction/imperative-patterns/functions/stripImperativePatterns.md)

***

### UnvalidatedExporterError

Re-exports [UnvalidatedExporterError](/api/@graphorin/observability/classes/UnvalidatedExporterError.md)

***

### ValidationConfig

Re-exports [ValidationConfig](/api/@graphorin/observability/interfaces/ValidationConfig.md)
