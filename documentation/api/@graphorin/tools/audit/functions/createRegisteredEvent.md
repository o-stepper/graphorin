[**Graphorin API reference v0.13.6**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [audit](/api/@graphorin/tools/audit/index.md) / createRegisteredEvent

# Function: createRegisteredEvent()

```ts
function createRegisteredEvent(opts): ToolAuditEvent;
```

Defined in: packages/tools/src/audit/index.ts:185

**`Stable`**

Convenience factory for the `tool:registered` audit row. Carries
the resolved trust class + side-effect class + per-tool fields the
downstream cassette / replay layers care about.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `deferLoading`: `boolean`; `examplesCount`: `number`; `hasIdempotencyKey`: `boolean`; `inboundSanitization`: [`InboundSanitizationPolicy`](/api/@graphorin/core/type-aliases/InboundSanitizationPolicy.md); `maxResultTokens`: `number`; `sideEffectClass`: [`SideEffectClass`](/api/@graphorin/core/type-aliases/SideEffectClass.md); `streamingHint`: `boolean`; `toolName`: `string`; `truncationStrategy`: [`TruncationStrategy`](/api/@graphorin/core/type-aliases/TruncationStrategy.md); `trustClass`: [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md); `ts?`: `number`; \} |
| `opts.deferLoading` | `boolean` |
| `opts.examplesCount` | `number` |
| `opts.hasIdempotencyKey` | `boolean` |
| `opts.inboundSanitization` | [`InboundSanitizationPolicy`](/api/@graphorin/core/type-aliases/InboundSanitizationPolicy.md) |
| `opts.maxResultTokens` | `number` |
| `opts.sideEffectClass` | [`SideEffectClass`](/api/@graphorin/core/type-aliases/SideEffectClass.md) |
| `opts.streamingHint` | `boolean` |
| `opts.toolName` | `string` |
| `opts.truncationStrategy` | [`TruncationStrategy`](/api/@graphorin/core/type-aliases/TruncationStrategy.md) |
| `opts.trustClass` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) |
| `opts.ts?` | `number` |

## Returns

[`ToolAuditEvent`](/api/@graphorin/tools/audit/interfaces/ToolAuditEvent.md)
