[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / resolveSandbox

# Function: resolveSandbox()

```ts
function resolveSandbox(input): ResolvedSandboxPolicy;
```

Defined in: packages/security/src/sandbox/tier-resolver.ts:77

Resolve the effective sandbox policy. Pure function; side-effect
free (the caller is responsible for emitting any WARN / audit
entry).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`ResolveSandboxInput`](/api/@graphorin/security/interfaces/ResolveSandboxInput.md) |

## Returns

[`ResolvedSandboxPolicy`](/api/@graphorin/security/interfaces/ResolvedSandboxPolicy.md)

## Stable
