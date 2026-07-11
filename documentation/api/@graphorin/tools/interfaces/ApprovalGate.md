[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ApprovalGate

# Interface: ApprovalGate

Defined in: [packages/tools/src/executor/types.ts:270](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L270)

Approval gate the executor consults before executing a gated tool.

## Methods

### request()

```ts
request(call, approval): Promise<ApprovalDecision>;
```

Defined in: [packages/tools/src/executor/types.ts:275](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L275)

Request approval for the tool call. Returns `{ granted: true }` to
proceed, `{ granted: false, reason? }` to deny.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `call` | [`ToolCall`](/api/@graphorin/core/interfaces/ToolCall.md) |
| `approval` | [`ToolApproval`](/api/@graphorin/core/interfaces/ToolApproval.md) |

#### Returns

`Promise`\&lt;`ApprovalDecision`\&gt;
