<!--
  Thanks for contributing to Graphorin! Please fill in every section below.
  See CONTRIBUTING.md for the full development workflow and conventions.
-->

## What changed

<!-- Bullet list of behavioural changes. One line per change. -->

-

## Why

<!--
  Explain the motivation. Link to the GitHub issue, discussion, or design doc
  this PR closes or implements.
-->

Closes #

## How it was tested

<!--
  Describe the testing you did. Include unit / integration / e2e coverage
  added or changed. Mention any manual testing.
-->

- [ ] Unit tests added or updated.
- [ ] Type-level tests added or updated for any new public API.
- [ ] Integration / e2e tests added or updated where applicable.
- [ ] `pnpm -r build && pnpm -r typecheck && pnpm -r test && pnpm lint && pnpm run check-no-network` runs green locally.

## Risks

<!--
  Anything reviewers should poke at: tricky edge cases, performance trade-offs,
  backwards-compatibility implications, etc.
-->

-

## Out of scope

<!--
  What was deliberately deferred or left to a follow-up PR.
-->

-

## Changeset

<!--
  Any change to a published @graphorin/* package needs a changeset.
  Run `pnpm changeset` and commit the generated file.
-->

- [ ] A changeset was added (`pnpm changeset`), **or** this PR does not affect any published package.

## Reviewer checklist

- [ ] No `any` in any new public API surface.
- [ ] No new implicit network call (anything that calls `fetch`, `http(s).request`, raw sockets, or WebSocket constructors must be in an allow-listed code path).
- [ ] Public APIs follow the streaming-first principle (return `AsyncIterable<E>` for plausibly long-running operations).
- [ ] All new errors extend a typed error class with `kind`, `message`, and optional `cause` / `hint` fields.
- [ ] Conventional Commit format used in commit subject(s).
- [ ] No reference to proprietary names from third-party frameworks that are not actual dependencies of Graphorin.
