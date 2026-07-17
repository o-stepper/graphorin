[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / McpApi

# Interface: McpApi

Defined in: [packages/server/src/routes/mcp.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/mcp.ts#L21)

## Stable

## Methods

### list()

```ts
list(): Promise<readonly unknown[]>;
```

Defined in: [packages/server/src/routes/mcp.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/mcp.ts#L22)

#### Returns

`Promise`\&lt;readonly `unknown`[]\&gt;

***

### register()

```ts
register(input): Promise<unknown>;
```

Defined in: [packages/server/src/routes/mcp.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/mcp.ts#L23)

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

Defined in: [packages/server/src/routes/mcp.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/mcp.ts#L28)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;`boolean`\&gt;
