[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / DirectiveOptions

# Interface: DirectiveOptions\<TUpdate, TResume\>

Defined in: packages/core/dist/channels/directive.d.ts:32

Constructor parameters for `Directive`.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TUpdate` | `Record`\<`string`, `unknown`\> |
| `TResume` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-goto"></a> `goto?` | `readonly` | `string` | packages/core/dist/channels/directive.d.ts:33 |
| <a id="property-resume"></a> `resume?` | `readonly` | `TResume` | packages/core/dist/channels/directive.d.ts:34 |
| <a id="property-update"></a> `update?` | `readonly` | `TUpdate` | packages/core/dist/channels/directive.d.ts:35 |
