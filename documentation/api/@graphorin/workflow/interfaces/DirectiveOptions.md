[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / DirectiveOptions

# Interface: DirectiveOptions\&lt;TUpdate, TResume\&gt;

Defined in: [packages/core/dist/channels/directive.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/directive.d.ts)

**`Stable`**

Constructor parameters for `Directive`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TUpdate` | `Record`\&lt;`string`, `unknown`\&gt; |
| `TResume` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-goto"></a> `goto?` | `readonly` | `string` | [packages/core/dist/channels/directive.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/directive.d.ts) |
| <a id="property-resume"></a> `resume?` | `readonly` | `TResume` | [packages/core/dist/channels/directive.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/directive.d.ts) |
| <a id="property-update"></a> `update?` | `readonly` | `TUpdate` | [packages/core/dist/channels/directive.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/directive.d.ts) |
