[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / outcomeToDelivery

# Function: outcomeToDelivery()

```ts
function outcomeToDelivery(outcome, identity): ProactiveDeliveryPayload;
```

Defined in: [packages/proactive/src/ladder.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/ladder.ts#L59)

Route an outcome onto a channel delivery (C3): `notify` / `act` are
plain text; `question` / `review` carry the HITL question block
whose `ref` rides into messenger callback-data. The gateway
outbound-sanitizes at its own boundary - this function only shapes.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `outcome` | [`ProactiveOutcome`](/api/@graphorin/core/type-aliases/ProactiveOutcome.md) |
| `identity` | [`ProactiveDeliveryIdentity`](/api/@graphorin/proactive/interfaces/ProactiveDeliveryIdentity.md) |

## Returns

[`ProactiveDeliveryPayload`](/api/@graphorin/proactive/interfaces/ProactiveDeliveryPayload.md)

## Stable
