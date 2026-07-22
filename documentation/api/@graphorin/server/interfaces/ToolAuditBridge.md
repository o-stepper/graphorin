[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ToolAuditBridge

# Interface: ToolAuditBridge

Defined in: packages/server/src/tools-audit-bridge.ts:78

**`Stable`**

Handle returned by [bridgeToolAuditToAudit](/api/@graphorin/server/functions/bridgeToolAuditToAudit.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-drain"></a> `drain` | `readonly` | () => `Promise`\&lt;`void`\&gt; | Resolve once every queued audit write has settled. | packages/server/src/tools-audit-bridge.ts:82 |
| <a id="property-stop"></a> `stop` | `readonly` | () => `void` | Unsubscribe from the tool-audit bus. | packages/server/src/tools-audit-bridge.ts:80 |
