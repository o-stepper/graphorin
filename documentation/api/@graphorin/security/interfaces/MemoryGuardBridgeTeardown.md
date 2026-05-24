[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / MemoryGuardBridgeTeardown

# Interface: MemoryGuardBridgeTeardown()

Defined in: packages/security/src/audit/memory-guard-bridge.ts:39

Teardown function returned by `bridgeMemoryGuardToAudit(...)`.

Calling it detaches the listener; the `.drain()` helper resolves
once every queued audit-log write has settled so test suites and
graceful-shutdown paths can wait for the bridge to finish before
closing the audit database.

## Stable

```ts
MemoryGuardBridgeTeardown(): void;
```

Defined in: packages/security/src/audit/memory-guard-bridge.ts:40

Teardown function returned by `bridgeMemoryGuardToAudit(...)`.

Calling it detaches the listener; the `.drain()` helper resolves
once every queued audit-log write has settled so test suites and
graceful-shutdown paths can wait for the bridge to finish before
closing the audit database.

## Returns

`void`

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-drain"></a> `drain` | `readonly` | () => `Promise`\&lt;`void`\&gt; | packages/security/src/audit/memory-guard-bridge.ts:41 |
