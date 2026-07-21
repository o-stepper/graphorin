[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / McpApi

# Interface: McpApi

Defined in: packages/server/src/routes/mcp.ts:21

**`Stable`**

## Methods

### list()

```ts
list(): Promise<readonly unknown[]>;
```

Defined in: packages/server/src/routes/mcp.ts:22

#### Returns

`Promise`\&lt;readonly `unknown`[]\&gt;

***

### register()

```ts
register(input): Promise<unknown>;
```

Defined in: packages/server/src/routes/mcp.ts:23

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `id`: `string`; `transport`: `string`; `url?`: `string`; \} |
| `input.id` | `string` |
| `input.transport` | `string` |
| `input.url?` | `string` |

#### Returns

`Promise`\&lt;`unknown`\&gt;

***

### remove()

```ts
remove(id): Promise<boolean>;
```

Defined in: packages/server/src/routes/mcp.ts:28

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;`boolean`\&gt;
