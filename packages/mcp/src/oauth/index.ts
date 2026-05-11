/**
 * OAuth integration surface for `@graphorin/mcp`.
 *
 * @packageDocumentation
 */

export {
  createOAuthAuthorizationProvider,
  type OAuthAuthorizationProvider,
  type OAuthAuthorizationProviderOptions,
} from './bridge.js';
export {
  mcpAuthListSessions,
  mcpAuthLogin,
  mcpAuthRefresh,
  mcpAuthRevoke,
  mcpAuthStatus,
} from './library.js';
