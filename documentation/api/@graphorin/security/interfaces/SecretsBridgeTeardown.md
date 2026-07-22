[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SecretsBridgeTeardown

# Interface: SecretsBridgeTeardown()

Defined in: packages/security/src/audit/secrets-bridge.ts:45

**`Stable`**

Teardown function returned by `bridgeSecretsToAudit(...)`.

Calling it detaches the listener; the `.drain()` helper resolves
once every queued audit-log write has settled so test suites and
graceful-shutdown paths can wait for the bridge to finish before
closing the audit database.

```ts
SecretsBridgeTeardown(): void;
```

Defined in: packages/security/src/audit/secrets-bridge.ts:46

**`Stable`**

Teardown function returned by `bridgeSecretsToAudit(...)`.

Calling it detaches the listener; the `.drain()` helper resolves
once every queued audit-log write has settled so test suites and
graceful-shutdown paths can wait for the bridge to finish before
closing the audit database.

## Returns

`void`

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-drain"></a> `drain` | `readonly` | () => `Promise`\&lt;`void`\&gt; | packages/security/src/audit/secrets-bridge.ts:47 |
