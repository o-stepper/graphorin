[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / GoogleAPICounter

# Class: GoogleAPICounter

Defined in: packages/provider/src/counters/google.ts:28

**`Stable`**

## Implements

- [`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md)

## Constructors

### Constructor

```ts
new GoogleAPICounter(options): GoogleAPICounter;
```

Defined in: packages/provider/src/counters/google.ts:33

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`GoogleAPICounterOptions`](/api/@graphorin/provider/interfaces/GoogleAPICounterOptions.md) |

#### Returns

`GoogleAPICounter`

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Human-readable identifier (`'js-tiktoken@cl100k_base'`, …). | packages/provider/src/counters/google.ts:29 |
| <a id="property-version"></a> `version` | `readonly` | `string` | Tokenizer version string used for cache invalidation. | packages/provider/src/counters/google.ts:30 |

## Methods

### count()

```ts
count(messages): Promise<number>;
```

Defined in: packages/provider/src/counters/google.ts:39

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

Defined in: packages/provider/src/counters/google.ts:43

Count tokens in a raw text string.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

`Promise`\&lt;`number`\&gt;

#### Implementation of

[`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md).[`countText`](/api/@graphorin/core/interfaces/TokenCounter.md#counttext)
