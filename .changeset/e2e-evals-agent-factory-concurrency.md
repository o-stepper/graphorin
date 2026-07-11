---
'@graphorin/evals': minor
---

Make parallel eval runs work with framework agents (E-19 / S-21): `runEvals` gains an `agentFactory` option, invoked once per worker (with the worker index) so each worker drives its own agent instance - the supported way to run a Graphorin `Agent` (one run in flight per instance) at `concurrency > 1`. `agent` is now optional and stays for objects that tolerate overlapping `run()` calls; `agentFactory` wins when both are set, and passing neither is a `TypeError`. When a shared instance still trips the agent's concurrent-run guard, the runner now fails fast with a new exported `EvalConcurrencyError` naming the remedy (original error preserved as `cause`) instead of recording every remaining case as a generic `agent.run threw` scorer failure. The README quickstart and the evals guide, which previously steered users into the guard (shared `agent` + `concurrency: 4`), now document the single-run constraint and the `agentFactory` pattern.
