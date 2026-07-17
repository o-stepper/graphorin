# benchmark-conformance

CHANGELOG seeded at package creation. The package is changesets-ignored
(private, lockstep-bumped by `bump-version --sync`), but the changesets
action still reads every version-changed package's CHANGELOG.md when it
composes the Version Packages PR - a missing file crashes the Release
run (the #182 landmine class).

Notable benchmark-level changes ride the root `CHANGELOG.md`.

## 0.12.0

- Initial release: the per-release framework-floor conformance suite
  (audit item 10) - 13 deterministic offline checks across agent,
  memory, sessions, workflow, security, server, and pricing, wired into
  `benchmark:ci` with a versioned RESULTS.md report.
