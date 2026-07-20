[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / PreBindResult

# Interface: PreBindResult

Defined in: packages/server/src/lifecycle/pre-bind.ts:43

**`Stable`**

Result returned by [runPreBind](/api/@graphorin/server/functions/runPreBind.md). Consumers (`createServer`,
tests) consume the resolved pepper + encryption decision when
wiring the rest of the server.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-auditpassphrase"></a> `auditPassphrase?` | `readonly` | `SecretValue$1` | packages/server/src/lifecycle/pre-bind.ts:46 |
| <a id="property-auditpath"></a> `auditPath?` | `readonly` | `string` | packages/server/src/lifecycle/pre-bind.ts:45 |
| <a id="property-pepper"></a> `pepper?` | `readonly` | `SecretValue$1` | packages/server/src/lifecycle/pre-bind.ts:44 |
| <a id="property-storagepassphrase"></a> `storagePassphrase?` | `readonly` | `SecretValue$1` | packages/server/src/lifecycle/pre-bind.ts:47 |
