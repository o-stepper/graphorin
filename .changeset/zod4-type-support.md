---
'@graphorin/core': minor
'@graphorin/memory': minor
'@graphorin/tools': minor
---

W-013: the declared `zod ^3.23 || ^4` peer range now actually typechecks under zod@4.

Two classes of breakage fixed: (a) `ZodLikeError.issues[].path` is now `ReadonlyArray<PropertyKey>` - zod 4 bases `$ZodIssue.path` on `PropertyKey`, and the shim must be a superset of both peer majors or the canonical `tool({ inputSchema: z.object({...}) })` failed to compile for every zod@4 consumer even with `skipLibCheck` (type-level breaking for downstream code assigning path elements to `string | number`; `validateOrThrow` maps elements through `String` first since `join` throws on symbols); (b) the published d.ts of `@graphorin/memory` (fact/block/recall/runbook tools) and `@graphorin/tools` (read_result, tool_search, code-mode meta-tools) baked concrete v3 `z.ZodObject<...>` generics via `z.infer<typeof schema>` aliases - replaced with explicit exported interfaces whose schema parity is pinned by in-source compile-time gates. The pack gate gains a `dts-no-concrete-zod-generics` leg and CI no longer allow-fails the zod4 leg - both zod majors are enforced at `skipLibCheck: false` from here on.
