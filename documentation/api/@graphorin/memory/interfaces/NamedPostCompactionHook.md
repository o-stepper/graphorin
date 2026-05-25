[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / NamedPostCompactionHook

# Interface: NamedPostCompactionHook

Defined in: packages/memory/src/context-engine/compaction/hooks/types.ts:44

Tagged hook returned by every factory below. The `id` field is
surfaced on the `context.compaction.hook.executed.total{hookName}`
counter family.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/memory/src/context-engine/compaction/hooks/types.ts:45 |

## Methods

### resolveContent()

```ts
resolveContent(deps): Promise<readonly MessageContent[]>;
```

Defined in: packages/memory/src/context-engine/compaction/hooks/types.ts:46

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | `HookDeps` |

#### Returns

`Promise`\&lt;readonly [`MessageContent`](/api/@graphorin/core/type-aliases/MessageContent.md)[]\&gt;
