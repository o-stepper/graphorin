---
'@graphorin/core': minor
'@graphorin/observability': minor
---

W-094: span EVENT attributes can finally carry a sensitivity tier. `AISpan.addEvent` gains an optional third parameter (`{ sensitivity, sensitivityByAttribute }`, additive - existing implementations keep compiling), the tracer records it onto `SpanRecordEvent.sensitivityByAttribute`, and the validation exporter honours it instead of passing an empty map (which dropped EVERY event attribute under the default `'public'` floor). Out of the box, `recordException` now exports a `exception` event with a non-empty `exception.type` (the class name - safe and load-bearing for error dashboards) while `exception.message`/`exception.stacktrace` stay `'internal'`; `emitGenAIMessageEvents` marks role / `gen_ai.system` / message name / tool-call id `'public'` and keeps content `'internal'`. Untagged event attributes keep the default-deny behaviour, and `onViolation` now distinguishes event drops from span-attribute drops via `origin: 'event:<name>'`.
