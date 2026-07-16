[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ApiBoundaryGuardOptions

# Interface: ApiBoundaryGuardOptions

Defined in: [packages/security/src/guard/api-boundary-guard.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guard/api-boundary-guard.ts#L31)

Options for `createApiBoundaryGuard(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-actor"></a> `actor?` | `readonly` | [`MemoryGuardActor`](/api/@graphorin/security/interfaces/MemoryGuardActor.md) | Optional actor pointer surfaced through audit events. | [packages/security/src/guard/api-boundary-guard.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guard/api-boundary-guard.ts#L44) |
| <a id="property-allowedops"></a> `allowedOps` | `readonly` | readonly `string`[] | List of allowed `<scope>.<op>` operations. | [packages/security/src/guard/api-boundary-guard.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guard/api-boundary-guard.ts#L33) |
| <a id="property-observedops"></a> `observedOps` | `readonly` | () => readonly `string`[] | Returns the list of `<scope>.<op>` operations observed during the surrounding execution context. The host records each `ctx.memory.*` call before it routes the call to the actual memory store; the recorder is reset between snapshots. | [packages/security/src/guard/api-boundary-guard.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guard/api-boundary-guard.ts#L40) |
