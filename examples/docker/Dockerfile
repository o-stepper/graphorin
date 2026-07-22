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

# Prune the tree to the production closure. Three packages that the
# runtime needs are dev-satisfied in the workspace (registry consumers
# get them as auto-installed peers / explicit installs instead), so a
# plain `--prod` install would drop them; promote them to prod in
# IMAGE-LOCAL manifest edits first (never committed):
#   - better-sqlite3 + sqlite-vec: non-optional peers of
#     @graphorin/store-sqlite, satisfied from its devDependencies.
#   - better-sqlite3-multiple-ciphers: non-optional peer of
#     @graphorin/store-sqlite-encrypted (the encrypted store the
#     shipped config.example.json enables).
#   - @graphorin/store-sqlite-encrypted itself: a devDependency of the
#     CLI (dynamic-loaded plugin).
#   - @graphorin/agent: an optional peer of @graphorin/server — without
#     it the server boots but cannot run agents, which would make the
#     image a health-check shell.
#   - zod: an optional peer of the @graphorin packages (consumers own
#     the instance), satisfied from each package's devDependencies in
#     the workspace. Workspace packages are their own pnpm importers,
#     so every manifest that dev-holds zod gets it promoted, not just
#     the CLI's.
# The install is filtered to the CLI's workspace subtree — a bare
# `--prod` would also install the production dependencies of packages
# OUTSIDE the image's closure (transformers.js/ONNX, node-llama-cpp,
# channels), which is exactly the builder-tree bloat this stage
# removes.
# Then wipe the dev-mode node_modules wholesale - an in-place filtered
# `--prod` reconcile keeps every OTHER importer's physical packages in
# the virtual store - and reinstall just the production closure from
# the local store cache (CI=true: pnpm wants TTY confirmation for
# modules-dir changes). Finally strip source/test trees: the runtime
# imports dist/ only.
RUN node -e ' \
    const fs = require("fs"); \
    const edit = (p, fn) => { const m = JSON.parse(fs.readFileSync(p, "utf8")); fn(m); fs.writeFileSync(p, JSON.stringify(m, null, 2) + "\n"); }; \
    edit("packages/store-sqlite/package.json", (m) => { \
      m.dependencies["better-sqlite3"] = m.devDependencies["better-sqlite3"]; \
      m.dependencies["sqlite-vec"] = m.devDependencies["sqlite-vec"]; \
      delete m.devDependencies["better-sqlite3"]; \
      delete m.devDependencies["sqlite-vec"]; \
    }); \
    edit("packages/store-sqlite-encrypted/package.json", (m) => { \
      m.dependencies = m.dependencies ?? {}; \
      m.dependencies["better-sqlite3-multiple-ciphers"] = m.peerDependencies["better-sqlite3-multiple-ciphers"]; \
      if (m.devDependencies) delete m.devDependencies["better-sqlite3-multiple-ciphers"]; \
    }); \
    edit("packages/cli/package.json", (m) => { \
      m.dependencies["@graphorin/store-sqlite-encrypted"] = "workspace:*"; \
      m.dependencies["@graphorin/agent"] = "workspace:*"; \
      if (m.devDependencies) delete m.devDependencies["@graphorin/store-sqlite-encrypted"]; \
    }); \
    for (const dir of fs.readdirSync("packages")) { \
      const p = `packages/${dir}/package.json`; \
      if (!fs.existsSync(p)) continue; \
      edit(p, (m) => { \
        if (m.devDependencies?.zod) { \
          m.dependencies = m.dependencies ?? {}; \
          m.dependencies.zod = m.devDependencies.zod; \
          delete m.devDependencies.zod; \
        } \
      }); \
    } \
  ' \
 && rm -rf node_modules \
 && find packages -mindepth 2 -maxdepth 2 -name node_modules -type d -exec rm -rf {} + \
 && CI=true pnpm install --prod --no-frozen-lockfile --filter "@graphorin/cli..." \
 && find packages -mindepth 2 -maxdepth 2 -type d \( -name src -o -name tests -o -name .turbo \) -exec rm -rf {} + \
 && find packages -mindepth 2 -maxdepth 2 -type f \( -name 'tsconfig*.json' -o -name '*.tsbuildinfo' -o -name 'vitest.config.*' \) -delete \
 && node packages/cli/dist/bin/graphorin.js --version

# ---------- Runtime ----------
FROM node:22-slim AS runtime

# Production-closure runtime on node:22-slim (not distroless — the
# HEALTHCHECK and operators' debug shells still want a libc userland).
# The builder tree arrives already pruned to prod dependencies + dist;
# the npm/corepack toolchain (historically where image scanners find
# the fixable advisories) is removed, and Debian security fixes are
# applied at build time. The docker-smoke workflow gates the final
# image on fixable high/critical findings.
RUN apt-get update \
 && apt-get upgrade -y \
 && rm -rf /var/lib/apt/lists/* \
 && rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx \
      /usr/local/bin/corepack /opt/yarn*

RUN groupadd --system --gid 10001 graphorin \
 && useradd --system --uid 10001 --gid 10001 --create-home --shell /usr/sbin/nologin graphorin

WORKDIR /app

# Ship the pruned builder tree: built dist, manifests, and the
# prod-only node_modules (pnpm's symlinks are relative, so the
# /build -> /app move preserves resolution). Optional integrations the
# server can use but the prod closure does not include (dockerode for
# the docker sandbox tier from inside the container, isolated-vm,
# @graphorin/mcp) are consumer add-ons — extend this stage with
# `pnpm add <pkg>` in a derived image if you need them.
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
