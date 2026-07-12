/**
 * Inbound sanitization for channel text: the channel-side wrapper
 * over the shared `applyInboundSanitization` pass from
 * `@graphorin/tools/inbound`, pinned to the `'channel-inbound'`
 * trust class.
 *
 * The gateway runs every inbound message through this BEFORE routing
 * and before the text reaches any agent: chat-template tokens are
 * stripped, imperative injection patterns are stripped, and the
 * remainder is wrapped in the untrusted-content envelope so the
 * model sees the provenance.
 *
 * @packageDocumentation
 */

import type { InboundSanitizationPolicy } from '@graphorin/core';
import { applyInboundSanitization, type SanitizationOutcome } from '@graphorin/tools/inbound';

export type { SanitizationOutcome } from '@graphorin/tools/inbound';

/** Options for {@link sanitizeChannelInbound}. @stable */
export interface SanitizeChannelInboundOptions {
  /** Channel id recorded as the content origin on audit rows. */
  readonly channelId: string;
  /**
   * Override the sanitization policy. Default
   * `'detect-and-strip-and-wrap'` - the same default every other
   * untrusted trust class gets.
   */
  readonly policy?: InboundSanitizationPolicy;
  /** Per-message scan budget in milliseconds (ReDoS ceiling). */
  readonly budgetMs?: number;
}

/**
 * Sanitize one inbound channel message body. Thin wrapper over
 * `applyInboundSanitization` with `trustClass: 'channel-inbound'`;
 * exists so every gateway (and adapter test) applies the identical
 * boundary with one call.
 *
 * @stable
 */
export function sanitizeChannelInbound(
  body: string,
  options: SanitizeChannelInboundOptions,
): SanitizationOutcome {
  return applyInboundSanitization({
    body,
    policy: options.policy ?? 'detect-and-strip-and-wrap',
    trustClass: 'channel-inbound',
    toolName: `channel:${options.channelId}`,
    contentOrigin: `channel:${options.channelId}`,
    ...(options.budgetMs !== undefined ? { budgetMs: options.budgetMs } : {}),
  });
}
