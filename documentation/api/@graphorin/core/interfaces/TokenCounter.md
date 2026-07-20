[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / TokenCounter

# Interface: TokenCounter

Defined in: packages/core/src/contracts/token-counter.ts:14

**`Stable`**

Pluggable token counter. Implementations live in `@graphorin/provider`
(default `JsTiktokenCounter` for OpenAI/compatible, plus per-vendor
native counters) and are interchangeable behind this interface.

Counters carry a `version` field so that consumers (e.g. the
`session_messages.tokenizer_version` cache column) can invalidate stale
cached counts when the underlying tokenizer is upgraded.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Human-readable identifier (`'js-tiktoken@cl100k_base'`, …). | packages/core/src/contracts/token-counter.ts:16 |
| <a id="property-version"></a> `version` | `readonly` | `string` | Tokenizer version string used for cache invalidation. | packages/core/src/contracts/token-counter.ts:18 |

## Methods

### count()

```ts
count(messages): Promise<number>;
```

Defined in: packages/core/src/contracts/token-counter.ts:20

Count tokens in a list of `Message`s (system/user/assistant/tool).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `messages` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] |

#### Returns

`Promise`\&lt;`number`\&gt;

***

### countText()

```ts
countText(text): Promise<number>;
```

Defined in: packages/core/src/contracts/token-counter.ts:22

Count tokens in a raw text string.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

`Promise`\&lt;`number`\&gt;
