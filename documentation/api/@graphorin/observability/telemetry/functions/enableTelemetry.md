[**Graphorin API reference v0.13.5**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [telemetry](/api/@graphorin/observability/telemetry/index.md) / enableTelemetry

# Function: enableTelemetry()

```ts
function enableTelemetry(): {
  reason: string;
  status: "disabled";
};
```

Defined in: packages/observability/src/telemetry/index.ts:57

**`Stable`**

Best-effort enable hook. Always returns the sentinel
`{ status: 'disabled', reason: ... }` payload. Reserved for v0.2+.

## Returns

```ts
{
  reason: string;
  status: "disabled";
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `reason` | `string` | packages/observability/src/telemetry/index.ts:59 |
| `status` | `"disabled"` | packages/observability/src/telemetry/index.ts:58 |
