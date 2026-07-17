[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SecretsBridgeTeardown

# Interface: SecretsBridgeTeardown()

Defined in: [packages/security/src/audit/secrets-bridge.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/secrets-bridge.ts#L45)

Teardown function returned by `bridgeSecretsToAudit(...)`.

Calling it detaches the listener; the `.drain()` helper resolves
once every queued audit-log write has settled so test suites and
graceful-shutdown paths can wait for the bridge to finish before
closing the audit database.

## Stable

```ts
SecretsBridgeTeardown(): void;
```

Defined in: [packages/security/src/audit/secrets-bridge.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/secrets-bridge.ts#L46)

Teardown function returned by `bridgeSecretsToAudit(...)`.

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
| <a id="property-drain"></a> `drain` | `readonly` | () => `Promise`\&lt;`void`\&gt; | [packages/security/src/audit/secrets-bridge.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/secrets-bridge.ts#L47) |
