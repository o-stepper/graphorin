[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / resolvePolicy

# Function: resolvePolicy()

```ts
function resolvePolicy(boundary, cfg?): ProtocolEscapePolicy;
```

Defined in: packages/agent/src/lateral-leak/protocol-guard.ts:58

Resolved policy lookup. Pure function — no side effects.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `boundary` | [`ProtocolBoundary`](/api/@graphorin/agent/type-aliases/ProtocolBoundary.md) |
| `cfg` | [`ProtocolGuardConfig`](/api/@graphorin/agent/interfaces/ProtocolGuardConfig.md) |

## Returns

[`ProtocolEscapePolicy`](/api/@graphorin/agent/type-aliases/ProtocolEscapePolicy.md)

## Stable
