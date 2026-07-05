[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ParsedTrigger

# Type Alias: ParsedTrigger

```ts
type ParsedTrigger = 
  | {
  count: number;
  kind: "turn";
  raw: string;
}
  | {
  idleMs: number;
  kind: "idle";
  raw: string;
}
  | {
  expression: string;
  kind: "cron";
  raw: string;
}
  | {
  kind: "event";
  name: string;
  raw: string;
}
  | {
  kind: "budget";
  raw: string;
  threshold: number;
};
```

Defined in: packages/memory/src/consolidator/triggers.ts:25

Parsed trigger declaration. The `kind` discriminator drives the
runtime dispatch; the `value` carries the spec-specific argument
already converted to a `number` (turns / millis / threshold) or a
string (cron expr / event name).

## Stable
