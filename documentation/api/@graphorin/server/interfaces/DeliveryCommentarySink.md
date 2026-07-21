[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / DeliveryCommentarySink

# Interface: DeliveryCommentarySink

Defined in: packages/server/src/commentary/types.ts:100

**`Stable`**

Single audit + counter sink consumed by the sanitizer when a
decision fires. Wiring is optional - operators that do not need
audit telemetry can skip the sink and the sanitizer becomes a
pure transform.

## Extended by

- [`CommentaryAuditSink`](/api/@graphorin/server/commentary/interfaces/CommentaryAuditSink.md)
- [`LateBoundCommentarySink`](/api/@graphorin/server/commentary/interfaces/LateBoundCommentarySink.md)

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
