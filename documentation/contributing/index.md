---
title: Contributing
description: "How to set up the repository, the development workflow, and the project conventions."
editLink: false
---

<!--
  This page is auto-synced from /CONTRIBUTING.md on every documentation build.
  Do not edit it directly — change /CONTRIBUTING.md in the repository root.
-->

# Contributing

Thanks for your interest in contributing to **Graphorin** — a TypeScript framework for building long-living personal AI assistants. This document explains how to set up the repository, the development workflow, and the project conventions.

By participating, you agree to abide by the [Code of Conduct](/contributing/code-of-conduct).

---

## Prerequisites

- **Node.js** 22.x LTS or newer (see [`.nvmrc`](https://github.com/o-stepper/graphorin/blob/main/.nvmrc)).
- **pnpm** (the project's package manager). The exact version is pinned in the root `package.json` `packageManager` field — `corepack` will activate it automatically:

```bash
corepack enable
```

- **Git** with SSH or HTTPS access to GitHub.
- A POSIX-compatible shell (bash / zsh) on macOS / Linux, or PowerShell / Git Bash on Windows. CI runs on macOS, Linux, and Windows for every PR.

## Repository layout

```
packages/        Each @graphorin/* package lives here as its own workspace.
examples/        Stand-alone example apps that consume @graphorin/* packages.
scripts/         Repo-wide maintenance scripts (CI helpers, license checks, …).
.github/         GitHub Actions workflows, issue templates, and PR template.
.changeset/      Changesets configuration; one file per pending release entry.
```

## First-time setup

```bash
git clone https://github.com/o-stepper/graphorin.git
cd graphorin
corepack enable
pnpm install --frozen-lockfile
pnpm -r build
pnpm -r test
```

If everything is green, you are ready to make changes.

## Development workflow

1. **Create a branch.** `phase-NN-<slug>` for one-phase work, `phase-NN-<sub-track>-<slug>` for sub-tracks within a heavy phase, or `hotfix/<short-description>` for unplanned fixes. Never push directly to `main`.
2. **Make your change** inside the relevant `packages/<scope>` or `examples/<app>` workspace.
3. **Add or update tests.** Vitest runs across the whole workspace.
4. **Run the local checks** before opening a PR:

```bash
pnpm -r build
pnpm -r typecheck
pnpm -r test
pnpm lint
pnpm run check-no-network
```

5. **Add a changeset** for any change that affects a published `@graphorin/*` package:

```bash
pnpm changeset
```

Pick the affected packages, the bump type (`patch` / `minor` / `major`), and write a single short paragraph that explains the *why* of the change. The CI release pipeline consumes the changeset on merge.

6. **Open a Pull Request** against `main` using the [PR template](https://github.com/o-stepper/graphorin/blob/main/.github/PULL_REQUEST_TEMPLATE.md). The template asks for:
   - The short summary of behavioural changes.
   - The reasoning / motivation.
   - The test plan (what you tested and how).
   - Risks and out-of-scope deferrals reviewers should know about.

## Conventional Commits

Graphorin follows the [Conventional Commits](https://www.conventionalcommits.org) specification:

- `feat(scope): ...` — new feature
- `fix(scope): ...` — bug fix
- `docs(scope): ...` — documentation only
- `chore(scope): ...` — tooling, dependencies, internal housekeeping
- `refactor(scope): ...` — non-behavioural refactor
- `test(scope): ...` — tests only
- `perf(scope): ...` — performance improvement
- A trailing `!` (e.g. `feat(core)!: ...`) plus a `BREAKING CHANGE:` footer marks a breaking change.

The **scope** is the package name without the `@graphorin/` prefix, e.g. `core`, `agent`, `memory`, `server`, `cli`.

The **subject** is in imperative mood, present tense, and at most 72 characters.

The **body** explains the *why*, not the *what*. One logical change per commit; squash on merge if your branch had churn.

## Code style

- **Biome** is the single tool for both lint and format. Run `pnpm lint` and `pnpm format`.
- **TypeScript** strict mode, `noUncheckedIndexedAccess`, `composite: true`. Zero `any` in public APIs.
- **ESM-only.** Every `@graphorin/*` package ships ESM only and runs on Node 22+.
- **Naming:** files in `kebab-case.ts`, types in `PascalCase`, functions and variables in `camelCase`, constants in `SCREAMING_SNAKE_CASE`, discriminated-union variants as `'kebab-case'` string literals.
- **Imports:** always use `import type` for type-only imports.
- **No default exports** in `@graphorin/core` or any other foundation package; named exports only.

## Testing

- **Unit tests** are required for every change. The default coverage threshold is 70 %; security-critical packages target 85 %.
- **Type-level tests** (via `vitest`'s `expectTypeOf` or `tsd`) are mandatory for every public interface.
- **Integration / end-to-end tests** are required for changes that span multiple packages.
- **Property tests** (via `fast-check`) are required for redaction, secret leakage, channel merge, and conflict-resolution thresholds once the corresponding packages exist.
- Network-gated tests are opt-in via `pnpm test:network`. The default CI run never makes outbound calls.

## Versioning

Graphorin follows [SemVer](https://semver.org). Pre-1.0, minor bumps cover breaking changes and patch bumps cover everything else (the industry pre-1.0 norm). Once Graphorin reaches 1.0, strict SemVer applies. All `@graphorin/*` packages are released **lockstep** at the same version while on the 0.x line.

Versions are managed by [Changesets](https://github.com/changesets/changesets). Do **not** bump versions by hand — let `pnpm changeset version` do it.

## Privacy & no-phone-home

Graphorin makes **no implicit network calls** of any kind. Any change that introduces a `fetch`, `http(s).request`, or socket call must be in an allow-listed code path (LLM provider adapters, MCP transports, OAuth flows, opt-in pricing refresh, embedder model downloads, or storage-adapter network drivers). The CI script `pnpm run check-no-network` enforces this. PRs that fail this check will not be merged.

See [`SECURITY.md`](/contributing/security) for the full privacy commitment.

## Reporting bugs and requesting features

- **Bug reports:** [open an issue](https://github.com/o-stepper/graphorin/issues/new?template=bug_report.yml).
- **Feature requests:** [open an issue](https://github.com/o-stepper/graphorin/issues/new?template=feature_request.yml).
- **Security disclosures:** see [`SECURITY.md`](/contributing/security).
- **Design discussion / Q&A:** GitHub Discussions (enabled post-launch).

## License

By contributing to Graphorin, you agree that your contributions will be licensed under the [MIT License](https://github.com/o-stepper/graphorin/blob/main/LICENSE).

---

**Graphorin** · v0.3.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://graphorin.com> · <https://github.com/o-stepper/graphorin>
