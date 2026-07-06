[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / runBridgedSource

# Function: runBridgedSource()

```ts
function runBridgedSource(opts): Promise<BridgedSourceResult>;
```

Defined in: [packages/security/src/sandbox/bridged-source.ts:280](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L280)

Run model-written source in a worker, bridging `tools.<name>(args)`
calls back to the host. See the module docstring for the isolation
contract.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`BridgedSourceOptions`](/api/@graphorin/security/interfaces/BridgedSourceOptions.md) |

## Returns

`Promise`\&lt;[`BridgedSourceResult`](/api/@graphorin/security/type-aliases/BridgedSourceResult.md)\&gt;

## Stable
