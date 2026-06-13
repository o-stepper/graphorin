# Docker deployment template

A hardened distribution `Dockerfile` for the **Graphorin standalone server**
(`@graphorin/server` via `@graphorin/cli`). It is a deployment *template*, not
a runnable example app — there is no `package.json` and it is not part of the
examples smoke test.

## Build

```bash
docker build -t graphorin:latest -f examples/docker/Dockerfile .
```

## Run

```bash
docker run --rm \
  --read-only --tmpfs /tmp \
  --security-opt no-new-privileges \
  --cap-drop=ALL \
  -v graphorin-data:/data \
  -v /run/secrets/graphorin:/secrets:ro \
  -e GRAPHORIN_CONFIG=/etc/graphorin/config.json \
  -p 8080:8080 \
  graphorin:latest
```

The flags mirror the framework's process-hardening discipline (refuse-to-run-as-root,
`umask 0o077`, dropped capabilities, read-only root FS, no new privileges).
Mount secrets (pepper, DB passphrases) read-only rather than baking them into
the image. See [Standalone server](../../documentation/guide/standalone-server.md)
and [Security](../../documentation/guide/security.md).

## Supported platforms

The image is built and health-checked for **`linux/amd64`** by the weekly
`Docker image smoke` workflow (`.github/workflows/docker-smoke.yml`, also
runnable on demand via `workflow_dispatch`). `linux/arm64` is best-effort.

The native modules `better-sqlite3` and `sqlite-vec` are installed from
**prebuilt binaries** — `node:22-slim` ships no C toolchain (`python3` /
`make` / `g++`). If a prebuilt binary is unavailable for the target
platform (e.g. an uncommon arch, or GitHub Releases being unreachable at
build time), the build fails at `pnpm install`; add the toolchain to the
builder stage if you need to compile from source.

Related templates: [`../k8s`](../k8s), [`../systemd`](../systemd),
[`../github-actions`](../github-actions).
