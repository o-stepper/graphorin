/**
 * `withRedaction` - outbound prompt-redaction middleware. Innermost
 * layer in the canonical order: it runs after every other middleware
 * has shaped the request and immediately before the underlying
 * provider call. The middleware:
 *
 * 1. Walks every text-bearing field of `ProviderRequest` (system /
 *    user / assistant / tool messages, tool-call args, vendor-prefixed
 *    `cache_control` spans).
 * 2. Detects `SecretValue`-shaped instances (cross-realm safe via
 *    `Symbol.for('graphorin.SecretValue')`).
 * 3. Runs the configured pattern catalogue (defaults to the 14 built-in
 *    patterns shared with the OTLP `RedactionValidator`).
 * 4. Applies the configured action (`'redact'` in-place by default;
 *    `'throw'` for `failClosed: true` deployments).
 * 5. Strips Anthropic-shape `cache_control` markers from any span
 *    that hit a pattern (default `stripCacheControlOnHit: true`).
 * 6. Emits one counter increment per detection plus a sanitised audit
 *    record (audit emission is delegated to the consumer via
 *    `onViolation`).
 * 7. Optionally scans streamed `text-delta` chunks for the same
 *    patterns - observability-only in v0.1, no stream mutation.
 *
 * @packageDocumentation
 */

import type {
  AssistantMessage,
  LocalProviderTrust,
  Message,
  Provider,
  ProviderEvent,
  ProviderRequest,
  ProviderResponse,
  Sensitivity,
  ToolMessage,
  UserMessage,
} from '@graphorin/core';
import { SECRET_VALUE_BRAND } from '@graphorin/core';
import {
  BUILT_IN_PATTERNS,
  type RedactionPattern,
} from '@graphorin/observability/redaction/patterns';
import { PromptRedactionError } from '../errors/errors.js';
import { defineProviderMiddleware } from './compose.js';

/**
 * Range of fields scanned by the middleware.
 *
 * @stable
 */
export type PromptRedactionScanScope = 'all' | 'untrusted' | 'secret-value-only';

/**
 * Sanitized record handed to `onViolation`. Carries metadata only;
 * never the matched value.
 *
 * @stable
 */
export interface PromptRedactionViolation {
  readonly patternName: string;
  readonly fieldPath: string;
  readonly role?: string;
  readonly matchLength: number;
  readonly trustClass?: LocalProviderTrust;
  readonly action: 'redact' | 'throw' | 'block-and-prompt-user';
}

/**
 * Mutable per-request scrubbing context. Tracks whether any pattern
 * matched so the post-scrub `cache_control` strip can decide whether
 * to fire.
 *
 * @internal
 */
interface ScrubContext {
  hits: number;
  cacheControlHits: number;
}

/**
 * Full prompt-redaction policy.
 *
 * @stable
 */
export interface PromptRedactionPolicy {
  /** Pattern catalogue. Defaults to the 14 built-in patterns. */
  readonly patterns?: ReadonlyArray<RedactionPattern>;
  /** Action on detection. Defaults to `'redact'`. */
  readonly action?: 'redact' | 'throw' | 'block-and-prompt-user';
  /** Throw on the first hit instead of redacting in-place. */
  readonly failClosed?: boolean;
  /** Range of fields scanned. Defaults to `'all'`. */
  readonly scanScope?: PromptRedactionScanScope;
  /** Detect `SecretValue` instances anywhere in the request. */
  readonly detectSecretValue?: boolean;
  /** Strip Anthropic-shape `cache_control` markers on hit. */
  readonly stripCacheControlOnHit?: boolean;
  /** Per-trust-class override block. */
  readonly byTrustClass?: Partial<Record<LocalProviderTrust, Partial<PromptRedactionPolicy>>>;
  /** Sanitised violation hook (audit emission lives downstream). */
  readonly onViolation?: (violation: PromptRedactionViolation) => void;
  /** Optional logger override. Defaults to `console.warn`. */
  readonly logger?: (message: string, meta?: object) => void;
  /** Test hook - synthetic trust class. */
  readonly trustClassOverride?: LocalProviderTrust;
}

const TRUST_CLASS_DEFAULTS: Readonly<Record<LocalProviderTrust, Partial<PromptRedactionPolicy>>> =
  Object.freeze({
    loopback: { scanScope: 'secret-value-only' },
    private: { scanScope: 'all', failClosed: false },
    'public-tls': { scanScope: 'all', failClosed: false },
    'public-cleartext': {},
  });

/**
 * @stable
 */
