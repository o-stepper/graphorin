[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider-llamacpp-node](/api/@graphorin/provider-llamacpp-node/index.md) / [](/api/@graphorin/provider-llamacpp-node/README.md) / LlamaInstance

# Interface: LlamaInstance

Defined in: src/runtime.ts:14

**`Internal`**

`Llama` engine instance (returned by `getLlama()`).

## Methods

### loadModel()

```ts
loadModel(args): Promise<LlamaModelInstance>;
```

Defined in: src/runtime.ts:15

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `gpuLayers?`: `number` \| `"auto"`; `modelPath`: `string`; \} |
| `args.gpuLayers?` | `number` \| `"auto"` |
| `args.modelPath` | `string` |

#### Returns

`Promise`\&lt;[`LlamaModelInstance`](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaModelInstance.md)\&gt;
