[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Directive

# Class: Directive\&lt;TUpdate, TResume\&gt;

Defined in: packages/core/src/channels/directive.ts:20

**`Stable`**

Workflow control-flow primitive: a single value handed to
`Workflow.resume(threadId, directive?)` (or returned from a node's
`pause(...)` resolution) carrying any combination of:

- `goto`   - jump to a named node, bypassing the edge graph.
**Destructive:** the restored frontier is discarded -
  surviving dynamic tasks, completed-but-unwalked nodes, and every
  pending pause record (including already-delivered pause answers)
  are dropped in favour of the single goto task. Use it as an
  operator escape hatch, not routine control flow.
- `resume` - value supplied to the `pause(value)` call that suspended.
- `update` - additional channel writes applied before the next step.

The shape is **Graphorin's own design** (the name `Directive` is part
of the public API).

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

Defined in: packages/core/src/channels/directive.ts:25

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`DirectiveOptions`](/api/@graphorin/core/interfaces/DirectiveOptions.md)\&lt;`TUpdate`, `TResume`\&gt; |

#### Returns

`Directive`\&lt;`TUpdate`, `TResume`\&gt;

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-goto"></a> `goto?` | `readonly` | `string` | packages/core/src/channels/directive.ts:21 |
| <a id="property-resume"></a> `resume?` | `readonly` | `TResume` | packages/core/src/channels/directive.ts:22 |
| <a id="property-update"></a> `update?` | `readonly` | `TUpdate` | packages/core/src/channels/directive.ts:23 |