export const withRedaction = defineProviderMiddleware<PromptRedactionPolicy>({
  kind: 'withRedaction',
  factory: (rawPolicy: PromptRedactionPolicy) => {
    const baseLogger = rawPolicy.logger ?? defaultLogger;
    return (next: Provider): Provider => {
      const trustClass = rawPolicy.trustClassOverride ?? inferTrustClass(next.acceptsSensitivity);
      const policy = effectivePolicy(rawPolicy, trustClass);
      return {
        name: next.name,
        modelId: next.modelId,
        capabilities: next.capabilities,
        ...(next.acceptsSensitivity !== undefined
          ? { acceptsSensitivity: next.acceptsSensitivity }
          : {}),
        stream(req) {
          const scrubbed = scrubRequest(req, policy, trustClass, baseLogger);
          return scanStreamingResponse(next.stream(scrubbed), policy, baseLogger);
        },
        async generate(req) {
          const scrubbed = scrubRequest(req, policy, trustClass, baseLogger);
          return next.generate(scrubbed);
        },
        ...(next.countTokens ? { countTokens: next.countTokens.bind(next) } : {}),
      };
    };
  },
});

function effectivePolicy(
  raw: PromptRedactionPolicy,
  trustClass: LocalProviderTrust | undefined,
): RequiredPolicy {
  const tierDefaults = trustClass !== undefined ? TRUST_CLASS_DEFAULTS[trustClass] : {};
  const explicitOverride = trustClass !== undefined ? (raw.byTrustClass?.[trustClass] ?? {}) : {};
  const merged: RequiredPolicy = {
    patterns: ensureGlobalPatterns(
      raw.patterns ?? explicitOverride.patterns ?? tierDefaults.patterns ?? BUILT_IN_PATTERNS,
    ),
    action: raw.action ?? explicitOverride.action ?? tierDefaults.action ?? 'redact',
    failClosed: pick(raw.failClosed, explicitOverride.failClosed, tierDefaults.failClosed, false),
    scanScope: raw.scanScope ?? explicitOverride.scanScope ?? tierDefaults.scanScope ?? 'all',
    detectSecretValue: pick(
      raw.detectSecretValue,
      explicitOverride.detectSecretValue,
      tierDefaults.detectSecretValue,
      true,
    ),
    stripCacheControlOnHit: pick(
      raw.stripCacheControlOnHit,
      explicitOverride.stripCacheControlOnHit,
      tierDefaults.stripCacheControlOnHit,
      true,
    ),
    onViolation: raw.onViolation,
  };
  if (raw.failClosed === true || explicitOverride.failClosed === true) {
    merged.action = 'throw';
  }
  return merged;
}

/**
 * Callers can supply a pattern without the global flag. `.replace` /
 * `.match` then stop after the FIRST occurrence, so a second secret on the same
 * line is neither redacted nor counted. Re-compile every non-global pattern
 * with the `g` flag so all occurrences are covered. The 14 built-ins already
 * carry `/g`; this only rescues user-supplied patterns (identity otherwise).
 */
function ensureGlobalPatterns(
  patterns: ReadonlyArray<RedactionPattern>,
): ReadonlyArray<RedactionPattern> {
  let changed = false;
  const out = patterns.map((p) => {
    if (p.regex.global) return p;
    changed = true;
    return { ...p, regex: new RegExp(p.regex.source, `${p.regex.flags}g`) };
  });
  return changed ? out : patterns;
}

function pick<T>(...values: ReadonlyArray<T | undefined>): T {
  for (const v of values) {
    if (v !== undefined) return v as T;
  }
  // The last argument acts as the default and is always defined per
  // the call sites above.
  return values[values.length - 1] as T;
}

interface RequiredPolicy {
  patterns: ReadonlyArray<RedactionPattern>;
  action: 'redact' | 'throw' | 'block-and-prompt-user';
  failClosed: boolean;
  scanScope: PromptRedactionScanScope;
  detectSecretValue: boolean;
  stripCacheControlOnHit: boolean;
  onViolation: ((violation: PromptRedactionViolation) => void) | undefined;
}

