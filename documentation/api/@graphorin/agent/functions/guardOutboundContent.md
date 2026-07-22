[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / guardOutboundContent

# Function: guardOutboundContent()

```ts
function guardOutboundContent(
   input, 
   boundary, 
   cfg?): GuardOutcome;
```

Defined in: packages/agent/src/lateral-leak/protocol-guard.ts:171

**`Stable`**

Apply the configured escape policy to a single string body. Pure
- never mutates inputs.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `string` |
| `boundary` | [`ProtocolBoundary`](/api/@graphorin/agent/type-aliases/ProtocolBoundary.md) |
| `cfg` | [`ProtocolGuardConfig`](/api/@graphorin/agent/interfaces/ProtocolGuardConfig.md) |

## Returns

[`GuardOutcome`](/api/@graphorin/agent/interfaces/GuardOutcome.md)
