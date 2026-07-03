[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / Directive

# Class: Directive\&lt;TUpdate, TResume\&gt;

Defined in: packages/core/dist/channels/directive.d.ts:16

Workflow control-flow primitive: a single value handed to
`Workflow.resume(threadId, directive?)` (or returned from a node's
`pause(...)` resolution) carrying any combination of:

- `goto`   — jump to a named node, bypassing the edge graph.
- `resume` — value supplied to the `pause(value)` call that suspended.
- `update` — additional channel writes applied before the next step.

The shape is **Graphorin's own design** (the name `Directive` is part
of the public API).

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TUpdate` | `Record`\&lt;`string`, `unknown`\&gt; |
| `TResume` | `unknown` |

## Constructors

### Constructor

```ts
new Directive<TUpdate, TResume>(opts): Directive<TUpdate, TResume>;
```

Defined in: packages/core/dist/channels/directive.d.ts:20

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`DirectiveOptions`](/api/@graphorin/workflow/interfaces/DirectiveOptions.md)\&lt;`TUpdate`, `TResume`\&gt; |

#### Returns

`Directive`\&lt;`TUpdate`, `TResume`\&gt;

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-goto"></a> `goto?` | `readonly` | `string` | packages/core/dist/channels/directive.d.ts:17 |
| <a id="property-resume"></a> `resume?` | `readonly` | `TResume` | packages/core/dist/channels/directive.d.ts:18 |
| <a id="property-update"></a> `update?` | `readonly` | `TUpdate` | packages/core/dist/channels/directive.d.ts:19 |
