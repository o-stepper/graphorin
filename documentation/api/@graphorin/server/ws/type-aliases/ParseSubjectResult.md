[**Graphorin API reference v0.5.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [ws](/api/@graphorin/server/ws/index.md) / ParseSubjectResult

# Type Alias: ParseSubjectResult

```ts
type ParseSubjectResult = 
  | {
  ok: true;
  subject: ParsedSubject;
}
  | {
  ok: false;
  reason: "wildcard-not-supported" | "unknown-subject" | "malformed";
};
```

Defined in: packages/server/src/ws/subjects.ts:51

Result of [tryParseSubject](/api/@graphorin/server/functions/tryParseSubject.md).

## Stable
