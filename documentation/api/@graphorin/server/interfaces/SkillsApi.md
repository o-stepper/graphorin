[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / SkillsApi

# Interface: SkillsApi

Defined in: packages/server/src/routes/skills.ts:21

## Stable

## Methods

### get()

```ts
get(name): Promise<unknown>;
```

Defined in: packages/server/src/routes/skills.ts:23

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`Promise`\&lt;`unknown`\&gt;

***

### install()

```ts
install(input): Promise<unknown>;
```

Defined in: packages/server/src/routes/skills.ts:24

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `source`: `string`; `trust?`: `"verified"` \| `"unverified"`; \} |
| `input.source` | `string` |
| `input.trust?` | `"verified"` \| `"unverified"` |

#### Returns

`Promise`\&lt;`unknown`\&gt;

***

### list()

```ts
list(): Promise<readonly {
  name: string;
  version?: string;
}[]>;
```

Defined in: packages/server/src/routes/skills.ts:22

#### Returns

`Promise`\<readonly \{
  `name`: `string`;
  `version?`: `string`;
\}[]\>
