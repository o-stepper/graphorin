[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SandboxCapabilities

# Interface: SandboxCapabilities

Defined in: packages/security/src/sandbox/sandbox.ts:43

**`Stable`**

Capability self-description. Each adapter advertises whether it
supports network blocking, filesystem blocking, and process-level
memory limits so the dispatcher can fall back gracefully when a
deployment requests a feature an adapter cannot satisfy.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-canblockfilesystem"></a> `canBlockFilesystem` | `readonly` | `boolean` | Adapter can block filesystem access. | packages/security/src/sandbox/sandbox.ts:47 |
| <a id="property-canblocknetwork"></a> `canBlockNetwork` | `readonly` | `boolean` | Adapter can block outgoing network calls. | packages/security/src/sandbox/sandbox.ts:45 |
| <a id="property-canenforcememorylimit"></a> `canEnforceMemoryLimit` | `readonly` | `boolean` | Adapter can enforce a memory limit (MB) on the executed code. | packages/security/src/sandbox/sandbox.ts:51 |
| <a id="property-canenforcetimeout"></a> `canEnforceTimeout` | `readonly` | `boolean` | Adapter can enforce a hard wall-clock timeout via signal/terminate. | packages/security/src/sandbox/sandbox.ts:49 |
