[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider-llamacpp-node](/api/@graphorin/provider-llamacpp-node/index.md) / [](/api/@graphorin/provider-llamacpp-node/README.md) / LlamaCppNativeCounter

# Class: LlamaCppNativeCounter

Defined in: [packages/provider-llamacpp-node/src/counter.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/provider-llamacpp-node/src/counter.ts#L34)

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

Defined in: [packages/provider-llamacpp-node/src/counter.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/provider-llamacpp-node/src/counter.ts#L39)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`LlamaCppNativeCounterOptions`](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaCppNativeCounterOptions.md) |

#### Returns

`LlamaCppNativeCounter`

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Human-readable identifier (`'js-tiktoken@cl100k_base'`, …). | [packages/provider-llamacpp-node/src/counter.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/provider-llamacpp-node/src/counter.ts#L35) |
| <a id="property-version"></a> `version` | `readonly` | `string` | Tokenizer version string used for cache invalidation. | [packages/provider-llamacpp-node/src/counter.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/provider-llamacpp-node/src/counter.ts#L36) |

## Methods

### count()

```ts
count(messages): Promise<number>;
```

Defined in: [packages/provider-llamacpp-node/src/counter.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/provider-llamacpp-node/src/counter.ts#L46)

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

Defined in: [packages/provider-llamacpp-node/src/counter.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/provider-llamacpp-node/src/counter.ts#L55)

Count tokens in a raw text string.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

`Promise`\&lt;`number`\&gt;

#### Implementation of

[`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md).[`countText`](/api/@graphorin/core/interfaces/TokenCounter.md#counttext)
