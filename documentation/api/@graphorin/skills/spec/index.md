[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / spec

# spec

Bundled snapshot loader for the `SKILL.md` packaging-format
specification.

The framework ships an offline copy of the upstream specification
so the loader can decide which frontmatter fields are recognised,
which `graphorin-*` extensions deprecate (or co-exist with) an
upstream field, and whether a skill author's
`graphorin-anthropic-spec` hint refers to a snapshot newer or older
than the bundled one. The snapshot is checked-in to the repository;
`pnpm run check-anthropic-spec` diffs it against an upstream snapshot
the maintainer supplies via `--upstream` (there is no scheduled CI
job and no auto-refresh - the release `mvp-readiness` gate runs the
helper in no-upstream skip mode, which only confirms the bundled
snapshot parses).

Neither the loader nor the helper fetches the upstream specification;
the upstream snapshot is fetched manually. The snapshot lookup is
deterministic and side-effect free at runtime.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [GraphorinMappingEntry](/api/@graphorin/skills/spec/interfaces/GraphorinMappingEntry.md) | Single entry of the `graphorin-*` mapping map. |
| [KnownFieldEntry](/api/@graphorin/skills/spec/interfaces/KnownFieldEntry.md) | Single entry of the upstream-known fields map. |
| [SpecSnapshot](/api/@graphorin/skills/spec/interfaces/SpecSnapshot.md) | Top-level shape of the bundled snapshot. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [FieldStability](/api/@graphorin/skills/spec/type-aliases/FieldStability.md) | Stability classification of a known upstream field. |
| [GraphorinFieldPolicy](/api/@graphorin/skills/spec/type-aliases/GraphorinFieldPolicy.md) | Migration policy applied to a `graphorin-*` field that maps to an upstream field. |

## Functions

| Function | Description |
| ------ | ------ |
| [\_setSpecSnapshotForTesting](/api/@graphorin/skills/spec/functions/setSpecSnapshotForTesting.md) | Override the bundled snapshot. Used by tests that exercise the "newer / older spec snapshot" branches of the validator. |
| [compareAuthorSpecHint](/api/@graphorin/skills/spec/functions/compareAuthorSpecHint.md) | Compare an author's `graphorin-anthropic-spec` value against the bundled snapshot date. Returns: |
| [getGraphorinMapping](/api/@graphorin/skills/spec/functions/getGraphorinMapping.md) | Resolve the mapping entry for a `graphorin-*` field. Returns `undefined` if the field is not known to the snapshot. |
| [getKnownField](/api/@graphorin/skills/spec/functions/getKnownField.md) | Resolve a known-field entry by name. Returns `undefined` if the field is not part of the upstream specification. |
| [getSpecSnapshot](/api/@graphorin/skills/spec/functions/getSpecSnapshot.md) | Return the currently active snapshot. Loads the bundled JSON file on first call, then caches the parsed object. |
