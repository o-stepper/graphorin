[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / AnthropicAPICounter

# Class: AnthropicAPICounter

Defined in: packages/provider/src/counters/anthropic.ts:44

**`Stable`**

Counter that talks to `POST /v1/messages/count_tokens` when an API
key is configured. Without an API key, the counter delegates to
`JsTiktokenCounter('cl100k_base')` - the closest publicly-available
proxy for Anthropic's tokenizer.

## Implements

- [`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md)

## Constructors

### Constructor

```ts
new AnthropicAPICounter(options): AnthropicAPICounter;
```

Defined in: packages/provider/src/counters/anthropic.ts:55

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`AnthropicAPICounterOptions`](/api/@graphorin/provider/interfaces/AnthropicAPICounterOptions.md) |

#### Returns

`AnthropicAPICounter`

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Human-readable identifier (`'js-tiktoken@cl100k_base'`, …). | packages/provider/src/counters/anthropic.ts:45 |
| <a id="property-version"></a> `version` | `readonly` | `string` | Tokenizer version string used for cache invalidation. | packages/provider/src/counters/anthropic.ts:46 |

## Methods

### count()

```ts
count(messages): Promise<number>;
```

Defined in: packages/provider/src/counters/anthropic.ts:66

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

Defined in: packages/provider/src/counters/anthropic.ts:97

Count tokens in a raw text string.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

`Promise`\&lt;`number`\&gt;

#### Implementation of

[`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md).[`countText`](/api/@graphorin/core/interfaces/TokenCounter.md#counttext)
