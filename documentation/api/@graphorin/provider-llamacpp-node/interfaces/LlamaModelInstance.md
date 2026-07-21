[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider-llamacpp-node](/api/@graphorin/provider-llamacpp-node/index.md) / [](/api/@graphorin/provider-llamacpp-node/README.md) / LlamaModelInstance

# Interface: LlamaModelInstance

Defined in: src/runtime.ts:23

**`Internal`**

Loaded GGUF model.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-traincontextsize"></a> `trainContextSize?` | `readonly` | `number` | src/runtime.ts:24 |

## Methods

### createContext()

```ts
createContext(args?): Promise<{
  dispose?: () => void;
  getSequence: {
     dispose?: () => void;
  };
}>;
```

Defined in: src/runtime.ts:26

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args?` | \{ `contextSize?`: `number`; \} |
| `args.contextSize?` | `number` |

#### Returns

`Promise`\<\{
  `dispose?`: () => `void`;
  `getSequence`: \{
     `dispose?`: () => `void`;
  \};
\}\>

***

### dispose()?

```ts
optional dispose(): Promise<void>;
```

Defined in: src/runtime.ts:30

#### Returns

`Promise`\&lt;`void`\&gt;

***

### tokenize()

```ts
tokenize(text): 
  | Uint32Array<ArrayBufferLike>
  | Uint8Array<ArrayBufferLike>
  | readonly number[];
```

Defined in: src/runtime.ts:25

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

  \| `Uint32Array`\&lt;`ArrayBufferLike`\&gt;
  \| `Uint8Array`\&lt;`ArrayBufferLike`\&gt;
  \| readonly `number`[]
