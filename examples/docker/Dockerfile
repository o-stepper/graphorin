# syntax=docker/dockerfile:1.7
#
# Distribution Dockerfile for the Graphorin standalone server.
# Phase 15 distribution template — pairs with @graphorin/cli's
# refuse-to-run-as-root + umask(0o077) hardening (DEC-135).
#
# Build:
#   docker build -t graphorin:latest -f examples/docker/Dockerfile .
#
# Run (a JSON config mounted at /etc/graphorin/config.json is REQUIRED -
# the CMD below passes it via --config; start from the container-tuned
# examples/docker/config.example.json - 0.0.0.0 bind, /data storage):
#   docker run --rm \
#     --read-only --tmpfs /tmp \
#     --security-opt no-new-privileges \
#     --cap-drop=ALL \
#     -v graphorin-data:/data \
#     -v "$PWD/config.json:/etc/graphorin/config.json:ro" \
#     -v /run/secrets/graphorin:/run/secrets/graphorin:ro \
#     -p 8080:8080 \
#     graphorin:latest
#
# @stable

# ---------- Builder ----------
FROM node:22-slim AS builder

WORKDIR /build

# Pinned package manager — mirrors the workspace `packageManager` field.
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

# tsconfig.base.json is load-bearing: every package tsconfig extends it,
# so `pnpm -r run build` (tsdown) fails without it in the build context.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages

RUN pnpm install --frozen-lockfile \
 && pnpm -r run build

# ---------- Runtime ----------
FROM node:22-slim AS runtime

# Compatibility-first runtime: a full node:22-slim base carrying the
# builder tree (see the COPY note below), NOT a distroless image - a
# pruned runtime target is tracked separately. What we can drop, we do:
# the entrypoint execs node directly, so the npm/corepack toolchain
# (historically where image scanners find the fixable advisories) is
# removed, and Debian security fixes are applied at build time. The
# docker-smoke workflow gates the final image on fixable high/critical
# findings.
RUN apt-get update \
 && apt-get upgrade -y \
 && rm -rf /var/lib/apt/lists/* \
 && rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx \
      /usr/local/bin/corepack /opt/yarn*

RUN groupadd --system --gid 10001 graphorin \
 && useradd --system --uid 10001 --gid 10001 --create-home --shell /usr/sbin/nologin graphorin

WORKDIR /app

# Ship the builder's tree wholesale: built dist, manifests, lockfile,
# and the fully-linked node_modules (pnpm's symlinks are relative, so
# the /build -> /app move preserves resolution). Re-installing here
# with --prod would drop better-sqlite3/sqlite-vec: in this workspace
# copy the natives are dev-satisfied PEER dependencies of
# @graphorin/store-sqlite (registry consumers get them as
# auto-installed peers instead), and every prod-pruning path removes
# them again. Carrying devDependencies is the size trade-off of
# building the image from source; install the published packages if
# you need a lean image. No pnpm/corepack in the runtime stage means
# no network access after the builder, either.
COPY --from=builder --chown=graphorin:graphorin /build /app

# Symlink the binary so /usr/local/bin/graphorin works without PATH
# gymnastics for downstream consumers.
RUN ln -s /app/packages/cli/dist/bin/graphorin.js /usr/local/bin/graphorin \
 && chmod 0755 /usr/local/bin/graphorin

# Mount points the container expects. Secrets mount at
# /run/secrets/graphorin so `file:/run/secrets/graphorin/<name>` refs in the
# config resolve (mirrors the k8s template).
RUN mkdir -p /data /run/secrets/graphorin /etc/graphorin \
 && chown graphorin:graphorin /data /run/secrets/graphorin /etc/graphorin \
 && chmod 0700 /data /run/secrets/graphorin

# The CLI selects its config via the --config flag in CMD below; there is no
# GRAPHORIN_CONFIG env var.
USER graphorin
ENV NODE_ENV=production

EXPOSE 8080

# Liveness probe (Compose / Kubernetes can also probe /v1/health).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["graphorin"]
CMD ["start", "--config", "/etc/graphorin/config.json"]
