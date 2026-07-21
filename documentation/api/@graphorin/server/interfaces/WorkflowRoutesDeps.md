[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WorkflowRoutesDeps

# Interface: WorkflowRoutesDeps

Defined in: packages/server/src/routes/workflows.ts:31

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-dispatcher"></a> `dispatcher?` | `readonly` | [`WsDispatcher`](/api/@graphorin/server/interfaces/WsDispatcher.md) | Streaming dispatcher: workflow events reach the run subject. | packages/server/src/routes/workflows.ts:36 |
| <a id="property-newrunid"></a> `newRunId?` | `readonly` | () => `string` | - | packages/server/src/routes/workflows.ts:34 |
| <a id="property-runs"></a> `runs` | `readonly` | [`RunStateTracker`](/api/@graphorin/server/classes/RunStateTracker.md) | - | packages/server/src/routes/workflows.ts:33 |
| <a id="property-workflows"></a> `workflows` | `readonly` | [`WorkflowRegistry`](/api/@graphorin/server/registry/classes/WorkflowRegistry.md) | - | packages/server/src/routes/workflows.ts:32 |
