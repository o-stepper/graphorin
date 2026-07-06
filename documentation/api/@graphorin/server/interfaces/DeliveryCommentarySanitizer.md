[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / DeliveryCommentarySanitizer

# Interface: DeliveryCommentarySanitizer

Defined in: [packages/server/src/commentary/sanitizer.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/sanitizer.ts#L46)

Public surface returned by [createDeliveryCommentarySanitizer](/api/@graphorin/server/functions/createDeliveryCommentarySanitizer.md).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-applytoevents"></a> `applyToEvents` | `readonly` | readonly `string`[] | [packages/server/src/commentary/sanitizer.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/sanitizer.ts#L48) |
| <a id="property-patterns"></a> `patterns` | `readonly` | readonly [`DeliveryCommentaryPattern`](/api/@graphorin/server/interfaces/DeliveryCommentaryPattern.md)[] | [packages/server/src/commentary/sanitizer.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/sanitizer.ts#L49) |
| <a id="property-policy"></a> `policy` | `readonly` | [`DeliveryCommentaryPolicy`](/api/@graphorin/server/type-aliases/DeliveryCommentaryPolicy.md) | [packages/server/src/commentary/sanitizer.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/sanitizer.ts#L47) |

## Methods

### sanitize()

```ts
sanitize(frame, transport): {
  eventId: string;
  kind: "event";
  payload?: unknown;
  subject: string;
  subscriptionId: string;
  type: string;
  v: "1";
};
```

Defined in: [packages/server/src/commentary/sanitizer.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/sanitizer.ts#L60)

Sanitize the payload of a single `event` frame. Returns the
(possibly-replaced) frame; emits an audit decision via the
configured sink when the sanitizer mutated the payload.

The frame is returned unchanged when:
  - the policy is `'pass-through'`,
  - the event type is not in `applyToEvents`,
  - or no pattern matched the JSON-stringified payload.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `frame` | \{ `eventId`: `string`; `kind`: `"event"`; `payload?`: `unknown`; `subject`: `string`; `subscriptionId`: `string`; `type`: `string`; `v`: `"1"`; \} |
| `frame.eventId` | `string` |
| `frame.kind` | `"event"` |
| `frame.payload?` | `unknown` |
| `frame.subject` | `string` |
| `frame.subscriptionId` | `string` |
| `frame.type` | `string` |
| `frame.v` | `"1"` |
| `transport` | [`DeliveryCommentaryTransport`](/api/@graphorin/server/type-aliases/DeliveryCommentaryTransport.md) |

#### Returns

```ts
{
  eventId: string;
  kind: "event";
  payload?: unknown;
  subject: string;
  subscriptionId: string;
  type: string;
  v: "1";
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `eventId` | `string` | [packages/protocol/dist/server-message.d.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/dist/server-message.d.ts#L103) |
| `kind` | `"event"` | [packages/protocol/dist/server-message.d.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/dist/server-message.d.ts#L100) |
| `payload?` | `unknown` | [packages/protocol/dist/server-message.d.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/dist/server-message.d.ts#L104) |
| `subject` | `string` | [packages/protocol/dist/server-message.d.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/dist/server-message.d.ts#L102) |
| `subscriptionId` | `string` | [packages/protocol/dist/server-message.d.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/dist/server-message.d.ts#L101) |
| `type` | `string` | [packages/protocol/dist/server-message.d.ts:99](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/dist/server-message.d.ts#L99) |
| `v` | `"1"` | [packages/protocol/dist/server-message.d.ts:98](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/dist/server-message.d.ts#L98) |
