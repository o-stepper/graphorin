# personal-assistant-cli

## 0.1.0

Initial release of the single-agent local CLI personal assistant. Wires `createAgent({...})` to a six-tier `Memory` backed by `createSqliteStore({...})` + transformers.js embeddings, exposes four LLM recipes through `GRAPHORIN_LLM_RECIPE` (`ollama`, `llamacpp-server`, `llamacpp-node`, `stub`), enables the `tier: 'cheap'` consolidator so memory feels alive after the first conversation, ships a `< 20`-line hello-world snippet plus a deterministic stub provider for CI smoke coverage, and honours `GRAPHORIN_OFFLINE=1` with a clear `OfflineRecipeUnreachableError` when the chosen daemon is unreachable. `Ctrl+C` drains the in-flight turn through `agent.abort({ drain: true, onPendingApprovals: 'hold' })` before closing the SQLite store.
