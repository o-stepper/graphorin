/**
 * Cooperation contract between the {@link ContextEngine} and the
 * outbound prompt-redaction middleware (D3, see ADR-045 / DEC-157)
 * + the inbound tool-result sanitization middleware (D4, see
 * RB-43 / DEC-159).
 *
 * Every {@link MessageContent} part assembled by the ContextEngine
 * carries two **independent** annotations:
 *
 * - `graphorin.content.origin` - where the content came from. Used
 *   by D3 (`withRedaction`) under `scanScope: 'untrusted'` to
 *   decide whether to re-scan a part that already passed the D2
 *   sensitivity-tier filter.
 * - `graphorin.content.inbound.trust` - what trust class the source
 *   carries. Used by D4 (`withInboundSanitization`) and by Phase 12
 *   (agent runtime) to gate the per-step preamble injection.
 *
 * Both annotations live as **span attributes only** (observability)
 * - they are never serialized to the wire payload. The wire-stable
 * `ProviderRequest` shape is unchanged by Phase 10d.
 *
 * @packageDocumentation
 */

/**
 * Span-attribute key for the origin axis.
 *
 * @stable
 */
export const CONTENT_ORIGIN_ATTR = 'graphorin.content.origin' as const;

/**
 * Span-attribute key for the inbound-trust axis.
 *
 * @stable
 */
export const INBOUND_TRUST_ATTR = 'graphorin.content.inbound.trust' as const;

/**
 * Origin discriminator for an assembled message-content part. The
 * non-ContextEngine origins (`'user:input'`, `'tool:result'`,
 * `'mcp:response'`, `'tool-call:args'`) are tagged by Phase 12
 * (agent runtime) when the corresponding payload enters
 * `session_messages`; the ContextEngine then propagates the tag
 * through the assembled message list.
 *
 * @stable
 */
export type ContentOrigin =
  | 'memory:tier-filtered'
  | 'system:framework'
  | 'agent:instructions'
  | 'skill:content'
  | 'user:input'
  | 'tool:result'
  | 'mcp:response'
  | 'tool-call:args';

/**
 * Trust-class discriminator for an assembled message-content part.
 * Sibling axis to {@link ContentOrigin}; the two are independent.
 *
 * - `'trusted'` - built-in framework tools + trusted-skill-bundled
 *   tools; D4 preamble does NOT fire on steps containing only
 *   these parts.
 * - `'user-defined'` - tools registered via `tool({...})` from user
 *   application code; D4 preamble fires.
 * - `'untrusted-skill'` - tools bundled by an untrusted skill; D4
 *   preamble fires; default policy is strip-and-wrap.
 * - `'mcp'` - every `Tool` produced by `MCPClient.toTools(...)`; D4
 *   preamble fires; default policy is strip-and-wrap.
 * - `'web-search'` - built-in `web_search` adapter; D4 preamble
 *   fires; default policy is strip-and-wrap.
 * - `'n/a'` - non-tool-result parts for which the inbound-trust
 *   axis is meaningless (`'user:input'`, `'memory:tier-filtered'`,
 *   `'system:framework'`, `'agent:instructions'`,
 *   `'tool-call:args'`).
 *
 * @stable
 */
export type InboundTrust =
  | 'trusted'
  | 'user-defined'
  | 'untrusted-skill'
  | 'mcp'
  | 'web-search'
  | 'n/a';

/**
 * Origins for which the inbound-trust axis is meaningless and is
 * always set to `'n/a'`. Surfaced as a frozen constant so consumers
 * can introspect the contract without re-implementing the rule.
 *
 * @stable
 */
export const NON_INBOUND_ORIGINS: ReadonlySet<ContentOrigin> = Object.freeze(
  new Set<ContentOrigin>([
    'memory:tier-filtered',
    'system:framework',
    'agent:instructions',
    'user:input',
    'tool-call:args',
  ]),
);

/**
 * Single typed annotation for an assembled message-content part.
 *
 * @stable
 */
export interface ContentAnnotation {
  readonly origin: ContentOrigin;
  readonly inboundTrust: InboundTrust;
}

/**
 * Build an annotation, enforcing the rule that
 * non-tool-result origins always carry `inboundTrust: 'n/a'`. A
 * caller that requests a non-`'n/a'` value for a non-inbound origin
 * is silently corrected (defense-in-depth: the rule is enforced
 * here so callers cannot accidentally violate it).
 *
 * @stable
 */
export function annotate(origin: ContentOrigin, inboundTrust: InboundTrust): ContentAnnotation {
  if (NON_INBOUND_ORIGINS.has(origin)) {
    return Object.freeze({ origin, inboundTrust: 'n/a' });
  }
  return Object.freeze({ origin, inboundTrust });
}

/**
 * Convert a {@link ContentAnnotation} to a span-attributes record
 * suitable for `AISpan.setAttributes(...)`.
 *
 * @stable
 */
export function toSpanAttributes(annotation: ContentAnnotation): Readonly<Record<string, string>> {
  return Object.freeze({
    [CONTENT_ORIGIN_ATTR]: annotation.origin,
    [INBOUND_TRUST_ATTR]: annotation.inboundTrust,
  });
}

/**
 * Decide whether the per-step inbound-sanitization preamble (D4)
 * should fire for an assembled message list. The preamble fires
 * iff at least one part carries an inbound-trust value other than
 * `'trusted'` and `'n/a'`. Trusted-only steps skip the preamble for
 * cache-friendliness; preamble is emitted exactly once per step
 * regardless of how many untrusted parts the step carries.
 *
 * @stable
 */
export function shouldFireInboundPreamble(annotations: ReadonlyArray<ContentAnnotation>): boolean {
  for (const annotation of annotations) {
    const trust = annotation.inboundTrust;
    if (trust !== 'trusted' && trust !== 'n/a') return true;
  }
  return false;
}
