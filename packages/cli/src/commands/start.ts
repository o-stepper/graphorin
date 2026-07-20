/**
 * `graphorin start [--config <path>]`. Boots the standalone server.
 *
 * Exits 1 on every recoverable failure (missing pepper, unresolvable
 * SecretRef, missing encryption peer, migration error). The CLI never
 * prints raw secret values; failure messages reference the offending
 * config path + the suggested `graphorin doctor` follow-up (Phase 15).
 *
 * @packageDocumentation
 */

import process from 'node:process';

import { applyProcessHardening, RefuseToRunAsRootError } from '@graphorin/security';
import { ConfigInvalidError, createServer, GraphorinServerError } from '@graphorin/server';

import { loadAppModule } from '../internal/app-module.js';
import { loadConfig } from '../internal/load-config.js';

/**
 * Selector for which `SecretsStore` flavour the server activates at
 * startup. Mirrors `--secrets-source` from DEC-136.
 *
 * @stable
 */
export type SecretsSourceFlag = 'auto' | 'keyring' | 'encrypted-file' | 'env';

/**
 * @stable
 */
export interface StartCommandOptions {
  readonly config?: string;
  readonly host?: string;
  readonly port?: number;
  readonly logResolved?: boolean;
  /**
   * Override the `secrets.source` field of the loaded config. Mirrors
   * the `--secrets-source <kind>` flag from DEC-136.
   */
  readonly secretsSource?: SecretsSourceFlag;
  /**
   * Refuse to fall back when the requested primary store is
   * unavailable. Mirrors `--strict-secrets` from DEC-136.
   */
  readonly strictSecrets?: boolean;
}

/**
 * Programmatic entry - used both by the CLI binary and by tests so
 * the spawn cost of running the binary is paid only when an operator
 * actually invokes `graphorin start` from a shell.
 *
 * @stable
 */
export async function runStart(
  options: StartCommandOptions = {},
): Promise<{ readonly host: string; readonly port: number }> {
  applyHardeningEarly();
  const loaded = await loadConfig(options.config);
  if (options.logResolved !== false) {
    process.stderr.write(`[graphorin/cli] resolved config: ${loaded.path}\n`);
  }
  const overrides = applyCliOverrides(loaded.config, options);

  // App-compose module (config `app` field): dynamically imported, its
  // adapter bag is spread into createServer so the sessions / memory /
  // agents / workflows surface mounts; a bare start stays
  // infrastructure-only.
  const appPath = (overrides as { app?: unknown }).app;
  let appBag: Record<string, unknown> = {};
  let appClose: (() => void | Promise<void>) | undefined;
  if (typeof appPath === 'string') {
    try {
      const app = await loadAppModule(appPath, loaded.path, overrides);
      appBag = app.bag as Record<string, unknown>;
      appClose = app.close;
      process.stderr.write(`[graphorin/cli] app module composed: ${appPath}\n`);
    } catch (err) {
      fatal(err);
    }
  }

  let server: Awaited<ReturnType<typeof createServer>> | undefined;
  try {
    server = await createServer({ config: overrides, ...appBag });
  } catch (err) {
    await closeQuietly(appClose);
    fatal(err);
  }
  if (server === undefined) process.exit(1);

  const listening = await safeStart(server, appClose);
  process.stderr.write(
    `[graphorin/cli] @graphorin/server v${server.version} listening on http://${listening.host}:${listening.port}${server.config.server.basePath}\n`,
  );
  installSignalHandlers(server, appClose);
  return listening;
}

/** Best-effort app-resource shutdown on failure paths. */
async function closeQuietly(close: (() => void | Promise<void>) | undefined): Promise<void> {
  if (close === undefined) return;
  try {
    await close();
  } catch (err) {
    process.stderr.write(
      `[graphorin/cli] app close hook failed: ${err instanceof Error ? err.message : String(err)}\n`,
    );
  }
}

/**
 * Merge CLI flag overrides into the loaded `graphorin.config` payload.
 * Exported for unit tests so callers can assert the precedence rules
 * without spinning up a real server.
 *
 * @internal
 */
export function applyCliOverrides(
  input: { readonly server?: unknown; readonly secrets?: unknown } | undefined,
  options: StartCommandOptions,
): Record<string, unknown> {
  const next = { ...(input ?? {}) } as Record<string, unknown>;
  const serverInput = (next.server as Record<string, unknown> | undefined) ?? {};
  if (options.host !== undefined || options.port !== undefined) {
    next.server = {
      ...serverInput,
      ...(options.host !== undefined ? { host: options.host } : {}),
      ...(options.port !== undefined ? { port: options.port } : {}),
    };
  }
  const secretsInput = (next.secrets as Record<string, unknown> | undefined) ?? {};
  if (options.secretsSource !== undefined || options.strictSecrets !== undefined) {
    next.secrets = {
      ...secretsInput,
      ...(options.secretsSource !== undefined ? { source: options.secretsSource } : {}),
      ...(options.strictSecrets !== undefined ? { strict: options.strictSecrets } : {}),
    };
  }
  return next;
}

async function safeStart(
  server: Awaited<ReturnType<typeof createServer>>,
  appClose?: () => void | Promise<void>,
) {
  try {
    return await server.start();
  } catch (err) {
    await closeQuietly(appClose);
    fatal(err);
  }
  process.exit(1);
}

function fatal(err: unknown): never {
  if (err instanceof ConfigInvalidError) {
    process.stderr.write('[graphorin/cli] graphorin.config invalid:\n');
    for (const issue of err.issues) {
      process.stderr.write(`  - ${issue.path.join('.') || '<root>'}: ${issue.message}\n`);
    }
  } else if (err instanceof GraphorinServerError) {
    process.stderr.write(`[graphorin/cli] ${err.kind}: ${err.message}\n`);
    if (err.hint !== undefined) {
      process.stderr.write(`  hint: ${err.hint}\n`);
    }
  } else if (err instanceof Error) {
    process.stderr.write(`[graphorin/cli] ${err.message}\n`);
  } else {
    process.stderr.write(`[graphorin/cli] unknown error: ${String(err)}\n`);
  }
  process.exit(1);
}

/**
 * Apply the standard hardening hooks before the server bootstraps.
 * Failures (e.g. running as root on Linux/macOS) abort the start with
 * a documented exit code.
 *
 * @internal
 */
export function applyHardeningEarly(): void {
  try {
    applyProcessHardening({});
  } catch (err) {
    if (err instanceof RefuseToRunAsRootError) {
      process.stderr.write(`[graphorin/cli] ${err.message}\n`);
      process.stderr.write(
        '[graphorin/cli] hint: drop privileges (systemd User=, k8s runAsNonRoot, docker --user) and retry.\n',
      );
      process.exit(1);
    }
    throw err;
  }
}

function installSignalHandlers(
  server: Awaited<ReturnType<typeof createServer>>,
  appClose?: () => void | Promise<void>,
): void {
  let shuttingDown = false;
  const onSignal = (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    process.stderr.write(`[graphorin/cli] received ${signal}; draining...\n`);
    server
      .stop()
      // The app owns its resources (injected store, provider clients);
      // stop() never closes them, so the close hook runs after drain.
      .then(() => closeQuietly(appClose))
      .then(() => {
        process.stderr.write('[graphorin/cli] graceful shutdown complete\n');
        process.exit(0);
      })
      .catch((err) => {
        process.stderr.write(`[graphorin/cli] shutdown error: ${(err as Error).message}\n`);
        process.exit(1);
      });
  };
  process.once('SIGTERM', onSignal);
  process.once('SIGINT', onSignal);
}
