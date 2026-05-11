/**
 * Internal — normalise a freshly-built {@link Tool} into a
 * {@link ResolvedTool} carrying every non-public registration-time
 * field the dispatcher / executor reads.
 *
 * The normalisation pipeline:
 *
 *  1. Derive the trust class from the registration source.
 *  2. Apply trust-class default for `inboundSanitization` if missing.
 *  3. Apply trust-class + name default for `truncationStrategy`.
 *  4. Resolve the effective `defer_loading` flag.
 *  5. Validate `examples` against the tool's schemas.
 *  6. Validate `preferredModel` shape.
 *  7. Resolve the side-effect classification (with the v0.1 transition
 *     deferred-default + WARN-once discipline).
 *  8. Resolve the `examplesEagerlyRendered` auto-rule.
 *
 * The function is pure — no audit / counter side-effects. The
 * registry layer wraps this with its own emitter.
 *
 * @packageDocumentation
 */

import type {
  InboundSanitizationPolicy,
  ModelHint,
  ModelSpec,
  ResolvedTool,
  SideEffectClass,
  Tool,
  ToolExample,
  ToolSource,
  ToolTrustClass,
  TruncationStrategy,
  ZodLikeError,
  ZodLikeSchema,
} from '@graphorin/core';
import { MODEL_HINTS } from '@graphorin/core';

import {
  defaultInboundSanitization,
  defaultTruncationStrategy,
  resolveTrustClass,
} from '../builder/trust-class.js';
import {
  InvalidExampleError,
  InvalidPreferredModelError,
  InvalidSideEffectClassError,
} from '../errors/index.js';

const SIDE_EFFECT_CLASSES: ReadonlySet<SideEffectClass> = new Set([
  'pure',
  'read-only',
  'side-effecting',
  'external-stateful',
] as const);

/**
 * Outcome of `normaliseTool(...)`. Carries the resolved record AND
 * the WARN flags the registry layer surfaces through audit events +
 * counter increments.
 */
export interface NormaliseOutcome<TInput, TOutput, TDeps> {
  readonly resolved: ResolvedTool<TInput, TOutput, TDeps>;
  readonly warnings: ReadonlyArray<NormaliseWarning>;
  readonly deferredDefaultApplied: boolean;
}

/**
 * Discriminator for the registration-time WARN family.
 */
export type NormaliseWarning =
  | { readonly kind: 'classification:missing'; readonly toolName: string }
  | {
      readonly kind: 'classification:idempotency-key-missing';
      readonly toolName: string;
      readonly sideEffectClass: SideEffectClass;
    }
  | {
      readonly kind: 'examples:overflow';
      readonly toolName: string;
      readonly count: number;
    }
  | { readonly kind: 'result:cap-disabled'; readonly toolName: string };

/**
 * Default value cap used for tool result tokens.
 */
export const DEFAULT_MAX_RESULT_TOKENS = 16384;

/**
 * Normalise a tool registration. Throws on programming errors
 * (invalid examples, invalid `preferredModel`, invalid
 * `sideEffectClass`); collects WARN markers for the
 * conservative-default branches.
 *
 * @stable
 */
