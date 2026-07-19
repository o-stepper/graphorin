[**Graphorin API reference v0.13.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [commentary](/api/@graphorin/server/commentary/index.md) / CommentaryAuditSink

# Interface: CommentaryAuditSink

Defined in: packages/server/src/commentary/audit-bridge.ts:59

**`Stable`**

A commentary sink that also exposes a `drain()` so callers (and tests) can
await any in-flight audit writes.

## Extends

- [`DeliveryCommentarySink`](/api/@graphorin/server/interfaces/DeliveryCommentarySink.md)

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-drain"></a> `drain` | `readonly` | () => `Promise`\&lt;`void`\&gt; | Resolve once every queued audit write has settled. | packages/server/src/commentary/audit-bridge.ts:61 |

## Methods

### onDecision()

```ts
onDecision(decision): void;
```

Defined in: packages/server/src/commentary/types.ts:106

Called once per applied decision. Implementations should be
non-throwing; the sanitizer wraps the call in `try/catch` so a
misbehaving sink never blocks the wire.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `decision` | [`DeliveryCommentaryDecision`](/api/@graphorin/server/interfaces/DeliveryCommentaryDecision.md) |

#### Returns

`void`

#### Inherited from

[`DeliveryCommentarySink`](/api/@graphorin/server/interfaces/DeliveryCommentarySink.md).[`onDecision`](/api/@graphorin/server/interfaces/DeliveryCommentarySink.md#ondecision)
