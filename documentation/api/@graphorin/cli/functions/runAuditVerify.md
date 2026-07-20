[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runAuditVerify

# Function: runAuditVerify()

```ts
function runAuditVerify(options?): Promise<AuditVerifyResult>;
```

Defined in: packages/cli/src/commands/audit.ts:73

**`Stable`**

`graphorin audit verify` - replay the chain and report the first
broken link (if any).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`AuditCommonOptions`](/api/@graphorin/cli/interfaces/AuditCommonOptions.md) |

## Returns

`Promise`\&lt;[`AuditVerifyResult`](/api/@graphorin/cli/interfaces/AuditVerifyResult.md)\&gt;
