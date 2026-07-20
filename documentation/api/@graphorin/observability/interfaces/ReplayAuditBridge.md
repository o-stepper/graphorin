[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / ReplayAuditBridge

# Interface: ReplayAuditBridge

Defined in: packages/observability/src/replay/types.ts:31

**`Stable`**

Audit-bridge contract used by the replay layer. Every replay
invocation emits one entry through the bridge - sanitized + raw
alike. The actual audit storage lives in `@graphorin/security`; the
replay layer keeps the bridge generic so the package stays free of
a hard dependency on the security package.

## Methods

### emit()

```ts
emit(event): void;
```

Defined in: packages/observability/src/replay/types.ts:32

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`ReplayAuditEvent`](/api/@graphorin/observability/interfaces/ReplayAuditEvent.md) |

#### Returns

`void`
