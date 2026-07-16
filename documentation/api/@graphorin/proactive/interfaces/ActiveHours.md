[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / ActiveHours

# Interface: ActiveHours

Defined in: [packages/proactive/src/active-hours.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/active-hours.ts#L25)

A daily wall-clock window in which proactive fires are allowed.
`from` / `to` are `'HH:MM'` (24h). A window with `from > to` crosses
midnight: `{ from: '22:00', to: '07:00' }` is active from 22:00
through 06:59. `from === to` means always active.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-from"></a> `from` | `readonly` | `string` | - | [packages/proactive/src/active-hours.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/active-hours.ts#L26) |
| <a id="property-timezone"></a> `timezone?` | `readonly` | `string` | IANA timezone the window's wall clock lives in. Default `'UTC'`. | [packages/proactive/src/active-hours.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/active-hours.ts#L29) |
| <a id="property-to"></a> `to` | `readonly` | `string` | - | [packages/proactive/src/active-hours.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/active-hours.ts#L27) |
