[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / BridgeSecretsToAuditOptions

# Interface: BridgeSecretsToAuditOptions

Defined in: [packages/security/src/audit/secrets-bridge.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/secrets-bridge.ts#L28)

Subscribe the audit-log subsystem to the secrets-layer event
emitter. Returns a teardown function that detaches the listener.

Failures inside the bridge never propagate - the audit subsystem
cannot tear down the secret-access path.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-db"></a> `db` | `readonly` | [`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md) | Audit database the bridge writes into. | [packages/security/src/audit/secrets-bridge.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/secrets-bridge.ts#L30) |
| <a id="property-onwriteerror"></a> `onWriteError?` | `readonly` | (`event`, `error`) => `void` | Optional logger called when a write fails. | [packages/security/src/audit/secrets-bridge.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/secrets-bridge.ts#L32) |
