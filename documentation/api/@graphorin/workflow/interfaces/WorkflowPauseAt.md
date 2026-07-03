[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowPauseAt

# Interface: WorkflowPauseAt

Defined in: packages/workflow/src/types.ts:226

Static `pauseAt` declaration. The engine consults the lists when
scheduling tasks: nodes named in `before` suspend before their `run`
is invoked; nodes in `after` complete normally and the engine
suspends right before the next planning round.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-after"></a> `after?` | `readonly` | readonly `string`[] | packages/workflow/src/types.ts:228 |
| <a id="property-before"></a> `before?` | `readonly` | readonly `string`[] | packages/workflow/src/types.ts:227 |
