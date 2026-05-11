[**Graphorin API reference v0.1.0**](../../../index.md)

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
};
```

Defined in: packages/tools/src/registry/types.ts:45

Audit row produced for every collision the registry resolves. The
dispatcher writes one record per `(toolName, action)` pair; the
downstream audit emitter and counter increments read from these
records so the data path stays single-source.

## Stable
