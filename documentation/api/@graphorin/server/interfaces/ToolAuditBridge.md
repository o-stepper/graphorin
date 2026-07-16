[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ToolAuditBridge

# Interface: ToolAuditBridge

Defined in: [packages/server/src/tools-audit-bridge.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/tools-audit-bridge.ts#L78)

Handle returned by [bridgeToolAuditToAudit](/api/@graphorin/server/functions/bridgeToolAuditToAudit.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-drain"></a> `drain` | `readonly` | () => `Promise`\&lt;`void`\&gt; | Resolve once every queued audit write has settled. | [packages/server/src/tools-audit-bridge.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/tools-audit-bridge.ts#L82) |
| <a id="property-stop"></a> `stop` | `readonly` | () => `void` | Unsubscribe from the tool-audit bus. | [packages/server/src/tools-audit-bridge.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/tools-audit-bridge.ts#L80) |
