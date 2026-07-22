[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / IterativeRetrievalDeps

# Interface: IterativeRetrievalDeps\&lt;H\&gt;

Defined in: packages/memory/src/search/iterative.ts:374

**`Stable`**

Dependencies injected into [runIterativeRetrieval](/api/@graphorin/memory/functions/runIterativeRetrieval.md). The loop does
no I/O of its own - `retrieve` and `grader` own all side effects.

## Type Parameters

| Type Parameter |
| ------ |
| `H` |

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-grader"></a> `grader` | \| [`RetrievalGrader`](/api/@graphorin/memory/interfaces/RetrievalGrader.md) \| `null` | Grader; `null` ⇒ single-shot (no grading, no provider call). | packages/memory/src/search/iterative.ts:386 |

## Methods

### fuse()?

```ts
optional fuse(lists): readonly H[];
```

Defined in: packages/memory/src/search/iterative.ts:394

Re-fuse the per-pass hit lists into one ranked list.
Receives one list per pass in pass order; the result feeds the
final `maxResults` cut so a pass-2 find can outrank pass-1 noise.
Absent ⇒ the loop falls back to round-robin interleaving (still
strictly better than the old discovery-order cut).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `lists` | readonly readonly `H`[][] |

#### Returns

readonly `H`[]

***

### idOf()

```ts
idOf(hit): string;
```

Defined in: packages/memory/src/search/iterative.ts:384

Stable id used to dedup hits across passes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `hit` | `H` |

#### Returns

`string`

***

### retrieve()

```ts
retrieve(
   query, 
   widen, 
signal?): Promise<readonly H[]>;
```

Defined in: packages/memory/src/search/iterative.ts:380

Run one retrieval pass for `query`. `widen` is `true` on
reformulation passes so the caller can broaden recall (e.g. enable
one-hop graph expansion).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `widen` | `boolean` |
| `signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;readonly `H`[]\&gt;

***

### snippetOf()

```ts
snippetOf(hit): string;
```

Defined in: packages/memory/src/search/iterative.ts:382

Snippet shown to the grader for a hit.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `hit` | `H` |

#### Returns

`string`
