[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / outcomeToDelivery

# Function: outcomeToDelivery()

```ts
function outcomeToDelivery(outcome, identity): ProactiveDeliveryPayload;
```

Defined in: packages/proactive/src/ladder.ts:59

**`Stable`**

Route an outcome onto a channel delivery: `notify` / `act` are
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
