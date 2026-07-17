[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / PermissionHook

# Type Alias: PermissionHook

```ts
type PermissionHook = (input) => 
  | PermissionHookResult
| Promise<PermissionHookResult>;
```

Defined in: [packages/tools/src/executor/types.ts:425](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L425)

E1 pre-tool permission hook: one caller-supplied decision point over
every tool call, evaluated after schema validation and BEFORE the
approval phase. The hook must be pure/idempotent over its input - the
agent pre-screen and the executor phase may each invoke it for the
same logical call. A throwing hook fails the call closed
(`capability_blocked`), never open.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`PermissionHookInput`](/api/@graphorin/tools/interfaces/PermissionHookInput.md) |

## Returns

  \| [`PermissionHookResult`](/api/@graphorin/tools/interfaces/PermissionHookResult.md)
  \| `Promise`\&lt;[`PermissionHookResult`](/api/@graphorin/tools/interfaces/PermissionHookResult.md)\&gt;

## Stable
