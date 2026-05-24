[**Graphorin API reference v0.3.0**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/reranker-llm

# @graphorin/reranker-llm

> LLM-as-reranker adapter for the
> [Graphorin](https://github.com/o-stepper/graphorin) framework. Asks
> the configured `Provider` to score `(query, passage)` pairs against
> a deterministic scoring prompt; runs scoring in parallel batches via
> `Promise.all()`. Implements the `ReRanker` contract from
> `@graphorin/memory/search`.
>
> Project Graphorin · v0.3.0 · MIT License · © 2026 Oleksiy Stepurenko ·
> <https://github.com/o-stepper/graphorin>

---

## Status

- **Published:** v0.3.0 (optional sub-pack)
- **Default temperature:** `0` (deterministic).
- **Default batch size:** `5` parallel provider calls.
- **Default max score:** `10` (operator-tunable; finer scales improve
  ordering precision at the cost of model variance).
- **Default scoring prompt:** English; locale-agnostic by design.
  Operators targeting non-English deployments pass `scoringPrompt:
  &lt;localised builder&gt;`.

---

## Install

```bash
pnpm add @graphorin/reranker-llm
```

The reranker reuses your existing `Provider` instance — no extra
network credentials beyond what the provider already needs.

---

## Usage

### Drop-in replacement for the built-in RRF reranker

```ts
import { createMemory } from '@graphorin/memory';
import { createLlmReranker } from '@graphorin/reranker-llm';

const memory = createMemory({
  store,
  embedder,
  reranker: createLlmReranker({ provider }),
});
```

### Tighter batching for rate-limited providers

```ts
const reranker = createLlmReranker({
  provider,
  batchSize: 2, // 2 concurrent calls per merged batch
  maxOutputTokens: 4,
});
```

### Custom scoring prompt (localisation / domain tuning)

```ts
import { createLlmReranker } from '@graphorin/reranker-llm';

const reranker = createLlmReranker({
  provider,
  maxScore: 100,
  scoringPrompt: ({ query, passage, maxScore }) => ({
    system:
      'Você é um avaliador preciso de relevância. Dado uma consulta e uma passagem, ' +
      `retorne um único inteiro de 0 a ${maxScore} indicando a relevância. ` +
      'Saída SOMENTE o inteiro; sem explicações.',
    user: `CONSULTA:\n${query}\n\nPASSAGEM:\n${passage}\n\nINTEIRO (0-${maxScore}):`,
  }),
});
```

### Custom passage extractor

```ts
const reranker = createLlmReranker<MyRecord>({
  provider,
  passageExtractor: (record) => `${record.title}\n\n${record.body}`,
});
```

---

## Cost / latency considerations

Every candidate triggers one provider call. For a memory hybrid-search
that retrieves 50 candidates the LLM-as-reranker therefore makes 50
calls (parallelised in batches of 5 by default = 10 sequential
batches). Pair with:

- A **smaller** judge model (e.g. `gpt-4o-mini`, `claude-3-5-haiku`,
  Gemini Flash) to keep per-call cost down.
- A **two-stage** pipeline (vector + FTS5 → RRF top-50 → LLM-judge
  top-10) so only the most-promising candidates pay the LLM cost.
- Provider middleware (`withRetry`, `withFallback`, `withCostTracking`)
  for rate-limit + budget enforcement.

---

## Output signals

Every result attaches:

| Signal              | Meaning                                                                |
|---------------------|-------------------------------------------------------------------------|
| `llm_score`         | Raw integer the model returned (0..maxScore).                          |
| `llm_score_norm`    | Normalised score in `[0, 1]` (`raw / maxScore`).                       |
| `cross_encoder`/etc | Pre-existing signals from upstream rankers (passed through unchanged). |

---

## Related decisions

- ADR-024 — Reciprocal Rank Fusion default + pluggable rerankers.

---

## License

MIT © 2026 Oleksiy Stepurenko

---

**Project Graphorin** · v0.3.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

@graphorin/reranker-llm — LLM-as-reranker adapter for the Graphorin
framework.

Asks the configured `Provider` to score `(query, passage)` pairs
against a deterministic scoring prompt; runs scoring in parallel
batches via `Promise.all()`. Drop-in replacement for the built-in
`RRFReranker`:

```ts
import { createMemory } from '@graphorin/memory';
import { createLlmReranker } from '@graphorin/reranker-llm';

const memory = createMemory({
  store,
  embedder,
  reranker: createLlmReranker({ provider }),
});
```

Defaults: `temperature: 0`, `batchSize: 5`, `maxScore: 10`. The
default scoring prompt is English; operators that target a
different locale pass `scoringPrompt: <localised builder>` per the
Phase 16 spec (the package's defaults are locale-agnostic, not
locale-privileging).

## Classes

| Class | Description |
| ------ | ------ |
| [LlmReRanker](/api/@graphorin/reranker-llm/classes/LlmReRanker.md) | `ReRanker` implementation. Matches the contract from `@graphorin/memory/search`. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [LlmRerankerOptions](/api/@graphorin/reranker-llm/interfaces/LlmRerankerOptions.md) | Options accepted by [createLlmReranker](/api/@graphorin/reranker-llm/functions/createLlmReranker.md). |
| [ScoringPrompt](/api/@graphorin/reranker-llm/interfaces/ScoringPrompt.md) | Result of a [ScoringPromptBuilder](/api/@graphorin/reranker-llm/type-aliases/ScoringPromptBuilder.md) call. The system message is forwarded verbatim to the provider; the user message is the per-pair instruction. |
| [ScoringPromptInput](/api/@graphorin/reranker-llm/interfaces/ScoringPromptInput.md) | Inputs passed to a [ScoringPromptBuilder](/api/@graphorin/reranker-llm/type-aliases/ScoringPromptBuilder.md). |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [PassageExtractor](/api/@graphorin/reranker-llm/type-aliases/PassageExtractor.md) | - |
| [ScoringPromptBuilder](/api/@graphorin/reranker-llm/type-aliases/ScoringPromptBuilder.md) | Function shape consumed by [createLlmReranker](/api/@graphorin/reranker-llm/functions/createLlmReranker.md). |

## Variables

| Variable | Description |
| ------ | ------ |
| [defaultScoringPrompt](/api/@graphorin/reranker-llm/variables/defaultScoringPrompt.md) | Default English scoring prompt. Asks the model to emit a single integer in `[0, maxScore]` and to omit any other text. |
| [RERANKER\_ID](/api/@graphorin/reranker-llm/variables/RERANKER_ID.md) | - |
| [VERSION](/api/@graphorin/reranker-llm/variables/VERSION.md) | Canonical version constant. Mirrors the `package.json` version. |

## Functions

| Function | Description |
| ------ | ------ |
| [createLlmReranker](/api/@graphorin/reranker-llm/functions/createLlmReranker.md) | Build an LLM-as-reranker. The reranker is stateless past the provider reference — the provider's own session / connection lifecycle owns the network resources. |
| [defaultPassageExtractor](/api/@graphorin/reranker-llm/functions/defaultPassageExtractor.md) | Walks `text → summary → value → label → id` to find the best passage representation of a memory record. |
| [mergeAndDedupe](/api/@graphorin/reranker-llm/functions/mergeAndDedupe.md) | Merge per-source lists, keeping the highest initial score per record id. Pure function; exported for the unit fixture. |
| [normalizeScore](/api/@graphorin/reranker-llm/functions/normalizeScore.md) | Normalise a raw integer score into `[0, 1]`. Rejects out-of-range inputs by clamping; returns the configured fallback when the input is `null` (parse failed upstream). |
| [parseIntegerResponse](/api/@graphorin/reranker-llm/functions/parseIntegerResponse.md) | Parse the model's reply into a non-negative integer. Accepts: |
