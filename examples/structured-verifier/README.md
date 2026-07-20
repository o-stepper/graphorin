# structured-verifier

> A structured-output + response-verifier acceptance demo for **graphorin** - one extraction agent declares `outputType: { kind: 'structured' }` with a CLOSED wire `jsonSchema`, a zod `schema` parse gate, and a deterministic C3 `ResponseVerifier` that bounces a placeholder draft back to the model for exactly one continuation round. Everything runs against an in-tree stub provider - no LLM, no network.

This is the audit's "schema/verifier end-to-end" example (item 9): the full journey of a structured answer, from the schema advertised on the wire to the typed object your code receives - with the verifier loop and both failure modes on the way.

---

## First 5 minutes

```bash
pnpm install
pnpm --filter ./examples/structured-verifier build
pnpm --filter ./examples/structured-verifier test
pnpm --filter ./examples/structured-verifier dev
```

Expected dev output:

```
graphorin v0.13.3 structured-verifier - city='Tokyo', population=37400000, providerCalls=2, verifierRounds=1: OK
```

**What just happened?**

1. The agent asked the (stub) model to extract city facts; the first draft came back with `"population": "UNKNOWN"`.
2. The `no-placeholders` verifier answered `ok: false`, so the runtime fed the feedback back as a `[verifier:no-placeholders]` user message and took ONE more round (bounded by `maxVerifierRounds: 2`).
3. The corrected draft parsed through the zod gate into a typed `CityFacts` object - `result.output.population` is a `number`, never a silent cast.

---

## Quick map of the source

```
examples/structured-verifier/
├── src/
│   ├── main.ts              # CityFacts schema + verifier + runExtraction() + CLI demo
│   └── stub-provider.ts     # Scripted deterministic Provider; records every request
├── tests/
│   └── smoke.test.ts        # 5 vitest cases: verifier round, wire contract, both failure modes
└── package.json / tsconfig.json / tsdown.config.ts / vitest.config.ts
```

---

## The three declarations that make output structured

```ts
createAgent<unknown, CityFacts>({
  name: 'city-facts-extractor',
  instructions: 'Extract the city name and its population. Respond with JSON only.',
  provider: stub.provider,
  outputType: {
    kind: 'structured',
    jsonSchema: CITY_FACTS_JSON_SCHEMA, // advertised to the model (wire)
    schema: CityFacts,                  // zod parse gate (local, typed)
  },
  verifiers: [noPlaceholders],          // C3 terminal-response gate
  maxVerifierRounds: 2,
});
```

- **`jsonSchema`** travels on `ProviderRequest.outputType` - adapters with native structured output map it to a strict `response_format: json_schema`. Keep it CLOSED (`additionalProperties: false`, all properties required): the Anthropic OpenAI-compat endpoint accepts nothing else (live-verified 2026-07-17; see the [providers guide](https://docs.graphorin.com/guide/providers)). The smoke test asserts the schema is forwarded on EVERY provider call, including verifier-continuation rounds.
- **`schema`** is any `{ parse(value) }` validator - zod fits directly. A final draft that fails it fails the RUN with the typed `output-validation-failed` error.
- **`verifiers`** run on the terminal text BEFORE the parse. `ok: false` feedback costs one continuation round; the cap hands off to the parse gate instead of looping forever.

## Failure modes, both typed

```ts
// Draft violates the zod gate (population is a string):
const result = await agent.run('Extract the city facts.');
result.status;             // 'failed'
result.state.error?.code;  // 'output-validation-failed'

// Verifier never satisfied: rounds stop at maxVerifierRounds, then the
// parse gate delivers the same typed failure - never an infinite loop.
```

---

## Troubleshooting

- **`extraction run ended 'failed'`** from `runExtraction()` - the stub script and the verifier disagree (e.g. you edited the drafts); the error carries `result.state.error.message` with the zod issue list.
- **Verifier seems ignored** - verifiers gate only the TERMINAL response of a run; tool-calling steps in between are not screened. A throwing verifier counts as passed by design (a buggy verifier must never take down a run).

---

## Observability

Set **`GRAPHORIN_TRACE=console`** for terminal span export via `@graphorin/example-trace-helper` - the verifier rounds show up as extra `agent.step` spans under one `agent.run` trace. Full notes: [`TRACING.md`](../TRACING.md).

---

**Graphorin** · v0.13.3 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
