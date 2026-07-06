# Changesets

This folder contains [Changesets](https://github.com/changesets/changesets) - the source of truth for which `@graphorin/*` packages will receive a version bump on the next release, and what the changelog entry should say.

All `@graphorin/*` packages are released **lockstep** at the same version while the framework is on the `0.x` line (configured via the `fixed` setting in [`config.json`](./config.json)).

## How to add a changeset

```bash
pnpm changeset
```

The interactive prompt asks you which packages changed, the bump type (`patch` / `minor` / `major`), and a one-paragraph summary that explains the *why* of the change. The summary becomes the changelog entry.

Pre-1.0 versioning convention:

- `minor` for breaking changes (the industry pre-1.0 norm).
- `patch` for everything else.

Once Graphorin reaches `1.0`, strict SemVer applies.

## Releasing

The release pipeline runs from `.github/workflows/release.yml` and is gated until the project is ready to publish to npm. When enabled, it consumes pending changesets, opens a "Version Packages" PR, and on merge publishes the affected packages with `--provenance --access public`.

---

**Graphorin** · v0.1.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://graphorin.com> · <https://github.com/o-stepper/graphorin>
