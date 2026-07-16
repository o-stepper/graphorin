[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / NamedPreCompactionHook

# Interface: NamedPreCompactionHook

Defined in: [packages/memory/src/context-engine/compaction/types.ts:259](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L259)

Named pre-compaction hook (built-in form): receives the shared hook
deps (memory handle, scope, privacy filter) plus the pre-compaction
context. Mirrors `NamedPostCompactionHook`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | [packages/memory/src/context-engine/compaction/types.ts:260](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L260) |

## Methods

### run()

```ts
run(deps, ctx): Promise<void>;
```

Defined in: [packages/memory/src/context-engine/compaction/types.ts:261](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L261)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | \{ `allowSensitivity?`: (`sensitivity`) => `boolean`; `memory`: [`Memory`](/api/@graphorin/memory/interfaces/Memory.md); `scope`: [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md); \} |
| `deps.allowSensitivity?` | (`sensitivity`) => `boolean` |
| `deps.memory` | [`Memory`](/api/@graphorin/memory/interfaces/Memory.md) |
| `deps.scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `ctx` | [`PreCompactionHookContext`](/api/@graphorin/memory/interfaces/PreCompactionHookContext.md) |

#### Returns

`Promise`\&lt;`void`\&gt;
