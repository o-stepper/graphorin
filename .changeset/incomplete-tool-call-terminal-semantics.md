---
'@graphorin/core': patch
'@graphorin/agent': patch
---

A provider stream that finishes while a tool call is still streaming its argument JSON (typically `finishReason: 'length'` at the output-token ceiling) no longer completes the run with the call silently dropped - the runtime now fails the run with `error.code: 'incomplete-tool-call'` so a never-executed side effect can never read as success. The loop threads the provider `finishReason` through the step chain, emits a new terminal `tool.call.incomplete` event per cut call (`toolCallId`, `toolName`, `finishReason`, accumulated `argsPrefix`; additive `AgentEvent` variant, forwarded under the `'lifecycle'` sub-agent policy), records the truncated call's token usage on the failed state, and deliberately skips fallback/retry (a fallback provider would hit the same ceiling, and re-running a side-effecting step needs the caller's idempotency decision). A `'length'` finish with no pending tool call still completes (the text is simply truncated) and is now observable as the new optional `RunStep.finishReason` field.
