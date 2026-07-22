[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / AGENT\_RUN\_THREW\_MARKER

# Variable: AGENT\_RUN\_THREW\_MARKER

```ts
const AGENT_RUN_THREW_MARKER: "agent.run threw:" = 'agent.run threw:';
```

Defined in: packages/evals/src/runner.ts:60

**`Stable`**

Stable machine-scannable prefix of the scorer reason the runner
records when `agent.run` itself threw (provider/network/timeout
errors), as opposed to the agent answering and a scorer failing the
answer. Benchmark runners classify such cases as INFRASTRUCTURE
failures - the system under test never produced an answer, so the
case is not a quality result.
