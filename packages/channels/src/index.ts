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