function scrubRequest(
  req: ProviderRequest,
  policy: RequiredPolicy,
  trustClass: LocalProviderTrust | undefined,
  logger: (message: string, meta?: object) => void,
): ProviderRequest {
  const ctx: ScrubContext = { hits: 0, cacheControlHits: 0 };
  const messages = req.messages.map((msg, i) =>
    scrubMessage(msg, policy, trustClass, `messages[${i}]`, ctx, logger),
  );
  const systemMessage =
    req.systemMessage !== undefined
      ? scrubText(req.systemMessage, 'system', 'systemMessage', policy, trustClass, ctx, logger)
      : undefined;
  let providerOptions = scrubProviderOptions(req.providerOptions, policy, trustClass, ctx, logger);
  if (
    policy.stripCacheControlOnHit &&
    ctx.hits > 0 &&
    providerOptions !== undefined &&
    hasAnthropicCacheControl(providerOptions)
  ) {
    providerOptions = stripAnthropicCacheControl(providerOptions);
    reportViolation(
      policy,
      {
        patternName: 'anthropic-cache-control-stripped',
        fieldPath: 'providerOptions.anthropic.cache_control',
        matchLength: 0,
        ...(trustClass !== undefined ? { trustClass } : {}),
        action: 'redact',
      },
      logger,
    );
    ctx.cacheControlHits++;
  }
  return {
    ...req,
    messages,
    ...(systemMessage !== undefined ? { systemMessage } : {}),
    ...(providerOptions !== undefined ? { providerOptions } : {}),
  };
}

function hasAnthropicCacheControl(providerOptions: Record<string, unknown>): boolean {
  const anthropic = providerOptions.anthropic;
  if (anthropic === null || typeof anthropic !== 'object') return false;
  return 'cache_control' in (anthropic as Record<string, unknown>);
}

function stripAnthropicCacheControl(
  providerOptions: Record<string, unknown>,
): Record<string, unknown> {
  const anthropic = providerOptions.anthropic;
  if (anthropic === null || typeof anthropic !== 'object') return providerOptions;
  const { cache_control: _drop, ...rest } = anthropic as Record<string, unknown>;
  void _drop;
  return { ...providerOptions, anthropic: rest };
}

function scrubMessage(
  msg: Message,
  policy: RequiredPolicy,
  trustClass: LocalProviderTrust | undefined,
  fieldPrefix: string,
  ctx: ScrubContext,
  logger: (message: string, meta?: object) => void,
): Message {
  if (policy.scanScope === 'secret-value-only') {
    detectSecretValuesIn(msg, policy, trustClass, fieldPrefix, ctx, logger);
    return msg;
  }
  if (policy.scanScope === 'untrusted' && msg.role === 'system') {
    detectSecretValuesIn(msg, policy, trustClass, fieldPrefix, ctx, logger);
    return msg;
  }
  switch (msg.role) {
    case 'system':
      return {
        role: 'system',
        content: scrubText(
          msg.content,
          'system',
          `${fieldPrefix}.content`,
          policy,
          trustClass,
          ctx,
          logger,
        ),
      };
    case 'user':
      return scrubUserMessage(msg, policy, trustClass, fieldPrefix, ctx, logger);
    case 'assistant':
      return scrubAssistantMessage(msg, policy, trustClass, fieldPrefix, ctx, logger);
    case 'tool':
      return scrubToolMessage(msg, policy, trustClass, fieldPrefix, ctx, logger);
    default:
      return msg;
  }
}

function scrubUserMessage(
  msg: UserMessage,
  policy: RequiredPolicy,
  trustClass: LocalProviderTrust | undefined,
  fieldPrefix: string,
  ctx: ScrubContext,
  logger: (message: string, meta?: object) => void,
): UserMessage {
  const next: UserMessage = {
    role: 'user',
    content: scrubContent(
      msg.content,
      'user',
      `${fieldPrefix}.content`,
      policy,
      trustClass,
      ctx,
      logger,
    ) as UserMessage['content'],
    ...(msg.userId !== undefined ? { userId: msg.userId } : {}),
  };
  return next;
}

function scrubAssistantMessage(
  msg: AssistantMessage,
  policy: RequiredPolicy,
  trustClass: LocalProviderTrust | undefined,
  fieldPrefix: string,
  ctx: ScrubContext,
  logger: (message: string, meta?: object) => void,
): AssistantMessage {
  const next: AssistantMessage = {
    role: 'assistant',
    content: scrubContent(
      msg.content,
      'assistant',
      `${fieldPrefix}.content`,
      policy,
      trustClass,
      ctx,
      logger,
    ) as AssistantMessage['content'],
    ...(msg.agentId !== undefined ? { agentId: msg.agentId } : {}),
  };
  if (msg.toolCalls !== undefined) {
    (next as { toolCalls?: AssistantMessage['toolCalls'] }).toolCalls = msg.toolCalls.map(
      (tc, idx) => ({
        ...tc,
        args: scrubAny(
          tc.args,
          'assistant',
          `${fieldPrefix}.toolCalls[${idx}].args`,
          policy,
          trustClass,
          ctx,
          logger,
        ),
      }),
    );
  }
  return next;
}

