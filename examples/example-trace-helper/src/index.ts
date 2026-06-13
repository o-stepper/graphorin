/**
 * Graphorin v0.5.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Shared helper for example apps: opt-in console span export driven by
 * `GRAPHORIN_TRACE`, without pulling tracing into the default CI path.
 */

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
