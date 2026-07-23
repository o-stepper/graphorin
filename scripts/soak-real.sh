#!/bin/bash
# Real-provider soak: boot a local server on .github/smoke/soak-real.app.mjs
# (agent pool backed by a live OpenAI-compatible endpoint) and drive it with
# scripts/soak-driver.mjs. Maintainer-gated: COSTS REAL MONEY, needs
# OPENAI_API_KEY in the environment (env-only, never config, never logged).
#
# Knobs (env):
#   SOAK_REAL_SECONDS  drive window, default 3600
#   SOAK_REAL_MODEL    subject model, default gpt-4.1-nano (cheap, non-reasoning)
#   SOAK_RPS           paced request rate, default 2 (realistic LLM-bound traffic)
#   SOAK_P95_MS        p95 budget, default 20000 (real cloud latency, not stub)
#
# Published runs live in documentation/guide/operations.md ("Published
# soak runs"); the stub-provider CI variant is .github/workflows/soak.yml.
set -euo pipefail
cd "$(dirname "$0")/.." || exit 2

if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "soak-real: OPENAI_API_KEY is required (env-only)"; exit 2
fi

SOAK_DIR="${SOAK_REAL_DIR:-$(mktemp -d "${TMPDIR:-/tmp}/graphorin-soak-real.XXXXXX")}"
mkdir -p "$SOAK_DIR/secrets"
openssl rand -hex 32 > "$SOAK_DIR/secrets/pepper"
chmod 0600 "$SOAK_DIR/secrets/pepper"

# The app module must live inside a workspace project whose node_modules
# resolve ALL its bare @graphorin/* imports; examples/assistant-bot has
# the widest dependency surface (see soak.yml for the same move).
cp .github/smoke/soak-real.app.mjs examples/assistant-bot/.soak-real.app.mjs

cat > "$SOAK_DIR/config.json" <<EOF
{
  "server": {
    "host": "127.0.0.1",
    "port": 8091,
    "rateLimit": { "enabled": false },
    "csrf": { "enabled": false }
  },
  "auth": { "kind": "token", "pepperRef": "file:$SOAK_DIR/secrets/pepper" },
  "storage": { "path": "$SOAK_DIR/data.db", "mode": "server" },
  "secrets": { "source": "auto", "strict": false },
  "observability": { "logger": "json" },
  "app": "$(pwd)/examples/assistant-bot/.soak-real.app.mjs"
}
EOF

node packages/cli/dist/bin/graphorin.js migrate --config "$SOAK_DIR/config.json" >/dev/null
SOAK_TOKEN=$(node packages/cli/dist/bin/graphorin.js token create \
  --scopes agents:invoke,agents:read --label soak-real \
  --config "$SOAK_DIR/config.json" | tail -1)

node packages/cli/dist/bin/graphorin.js start --config "$SOAK_DIR/config.json" \
  > "$SOAK_DIR/server.log" 2>&1 &
SERVER_PID=$!

healthy=""
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:8091/v1/health >/dev/null 2>&1; then
    healthy=1; echo "soak-real: server healthy after ${i}s (pid $SERVER_PID, dir $SOAK_DIR)"; break
  fi
  sleep 1
done
if [ -z "$healthy" ]; then
  echo "soak-real: server did not become healthy (see $SOAK_DIR/server.log)"
  kill "$SERVER_PID" 2>/dev/null; exit 1
fi

set +e
SOAK_URL=http://127.0.0.1:8091 \
SOAK_TOKEN="$SOAK_TOKEN" \
SOAK_SECONDS="${SOAK_REAL_SECONDS:-3600}" \
SOAK_CONCURRENCY=16 \
SOAK_RPS="${SOAK_RPS:-2}" \
SOAK_P95_MS="${SOAK_P95_MS:-20000}" \
SOAK_SERVER_PID=$SERVER_PID \
  node scripts/soak-driver.mjs
rc=$?
set -e
kill "$SERVER_PID" 2>/dev/null || true
exit $rc
