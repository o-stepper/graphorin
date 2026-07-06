/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Shared helpers for example apps: opt-in console span export driven by
 * `GRAPHORIN_TRACE` (without pulling tracing into the default CI path)
 * and a portable run-direct guard for CLI entry points.
 */

import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import type { Tracer } from '@graphorin/core';
import { createConsoleExporter, createTracer } from '@graphorin/observability';

const TRUTHY = new Set(['1', 'true', 'yes', 'on']);

/**
 * When `GRAPHORIN_TRACE` is `console`, `1`, `true`, `yes`, or `on`,
 * returns a {@link Tracer} that pretty-prints finished spans to the
 * console. Otherwise returns `undefined` so `createAgent` /
 * `createWorkflow` keep the framework `NOOP_TRACER` default.
 */
export function optionalTracerFromEnv(env: NodeJS.ProcessEnv): Tracer | undefined {
  const raw = (env.GRAPHORIN_TRACE ?? '').trim().toLowerCase();
  if (raw === 'console' || TRUTHY.has(raw)) {
    return createTracer({ exporters: [createConsoleExporter({ pretty: true })] });
  }
  return undefined;
}

/**
 * Run-direct guard for example entry points: `true` when the module at
 * `importMetaUrl` is the one Node was asked to execute (`argv1`).
 *
 * The naive guard (string-comparing `import.meta.url` against a
 * `file://` prefix glued onto `process.argv[1]`) is a silent no-op on
 * Windows (argv[1] is `C:\...` with backslashes), for paths containing
 * spaces (URL-encoding), and when
 * the script is launched through a declared `bin` (Node resolves the
 * main module to its realpath while argv[1] keeps the symlink path).
 * `pathToFileURL` covers the first two; `realpath` covers the third,
 * falling back to the unresolved path when resolution throws (for
 * example the file was unlinked between launch and the check).
 */
export function isMainModule(
  importMetaUrl: string,
  argv1: string | undefined,
  realpath: (p: string) => string = realpathSync,
): boolean {
  if (argv1 === undefined) return false;
  let resolved = argv1;
  try {
    resolved = realpath(argv1);
  } catch {
    // Keep the unresolved path: a stale/virtual argv[1] should still
    // match when the URL forms agree.
  }
  return importMetaUrl === pathToFileURL(resolved).href;
}
