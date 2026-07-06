[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / CollisionResolution

# Type Alias: CollisionResolution

```ts
type CollisionResolution = 
  | {
  action: "priority-resolved";
  losers: ReadonlyArray<ToolSource>;
  tieBreakReason: "first-party-precedence" | "explicit-priority" | "registration-order";
  toolName: string;
  winner: ToolSource;
}
  | {
  action: "auto-prefix-applied";
  losers: ReadonlyArray<ToolSource>;
  renamed: {
     from: string;
     namespaceSource: string;
     to: string;
  };
  toolName: string;
  winner: ToolSource;
}
  | {
  action: "manual-rejected";
  conflictingSources: ReadonlyArray<ToolSource>;
  toolName: string;
}
  | {
  action: "first-party-precedence";
  losers: ReadonlyArray<ToolSource>;
  toolName: string;
  winner: ToolSource;
}
  | {
  action: "suppressed";
  losers: ReadonlyArray<ToolSource>;
  toolName: string;
  winner: ToolSource;
};
```

Defined in: [packages/tools/src/registry/types.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/types.ts#L45)

Audit row produced for every collision the registry resolves. The
dispatcher writes one record per `(toolName, action)` pair; the
downstream audit emitter and counter increments read from these
records so the data path stays single-source.

## Union Members

### Type Literal

```ts
{
  action: "priority-resolved";
  losers: ReadonlyArray<ToolSource>;
  tieBreakReason: "first-party-precedence" | "explicit-priority" | "registration-order";
  toolName: string;
  winner: ToolSource;
}
```

***

### Type Literal

```ts
{
  action: "auto-prefix-applied";
  losers: ReadonlyArray<ToolSource>;
  renamed: {
     from: string;
     namespaceSource: string;
     to: string;
  };
  toolName: string;
  winner: ToolSource;
}
```

***

### Type Literal

```ts
{
  action: "manual-rejected";
  conflictingSources: ReadonlyArray<ToolSource>;
  toolName: string;
}
```

***

### Type Literal

```ts
{
  action: "first-party-precedence";
  losers: ReadonlyArray<ToolSource>;
  toolName: string;
  winner: ToolSource;
}
```

***

### Type Literal

```ts
{
  action: "suppressed";
  losers: ReadonlyArray<ToolSource>;
  toolName: string;
  winner: ToolSource;
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `action` | `"suppressed"` | W-116: an auto-prefix loser whose rename was impossible (the residual case after the fallback namespace + truncation - e.g. a pathological future source shape). The loser is dropped from the catalogue, but never silently: this record, a `tool:collision:suppressed` audit row and the `tool.collision.suppressed.total` counter all mark it. | [packages/tools/src/registry/types.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/types.ts#L90) |
| `losers` | `ReadonlyArray`\&lt;[`ToolSource`](/api/@graphorin/core/type-aliases/ToolSource.md)\&gt; | - | [packages/tools/src/registry/types.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/types.ts#L81) |
| `toolName` | `string` | - | [packages/tools/src/registry/types.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/types.ts#L79) |
| `winner` | [`ToolSource`](/api/@graphorin/core/type-aliases/ToolSource.md) | - | [packages/tools/src/registry/types.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/types.ts#L80) |

## Stable
