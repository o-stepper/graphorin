[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / DirectiveOptions

# Interface: DirectiveOptions\&lt;TUpdate, TResume\&gt;

Defined in: [packages/core/src/channels/directive.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/directive.ts#L37)

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
| <a id="property-goto"></a> `goto?` | `readonly` | `string` | [packages/core/src/channels/directive.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/directive.ts#L38) |
| <a id="property-resume"></a> `resume?` | `readonly` | `TResume` | [packages/core/src/channels/directive.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/directive.ts#L39) |
| <a id="property-update"></a> `update?` | `readonly` | `TUpdate` | [packages/core/src/channels/directive.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/directive.ts#L40) |