function scrubToolMessage(
  msg: ToolMessage,
  policy: RequiredPolicy,
  trustClass: LocalProviderTrust | undefined,
  fieldPrefix: string,
  ctx: ScrubContext,
  logger: (message: string, meta?: object) => void,
): ToolMessage {
  return {
    role: 'tool',
    toolCallId: msg.toolCallId,
    content: scrubContent(
      msg.content,
      'tool',
      `${fieldPrefix}.content`,
      policy,
      trustClass,
      ctx,
      logger,
    ) as ToolMessage['content'],
  };
}

function scrubContent(
  content: string | ReadonlyArray<unknown>,
  role: string,
  fieldPath: string,
  policy: RequiredPolicy,
  trustClass: LocalProviderTrust | undefined,
  ctx: ScrubContext,
  logger: (message: string, meta?: object) => void,
): string | ReadonlyArray<unknown> {
  if (typeof content === 'string') {
    return scrubText(content, role, fieldPath, policy, trustClass, ctx, logger);
  }
  return content.map((part, idx) => {
    if (typeof part === 'string') {
      return scrubText(part, role, `${fieldPath}[${idx}]`, policy, trustClass, ctx, logger);
    }
    if (part === null || typeof part !== 'object') return part;
    const partWithType = part as { type?: string; text?: string };
    if (partWithType.type === 'text' && typeof partWithType.text === 'string') {
      return {
        ...part,
        text: scrubText(
          partWithType.text,
          role,
          `${fieldPath}[${idx}].text`,
          policy,
          trustClass,
          ctx,
          logger,
        ),
      };
    }
    if (partWithType.type === 'reasoning' && typeof partWithType.text === 'string') {
      return {
        ...part,
        text: scrubText(
          partWithType.text,
          role,
          `${fieldPath}[${idx}].text`,
          policy,
          trustClass,
          ctx,
          logger,
        ),
      };
    }
    return part;
  });
}

function scrubText(
  text: string,
  role: string,
  fieldPath: string,
  policy: RequiredPolicy,
  trustClass: LocalProviderTrust | undefined,
  ctx: ScrubContext,
  logger: (message: string, meta?: object) => void,
): string {
  let scrubbed = text;
  for (const pattern of policy.patterns) {
    // Single pass per pattern: mask every match the per-pattern `verify`
    // predicate accepts (no predicate = accept all). Rejected look-alikes
    // (e.g. Luhn-invalid digit runs hitting the `creditcard` regex) stay
    // byte-identical, mirroring the OTLP validator's RP-21 semantics.
    const mask = pattern.mask ?? `[REDACTED ${pattern.name}]`;
    const verify = pattern.verify;
    let matchLength = 0;
    let accepted = 0;
    pattern.regex.lastIndex = 0;
    const rewritten = scrubbed.replace(pattern.regex, (m) => {
      if (verify !== undefined && !verify(m)) return m;
      accepted += 1;
      matchLength += m.length;
      return mask;
    });
    if (accepted === 0) continue;
    ctx.hits++;
    reportViolation(
      policy,
      {
        patternName: pattern.name,
        fieldPath,
        role,
        matchLength,
        ...(trustClass !== undefined ? { trustClass } : {}),
        action: policy.action,
      },
      logger,
    );
    if (policy.action === 'throw' || policy.failClosed) {
      throw new PromptRedactionError({
        patternName: pattern.name,
        fieldPath,
        ...(role !== undefined ? { role } : {}),
      });
    }
    scrubbed = rewritten;
  }
  return scrubbed;
}

function scrubAny(
  value: unknown,
  role: string,
  fieldPath: string,
  policy: RequiredPolicy,
  trustClass: LocalProviderTrust | undefined,
  ctx: ScrubContext,
  logger: (message: string, meta?: object) => void,
): unknown {
  if (typeof value === 'string') {
    return scrubText(value, role, fieldPath, policy, trustClass, ctx, logger);
  }
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item, idx) =>
      scrubAny(item, role, `${fieldPath}[${idx}]`, policy, trustClass, ctx, logger),
    );
  }
  if (typeof value === 'object') {
    if (policy.detectSecretValue && isSecretValue(value)) {
      ctx.hits++;
      reportViolation(
        policy,
        {
          patternName: 'graphorin-secret-value',
          fieldPath,
          role,
          matchLength: 0,
          ...(trustClass !== undefined ? { trustClass } : {}),
          action: policy.action,
        },
        logger,
      );
      return '[REDACTED graphorin-secret-value]';
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = scrubAny(v, role, `${fieldPath}.${k}`, policy, trustClass, ctx, logger);
    }
    return out;
  }
  return value;
}

