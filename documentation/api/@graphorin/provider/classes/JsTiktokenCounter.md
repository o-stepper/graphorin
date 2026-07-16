[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / JsTiktokenCounter

# Class: JsTiktokenCounter

Defined in: [packages/provider/src/counters/js-tiktoken.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/js-tiktoken.ts#L75)

Counter that delegates to the `js-tiktoken` package. Caches the
dynamically-loaded module per process; tests use `moduleOverride`
to supply a fixture-shaped substitute.

## Stable

## Implements

- [`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md)

## Constructors

### Constructor

```ts
new JsTiktokenCounter(options?): JsTiktokenCounter;
```

Defined in: [packages/provider/src/counters/js-tiktoken.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/js-tiktoken.ts#L83)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`JsTiktokenCounterOptions`](/api/@graphorin/provider/interfaces/JsTiktokenCounterOptions.md) |

#### Returns

`JsTiktokenCounter`

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Human-readable identifier (`'js-tiktoken@cl100k_base'`, …). | [packages/provider/src/counters/js-tiktoken.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/js-tiktoken.ts#L76) |
| <a id="property-version"></a> `version` | `readonly` | `string` | Tokenizer version string used for cache invalidation. | [packages/provider/src/counters/js-tiktoken.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/js-tiktoken.ts#L77) |

## Methods

### count()

```ts
count(messages): Promise<number>;
```

Defined in: [packages/provider/src/counters/js-tiktoken.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/js-tiktoken.ts#L91)

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

Defined in: [packages/provider/src/counters/js-tiktoken.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/js-tiktoken.ts#L101)

Count tokens in a raw text string.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

`Promise`\&lt;`number`\&gt;

#### Implementation of

[`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md).[`countText`](/api/@graphorin/core/interfaces/TokenCounter.md#counttext)
