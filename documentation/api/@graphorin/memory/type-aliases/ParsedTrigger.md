[**Graphorin API reference v0.13.2**](../../../index.md)

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
}
  | {
  kind: "buffer";
  raw: string;
  tokens: number;
};
```

Defined in: packages/memory/src/consolidator/triggers.ts:25

**`Stable`**

Parsed trigger declaration. The `kind` discriminator drives the
runtime dispatch; the `value` carries the spec-specific argument
already converted to a `number` (turns / millis / threshold) or a
string (cron expr / event name).

## Union Members

### Type Literal

```ts
{
  count: number;
  kind: "turn";
  raw: string;
}
```

***

### Type Literal

```ts
{
  idleMs: number;
  kind: "idle";
  raw: string;
}
```

***

### Type Literal

```ts
{
  expression: string;
  kind: "cron";
  raw: string;
}
```

***

### Type Literal

```ts
{
  kind: "event";
  name: string;
  raw: string;
}
```

***

### Type Literal

```ts
{
  kind: "budget";
  raw: string;
  threshold: number;
}
```

***

### Type Literal

```ts
{
  kind: "buffer";
  raw: string;
  tokens: number;
}
```

Fire when the unconsolidated transcript tail (from the
standard-phase cursor) reaches `tokens` tokens (chars/4 proxy, the
same measure as the `maxTranscriptChars` transcript budget).
Evaluated on activity signals via
`Consolidator.notifyActivity(...)` - the scheduler cannot measure
the tail on its own. Not to be confused with `budget:F`, which is
a spent-budget fraction.
