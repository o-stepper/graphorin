[**Graphorin API reference v0.13.11**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [fanout](/api/@graphorin/agent/fanout/index.md) / MergeStrategy

# Type Alias: MergeStrategy\&lt;TOutput\&gt;

```ts
type MergeStrategy<TOutput> = 
  | {
  kind: "concat";
  separator?: string;
}
  | {
  kind: "first-success";
}
  | {
  judge: (children) => Promise<TOutput>;
  kind: "judge-merge";
}
  | {
  kind: "custom";
  merge: (children) => Promise<TOutput>;
};
```

Defined in: packages/agent/src/fanout/index.ts:56

**`Stable`**

Built-in merge-strategy taxonomy.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |
