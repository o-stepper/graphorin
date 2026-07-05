# @graphorin/eslint-plugin

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

### Minor Changes

- Initial scaffold for the Graphorin ESLint plugin. Ships an empty rule set
  and a single no-op rule (`no-console-in-public-api`) used to verify that
  the plugin loads correctly in a host project. The full ruleset lands in a
  later release.