export function normaliseTool<TInput, TOutput, TDeps>(
  tool: Tool<TInput, TOutput, TDeps>,
  source: ToolSource,
): NormaliseOutcome<TInput, TOutput, TDeps> {
  const warnings: NormaliseWarning[] = [];
  const trustClass = resolveTrustClass(source);

  // Resolve inbound sanitization (operator override > trust-class default).
  const inboundSanitization: InboundSanitizationPolicy =
    tool.inboundSanitization ?? defaultInboundSanitization(trustClass);

  // Resolve truncation strategy.
  const truncationStrategy: TruncationStrategy =
    tool.truncationStrategy ?? defaultTruncationStrategy(trustClass, tool.name);

  // Resolve effective defer_loading.
  const effectiveDeferLoading = tool.defer_loading === true;

  // Validate `preferredModel` shape.
  if (tool.preferredModel !== undefined) {
    if (!isValidPreferredModel(tool.preferredModel)) {
      throw new InvalidPreferredModelError({ toolName: tool.name, value: tool.preferredModel });
    }
  }

  // Resolve `sideEffectClass` (with v0.1 transition deferred-default).
  // MCP-derived registrations get the conservative `'external-stateful'`
  // auto-default WITHOUT a WARN (the WARN is suppressed because the
  // auto-default is the documented source-of-truth on the MCP path —
  // operators downgrade per-tool via `MCPClient.toTools({ sideEffectClassByTool })`
  // in Phase 09). First-party / skill registrations missing the field
  // get the conservative `'side-effecting'` deferred-default WITH a WARN
  // so the operator sees the v0.1-transition signal.
  let sideEffectClass: SideEffectClass;
  let deferredDefaultApplied = false;
  if (tool.sideEffectClass === undefined) {
    if (source.kind === 'mcp') {
      sideEffectClass = 'external-stateful';
      deferredDefaultApplied = true;
      // No WARN emitted — MCP-default is the source-of-truth.
    } else {
      sideEffectClass = 'side-effecting';
      deferredDefaultApplied = true;
      warnings.push({ kind: 'classification:missing', toolName: tool.name });
    }
  } else if (!SIDE_EFFECT_CLASSES.has(tool.sideEffectClass)) {
    throw new InvalidSideEffectClassError({ toolName: tool.name, value: tool.sideEffectClass });
  } else {
    sideEffectClass = tool.sideEffectClass;
  }

  const hasIdempotencyKey = typeof tool.idempotencyKey === 'function';
  if (
    !hasIdempotencyKey &&
    (sideEffectClass === 'side-effecting' || sideEffectClass === 'external-stateful')
  ) {
    warnings.push({
      kind: 'classification:idempotency-key-missing',
      toolName: tool.name,
      sideEffectClass,
    });
  }

  // Validate `examples` against the tool's schemas.
  if (tool.examples !== undefined) {
    validateExamples(tool.name, tool.examples, tool.inputSchema, tool.outputSchema);
    if (tool.examples.length > 5) {
      warnings.push({
        kind: 'examples:overflow',
        toolName: tool.name,
        count: tool.examples.length,
      });
    }
  }

  // Resolve `examplesEagerlyRendered` auto-rule.
  let examplesEagerlyRendered: boolean | undefined;
  if (tool.examplesEagerlyRendered !== undefined) {
    examplesEagerlyRendered = tool.examplesEagerlyRendered;
  } else if (tool.defer_loading === true) {
    examplesEagerlyRendered = false;
  } else if (tool.defer_loading === false) {
    examplesEagerlyRendered = true;
  }
  // else: leave undefined; agent runtime decides at assembly time.

  // Resolve `maxResultTokens` (with WARN on disabled cap).
  const maxResultTokens =
    tool.maxResultTokens === undefined ? DEFAULT_MAX_RESULT_TOKENS : tool.maxResultTokens;
  if (maxResultTokens === 0) {
    warnings.push({ kind: 'result:cap-disabled', toolName: tool.name });
  }

  const resolved = Object.freeze({
    ...tool,
    inboundSanitization,
    truncationStrategy,
    maxResultTokens,
    ...(examplesEagerlyRendered !== undefined ? { examplesEagerlyRendered } : {}),
    sideEffectClass,
    __trustClass: trustClass,
    __source: source,
    __effectiveDeferLoading: effectiveDeferLoading,
    __sideEffectClass: sideEffectClass,
    __hasIdempotencyKey: hasIdempotencyKey,
    __streamingHint: tool.streamingHint === true,
    __exampleCount: tool.examples?.length ?? 0,
    ...(tool.preferredModel !== undefined ? { __preferredModel: tool.preferredModel } : {}),
  }) as ResolvedTool<TInput, TOutput, TDeps>;

  // Mutating the literal type back to `ToolTrustClass` after the
  // freeze keeps the runtime shape consistent with the type contract;
  // the cast above is intentionally narrow.
  void (trustClass satisfies ToolTrustClass);

  return { resolved, warnings, deferredDefaultApplied };
}

function isValidPreferredModel(value: unknown): value is ModelHint | ModelSpec {
  if (typeof value === 'string' && (MODEL_HINTS as ReadonlyArray<string>).includes(value)) {
    return true;
  }
  if (typeof value !== 'object' || value === null) return false;
  // ModelSpec | ProviderLike. Both shapes carry a `name` (provider) +
  // `modelId` (provider) at minimum; the wrapper shape adds `provider` +
  // `model`.
  if ('provider' in value && 'model' in value) {
    const provider = (value as { provider: unknown }).provider;
    const model = (value as { model: unknown }).model;
    if (typeof model !== 'string') return false;
    return isProviderLike(provider);
  }
  return isProviderLike(value);
}

function isProviderLike(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { name?: unknown }).name === 'string' &&
    typeof (value as { modelId?: unknown }).modelId === 'string'
  );
}

function validateExamples<TInput, TOutput>(
  toolName: string,
  examples: ReadonlyArray<ToolExample<TInput, TOutput>>,
  inputSchema: ZodLikeSchema<TInput>,
  outputSchema: ZodLikeSchema<TOutput> | undefined,
): void {
  examples.forEach((example, exampleIndex) => {
    const inputResult = inputSchema.safeParse(example.input);
    if (!inputResult.success) {
      throw new InvalidExampleError({
        toolName,
        exampleIndex,
        field: 'input',
        validationError: inputResult.error satisfies ZodLikeError,
      });
    }
    if (outputSchema !== undefined) {
      const outputCandidate = isToolReturn(example.output)
        ? (example.output.output as TOutput)
        : (example.output as TOutput);
      const outputResult = outputSchema.safeParse(outputCandidate);
      if (!outputResult.success) {
        throw new InvalidExampleError({
          toolName,
          exampleIndex,
          field: 'output',
          validationError: outputResult.error satisfies ZodLikeError,
        });
      }
    }
  });
}

function isToolReturn(value: unknown): value is { readonly output: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'output' in value &&
    Object.hasOwn(value, 'output')
  );
}
