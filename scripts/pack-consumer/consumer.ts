/**
 * Pack-gate scratch consumer (W-071). Exercises the DOCUMENTED entry
 * points of the published tarballs exactly as a real dependant would:
 * a `tool({...})` built from a zod schema, the core validation
 * helpers, the memory tool belt, and the observability surface. The
 * point is the TYPES: this file is compiled (never executed) by
 * `check-package-shape.mjs` under a moduleResolution x zod matrix
 * against the packed tarballs, where `workspace:*` symlinks and the
 * root devDependencies cannot mask packaging defects.
 */
import type { SessionScope, Tracer } from '@graphorin/core';
import { validate, validateOrThrow } from '@graphorin/core';
import { buildMemoryTools } from '@graphorin/memory';
import { createConsoleExporter } from '@graphorin/observability';
import { tool } from '@graphorin/tools';
import { z } from 'zod';

const echo = tool({
  name: 'echo',
  description: 'Echo the input back to the caller.',
  inputSchema: z.object({ message: z.string(), count: z.number().int().optional() }),
  sideEffectClass: 'pure',
  async execute(input) {
    return `${input.message}`;
  },
});

const schema = z.object({ id: z.string() });
const checked = validate(schema, { id: 'x' });
const parsed: { id: string } = validateOrThrow(schema, { id: 'x' });

export function wire(deps: Parameters<typeof buildMemoryTools>[0]): number {
  const tools = buildMemoryTools(deps);
  return tools.length;
}

export function traceable(tracer: Tracer): Tracer {
  return tracer;
}

export const exporter = createConsoleExporter;

export const surface = { echo, checked, parsed };

export const scope: SessionScope = { userId: 'consumer' };
