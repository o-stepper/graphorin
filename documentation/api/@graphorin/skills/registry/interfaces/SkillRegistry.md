[**Graphorin API reference v0.13.10**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [registry](/api/@graphorin/skills/registry/index.md) / SkillRegistry

# Interface: SkillRegistry

Defined in: packages/skills/src/registry/index.ts:68

Public registry surface.

## Methods

### activate()

```ts
activate(triggers, signal?): Promise<readonly ActivatedSkill[]>;
```

Defined in: packages/skills/src/registry/index.ts:101

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `triggers` | readonly `string`[] |
| `signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;readonly [`ActivatedSkill`](/api/@graphorin/skills/interfaces/ActivatedSkill.md)[]\&gt;

***

### clear()

```ts
clear(): void;
```

Defined in: packages/skills/src/registry/index.ts:122

#### Returns

`void`

***

### getAutoActivationMetadata()

```ts
getAutoActivationMetadata(): readonly SkillMetadata[];
```

Defined in: packages/skills/src/registry/index.ts:85

Skills surfaced into the system prompt for auto-activation.
Skills with `disable-model-invocation: true` are excluded.

#### Returns

readonly [`SkillMetadata`](/api/@graphorin/skills/interfaces/SkillMetadata.md)[]

***

### getMetadata()

```ts
getMetadata(): readonly SkillMetadata[];
```

Defined in: packages/skills/src/registry/index.ts:80

#### Returns

readonly [`SkillMetadata`](/api/@graphorin/skills/interfaces/SkillMetadata.md)[]

***

### getMetadataBlock()

```ts
getMetadataBlock(): string;
```

Defined in: packages/skills/src/registry/index.ts:92

Render the auto-activation metadata as a string suitable for the
system prompt. The format is bytes-stable and consumed verbatim
by the ContextEngine layered template (Phase 10d). Skills with
`disable-model-invocation: true` are excluded.

#### Returns

`string`

***

### getSkill()

```ts
getSkill(name): Skill | undefined;
```

Defined in: packages/skills/src/registry/index.ts:77

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

[`Skill`](/api/@graphorin/skills/interfaces/Skill.md) \| `undefined`

***

### has()

```ts
has(name): boolean;
```

Defined in: packages/skills/src/registry/index.ts:78

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`boolean`

***

### list()

```ts
list(): readonly Skill[];
```

Defined in: packages/skills/src/registry/index.ts:79

#### Returns

readonly [`Skill`](/api/@graphorin/skills/interfaces/Skill.md)[]

***

### register()

```ts
register(skill): void;
```

Defined in: packages/skills/src/registry/index.ts:69

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `skill` | [`Skill`](/api/@graphorin/skills/interfaces/Skill.md) |

#### Returns

`void`

***

### replace()

```ts
replace(skill): void;
```

Defined in: packages/skills/src/registry/index.ts:75

Upsert a skill by name. Unlike [SkillRegistry.register](/api/@graphorin/skills/registry/interfaces/SkillRegistry.md#register),
`replace` overwrites an existing registration instead of throwing on a
name collision - the upgrade path for hot-reloading a re-loaded skill.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `skill` | [`Skill`](/api/@graphorin/skills/interfaces/Skill.md) |

#### Returns

`void`

***

### resolveTrigger()

```ts
resolveTrigger(trigger): 
  | ActivationRequest
  | null;
```

Defined in: packages/skills/src/registry/index.ts:100

Resolve a single trigger (model-emitted skill name OR the raw
`/skill:<name>` slash-command body) into an [ActivationRequest](/api/@graphorin/skills/registry/interfaces/ActivationRequest.md).
Returns `null` when no skill matches and the trigger looked like a
slash command - callers that want a strict mode should call
[parseActivationTrigger](/api/@graphorin/skills/registry/functions/parseActivationTrigger.md) themselves.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `trigger` | `string` |

#### Returns

  \| [`ActivationRequest`](/api/@graphorin/skills/registry/interfaces/ActivationRequest.md)
  \| `null`

***

### search()

```ts
search(triggers): readonly Skill[];
```

Defined in: packages/skills/src/registry/index.ts:111

Best-effort match: returns every skill whose name OR description
contains all of the supplied trigger tokens (case-insensitive).
The agent runtime uses this when the model emits a trigger phrase
that does not directly map to a skill name.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `triggers` | readonly `string`[] |

#### Returns

readonly [`Skill`](/api/@graphorin/skills/interfaces/Skill.md)[]

***

### size()

```ts
size(): number;
```

Defined in: packages/skills/src/registry/index.ts:121

#### Returns

`number`

***

### toolDeclarations()

```ts
toolDeclarations(): readonly RegisteredToolDeclaration[];
```

Defined in: packages/skills/src/registry/index.ts:120

#### Returns

readonly [`RegisteredToolDeclaration`](/api/@graphorin/skills/registry/interfaces/RegisteredToolDeclaration.md)[]

***

### tools()

```ts
tools(): readonly InlineSkillTool[];
```

Defined in: packages/skills/src/registry/index.ts:119

Flat, deduplicated list of every pre-built tool shipped by the
registered skills. The first registration wins on a `tool.name`
collision; later collisions surface a one-time WARN through the
console so operators can resolve the conflict (Phase 12 will
route these through the audit emitter).

#### Returns

readonly [`InlineSkillTool`](/api/@graphorin/skills/type-aliases/InlineSkillTool.md)[]

***

### unregister()

```ts
unregister(name): boolean;
```

Defined in: packages/skills/src/registry/index.ts:76

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`boolean`
