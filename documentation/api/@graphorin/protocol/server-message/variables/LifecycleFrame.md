[**Graphorin API reference v0.13.11**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [server-message](/api/@graphorin/protocol/server-message/index.md) / LifecycleFrame

# Variable: LifecycleFrame

```ts
const LifecycleFrame: ZodObject<{
  kind: ZodLiteral<"lifecycle">;
  reason: ZodOptional<ZodString>;
  status: ZodEnum<["running", "paused", "completed", "aborted", "failed"]>;
  subscriptionId: ZodString;
  v: ZodLiteral<"1">;
}, "strict", ZodTypeAny, {
  kind: "lifecycle";
  reason?: string;
  status: "aborted" | "running" | "paused" | "completed" | "failed";
  subscriptionId: string;
  v: "1";
}, {
  kind: "lifecycle";
  reason?: string;
  status: "aborted" | "running" | "paused" | "completed" | "failed";
  subscriptionId: string;
  v: "1";
}>;
```

Defined in: src/server-message.ts:142

**`Stable`**

Zod schema behind [ServerLifecycleFrame](/api/@graphorin/protocol/server-message/type-aliases/ServerLifecycleFrame.md).
