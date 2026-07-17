[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Tool

# Interface: Tool\&lt;TInput, TOutput, TDeps\&gt;

Defined in: [packages/core/src/contracts/tool.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L35)

Pluggable function call exposed to an LLM. Concrete `Tool` instances
are produced by the `tool({...})` factory in `@graphorin/tools` and
by the MCP / Skills loaders. The interface lives in core because every
package above the persistence layer (agent runtime, workflow engine,
server, sessions, observability, …) carries `Tool[]` references on
its public surface.

The interface is intentionally minimal - extension fields covered by
later phases (per-tool `secretsAllowed` ACL, inbound sanitization
policy, result truncation strategy, streaming hint, …) are added
**additively** by their owning packages so that v0.1 consumers can
type their tool list against `Tool<...>` today without having to
worry about future fields.

## Stable

## Extended by

- [`ResolvedTool`](/api/@graphorin/core/interfaces/ResolvedTool.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TInput` | `unknown` |
| `TOutput` | `unknown` |
| `TDeps` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-defer_loading"></a> `defer_loading?` | `readonly` | `boolean` | Defer the tool from the per-step catalogue until the model invokes the built-in `tool_search` to look it up. Tools with deferred loading are not advertised to the model on every step, which keeps the input-token cost bounded for installations with dozens of MCP-derived tools. Naming note (W-127): the snake_case is DELIBERATE - this field mirrors the wire-level `defer_loading` flag of the Anthropic tool-use surface one-to-one, so grep and serialized payloads match. It is the only snake_case field on `Tool` by design, not an oversight. **Default** `false` | [packages/core/src/contracts/tool.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L112) |
| <a id="property-description"></a> `description` | `readonly` | `string` | - | [packages/core/src/contracts/tool.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L37) |
| <a id="property-examples"></a> `examples?` | `readonly` | readonly [`ToolExample`](/api/@graphorin/core/interfaces/ToolExample.md)\&lt;`TInput`, `TOutput`\&gt;[] | Worked examples shown to the model alongside the tool's description. Bounded `[1, 5]` - overflow emits a one-time WARN at registration. Each example's `input` and `output` is validated against the tool's `inputSchema` / `outputSchema`. | [packages/core/src/contracts/tool.ts:130](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L130) |
| <a id="property-exampleseagerlyrendered"></a> `examplesEagerlyRendered?` | `readonly` | `boolean` | Render examples eagerly (every step) regardless of `defer_loading`. When undefined the runtime applies the auto-rule: `defer_loading: true` ⇒ `false`; `defer_loading: false` ⇒ `true`; neither ⇒ `undefined` (the agent runtime decides at assembly time). | [packages/core/src/contracts/tool.ts:137](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L137) |
| <a id="property-executionmode"></a> `executionMode?` | `readonly` | `"parallel"` \| `"sequential"` | Sequential execution mode hints. Tools tagged `'sequential'` are never executed in parallel with each other; the executor serializes them inside the per-step batch. **Default** `'parallel'` | [packages/core/src/contracts/tool.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L66) |
| <a id="property-failclosed"></a> `failClosed?` | `readonly` | `boolean` | When `true`, an inbound-sanitization hit returns `ToolError({ kind: 'inbound_sanitization_blocked' })` instead of forwarding the (sanitized) result. Intended for regulated deployments. **Default** `false` | [packages/core/src/contracts/tool.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L96) |
| <a id="property-idempotencykey"></a> `idempotencyKey?` | `readonly` | (`input`, `ctx`) => `string` \| `Promise`\&lt;`string`\&gt; | Optional callback returning a deterministic dedup key per `(input, ctx)` tuple. REQUIRED-by-WARN for `'side-effecting'` / `'external-stateful'` tools. The framework does not validate determinism - that is the operator's contract. | [packages/core/src/contracts/tool.ts:151](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L151) |
| <a id="property-inboundsanitization"></a> `inboundSanitization?` | `readonly` | [`InboundSanitizationPolicy`](/api/@graphorin/core/type-aliases/InboundSanitizationPolicy.md) | Inbound prompt-injection sanitization policy. | [packages/core/src/contracts/tool.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L88) |
| <a id="property-inputschema"></a> `inputSchema` | `readonly` | [`ZodLikeSchema`](/api/@graphorin/core/interfaces/ZodLikeSchema.md)\&lt;`TInput`\&gt; | - | [packages/core/src/contracts/tool.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L38) |
| <a id="property-maxresulttokens"></a> `maxResultTokens?` | `readonly` | `number` | Maximum number of tokens the assembled tool result may carry into the conversation history. `0` disables the cap (logs a one-time WARN at registration). Counted against text-shaped output and text-shaped `contentParts` entries; non-text parts pass through. **Default** `16384` | [packages/core/src/contracts/tool.ts:121](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L121) |
| <a id="property-memoryguardtier"></a> `memoryGuardTier?` | `readonly` | [`MemoryGuardTier`](/api/@graphorin/core/type-aliases/MemoryGuardTier.md) | Memory-modification guard tier (DEC-153). ACTIVE when the agent is created with `memory` wired (SDF-1): the runtime binds a scope-aware region reader over working memory and the executor snapshots/verifies the region around guarded calls. Without `memory` the guard is skipped and the agent emits a one-time WARN. | [packages/core/src/contracts/tool.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L86) |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | [packages/core/src/contracts/tool.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L36) |
| <a id="property-needsapproval"></a> `needsApproval?` | `readonly` | `boolean` \| ((`input`, `ctx`) => `boolean` \| `Promise`\&lt;`boolean`\&gt;) | Either a static boolean or a predicate consulted at runtime against the realized input. `true` means the runtime suspends the run with a `tool.approval.requested` event before the tool executes. | [packages/core/src/contracts/tool.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L45) |
| <a id="property-outputschema"></a> `outputSchema?` | `readonly` | [`ZodLikeSchema`](/api/@graphorin/core/interfaces/ZodLikeSchema.md)\&lt;`TOutput`, `unknown`\&gt; | - | [packages/core/src/contracts/tool.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L39) |
| <a id="property-preferredmodel"></a> `preferredModel?` | `readonly` | \| [`ModelHint`](/api/@graphorin/core/type-aliases/ModelHint.md) \| [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md) | Per-tool author-time model hint. Either a cost-tier vocabulary literal (`'fast' | 'balanced' | 'smart'`) OR an explicit `ModelSpec` that always wins over the agent-side tier mapping. | [packages/core/src/contracts/tool.ts:168](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L168) |
| <a id="property-sandboxpolicy"></a> `sandboxPolicy?` | `readonly` | [`SandboxPolicy`](/api/@graphorin/core/type-aliases/SandboxPolicy.md) | Sandbox isolation level. Defaults are picked by `@graphorin/security`. ADVISORY in the default agent build (AG-18): inline `config.tools` closures cannot be serialised out-of-process, so the resolved policy is surfaced on the `tool.execute` span / audit but the tool runs in-process. Real isolation applies to module-loadable (skill / MCP) tools. | [packages/core/src/contracts/tool.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L56) |
| <a id="property-secretsallowed"></a> `secretsAllowed?` | `readonly` | readonly `string`[] | Per-tool secrets ACL. Tool execution is wrapped in a scope where `ctx.secrets.require(...)` only resolves keys present here. Empty / undefined means the tool may not request any secret. | [packages/core/src/contracts/tool.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L72) |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Sensitivity ceiling of the tool's input + output payload. Used by the redaction validator to decide whether the result may flow to a given sink (provider / exporter). | [packages/core/src/contracts/tool.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L78) |
| <a id="property-sideeffectclass"></a> `sideEffectClass?` | `readonly` | [`SideEffectClass`](/api/@graphorin/core/type-aliases/SideEffectClass.md) | REQUIRED side-effect classification. v0.1 transition mode emits a one-time WARN per tool name on missing classification and applies the conservative deferred default `'side-effecting'`; v0.2 may promote the WARN to a registration error. | [packages/core/src/contracts/tool.ts:144](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L144) |
| <a id="property-streaminghint"></a> `streamingHint?` | `readonly` | `true` | Opt-in flag for streaming-tool execution. The `?: true` typing rejects `streamingHint: false` on purpose - absence is the canonical "non-streaming" signal preserving v0.1 behaviour. When `true`, `Tool.execute(...)` may call `ctx.streamContent(...)` / `ctx.reportProgress(...)` and may return `Promise<void>`. | [packages/core/src/contracts/tool.ts:162](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L162) |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | Free-form labels surfaced to operators and to the model. | [packages/core/src/contracts/tool.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L58) |
| <a id="property-truncationstrategy"></a> `truncationStrategy?` | `readonly` | [`TruncationStrategy`](/api/@graphorin/core/type-aliases/TruncationStrategy.md) | Truncation strategy applied when `maxResultTokens` is exceeded. | [packages/core/src/contracts/tool.ts:123](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L123) |

## Methods

### execute()

```ts
execute(input, ctx): Promise<
  | TOutput
  | ToolReturn<TOutput>
| undefined>;
```

Defined in: [packages/core/src/contracts/tool.ts:176](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L176)

Execute the tool. Concrete implementations may return either a raw
`TOutput` or a `ToolReturn<TOutput>` envelope when extra content
parts (images, files, …) need to be appended to the conversation.
Streaming-hint tools may also return `void` once the per-chunk
buffer has been populated.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `TInput` |
| `ctx` | [`ToolExecutionContext`](/api/@graphorin/core/interfaces/ToolExecutionContext.md)\&lt;`TDeps`\&gt; |

#### Returns

`Promise`\<
  \| `TOutput`
  \| [`ToolReturn`](/api/@graphorin/core/interfaces/ToolReturn.md)\&lt;`TOutput`\&gt;
  \| `undefined`\>
