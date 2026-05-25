[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / DirectiveOptions

# Interface: DirectiveOptions\&lt;TUpdate, TResume\&gt;

Defined in: packages/core/src/channels/directive.ts:32

Constructor parameters for `Directive`.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TUpdate` | `Record`\&lt;`string`, `unknown`\&gt; |
| `TResume` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-goto"></a> `goto?` | `readonly` | `string` | packages/core/src/channels/directive.ts:33 |
| <a id="property-resume"></a> `resume?` | `readonly` | `TResume` | packages/core/src/channels/directive.ts:34 |
| <a id="property-update"></a> `update?` | `readonly` | `TUpdate` | packages/core/src/channels/directive.ts:35 |
