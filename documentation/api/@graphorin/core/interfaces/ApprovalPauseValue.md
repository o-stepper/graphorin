[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ApprovalPauseValue

# Interface: ApprovalPauseValue

Defined in: [packages/core/src/channels/durable.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L52)

Pause value carried by a persisted-approval suspension.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"graphorin.approval"` | - | [packages/core/src/channels/durable.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L53) |
| <a id="property-name"></a> `name` | `readonly` | `string` | Caller-chosen name targeted by `workflow.approve(...)`. | [packages/core/src/channels/durable.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L55) |
| <a id="property-payload"></a> `payload?` | `readonly` | `unknown` | Free-form payload surfaced to the approver (what is being approved). | [packages/core/src/channels/durable.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L57) |
