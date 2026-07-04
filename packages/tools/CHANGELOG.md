# @graphorin/tools

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

### Minor Changes

- Phase 07 — initial release. The `@graphorin/tools` package ships the
  typed `tool({...})` builder, the strategy-aware `ToolRegistry`, the
  `ToolExecutor` with parallel/sequential dispatch, the approval flow,
  the inbound prompt-injection sanitization layer, the four-strategy
  result truncation pipeline, the streaming-tool execution surface, and
  the built-in `tool_search` lookup tool. See the package `README.md`
  for the full surface inventory and the workspace changeset for the
  rollup release notes.
