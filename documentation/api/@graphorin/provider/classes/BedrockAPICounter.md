[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / BedrockAPICounter

# Class: BedrockAPICounter

Defined in: [packages/provider/src/counters/bedrock.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/bedrock.ts#L28)

## Stable

## Implements

- [`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md)

## Constructors

### Constructor

```ts
new BedrockAPICounter(options): BedrockAPICounter;
```

Defined in: [packages/provider/src/counters/bedrock.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/bedrock.ts#L33)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`BedrockAPICounterOptions`](/api/@graphorin/provider/interfaces/BedrockAPICounterOptions.md) |

#### Returns

`BedrockAPICounter`

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Human-readable identifier (`'js-tiktoken@cl100k_base'`, …). | [packages/provider/src/counters/bedrock.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/bedrock.ts#L29) |
| <a id="property-version"></a> `version` | `readonly` | `string` | Tokenizer version string used for cache invalidation. | [packages/provider/src/counters/bedrock.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/bedrock.ts#L30) |

## Methods

### count()

```ts
count(messages): Promise<number>;
```

Defined in: [packages/provider/src/counters/bedrock.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/bedrock.ts#L39)

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

Defined in: [packages/provider/src/counters/bedrock.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/bedrock.ts#L43)

Count tokens in a raw text string.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

`Promise`\&lt;`number`\&gt;

#### Implementation of

[`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md).[`countText`](/api/@graphorin/core/interfaces/TokenCounter.md#counttext)
