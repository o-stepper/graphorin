/**
 * `graphorin auth` - outbound OAuth subsystem (e.g. for MCP servers).
 *
 * Surface (per Phase 15 § Auth):
 *
 *  - `graphorin auth login --server <url> [--device-flow]`
 *  - `graphorin auth list`
 *  - `graphorin auth refresh <id>`
 *  - `graphorin auth revoke <id>`
 *  - `graphorin auth status`
 *
 * Honours `GRAPHORIN_OFFLINE=1` - when set, every subcommand short-
 * circuits with an explanatory message and exits `1` so CI pipelines
 * see the failure.
 *
 * @packageDocumentation
 */

import {
  getOAuthStatus,
  type LoginInteractiveResult,
  listOAuthSessions,
  loginInteractive,
  refreshOAuthSession,
  revokeOAuthSession,
} from '@graphorin/security';
import { createSecretsStore, getActiveSecretsStore } from '@graphorin/security/secrets';
import { EXIT_CODES } from '../internal/exit.js';
import { checkOfflineModeBlocked } from '../internal/offline.js';
import {
  brand,
  type CommonOutputOptions,
  defaultPrintSink,
  emitReport,
  statusMarker,
} from '../internal/output.js';
import { openStoreContext } from '../internal/store-context.js';

/**
 * Resolve the CLI's secrets store for OAuth token persistence:
 * the already-active store when one exists, else the default auto
 * chain (keyring → encrypted-file → env). Best-effort - a store
 * failure degrades to the in-memory-only legacy behavior instead of
 * blocking the auth command.
 */
async function resolveAuthSecretsStore(): Promise<
  import('@graphorin/core/contracts').SecretsStore | undefined
> {
  try {
    return getActiveSecretsStore() ?? (await createSecretsStore({}));
  } catch {
    return undefined;
  }
}

/** @stable */
export interface AuthCommonOptions extends CommonOutputOptions {
  readonly config?: string;
}

/** @stable */
export interface AuthLoginOptions extends AuthCommonOptions {
  readonly serverUrl: string;
  readonly serverId?: string;
  readonly scope?: string;
  readonly deviceFlow?: boolean;
  /**
   * Optional pre-existing client identifier - skips Dynamic Client
   * Registration when supplied.
   */
  readonly clientId?: string;
}

/** @stable */
export async function runAuthLogin(options: AuthLoginOptions): Promise<LoginInteractiveResult> {
  if (
    !checkOfflineModeBlocked('auth login', {
      ...(options.print !== undefined ? { print: options.print } : {}),
    })
  ) {
    process.exit(EXIT_CODES.RECOVERABLE_FAILURE);
  }
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const serverId = options.serverId ?? deriveServerId(options.serverUrl);
    const secretsStore = await resolveAuthSecretsStore();
    const result = await loginInteractive({
      serverId,
      serverUrl: options.serverUrl,
      storage: ctx.store.oauthServers,
      ...(secretsStore === undefined ? {} : { secretsStore }),
      ...(options.deviceFlow !== undefined ? { deviceFlow: options.deviceFlow } : {}),
      ...(options.scope !== undefined ? { scope: options.scope } : {}),
      ...(options.clientId !== undefined ? { clientId: options.clientId } : {}),
    });
    emitReport(options, result.status, () => {
      const print = options.print ?? defaultPrintSink;
      print(brand(`oauth login ${statusMarker('ok')} (server=${result.status.serverId})`));
      print(`  status: ${result.status.status}`);
      print(`  expiresAt: ${result.status.expiresAt ?? '-'}`);
    });
    return result;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface AuthListOptions extends AuthCommonOptions {}

/** @stable */
export async function runAuthList(options: AuthListOptions = {}) {
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const secretsStore = await resolveAuthSecretsStore();
    const list = await listOAuthSessions(ctx.store.oauthServers, {
      ...(secretsStore === undefined ? {} : { secretsStore }),
    });
    emitReport(options, list, () => {
      const print = options.print ?? defaultPrintSink;
      if (list.length === 0) {
        print(brand('no OAuth sessions persisted.'));
        return;
      }
      print(brand(`${list.length} OAuth session(s):`));
      for (const s of list) {
        const mark = s.status === 'expired' ? statusMarker('warn') : statusMarker('ok');
        print(`  ${mark} ${s.serverId} (status=${s.status}, scope=${s.scope ?? '-'})`);
      }
    });
    return list;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface AuthRefreshOptions extends AuthCommonOptions {
  readonly id: string;
}

/** @stable */
export async function runAuthRefresh(options: AuthRefreshOptions) {
  if (
    !checkOfflineModeBlocked('auth refresh', {
      ...(options.print !== undefined ? { print: options.print } : {}),
    })
  ) {
    process.exit(EXIT_CODES.RECOVERABLE_FAILURE);
  }
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const secretsStore = await resolveAuthSecretsStore();
    const session = await refreshOAuthSession(ctx.store.oauthServers, options.id, {
      ...(secretsStore === undefined ? {} : { secretsStore }),
    });
    emitReport(options, { ok: true, id: options.id }, () => {
      const print = options.print ?? defaultPrintSink;
      print(
        brand(
          `oauth session '${options.id}' refreshed (expiresAt=${new Date(session.expiresAt ?? Date.now()).toISOString()})`,
        ),
      );
    });
    return session;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface AuthRevokeOptions extends AuthCommonOptions {
  readonly id: string;
  readonly reason?: string;
}

/** @stable */
export async function runAuthRevoke(options: AuthRevokeOptions): Promise<{ readonly ok: true }> {
  // AUTH-CLI-01: revoke makes an outbound RFC 7009 call, so it must honour
  // GRAPHORIN_OFFLINE like login/refresh (the documented "no implicit network
  // calls" contract) instead of silently POSTing the live token.
  if (
    !checkOfflineModeBlocked('auth revoke', {
      ...(options.print !== undefined ? { print: options.print } : {}),
    })
  ) {
    process.exit(EXIT_CODES.RECOVERABLE_FAILURE);
  }
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const secretsStore = await resolveAuthSecretsStore();
    await revokeOAuthSession(ctx.store.oauthServers, options.id, {
      ...(secretsStore === undefined ? {} : { secretsStore }),
      ...(options.reason !== undefined ? { reason: options.reason } : {}),
    });
    emitReport(options, { ok: true } as const, () => {
      const print = options.print ?? defaultPrintSink;
      print(brand(`oauth session '${options.id}' revoked.`));
    });
    return { ok: true };
  } finally {
    await ctx.close();
  }
}

/** @stable */
export async function runAuthStatus(options: AuthCommonOptions = {}) {
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const secretsStore = await resolveAuthSecretsStore();
    const status = await getOAuthStatus(ctx.store.oauthServers, {
      ...(secretsStore === undefined ? {} : { secretsStore }),
    });
    emitReport(options, status, () => {
      const print = options.print ?? defaultPrintSink;
      print(
        brand(
          `oauth subsystem status: ${status.sessions.length} session(s), ${status.providers.length} strategy(ies)`,
        ),
      );
      if (status.defaultStrategy !== null) {
        print(brand(`default strategy: ${status.defaultStrategy.id}`));
      }
    });
    return status;
  } finally {
    await ctx.close();
  }
}

function deriveServerId(serverUrl: string): string {
  try {
    const u = new URL(serverUrl);
    return u.host;
  } catch {
    return serverUrl;
  }
}
