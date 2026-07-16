[**Graphorin API reference v0.10.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [telemetry](/api/@graphorin/observability/telemetry/index.md) / enableTelemetry

# Function: enableTelemetry()

```ts
function enableTelemetry(): {
  reason: string;
  status: "disabled";
};
```

Defined in: [packages/observability/src/telemetry/index.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/telemetry/index.ts#L57)

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
| `reason` | `string` | [packages/observability/src/telemetry/index.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/telemetry/index.ts#L59) |
| `status` | `"disabled"` | [packages/observability/src/telemetry/index.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/telemetry/index.ts#L58) |

## Stable
