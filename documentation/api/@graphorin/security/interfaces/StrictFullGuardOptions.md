[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / StrictFullGuardOptions

# Interface: StrictFullGuardOptions

Defined in: packages/security/src/guard/strict-full-guard.ts:32

Options for `createStrictFullGuard(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-actor"></a> `actor?` | `readonly` | [`MemoryGuardActor`](/api/@graphorin/security/interfaces/MemoryGuardActor.md) | Optional actor pointer surfaced through audit events. | packages/security/src/guard/strict-full-guard.ts:34 |
| <a id="property-maxmemorybytes"></a> `maxMemoryBytes?` | `readonly` | `number` | Hard ceiling on total snapshot bytes. Defaults to 200 KB per DEC-153. | packages/security/src/guard/strict-full-guard.ts:36 |