function scrubProviderOptions(
  providerOptions: Readonly<Record<string, unknown>> | undefined,
  policy: RequiredPolicy,
  trustClass: LocalProviderTrust | undefined,
  ctx: ScrubContext,
  logger: (message: string, meta?: object) => void,
): Record<string, unknown> | undefined {
  if (providerOptions === undefined) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(providerOptions)) {
    out[k] = scrubAny(
      v,
      'provider-options',
      `providerOptions.${k}`,
      policy,
      trustClass,
      ctx,
      logger,
    );
  }
  return out;
}

function detectSecretValuesIn(
  msg: Message,
  policy: RequiredPolicy,
  trustClass: LocalProviderTrust | undefined,
  fieldPrefix: string,
  ctx: ScrubContext,
  logger: (message: string, meta?: object) => void,
): void {
  if (!policy.detectSecretValue) return;
  scrubAny(msg, msg.role, fieldPrefix, policy, trustClass, ctx, logger);
}

function reportViolation(
  policy: RequiredPolicy,
  violation: PromptRedactionViolation,
  logger: (message: string, meta?: object) => void,
): void {
  policy.onViolation?.(violation);
  logger(
    `[graphorin/provider] withRedaction hit '${violation.patternName}' at '${violation.fieldPath}' (action: ${violation.action})`,
    {
      patternName: violation.patternName,
      fieldPath: violation.fieldPath,
      role: violation.role,
      matchLength: violation.matchLength,
      trustClass: violation.trustClass,
    },
  );
}

function isSecretValue(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false;
  return (value as Record<string | symbol, unknown>)[SECRET_VALUE_BRAND] === true;
}

function inferTrustClass(
  acceptsSensitivity: ReadonlyArray<Sensitivity> | undefined,
): LocalProviderTrust | undefined {
  if (acceptsSensitivity === undefined) return undefined;
  const set = new Set<Sensitivity>(acceptsSensitivity);
  if (set.has('secret')) return 'loopback';
  if (set.has('internal')) return 'private';
  if (set.has('public')) return 'public-tls';
  return undefined;
}

async function* scanStreamingResponse(
  source: AsyncIterable<ProviderEvent>,
  policy: RequiredPolicy,
  logger: (message: string, meta?: object) => void,
): AsyncIterable<ProviderEvent> {
  // PS-22: secrets can straddle text-delta boundaries. Keep a bounded tail of
  // recently-streamed text and scan `tail + delta`, reporting only matches that
  // reach into the freshly-arrived delta so a prior window's matches are not
  // double-counted. The tail is capped (no unbounded accumulation); a single
  // match longer than the cap can still slip a boundary (best-effort).
  const TAIL_WINDOW = 512;
  let tail = '';
  for await (const event of source) {
    if (event.type === 'text-delta' && policy.scanScope === 'all') {
      // Observability-only - match patterns and emit synthetic violation rows;
      // do NOT mutate the stream content (mid-stream mutation would break
      // structured-output / tool-call parsing).
      const haystack = tail + event.delta;
      for (const pattern of policy.patterns) {
        pattern.regex.lastIndex = 0;
        let newMatchLength = 0;
        let match = pattern.regex.exec(haystack);
        while (match !== null) {
          const endIndex = match.index + match[0].length;
          // A match wholly inside `tail` was reported on the prior delta.
          // Per-pattern `verify` applies here too, so a rejected look-alike
          // (Luhn-invalid digit run, …) does not emit a violation row.
          if (
            match[0].length > 0 &&
            endIndex > tail.length &&
            (pattern.verify === undefined || pattern.verify(match[0]))
          ) {
            newMatchLength += match[0].length;
          }
          if (!pattern.regex.global) break;
          if (match[0].length === 0) pattern.regex.lastIndex += 1;
          match = pattern.regex.exec(haystack);
        }
        if (newMatchLength > 0) {
          reportViolation(
            policy,
            {
              patternName: pattern.name,
              fieldPath: 'response.text-delta',
              role: 'assistant',
              matchLength: newMatchLength,
              action: 'redact',
            },
            logger,
          );
        }
      }
      tail =
        haystack.length > TAIL_WINDOW ? haystack.slice(haystack.length - TAIL_WINDOW) : haystack;
    }
    yield event;
  }
}

function defaultLogger(message: string, meta?: object): void {
  if (meta !== undefined) console.warn(message, meta);
  else console.warn(message);
}

// Re-export to silence "declared but unused" lints for downstream
// consumers that import only the types.
export type _RedactionResponseGuard = ProviderResponse;
