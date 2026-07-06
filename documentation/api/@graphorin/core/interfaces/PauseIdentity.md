[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / PauseIdentity

# Interface: PauseIdentity

Defined in: [packages/core/src/channels/pause.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/pause.ts#L53)

Identity of one pause as recorded next to its satisfied resume value
(W-120): the durable-primitive `kind` (`timer` / `awakeable` /
`approval`) and the awakeable/approval `name`. A plain `pause()` has
neither - two plain pauses are indistinguishable BY DESIGN (no
false positives; the check is deliberately conservative).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind?` | `readonly` | `string` | [packages/core/src/channels/pause.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/pause.ts#L54) |
| <a id="property-name"></a> `name?` | `readonly` | `string` | [packages/core/src/channels/pause.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/pause.ts#L55) |
