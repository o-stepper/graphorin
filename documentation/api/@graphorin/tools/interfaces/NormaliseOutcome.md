[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / NormaliseOutcome

# Interface: NormaliseOutcome\&lt;TInput, TOutput, TDeps\&gt;

Defined in: [packages/tools/src/registry/normalize.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/normalize.ts#L63)

Outcome of `normaliseTool(...)`. Carries the resolved record AND
the WARN flags the registry layer surfaces through audit events +
counter increments.

## Type Parameters

| Type Parameter |
| ------ |
| `TInput` |
| `TOutput` |
| `TDeps` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-deferreddefaultapplied"></a> `deferredDefaultApplied` | `readonly` | `boolean` | [packages/tools/src/registry/normalize.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/normalize.ts#L66) |
| <a id="property-resolved"></a> `resolved` | `readonly` | [`ResolvedTool`](/api/@graphorin/core/interfaces/ResolvedTool.md)\&lt;`TInput`, `TOutput`, `TDeps`\&gt; | [packages/tools/src/registry/normalize.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/normalize.ts#L64) |
| <a id="property-warnings"></a> `warnings` | `readonly` | readonly [`NormaliseWarning`](/api/@graphorin/tools/type-aliases/NormaliseWarning.md)[] | [packages/tools/src/registry/normalize.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/normalize.ts#L65) |
