# @graphorin/benchmark-tool-agent

Hermetic **tool-use / harness reliability** benchmark for the Graphorin
framework. It drives the real `createAgent(...)` loop with a **deterministic,
offline stub provider** over a small retail multi-tool task set, then scores
each run with the trajectory scorers from `@graphorin/evals` and reports
`pass^1` / `pass^k` against a committed baseline.

> **Why a stub provider?** The benchmark measures the **harness**, not a model.
> The provider script is a fixed plan of tool calls; the tools mutate an
> in-memory world. The benchmark checks that the loop routes, dispatches
> (incl. in parallel), surfaces results, recovers from a tool error, and lands
> the world in the goal state. No model, no network (`check-no-network` clean).

## Metrics

- **`pass^1`** — fraction of tasks whose *first* attempt passed every gating
  scorer.
- **`pass^k`** — fraction of tasks that passed every gating scorer on *all* `k`
  attempts (worst-case reliability). With a deterministic provider each attempt
  is identical, so `pass^k == pass^1`; the `k`-run loop and "all must pass"
  semantics are in place for stochastic providers and as a structural guard.

A task counts as passed only when **all five** trajectory scorers pass:
`correctToolSelected`, `argumentValidity`, `redundantCallDetection`,
`recoveryAfterError`, and `finalStateCorrect` (goal-state). A drop in `pass^k`
or `pass^1` below the baseline fails CI (set `TOOL_AGENT_REGRESSION_STRICT=0`
to report without gating; `--smoke` relaxes the hard gate).

## Run

```sh
pnpm --filter @graphorin/benchmark-tool-agent run benchmark:run    # full suite, writes RESULTS.md, gates
pnpm --filter @graphorin/benchmark-tool-agent run benchmark:smoke  # fewer attempts, no gate
```

Wired into the repo-wide `pnpm benchmark:ci` chain.

---

**Graphorin** · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
