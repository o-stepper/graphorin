[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SessionWorkflowRun

# Interface: SessionWorkflowRun

Defined in: packages/core/src/contracts/session-store.ts:44

**`Stable`**

Workflow ↔ session mapping row. Lets the server enumerate the
workflows attached to a session for resume / replay flows.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-attachedat"></a> `attachedAt` | `readonly` | `string` | packages/core/src/contracts/session-store.ts:48 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/contracts/session-store.ts:45 |
| <a id="property-status"></a> `status` | `readonly` | `"running"` \| `"suspended"` \| `"completed"` \| `"failed"` | packages/core/src/contracts/session-store.ts:49 |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | packages/core/src/contracts/session-store.ts:47 |
| <a id="property-workflowid"></a> `workflowId` | `readonly` | `string` | packages/core/src/contracts/session-store.ts:46 |
