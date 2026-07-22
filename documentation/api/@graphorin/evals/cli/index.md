[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / cli

# cli

CLI integration helpers. Convenience wrappers that combine the
runner + a reporter + an exit-code mapping so consumer scripts can
stay short.

Typical use from a `package.json` script:

```jsonc
{
  "scripts": {
    "eval": "node ./scripts/run-evals.mjs"
  }
}
```

Where `run-evals.mjs` looks like:

```ts
import { runEvals, exitOnFailures, renderTerminalReport } from '@graphorin/evals';

const report = await runEvals({...});
console.log(renderTerminalReport(report));
exitOnFailures(report);
```

## Interfaces

| Interface | Description |
| ------ | ------ |
| [WriteReportsOptions](/api/@graphorin/evals/cli/interfaces/WriteReportsOptions.md) | - |
| [WrittenReport](/api/@graphorin/evals/cli/interfaces/WrittenReport.md) | - |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [ReporterFormat](/api/@graphorin/evals/cli/type-aliases/ReporterFormat.md) | Reporter ids accepted by [writeReports](/api/@graphorin/evals/cli/functions/writeReports.md). |

## Functions

| Function | Description |
| ------ | ------ |
| [exitOnFailures](/api/@graphorin/evals/cli/functions/exitOnFailures.md) | Set `process.exitCode` to `1` when at least one case failed, or when a regression report contains findings. Uses `exitCode` rather than `process.exit` so other async tasks finish cleanly. |
| [writeReports](/api/@graphorin/evals/cli/functions/writeReports.md) | Render the report in every requested format and write each one to a file. Returns the manifest of written files. |

## References

### detectRegressions

Re-exports [detectRegressions](/api/@graphorin/evals/functions/detectRegressions.md)

***

### RegressionOptions

Re-exports [RegressionOptions](/api/@graphorin/evals/interfaces/RegressionOptions.md)
