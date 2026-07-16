# benchmark-longmemeval

CHANGELOG seeded retroactively for the LongMemEval harness. The package
is changesets-ignored (private, lockstep-bumped by
`bump-version --sync`), but the changesets action still reads every
version-changed package's CHANGELOG.md when it composes the Version
Packages PR - a missing file crashed the Release run on 2026-07-16.
