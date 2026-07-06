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
# the CMD below passes it via --config; see
# examples/systemd/config.example.json for a starter):
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

# Distroless-style: only the bits we need.
RUN groupadd --system --gid 10001 graphorin \
 && useradd --system --uid 10001 --gid 10001 --create-home --shell /usr/sbin/nologin graphorin

WORKDIR /app

# Copy the built workspace + the lockfile so the runtime stays
# pnpm-frozen and reproducible.
COPY --from=builder --chown=graphorin:graphorin /build/packages /app/packages
COPY --from=builder --chown=graphorin:graphorin /build/pnpm-lock.yaml /build/pnpm-workspace.yaml /build/package.json /app/

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate \
 && pnpm install --frozen-lockfile --prod \
 && pnpm cache delete

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
