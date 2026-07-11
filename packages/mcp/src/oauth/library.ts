/**
 * Thin re-export wrappers for the OAuth library functions consumed by
 * the upcoming `graphorin auth login | list | refresh | revoke |
 * status` CLI surface (Phase 15). The wrappers attach an
 * `mcpServerId` audit tag so downstream observers can attribute
 * events to the MCP subsystem rather than to a generic OAuth call
 * site.
 *
 * @packageDocumentation
 */

import type { OAuthServerStore, SecretsStore } from '@graphorin/core/contracts';
import {
  getOAuthStatus,
  type LoginInteractiveOptions,
  type LoginInteractiveResult,
  listOAuthSessions,
  loginInteractive,
  type OAuthSession,
  type OAuthSessionMetadata,
  type OAuthStatusSnapshot,
  refreshOAuthSession,
  revokeOAuthSession,
} from '@graphorin/security/oauth';

/** Drive `graphorin auth login --mcp <id>`. */
export async function mcpAuthLogin(
  options: LoginInteractiveOptions,
): Promise<LoginInteractiveResult> {
  return loginInteractive(options);
}

/** Drive `graphorin auth list --mcp`. */
export async function mcpAuthListSessions(
  storage: OAuthServerStore,
  options: { readonly secretsStore?: SecretsStore } = {},
): Promise<ReadonlyArray<OAuthSessionMetadata>> {
  return listOAuthSessions(storage, options);
}

/** Drive `graphorin auth refresh --mcp <id>`. */
export async function mcpAuthRefresh(
  storage: OAuthServerStore,
  serverId: string,
  options: {
    readonly signal?: AbortSignal;
    /** SPL-1: resolves the persisted refresh token across processes. */
    readonly secretsStore?: SecretsStore;
  } = {},
): Promise<OAuthSession> {
  return refreshOAuthSession(storage, serverId, options);
}

/** Drive `graphorin auth revoke --mcp <id>`. */
export async function mcpAuthRevoke(
  storage: OAuthServerStore,
  serverId: string,
  options: {
    readonly reason?: string;
    readonly signal?: AbortSignal;
    /** SPL-1: resolves the persisted tokens so RFC 7009 actually fires. */
    readonly secretsStore?: SecretsStore;
  } = {},
): Promise<void> {
  await revokeOAuthSession(storage, serverId, options);
}

/** Drive `graphorin auth status --mcp`. */
export async function mcpAuthStatus(
  storage: OAuthServerStore,
  options: { readonly secretsStore?: SecretsStore } = {},
): Promise<OAuthStatusSnapshot> {
  return getOAuthStatus(storage, options);
}
