# example-structured-verifier

CHANGELOG seeded at package creation. The package is changesets-ignored
(private, lockstep-bumped by `bump-version --sync`), but the changesets
action still reads every version-changed package's CHANGELOG.md when it
composes the Version Packages PR - a missing file crashes the Release
run (first observed 2026-07-16, reproduced 2026-07-17 by this very
package).

Notable example-level changes ride the root `CHANGELOG.md`.

## 0.12.0

- Initial release: structured-output + response-verifier acceptance
  demo (audit item 9) - closed wire `jsonSchema`, zod parse gate, C3
  verifier continuation round, wire-forwarding contract tests.
