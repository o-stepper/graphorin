---
'@graphorin/security': minor
'@graphorin/tools': minor
'@graphorin/agent': minor
---

Code-mode runtime pass-through (wave-E E3, plan item 13 step 1). The code-mode runtime is now a named provider contract: `CodeModeRunner` (`@graphorin/security/sandbox`) is `(options: BridgedSourceOptions) => Promise<BridgedSourceResult>`, with `runBridgedSource` as the built-in `worker_threads` implementation. `AgentConfig.codeMode: { run?, limits? }` threads a caller-chosen runtime (subprocess provider, remote runner) and script limits (`timeoutMs` / `maxMemoryMb` / `maxToolCalls`) through `registerCodeMode` into `createCodeExecuteTool` - the previously undeliverable `run`/`limits` seam. Fixed invariant: a runner receives only the script source, the allowed tool names, the host `dispatch` bridge, the signal and the limits - credentials, `RunState` and policy stay on the harness side, since every in-script tool call routes back through the executor's governance. Defaults are byte-identical (in-process worker runner).
