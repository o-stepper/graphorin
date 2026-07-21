[**Graphorin API reference v0.13.12**](../../index.md)

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
> Project Graphorin · v0.13.12 · MIT License · © 2026 Oleksiy Stepurenko ·
> <https://github.com/o-stepper/graphorin>

---

## Status

- **Published:** v0.13.12 (optional sub-pack)
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

The reranker reuses your existing `Provider` instance - no extra
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

- ADR-024 - Reciprocal Rank Fusion default + pluggable rerankers.

---

## License

MIT © 2026 Oleksiy Stepurenko

---

**Project Graphorin** · v0.13.12 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

## Modules

| Module | Description |
| ------ | ------ |
| [](/api/@graphorin/reranker-llm/README.md) | @graphorin/reranker-llm - LLM-as-reranker adapter for the Graphorin framework. |
| [package.json](/api/@graphorin/reranker-llm/package.json/index.md) | - |
