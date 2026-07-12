/**
 * @graphorin/channels - vendor-neutral channel SPI and gateway
 * runtime for messenger front doors.
 *
 * The framework ships the mechanism (adapter contract, identity
 * routing, pairing policy, trust boundary, testkit); vendor adapters
 * and access rules are application-side.
 *
 * Deliberately exports no symbol named `Channel` or `ChannelKind`:
 * those names belong to the workflow state-merge primitives in
 * `@graphorin/core/channels`.
 *
 * @packageDocumentation
 */

/** Canonical version constant, derived from `package.json` at build time. */
import pkg from '../package.json' with { type: 'json' };

export const VERSION: string = pkg.version;

export {
  ChannelAccessConfigError,
  type ChannelAccessController,
  type ChannelAccessDecision,
  type ChannelAccessPolicyConfig,
  type ChannelAccessPolicyKind,
  type ChannelAllowlistEntry,
  type CreateAccessControllerOptions,
  createAccessController,
  type PairingPolicyOptions,
} from './access.js';
export {
  type SanitizationOutcome,
  type SanitizeChannelInboundOptions,
  sanitizeChannelInbound,
} from './inbound.js';
export {
  type ChannelRoute,
  ChannelRouteConfigError,
  createIdentityRouter,
  defaultSessionKey,
  type IdentityRouter,
  type IdentityRouterOptions,
  type ResolvedChannelRoute,
} from './router.js';
export {
  type ChannelAdapter,
  type ChannelAttachment,
  type ChannelCapabilities,
  ChannelDeliveryError,
  type ChannelIdentity,
  type ChannelRuntimeContext,
  type DeliveryPayload,
  type DeliveryQuestion,
  type DeliveryReceipt,
  type InboundAcceptance,
  type InboundChannelMessage,
  isChannelDeliveryError,
} from './spi.js';
