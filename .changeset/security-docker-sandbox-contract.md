---
'@graphorin/security': patch
---

DockerSandbox now executes the full stable `SandboxRunOptions` contract (eleventh deep retest P1). The `env` allowlist is forwarded as the container `Env` (previously silently dropped; the image baseline such as `PATH` remains and is documented), per-call `maxMemoryMb` overrides the constructor-level limit in `HostConfig.Memory`, and `signal` now aborts the run: an abort force-removes the container and resolves with `kind: 'aborted'`, including aborts that race container start. Failure diagnostics are no longer discarded - the log stream is demultiplexed into separate stdout/stderr channels, a non-zero exit surfaces the wrapper's stderr first line in the error message and the full text in `cause.stderr` (previously `logs({ stderr: false })` returned an empty cause), and the `__INPUT__` source-code input binding is documented.
