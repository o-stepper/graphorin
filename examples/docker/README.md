# Docker deployment template

A hardened distribution `Dockerfile` for the **Graphorin standalone server**
(`@graphorin/server` via `@graphorin/cli`). It is a deployment *template*, not
a runnable example app - there is no `package.json` and it is not part of the
examples smoke test.

## Build

```bash
docker build -t graphorin:latest -f examples/docker/Dockerfile .
```

## Run

The container needs a **JSON config mounted at `/etc/graphorin/config.json`**
(the image `CMD` passes it via `--config`; the loader reads `.json`/`.js`/`.mjs`,
not TOML). Start from the container-tuned
[`config.example.json`](./config.example.json) in this directory - its `file:`
secret refs already point under `/run/secrets/graphorin/`:

```bash
docker run --rm \
  --read-only --tmpfs /tmp \
  --security-opt no-new-privileges \
  --cap-drop=ALL \
  -v graphorin-data:/data \
  -v "$PWD/examples/docker/config.example.json:/etc/graphorin/config.json:ro" \
  -v /run/secrets/graphorin:/run/secrets/graphorin:ro \
  -p 8080:8080 \
  graphorin:latest
```

> **Container-specific config rules.** Inside a container the server **must
> bind `0.0.0.0`** - with the server default `127.0.0.1` the published port
> (`-p 8080:8080`) is unreachable from outside, while the image
> `HEALTHCHECK` (which probes `127.0.0.1` in-container) keeps reporting
> `healthy`. The database **must live under `/data`**: it is the only
> writable volume under the recommended `--read-only` root FS. The sibling
> [`../systemd/config.example.json`](../systemd/config.example.json) makes
> the opposite choices (`127.0.0.1`, `/var/lib/graphorin`) because they are
> right for a host service - do not reuse it here. JSON allows no comments,
> so these rules live in this README rather than the config files.

The flags mirror the framework's process-hardening discipline (refuse-to-run-as-root,
`umask 0o077`, dropped capabilities, read-only root FS, no new privileges).
Mount secrets (pepper, DB passphrases) read-only rather than baking them into
the image. Without the config mount the CLI exits immediately with
"config file not found". Remember the in-container `HEALTHCHECK` confirms
**liveness only** - probe the published port from outside (as the smoke
workflow does) to prove reachability. See
[Standalone server](../../documentation/guide/standalone-server.md)
and [Security](../../documentation/guide/security.md).

### Secret file ownership and mode

The container runs as uid/gid **10001** (`graphorin`). Root-owned `0600`
secret files are unreadable to it, and world-readable `0644` files make the
server warn on every boot - both are wrong. For **bind-mounted** secret
files, own them as the container user and keep them owner-read-only:

```bash
sudo chown -R 10001:10001 /run/secrets/graphorin
sudo chmod 0500 /run/secrets/graphorin
sudo chmod 0400 /run/secrets/graphorin/*
```

(The weekly smoke workflow runs exactly this pattern.) Orchestrator-managed
secrets (Docker Swarm/Compose `secrets:`, Kubernetes `Secret` volumes) set
ownership themselves; if your orchestrator fixes the mode to something the
server flags and you cannot change it, the documented
`?warnOnPermissions=0` suffix on the `file:` SecretRef silences that one
ref's warning - reserve it for read-only orchestrator mounts.

## Supported platforms

The image is built and health-checked for **`linux/amd64`** by the weekly
`Docker image smoke` workflow (`.github/workflows/docker-smoke.yml`, also
runnable on demand via `workflow_dispatch`). `linux/arm64` is best-effort.

The native modules `better-sqlite3` and `sqlite-vec` are installed from
**prebuilt binaries** - `node:22-slim` ships no C toolchain (`python3` /
`make` / `g++`). If a prebuilt binary is unavailable for the target
platform (e.g. an uncommon arch, or GitHub Releases being unreachable at
build time), the build fails at `pnpm install`; add the toolchain to the
builder stage if you need to compile from source.

Related templates: [`../k8s`](../k8s), [`../systemd`](../systemd),
[`../github-actions`](../github-actions).
