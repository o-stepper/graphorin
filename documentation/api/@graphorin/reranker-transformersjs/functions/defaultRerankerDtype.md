[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / defaultRerankerDtype

# Function: defaultRerankerDtype()

```ts
function defaultRerankerDtype(device): RerankerDtype;
```

Defined in: packages/reranker-transformersjs/src/cross-encoder.ts:36

**`Stable`**

Device-aware default precision. The fp16 ONNX exports of the default
BGE rerankers fail session initialisation on the onnxruntime-node CPU
execution provider (`SimplifiedLayerNormFusion` cast error, N-01/22),
so the CPU default is the q8 quantization; non-CPU devices
(`'webgpu'`, ...) keep fp16.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `device` | `string` \| `undefined` |

## Returns

[`RerankerDtype`](/api/@graphorin/reranker-transformersjs/type-aliases/RerankerDtype.md)
