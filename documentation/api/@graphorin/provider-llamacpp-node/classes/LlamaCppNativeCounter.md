[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider-llamacpp-node](/api/@graphorin/provider-llamacpp-node/index.md) / LlamaCppNativeCounter

# Class: LlamaCppNativeCounter

Defined in: counter.ts:34

Counter that delegates to `model.tokenize(text)` from the loaded
GGUF instance. Cache invalidation is keyed on the model file path
(when supplied) so swapping models invalidates per-message caches
upstream.

## Stable

## Implements

- [`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md)

## Constructors

### Constructor

```ts
new LlamaCppNativeCounter(options): LlamaCppNativeCounter;
```

Defined in: counter.ts:39

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`LlamaCppNativeCounterOptions`](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaCppNativeCounterOptions.md) |

#### Returns

`LlamaCppNativeCounter`

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Human-readable identifier (`'js-tiktoken@cl100k_base'`, …). | counter.ts:35 |
| <a id="property-version"></a> `version` | `readonly` | `string` | Tokenizer version string used for cache invalidation. | counter.ts:36 |

## Methods

### count()

```ts
count(messages): Promise<number>;
```

Defined in: counter.ts:46

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

Defined in: counter.ts:55

Count tokens in a raw text string.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

`Promise`\&lt;`number`\&gt;

#### Implementation of

[`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md).[`countText`](/api/@graphorin/core/interfaces/TokenCounter.md#counttext)
