[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RetentionLog

# Type Alias: RetentionLog

```ts
type RetentionLog = (level, message, fields?) => void;
```

Defined in: packages/server/src/runtime/retention.ts:99

**`Stable`**

Logging seam: `warn` on a failed surface, `info` with per-surface
deletion counts after each sweep. Defaults to a no-op.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `level` | [`RetentionLogLevel`](/api/@graphorin/server/type-aliases/RetentionLogLevel.md) |
| `message` | `string` |
| `fields?` | `Record`\&lt;`string`, `unknown`\&gt; |

## Returns

`void`
