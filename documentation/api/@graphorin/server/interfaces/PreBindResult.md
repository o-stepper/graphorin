[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / PreBindResult

# Interface: PreBindResult

Defined in: [packages/server/src/lifecycle/pre-bind.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/lifecycle/pre-bind.ts#L43)

Result returned by [runPreBind](/api/@graphorin/server/functions/runPreBind.md). Consumers (`createServer`,
tests) consume the resolved pepper + encryption decision when
wiring the rest of the server.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-auditpassphrase"></a> `auditPassphrase?` | `readonly` | `SecretValue$1` | [packages/server/src/lifecycle/pre-bind.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/lifecycle/pre-bind.ts#L46) |
| <a id="property-auditpath"></a> `auditPath?` | `readonly` | `string` | [packages/server/src/lifecycle/pre-bind.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/lifecycle/pre-bind.ts#L45) |
| <a id="property-pepper"></a> `pepper?` | `readonly` | `SecretValue$1` | [packages/server/src/lifecycle/pre-bind.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/lifecycle/pre-bind.ts#L44) |
| <a id="property-storagepassphrase"></a> `storagePassphrase?` | `readonly` | `SecretValue$1` | [packages/server/src/lifecycle/pre-bind.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/lifecycle/pre-bind.ts#L47) |
