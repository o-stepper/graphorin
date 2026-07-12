---
'@graphorin/security': minor
'@graphorin/agent': minor
'@graphorin/tools': minor
'@graphorin/memory': minor
'@graphorin/channels': minor
---

Assistant output as a data-flow sink + pluggable injection classifier (bot-adoption wave B, B4 / item 14). `DataFlowEvaluation` gains `sinkKind` (`'tool' | 'assistant-output'`; `isSink` honors it) and the agent guard gains `inspectAssistantOutput`: the run's outgoing text is evaluated as a sink with the stable id `'assistant-output'` in the commit path - enforce-mode blocks replace the durable message with a fixed notice and withhold the run's final output (unified with the lateral-leak path), shadow flags, and `declassifySinks: ['assistant-output']` re-opens the reply surface deliberately; findings land in the B3 verdict sidecar. New `@graphorin/security/inspect` subpath ships the `InjectionClassifier` seam (D-12): the resilient `runInjectionClassifier` (engine errors always degrade to the regex verdict) plus the `injectionClassifierOutputGuardrail` adapter, wired at all three regex layers - inbound sanitisation (`applyInboundSanitizationWithClassifier` in `@graphorin/tools/inbound`, exposed on the channel gateway as `injectionClassifier`), SDF-4 output guardrails, and the memory write-time quarantine gate (`createMemory({ injectionClassifier })`, widen-only). Offline default off everywhere; the framework ships no engine. W-103 stays warn + opt-in per D-13, with `treatPiiAsSensitive: true` recommended in the documented gateway preset.
