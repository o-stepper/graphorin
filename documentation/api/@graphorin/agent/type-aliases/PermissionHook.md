[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / PermissionHook

# Type Alias: PermissionHook

```ts
type PermissionHook = (input) => 
  | PermissionHookResult
| Promise<PermissionHookResult>;
```

Defined in: [packages/tools/dist/executor/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/executor/types.d.ts)

E1 pre-tool permission hook: one caller-supplied decision point over
every tool call, evaluated after schema validation and BEFORE the
approval phase. The hook must be pure/idempotent over its input - the
agent pre-screen and the executor phase may each invoke it for the
same logical call. A throwing hook fails the call closed
(`capability_blocked`), never open.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`PermissionHookInput`](/api/@graphorin/agent/interfaces/PermissionHookInput.md) |

## Returns

  \| [`PermissionHookResult`](/api/@graphorin/agent/interfaces/PermissionHookResult.md)
  \| `Promise`\&lt;[`PermissionHookResult`](/api/@graphorin/agent/interfaces/PermissionHookResult.md)\&gt;

## Stable
