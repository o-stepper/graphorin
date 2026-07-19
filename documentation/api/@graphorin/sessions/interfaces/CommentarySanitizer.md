[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / CommentarySanitizer

# Interface: CommentarySanitizer

Defined in: packages/sessions/src/commentary/sanitizer.ts:75

**`Stable`**

Stateless, deterministic sanitizer. The methods are async-friendly
but synchronous on the inside; the API is structured this way so
future revisions can move the regex pass into a worker pool.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-patterns"></a> `patterns` | `readonly` | readonly [`CommentaryPattern`](/api/@graphorin/sessions/interfaces/CommentaryPattern.md)[] | packages/sessions/src/commentary/sanitizer.ts:77 |
| <a id="property-policy"></a> `policy` | `readonly` | [`CommentaryPolicy`](/api/@graphorin/sessions/type-aliases/CommentaryPolicy.md) | packages/sessions/src/commentary/sanitizer.ts:76 |

## Methods

### sanitizeMessage()

```ts
sanitizeMessage(message, boundary): {
  decisions: readonly CommentarySanitizationDecision[];
  message: Message;
};
```

Defined in: packages/sessions/src/commentary/sanitizer.ts:89

Sanitize every `MessageContent` part on a `Message`. Returns the
(possibly unchanged) message plus per-part decisions in source
order. `system` messages are pass-through (their `content` is a
plain string with no commentary potential).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) |
| `boundary` | [`CommentaryBoundary`](/api/@graphorin/sessions/type-aliases/CommentaryBoundary.md) |

#### Returns

```ts
{
  decisions: readonly CommentarySanitizationDecision[];
  message: Message;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `decisions` | readonly [`CommentarySanitizationDecision`](/api/@graphorin/sessions/interfaces/CommentarySanitizationDecision.md)[] | packages/sessions/src/commentary/sanitizer.ts:94 |
| `message` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) | packages/sessions/src/commentary/sanitizer.ts:93 |

***

### sanitizePart()

```ts
sanitizePart(part, boundary): CommentarySanitizationResult;
```

Defined in: packages/sessions/src/commentary/sanitizer.ts:82

Sanitize a single `MessageContent` part. Returns the (possibly
unchanged) part plus the audit-level decision.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `part` | [`MessageContent`](/api/@graphorin/sessions/facade/type-aliases/MessageContent.md) |
| `boundary` | [`CommentaryBoundary`](/api/@graphorin/sessions/type-aliases/CommentaryBoundary.md) |

#### Returns

[`CommentarySanitizationResult`](/api/@graphorin/sessions/interfaces/CommentarySanitizationResult.md)
