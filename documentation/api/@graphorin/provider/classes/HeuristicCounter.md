[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / HeuristicCounter

# Class: HeuristicCounter

Defined in: packages/provider/src/counters/heuristic.ts:39

**`Stable`**

Counter that estimates tokens via simple character division. The
estimator is deterministic and side-effect-free apart from the
one-time WARN.

## Implements

- [`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md)

## Constructors

### Constructor

```ts
new HeuristicCounter(options?): HeuristicCounter;
```

Defined in: packages/provider/src/counters/heuristic.ts:47

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`HeuristicCounterOptions`](/api/@graphorin/provider/interfaces/HeuristicCounterOptions.md) |

#### Returns

`HeuristicCounter`

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Human-readable identifier (`'js-tiktoken@cl100k_base'`, …). | packages/provider/src/counters/heuristic.ts:40 |
| <a id="property-version"></a> `version` | `readonly` | `string` | Tokenizer version string used for cache invalidation. | packages/provider/src/counters/heuristic.ts:41 |

## Methods

### count()

```ts
count(messages): Promise<number>;
```

Defined in: packages/provider/src/counters/heuristic.ts:59

Count tokens in a list of `Message`s (system/user/assistant/tool).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `messages` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] |

#### Returns

`Promise`\&lt;`number`\&gt;

#### Implementation of

[`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md).[`count`](/api/@graphorin/core/interfaces/TokenCounter.md#count)

***

### countText()

```ts
countText(text): Promise<number>;
```

Defined in: packages/provider/src/counters/heuristic.ts:69

Count tokens in a raw text string.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

`Promise`\&lt;`number`\&gt;

#### Implementation of

[`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md).[`countText`](/api/@graphorin/core/interfaces/TokenCounter.md#counttext)
