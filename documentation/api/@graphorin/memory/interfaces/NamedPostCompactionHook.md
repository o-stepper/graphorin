[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / NamedPostCompactionHook

# Interface: NamedPostCompactionHook

Defined in: packages/memory/src/context-engine/compaction/hooks/types.ts:56

**`Stable`**

Tagged hook returned by every factory below. The `id` field is
surfaced on the `context.compaction.hook.executed.total{hookName}`
counter family.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/memory/src/context-engine/compaction/hooks/types.ts:57 |

## Methods

### resolveContent()

```ts
resolveContent(deps, ctx?): Promise<readonly MessageContent[]>;
```

Defined in: packages/memory/src/context-engine/compaction/hooks/types.ts:64

`ctx` carries the REAL compaction outcome - result, scope,
runId, sessionId, agentId, source - built by `compactNow` after the
pipeline finishes. Record-form built-ins may ignore it; the
function-form wrapper forwards it to the operator's hook verbatim.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | `HookDeps` |
| `ctx?` | [`PostCompactionHookContext`](/api/@graphorin/memory/interfaces/PostCompactionHookContext.md) |

#### Returns

`Promise`\&lt;readonly [`MessageContent`](/api/@graphorin/core/type-aliases/MessageContent.md)[]\&gt;
