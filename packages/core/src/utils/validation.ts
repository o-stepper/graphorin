/**
 * Type-only Zod compatibility shim. We declare a structural type for the
 * subset of `zod` we depend on so that `@graphorin/core` can be type-
 * checked without importing zod directly. Consumers that do `import {
 *   z } from 'zod'` get the real types via the user's `zod` install (the
 * peer dependency).
 *
 * @stable
 */
export interface ZodLikeSchema<TOutput = unknown, TInput = unknown> {
  parse(data: unknown): TOutput;
  safeParse(data: unknown): ZodLikeSafeParseResult<TOutput, TInput>;
  /** Internal phantom used by Zod for inference. We don't dereference it. */
  readonly _output?: TOutput;
  readonly _input?: TInput;
}

/** @stable */
export type ZodLikeSafeParseResult<TOutput, TInput> =
  | { readonly success: true; readonly data: TOutput }
  | { readonly success: false; readonly error: ZodLikeError<TInput> };

/** @stable */
export interface ZodLikeError<_TInput = unknown> {
  readonly name: string;
  readonly message: string;
  readonly issues: ReadonlyArray<{
    /**
     * `PropertyKey`, not `string | number` - zod 4 bases
     * `$ZodIssue.path` on `PropertyKey`, and this shim must be a
     * SUPERSET of both supported peer majors or the canonical
     * `tool({ inputSchema: z.object({...}) })` fails to typecheck for
     * every zod@4 consumer. Type-level widening of a produced position
     * (breaking for downstream code assigning elements to
     * `string | number`).
     */
    readonly path: ReadonlyArray<PropertyKey>;
    readonly message: string;
  }>;
}

/**
 * Validate `data` against `schema` and return a `Result` instead of
 * throwing. Use this in code paths where you want explicit
 * pattern-matching over success / failure.
 *
 * @stable
 */
export type ValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: ZodLikeError };

/**
 * Synchronous validation wrapper. Does **not** swallow errors thrown by
 * the schema's transformations - only normalizes the success / failure
 * signal.
 *
 * @stable
 */
export function validate<T>(schema: ZodLikeSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, error: result.error };
}

/**
 * Throwing variant of `validate(...)` that surfaces a `TypeError` carrying
 * a stable, parser-style message. Useful at module-boundary entry points
 * where a thrown error is the natural failure mode.
 *
 * @stable
 */
export function validateOrThrow<T>(schema: ZodLikeSchema<T>, data: unknown, what?: string): T {
  const r = validate(schema, data);
  if (r.ok) return r.value;
  // W-013: `Array.prototype.join` THROWS on symbol elements - map to
  // String first (zod 4 paths are PropertyKey-based).
  const summary = r.error.issues
    .map((i) => `${i.path.map(String).join('.') || '.'}: ${i.message}`)
    .join('; ');
  throw new TypeError(`graphorin: validation failed${what ? ` for ${what}` : ''}: ${summary}`);
}
