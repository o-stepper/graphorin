[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / createIsolatedVMSandbox

# Function: createIsolatedVMSandbox()

```ts
function createIsolatedVMSandbox(opts?): SandboxImpl;
```

Defined in: packages/security/src/sandbox/isolated-vm.ts:118

**`Stable`**

Construct an `IsolatedVMSandbox`. The adapter resolves the peer
lazily on the first `run(...)` call so the package can be imported
even on hosts that cannot install `isolated-vm`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`IsolatedVMSandboxOptions`](/api/@graphorin/security/interfaces/IsolatedVMSandboxOptions.md) |

## Returns

[`SandboxImpl`](/api/@graphorin/security/interfaces/SandboxImpl.md)
