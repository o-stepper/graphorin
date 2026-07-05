/**
 * `graphorin` CLI entry point. Built into `dist/bin/graphorin.js`
 * with a shebang prepended by `tsdown`; the `package.json` `bin`
 * field points npm at the compiled file.
 *
 * Phase 14a installs three subcommands grouped by lifecycle phase:
 *
 *   Bootstrap:
 *     - graphorin init
 *
 *   Maintenance:
 *     - graphorin migrate
 *
 *   Runtime:
 *     - graphorin start
 *
 * Phase 15 extends this binary with the full operator surface
 * (`doctor`, `token`, `secrets`, `audit`, `storage`, `memory`,
 * `consolidator`, `triggers`, `auth`, `pricing`, `skills`, `traces`,
 * `migrate-export`, `migrate-config`, `guard`, `telemetry`,
 * `tools lint`).
 *
 * `GRAPHORIN_OFFLINE=1` is honoured by every subcommand - the v0.1
 * surface never makes implicit network calls. Phase 15 commands that
 * do touch the network (e.g. `graphorin pricing refresh`) consult
 * the same flag through the helper in `../internal/offline.ts`.
 *
 * @packageDocumentation
 */

import process from 'node:process';

import { Command } from 'commander';

import {
  runAuditExport,
  runAuditPrune,
  runAuditVerify,
  runAuthList,
  runAuthLogin,
  runAuthRefresh,
  runAuthRevoke,
  runAuthStatus,
  runConsolidatorSetTier,
  runConsolidatorStatus,
  runConsolidatorStop,
  runDoctor,
  runGuardExplain,
  runGuardStatus,
  runInit,
  runMemoryActivity,
  runMemoryInspect,
  runMemoryMigrate,
  runMemoryPruneHistory,
  runMemoryReview,
  runMemoryStatus,
  runMemoryWhy,
  runMigrate,
  runMigrateConfig,
  runMigrateExport,
  runPricingDiff,
  runPricingLookup,
  runPricingMissing,
  runPricingRefresh,
  runPricingStatus,
  runSecretsDelete,
  runSecretsGet,
  runSecretsList,
  runSecretsRef,
  runSecretsRotate,
  runSecretsSet,
  runSkillsAudit,
  runSkillsInspect,
  runSkillsInstall,
  runSkillsMigrateFrontmatter,
  runStart,
  runStorageBackup,
  runStorageCleanupBackups,
  runStorageEncrypt,
  runStorageRekey,
  runStorageStatus,
  runTelemetryDisable,
  runTelemetryEnable,
  runTelemetryInspect,
  runTelemetryStatus,
  runTokenCreate,
  runTokenList,
  runTokenRekey,
  runTokenRevoke,
  runTokenRotate,
  runTokenVerify,
  runToolsLint,
  runTracesPrune,
  runTracesStatus,
  runTriggersDisable,
  runTriggersFire,
  runTriggersList,
  runTriggersPrune,
  runTriggersStatus,
  VERSION,
} from '../index.js';
import { isOfflineMode } from '../internal/offline.js';

async function main(): Promise<void> {
  const program = new Command();
  program
    .name('graphorin')
    .description(
      [
        'Operator CLI for the Graphorin framework.',
        '',
        'Commands grouped by purpose:',
        '  Bootstrap:    init, migrate, migrate-config',
        '  Runtime:      start',
        '  Diagnostics:  doctor, telemetry, traces, guard',
        '  Auth:         token, secrets, auth',
        '  Storage:      storage, audit, memory, consolidator, triggers, migrate-export',
        '  Catalogue:    pricing, skills, tools',
        '',
        'Honours GRAPHORIN_OFFLINE=1 - the v0.1 surface never makes implicit network calls.',
      ].join('\n'),
    )
    .version(VERSION);

  registerLifecycleCommands(program);
  registerDoctorCommand(program);
  registerTokenCommands(program);
  registerSecretsCommands(program);
  registerStorageCommands(program);
  registerAuditCommands(program);
  registerMemoryCommands(program);
  registerConsolidatorCommands(program);
  registerTriggersCommands(program);
  registerAuthCommands(program);
  registerPricingCommands(program);
  registerSkillsCommands(program);
  registerTracesCommands(program);
  registerMigrateExportCommand(program);
  registerMigrateConfigCommand(program);
  registerGuardCommands(program);
  registerTelemetryCommands(program);
  registerToolsCommands(program);

  await program.parseAsync(process.argv);
}

function registerLifecycleCommands(program: Command): void {
  program
    .command('start')
    .description('[Runtime] Start the @graphorin/server daemon.')
    .option('-c, --config <path>', 'Path to the graphorin.config file (TS / JS / JSON).')
    .option('-h, --host <host>', 'Override the configured listen host.')
    .option('-p, --port <port>', 'Override the configured listen port.', (value) =>
      Number.parseInt(value, 10),
    )
    .option(
      '--secrets-source <kind>',
      'Override secrets.source: auto | keyring | encrypted-file | env (DEC-136).',
    )
    .option('--strict-secrets', 'Refuse to fall back to a different secrets store (DEC-136).')
    .action(
      async (opts: {
        config?: string;
        host?: string;
        port?: number;
        secretsSource?: 'auto' | 'keyring' | 'encrypted-file' | 'env';
        strictSecrets?: boolean;
      }) => {
        if (isOfflineMode()) {
          process.stderr.write(
            '[graphorin/cli] GRAPHORIN_OFFLINE=1 - running with no implicit network calls.\n',
          );
        }
        await runStart({
          ...(opts.config !== undefined ? { config: opts.config } : {}),
          ...(opts.host !== undefined ? { host: opts.host } : {}),
          ...(opts.port !== undefined ? { port: opts.port } : {}),
          ...(opts.secretsSource !== undefined ? { secretsSource: opts.secretsSource } : {}),
          ...(opts.strictSecrets !== undefined ? { strictSecrets: opts.strictSecrets } : {}),
        });
      },
    );

  program
    .command('init')
    .description(
      '[Bootstrap] Generate a fresh graphorin.config.ts and a one-shot bootstrap admin token.',
    )
    .option('-o, --out <path>', 'Output path; defaults to ./graphorin.config.ts.')
    .option('--non-interactive', 'Accept defaults / env vars without prompting.', false)
    .option(
      '--cloud-consent <tier>',
      'Cloud-upload consent tier: public-only | public-and-internal | all-with-warnings.',
    )
    .option('--encrypted', 'Enable storage encryption opt-in.')
    .option('--no-encrypted', 'Disable storage encryption opt-in.')
    .action(
      async (opts: {
        out?: string;
        nonInteractive?: boolean;
        cloudConsent?: 'public-only' | 'public-and-internal' | 'all-with-warnings';
        encrypted?: boolean;
      }) => {
        if (isOfflineMode()) {
          process.stderr.write(
            '[graphorin/cli] GRAPHORIN_OFFLINE=1 - init never reaches the network.\n',
          );
        }
        await runInit({
          ...(opts.out !== undefined ? { out: opts.out } : {}),
          ...(opts.nonInteractive !== undefined ? { nonInteractive: opts.nonInteractive } : {}),
          ...(opts.cloudConsent !== undefined ? { cloudConsent: opts.cloudConsent } : {}),
          ...(opts.encrypted !== undefined ? { encrypted: opts.encrypted } : {}),
        });
      },
    );

  program
    .command('migrate')
    .description(
      '[Maintenance] Apply pending storage migrations against the configured SQLite store.',
    )
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--target <version>', 'Reserved for the Phase 15 partial-migration runner.')
    .action(async (opts: { config?: string; target?: string }) => {
      if (isOfflineMode()) {
        process.stderr.write(
          '[graphorin/cli] GRAPHORIN_OFFLINE=1 - migrate is a local-only operation.\n',
        );
      }
      await runMigrate({
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.target !== undefined ? { target: opts.target } : {}),
      });
    });
}

function registerDoctorCommand(program: Command): void {
  program
    .command('doctor')
    .description('[Diagnostics] Health check (perms + secrets + encryption + systemd).')
    .option('--fix-perms', 'Repair drifted POSIX file modes.')
    .option('--check-perms', 'Run the file-perms check.')
    .option('--check-secrets', 'Run the secrets-store check.')
    .option('--check-encryption', 'Run the audit-encryption check.')
    .option('--check-systemd', 'Run the systemd-hardening check (Linux only).')
    .option('--all', 'Run every check.')
    .option('--json', 'Emit a structured JSON report on stdout.')
    .action(
      async (opts: {
        fixPerms?: boolean;
        checkPerms?: boolean;
        checkSecrets?: boolean;
        checkEncryption?: boolean;
        checkSystemd?: boolean;
        all?: boolean;
        json?: boolean;
      }) => {
        await runDoctor({
          ...(opts.fixPerms !== undefined ? { fixPerms: opts.fixPerms } : {}),
          ...(opts.checkPerms !== undefined ? { checkPerms: opts.checkPerms } : {}),
          ...(opts.checkSecrets !== undefined ? { checkSecrets: opts.checkSecrets } : {}),
          ...(opts.checkEncryption !== undefined ? { checkEncryption: opts.checkEncryption } : {}),
          ...(opts.checkSystemd !== undefined ? { checkSystemd: opts.checkSystemd } : {}),
          ...(opts.all !== undefined ? { all: opts.all } : {}),
          ...(opts.json !== undefined ? { json: opts.json } : {}),
        });
      },
    );
}

function registerTokenCommands(program: Command): void {
  const token = program.command('token').description('[Auth] Manage server auth tokens.');
  token
    .command('create')
    .description('Mint a new token. Prints the raw value once.')
    .requiredOption('--scopes <list>', 'Comma-separated scope list.')
    .option('--label <name>', 'Optional label.')
    .option('--expires-in <duration>', 'Duration string: 30d, 12h, 90m, 45s.')
    .option('--env <env>', 'Token environment: live | test.', 'live')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(
      async (opts: {
        scopes: string;
        label?: string;
        expiresIn?: string;
        env?: 'live' | 'test';
        config?: string;
        json?: boolean;
      }) => {
        await runTokenCreate({
          scopes: opts.scopes
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          ...(opts.label !== undefined ? { label: opts.label } : {}),
          ...(opts.expiresIn !== undefined ? { expiresIn: opts.expiresIn } : {}),
          ...(opts.env !== undefined ? { env: opts.env } : {}),
          ...(opts.config !== undefined ? { config: opts.config } : {}),
          ...(opts.json !== undefined ? { json: opts.json } : {}),
        });
      },
    );
  token
    .command('list')
    .description('List token metadata.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--include-revoked', 'Include revoked tokens.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { config?: string; includeRevoked?: boolean; json?: boolean }) => {
      await runTokenList({
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.includeRevoked !== undefined ? { includeRevoked: opts.includeRevoked } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  token
    .command('revoke <id>')
    .description('Revoke a single token.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (id: string, opts: { config?: string; json?: boolean }) => {
      await runTokenRevoke({
        id,
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  token
    .command('rotate <id>')
    .description('Revoke + reissue a token with the same scopes.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--env <env>', 'Token environment: live | test.', 'live')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(
      async (id: string, opts: { config?: string; env?: 'live' | 'test'; json?: boolean }) => {
        await runTokenRotate({
          id,
          ...(opts.config !== undefined ? { config: opts.config } : {}),
          ...(opts.env !== undefined ? { env: opts.env } : {}),
          ...(opts.json !== undefined ? { json: opts.json } : {}),
        });
      },
    );
  token
    .command('rekey')
    .description('Re-issue every active token (use after a known compromise).')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--env <env>', 'Token environment: live | test.', 'live')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { config?: string; env?: 'live' | 'test'; json?: boolean }) => {
      await runTokenRekey({
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.env !== undefined ? { env: opts.env } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  token
    .command('verify <token>')
    .description('Offline checksum verification - never consults the store.')
    .option('--prefix <prefix>', 'Override the expected token prefix.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action((tok: string, opts: { prefix?: string; json?: boolean }) => {
      runTokenVerify({
        token: tok,
        ...(opts.prefix !== undefined ? { prefix: opts.prefix } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
}

function registerSecretsCommands(program: Command): void {
  const secrets = program
    .command('secrets')
    .description('[Auth] Manage secrets in the configured store.');
  const commonOpts = (cmd: Command): Command =>
    cmd
      .option('--secrets-source <kind>', 'auto | keyring | encrypted-file | env (DEC-136).')
      .option('--strict-secrets', 'Refuse to fall back to a different secrets store.')
      .option('--json', 'Emit a structured JSON document on stdout.');
  commonOpts(secrets.command('list').description('List secret metadata.')).action(
    async (opts: {
      secretsSource?: 'auto' | 'keyring' | 'encrypted-file' | 'env';
      strictSecrets?: boolean;
      json?: boolean;
    }) => {
      await runSecretsList({
        ...(opts.secretsSource !== undefined ? { secretsSource: opts.secretsSource } : {}),
        ...(opts.strictSecrets !== undefined ? { strictSecrets: opts.strictSecrets } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    },
  );
  commonOpts(
    secrets
      .command('get <key>')
      .description('Read a secret. Use --reveal to print the bytes.')
      .option('--reveal', 'Print the raw value.'),
  ).action(
    async (
      key: string,
      opts: {
        secretsSource?: 'auto' | 'keyring' | 'encrypted-file' | 'env';
        strictSecrets?: boolean;
        json?: boolean;
        reveal?: boolean;
      },
    ) => {
      await runSecretsGet({
        key,
        ...(opts.secretsSource !== undefined ? { secretsSource: opts.secretsSource } : {}),
        ...(opts.strictSecrets !== undefined ? { strictSecrets: opts.strictSecrets } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
        ...(opts.reveal !== undefined ? { reveal: opts.reveal } : {}),
      });
    },
  );
  commonOpts(
    secrets
      .command('set <key>')
      .description('Persist a secret. Pass --value <v> or --from-stdin.')
      .option('--value <v>', 'Inline value.')
      .option('--from-stdin', 'Read the value from stdin.'),
  ).action(
    async (
      key: string,
      opts: {
        value?: string;
        fromStdin?: boolean;
        secretsSource?: 'auto' | 'keyring' | 'encrypted-file' | 'env';
        strictSecrets?: boolean;
        json?: boolean;
      },
    ) => {
      await runSecretsSet({
        key,
        ...(opts.value !== undefined ? { value: opts.value } : {}),
        ...(opts.fromStdin !== undefined ? { fromStdin: opts.fromStdin } : {}),
        ...(opts.secretsSource !== undefined ? { secretsSource: opts.secretsSource } : {}),
        ...(opts.strictSecrets !== undefined ? { strictSecrets: opts.strictSecrets } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    },
  );
  commonOpts(secrets.command('delete <key>').description('Delete a secret.')).action(
    async (
      key: string,
      opts: {
        secretsSource?: 'auto' | 'keyring' | 'encrypted-file' | 'env';
        strictSecrets?: boolean;
        json?: boolean;
      },
    ) => {
      await runSecretsDelete({
        key,
        ...(opts.secretsSource !== undefined ? { secretsSource: opts.secretsSource } : {}),
        ...(opts.strictSecrets !== undefined ? { strictSecrets: opts.strictSecrets } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    },
  );
  commonOpts(
    secrets
      .command('ref <uri>')
      .description('Test resolution of a SecretRef URI.')
      .option('--reveal', 'Include the resolved value in the report.'),
  ).action(async (uri: string, opts: { reveal?: boolean; json?: boolean }) => {
    await runSecretsRef({
      uri,
      ...(opts.reveal !== undefined ? { reveal: opts.reveal } : {}),
      ...(opts.json !== undefined ? { json: opts.json } : {}),
    });
  });
  commonOpts(
    secrets
      .command('rotate <key>')
      .description('Replace an existing secret with a fresh value.')
      .option('--new-value <v>', 'Inline new value.')
      .option('--from-stdin', 'Read the new value from stdin.'),
  ).action(
    async (
      key: string,
      opts: {
        newValue?: string;
        fromStdin?: boolean;
        secretsSource?: 'auto' | 'keyring' | 'encrypted-file' | 'env';
        strictSecrets?: boolean;
        json?: boolean;
      },
    ) => {
      await runSecretsRotate({
        key,
        ...(opts.newValue !== undefined ? { newValue: opts.newValue } : {}),
        ...(opts.fromStdin !== undefined ? { fromStdin: opts.fromStdin } : {}),
        ...(opts.secretsSource !== undefined ? { secretsSource: opts.secretsSource } : {}),
        ...(opts.strictSecrets !== undefined ? { strictSecrets: opts.strictSecrets } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    },
  );
}

function registerStorageCommands(program: Command): void {
  const storage = program
    .command('storage')
    .description('[Storage] SQLite + encryption-at-rest commands.');
  storage
    .command('status')
    .description('Report current store state + cipher peer availability.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { config?: string; json?: boolean }) => {
      await runStorageStatus({
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  storage
    .command('encrypt')
    .description(
      'Encrypt the store. Requires the @graphorin/store-sqlite-encrypted sub-pack (Phase 16).',
    )
    .requiredOption('--passphrase-from <ref>', 'SecretRef URI for the new passphrase.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option(
      '--target-path <path>',
      'Override the encrypted output path. Default <storage>.encrypted.',
    )
    .option(
      '--swap',
      'Atomically swap the encrypted output into the storage path; original kept under .bak.<ts>.',
    )
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(
      async (opts: {
        passphraseFrom: string;
        config?: string;
        targetPath?: string;
        swap?: boolean;
        json?: boolean;
      }) => {
        await runStorageEncrypt({
          passphraseFrom: opts.passphraseFrom,
          ...(opts.config !== undefined ? { config: opts.config } : {}),
          ...(opts.targetPath !== undefined ? { targetPath: opts.targetPath } : {}),
          ...(opts.swap === true ? { swap: true } : {}),
          ...(opts.json !== undefined ? { json: opts.json } : {}),
        });
      },
    );
  storage
    .command('rekey')
    .description('Rekey an already-encrypted store.')
    .requiredOption('--old-passphrase-from <ref>', 'SecretRef URI for the existing passphrase.')
    .requiredOption('--new-passphrase-from <ref>', 'SecretRef URI for the new passphrase.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(
      async (opts: {
        oldPassphraseFrom: string;
        newPassphraseFrom: string;
        config?: string;
        json?: boolean;
      }) => {
        await runStorageRekey({
          oldPassphraseFrom: opts.oldPassphraseFrom,
          newPassphraseFrom: opts.newPassphraseFrom,
          ...(opts.config !== undefined ? { config: opts.config } : {}),
          ...(opts.json !== undefined ? { json: opts.json } : {}),
        });
      },
    );
  storage
    .command('backup')
    .description(
      'Online, consistent copy of the store via the page-level backup API (safe under a live writer; never use VACUUM INTO).',
    )
    .argument('<dest>', 'Destination file path for the backup copy.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--overwrite', 'Replace an existing destination file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(
      async (dest: string, opts: { config?: string; overwrite?: boolean; json?: boolean }) => {
        await runStorageBackup({
          dest,
          ...(opts.config !== undefined ? { config: opts.config } : {}),
          ...(opts.overwrite === true ? { overwrite: true } : {}),
          ...(opts.json !== undefined ? { json: opts.json } : {}),
        });
      },
    );
  storage
    .command('cleanup-backups')
    .description('Drop stale .bak / .tmp.<ts> files left by previous encrypt / rekey runs.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--dry-run', 'Print what would be removed without touching the filesystem.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { config?: string; dryRun?: boolean; json?: boolean }) => {
      await runStorageCleanupBackups({
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.dryRun !== undefined ? { dryRun: opts.dryRun } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
}

function registerAuditCommands(program: Command): void {
  const audit = program
    .command('audit')
    .description('[Storage] Operate on the encrypted audit log.');
  audit
    .command('verify')
    .description('Replay the chain and report the first broken link (if any).')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { config?: string; json?: boolean }) => {
      await runAuditVerify({
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  audit
    .command('prune')
    .description('Drop entries older than --before (cutoff is required).')
    .requiredOption('--before <date>', 'ISO date / epoch ms cutoff.')
    .option('--retain <n>', 'Minimum number of entries that must survive.', (v) =>
      Number.parseInt(v, 10),
    )
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { before: string; retain?: number; config?: string; json?: boolean }) => {
      await runAuditPrune({
        before: opts.before,
        ...(opts.retain !== undefined ? { retain: opts.retain } : {}),
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  audit
    .command('export')
    .description('Stream every audit entry as JSONL into --to.')
    .requiredOption('--to <file>', 'Output path.')
    .option('--from-seq <n>', 'Lower bound (inclusive).', (v) => Number.parseInt(v, 10))
    .option('--to-seq <n>', 'Upper bound (inclusive).', (v) => Number.parseInt(v, 10))
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(
      async (opts: {
        to: string;
        fromSeq?: number;
        toSeq?: number;
        config?: string;
        json?: boolean;
      }) => {
        await runAuditExport({
          to: opts.to,
          ...(opts.fromSeq !== undefined ? { fromSeq: opts.fromSeq } : {}),
          ...(opts.toSeq !== undefined ? { toSeq: opts.toSeq } : {}),
          ...(opts.config !== undefined ? { config: opts.config } : {}),
          ...(opts.json !== undefined ? { json: opts.json } : {}),
        });
      },
    );
}

function registerMemoryCommands(program: Command): void {
  const memory = program
    .command('memory')
    .description('[Storage] Long-term memory operator commands.');
  memory
    .command('status')
    .description('Report counts + active embedder + migration state.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { config?: string; json?: boolean }) => {
      await runMemoryStatus({
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  memory
    .command('migrate')
    .description('Embedder swap. Requires --embedders module that exports the factories.')
    .requiredOption('--from <id>', 'Source embedder id.')
    .requiredOption('--to <id>', 'Target embedder id.')
    .requiredOption('--strategy <s>', 'lock-on-first | auto-migrate | multi-active.')
    .option('--embedders <path>', 'Path to a module exporting embedder factories.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .action(
      async (opts: {
        from: string;
        to: string;
        strategy: string;
        embedders?: string;
        config?: string;
      }) => {
        await runMemoryMigrate({
          from: opts.from,
          to: opts.to,
          strategy: opts.strategy as 'lock-on-first' | 'auto-migrate' | 'multi-active',
          ...(opts.embedders !== undefined ? { embeddersModule: opts.embedders } : {}),
          ...(opts.config !== undefined ? { config: opts.config } : {}),
        });
      },
    );
  memory
    .command('inspect')
    .description('Inspect one fact: supersede chain, quarantine, conflicts, citing insights.')
    .argument('<factId>', 'Id of the fact to inspect.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (factId: string, opts: { config?: string; json?: boolean }) => {
      await runMemoryInspect({
        factId,
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  memory
    .command('activity')
    .description('Store-wide consolidator / reflection activity: quarantine, history, conflicts.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--limit <n>', 'Cap on recent history / conflict rows (default 20).')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { config?: string; limit?: string; json?: boolean }) => {
      const limit = opts.limit !== undefined ? Number.parseInt(opts.limit, 10) : undefined;
      await runMemoryActivity({
        ...(limit !== undefined && Number.isFinite(limit) ? { limit } : {}),
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  memory
    .command('prune-history')
    .description(
      'Delete memory_history rows older than the threshold (storage-cost hygiene; purge() already scrubs sensitive text).',
    )
    .requiredOption(
      '--older-than <duration|date>',
      "Age threshold: a duration ('30d', '12h') or a past ISO date. Mandatory - destructive.",
    )
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { olderThan: string; config?: string; json?: boolean }) => {
      await runMemoryPruneHistory({
        olderThan: opts.olderThan,
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  memory
    .command('why')
    .description(
      'Explain why facts were recalled (ranking signals) from the persisted recall spans.',
    )
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--session <id>', "Restrict to one session's recall spans.")
    .option('--limit <n>', 'Cap on the most-recent recall spans (default 5).')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { config?: string; session?: string; limit?: string; json?: boolean }) => {
      const limit = opts.limit !== undefined ? Number.parseInt(opts.limit, 10) : undefined;
      await runMemoryWhy({
        ...(opts.session !== undefined ? { sessionId: opts.session } : {}),
        ...(limit !== undefined && Number.isFinite(limit) ? { limit } : {}),
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  memory
    .command('review')
    .description('List quarantined memory by tier, or promote a reviewed item with --promote.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--limit <n>', 'Cap on rows listed per type (default 20).')
    .option('--promote <id>', 'Promote this quarantined memory id out of quarantine.')
    .option('--reason <text>', 'Audit reason recorded with the promotion.')
    .option('--force', 'Override the injection-refusal gate (operator action, after review).')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(
      async (opts: {
        config?: string;
        limit?: string;
        promote?: string;
        reason?: string;
        force?: boolean;
        json?: boolean;
      }) => {
        const limit = opts.limit !== undefined ? Number.parseInt(opts.limit, 10) : undefined;
        await runMemoryReview({
          ...(limit !== undefined && Number.isFinite(limit) ? { limit } : {}),
          ...(opts.promote !== undefined ? { promote: opts.promote } : {}),
          ...(opts.reason !== undefined ? { reason: opts.reason } : {}),
          ...(opts.force !== undefined ? { force: opts.force } : {}),
          ...(opts.config !== undefined ? { config: opts.config } : {}),
          ...(opts.json !== undefined ? { json: opts.json } : {}),
        });
      },
    );
}

function registerConsolidatorCommands(program: Command): void {
  const c = program
    .command('consolidator')
    .description('[Storage] Inspect and steer the memory consolidator.');
  c.command('status')
    .description('Current tier hint + DLQ size + recent run history.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { config?: string; json?: boolean }) => {
      await runConsolidatorStatus({
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  c.command('set-tier <tier>')
    .description(
      'Runtime tier switching is not wired yet: reports UNSUPPORTED (exit 2) and points at consolidator.tier in the config (IP-4).',
    )
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (tier: string, opts: { config?: string; json?: boolean }) => {
      await runConsolidatorSetTier({
        tier: tier as 'free' | 'cheap' | 'standard' | 'full' | 'custom',
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  c.command('stop')
    .description(
      'Runtime pause is not wired yet: reports UNSUPPORTED (exit 2); stop the server process to stop consolidation (IP-4).',
    )
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { config?: string; json?: boolean }) => {
      await runConsolidatorStop({
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
}

function registerTriggersCommands(program: Command): void {
  const t = program
    .command('triggers')
    .description('[Storage] Operate on the durable trigger registry.');
  t.command('list')
    .description('Every persisted trigger.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { config?: string; json?: boolean }) => {
      await runTriggersList({
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  t.command('status <id>')
    .description('Single-trigger detail.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (id: string, opts: { config?: string; json?: boolean }) => {
      await runTriggersStatus({
        id,
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  t.command('fire <id>')
    .description('Operator-fired side-effect (admin only).')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (id: string, opts: { config?: string; json?: boolean }) => {
      await runTriggersFire({
        id,
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  t.command('disable <id>')
    .description('Flip the disabled column on the registry row.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (id: string, opts: { config?: string; json?: boolean }) => {
      await runTriggersDisable({
        id,
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  t.command('prune')
    .description('Drop disabled triggers older than --before.')
    .option(
      '--before <date>',
      'ISO date / epoch ms cutoff. Defaults to 0 (drop every disabled row).',
    )
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { before?: string; config?: string; json?: boolean }) => {
      await runTriggersPrune({
        ...(opts.before !== undefined ? { before: opts.before } : {}),
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
}

function registerAuthCommands(program: Command): void {
  const a = program.command('auth').description('[Auth] Outbound OAuth (e.g. for MCP servers).');
  a.command('login')
    .description('Drive an interactive login flow.')
    .requiredOption('--server <url>', 'Authorization server URL.')
    .option('--server-id <id>', 'Override the persisted server identifier.')
    .option('--scope <scope>', 'OAuth scope.')
    .option('--device-flow', 'Use the Device Authorization Grant.')
    .option('--client-id <id>', 'Pre-existing client identifier (skip DCR).')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .action(
      async (opts: {
        server: string;
        serverId?: string;
        scope?: string;
        deviceFlow?: boolean;
        clientId?: string;
        config?: string;
      }) => {
        await runAuthLogin({
          serverUrl: opts.server,
          ...(opts.serverId !== undefined ? { serverId: opts.serverId } : {}),
          ...(opts.scope !== undefined ? { scope: opts.scope } : {}),
          ...(opts.deviceFlow !== undefined ? { deviceFlow: opts.deviceFlow } : {}),
          ...(opts.clientId !== undefined ? { clientId: opts.clientId } : {}),
          ...(opts.config !== undefined ? { config: opts.config } : {}),
        });
      },
    );
  a.command('list')
    .description('List persisted OAuth sessions.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { config?: string; json?: boolean }) => {
      await runAuthList({
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  a.command('refresh <id>')
    .description('Refresh a session.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .action(async (id: string, opts: { config?: string }) => {
      await runAuthRefresh({
        id,
        ...(opts.config !== undefined ? { config: opts.config } : {}),
      });
    });
  a.command('revoke <id>')
    .description('Revoke a session.')
    .option('--reason <text>', 'Optional reason persisted in the audit log.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .action(async (id: string, opts: { reason?: string; config?: string }) => {
      await runAuthRevoke({
        id,
        ...(opts.reason !== undefined ? { reason: opts.reason } : {}),
        ...(opts.config !== undefined ? { config: opts.config } : {}),
      });
    });
  a.command('status')
    .description('OAuth subsystem snapshot.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { config?: string; json?: boolean }) => {
      await runAuthStatus({
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
}

function registerPricingCommands(program: Command): void {
  const p = program.command('pricing').description('[Catalogue] Bundled LLM pricing snapshot.');
  p.command('status')
    .description('Show bundled snapshot version + entry count + digest.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action((opts: { json?: boolean }) => {
      runPricingStatus({ ...(opts.json !== undefined ? { json: opts.json } : {}) });
    });
  p.command('refresh')
    .description('Pull a fresh snapshot from --url (network).')
    .requiredOption('--url <url>', 'Snapshot URL.')
    .option('--out <file>', 'Optional path to write the refreshed snapshot to.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { url: string; out?: string; json?: boolean }) => {
      await runPricingRefresh({
        url: opts.url,
        ...(opts.out !== undefined ? { out: opts.out } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  p.command('diff')
    .description('Diff a supplied snapshot against the bundled one.')
    .requiredOption('--snapshot <file>', 'JSON file containing a PricingSnapshot.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { snapshot: string; json?: boolean }) => {
      await runPricingDiff({
        snapshot: opts.snapshot,
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  p.command('lookup')
    .description('Print the per-token price for a single (provider, model) pair.')
    .requiredOption('--provider <name>', 'Provider id.')
    .requiredOption('--model <id>', 'Model id.')
    .option('--region <region>', 'Optional region.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action((opts: { provider: string; model: string; region?: string; json?: boolean }) => {
      runPricingLookup({
        provider: opts.provider,
        model: opts.model,
        ...(opts.region !== undefined ? { region: opts.region } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  p.command('missing')
    .description('Report (provider, model) pairs absent from the bundled snapshot.')
    .requiredOption('--spans <file>', 'JSON file containing trace spans (array of { attributes }).')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { spans: string; json?: boolean }) => {
      await runPricingMissing({
        spans: opts.spans,
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
}

function registerSkillsCommands(program: Command): void {
  const s = program
    .command('skills')
    .description('[Catalogue] Manage operator-managed skill packages.');
  s.command('install <source>')
    .description('Install a skill from npm:<name>[@version] or git:<url>.')
    .option('--version <version>', 'npm version pin.')
    .option('--ref <ref>', 'git ref (branch / tag / sha).')
    .option('--trust-level <level>', 'trusted | trusted-with-scripts | untrusted.')
    .option('--cwd <dir>', 'Working directory for npm installs.')
    .option('--dry-run', 'Skip the install; run the policy + audit pipeline only.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(
      async (
        source: string,
        opts: {
          version?: string;
          ref?: string;
          trustLevel?: 'trusted' | 'trusted-with-scripts' | 'untrusted';
          cwd?: string;
          dryRun?: boolean;
          json?: boolean;
        },
      ) => {
        await runSkillsInstall({
          source,
          ...(opts.version !== undefined ? { version: opts.version } : {}),
          ...(opts.ref !== undefined ? { ref: opts.ref } : {}),
          ...(opts.trustLevel !== undefined ? { trustLevel: opts.trustLevel } : {}),
          ...(opts.cwd !== undefined ? { cwd: opts.cwd } : {}),
          ...(opts.dryRun !== undefined ? { dryRun: opts.dryRun } : {}),
          ...(opts.json !== undefined ? { json: opts.json } : {}),
        });
      },
    );
  s.command('inspect <name>')
    .description('Print a single recorded installation.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (name: string, opts: { json?: boolean }) => {
      await runSkillsInspect({
        name,
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  s.command('audit')
    .description('Audit every recorded installation in this process.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action((opts: { json?: boolean }) => {
      runSkillsAudit({ ...(opts.json !== undefined ? { json: opts.json } : {}) });
    });
  s.command('migrate-frontmatter')
    .description(
      'Migrate legacy graphorin-* frontmatter fields onto upstream equivalents (DEC-156).',
    )
    .option('--path <dir>', 'Directory to walk. Defaults to cwd.')
    .option('--recursive', 'Walk subdirectories.')
    .option('--apply', 'Actually rewrite files (default: dry-run).')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(
      async (opts: { path?: string; recursive?: boolean; apply?: boolean; json?: boolean }) => {
        await runSkillsMigrateFrontmatter({
          ...(opts.path !== undefined ? { path: opts.path } : {}),
          ...(opts.recursive !== undefined ? { recursive: opts.recursive } : {}),
          ...(opts.apply !== undefined ? { apply: opts.apply } : {}),
          ...(opts.json !== undefined ? { json: opts.json } : {}),
        });
      },
    );
}

function registerTracesCommands(program: Command): void {
  const t = program.command('traces').description('[Diagnostics] Operate on persisted spans.');
  t.command('status')
    .description('Count persisted spans + report their time range.')
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { config?: string; json?: boolean }) => {
      await runTracesStatus({
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
  t.command('prune')
    .description('Delete spans that FINISHED before the cutoff (cutoff is required).')
    .requiredOption(
      '--before <date>',
      'ISO date / epoch ms cutoff (spans ending strictly before it are deleted).',
    )
    .option('-c, --config <path>', 'Path to the graphorin.config file.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (opts: { before: string; config?: string; json?: boolean }) => {
      await runTracesPrune({
        before: opts.before,
        ...(opts.config !== undefined ? { config: opts.config } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
}

function registerMigrateExportCommand(program: Command): void {
  program
    .command('migrate-export <input>')
    .description('[Storage] Migrate a session export file to the current schema (DEC-155).')
    .requiredOption('--to <file>', 'Output path.')
    .option('--to-schema <version>', 'Target schema version.', '1.0')
    .option('--writer <id>', 'Writer identifier surfaced on the meta header.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(
      async (
        input: string,
        opts: { to: string; toSchema?: string; writer?: string; json?: boolean },
      ) => {
        await runMigrateExport({
          input,
          to: opts.to,
          ...(opts.toSchema !== undefined ? { toSchema: opts.toSchema } : {}),
          ...(opts.writer !== undefined ? { writer: opts.writer } : {}),
          ...(opts.json !== undefined ? { json: opts.json } : {}),
        });
      },
    );
}

function registerMigrateConfigCommand(program: Command): void {
  program
    .command('migrate-config <input>')
    .description('[Bootstrap] Migrate an old config file to the current schema.')
    .option('--out <file>', 'Output path. Defaults to <input>.migrated.json next to the source.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(async (input: string, opts: { out?: string; json?: boolean }) => {
      await runMigrateConfig({
        input,
        ...(opts.out !== undefined ? { out: opts.out } : {}),
        ...(opts.json !== undefined ? { json: opts.json } : {}),
      });
    });
}

function registerGuardCommands(program: Command): void {
  const g = program
    .command('guard')
    .description('[Diagnostics] Inspect the memory-modification guard.');
  g.command('status')
    .description('Print the four guard tiers and their variants.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action((opts: { json?: boolean }) => {
      runGuardStatus({ ...(opts.json !== undefined ? { json: opts.json } : {}) });
    });
  g.command('explain <toolName>')
    .description(
      'Derive the tier the classifier would assign to a tool with the supplied metadata.',
    )
    .option('--tags <list>', 'Comma-separated tag list.')
    .option('--secrets-allowed <list>', 'Comma-separated secret allowlist.')
    .option('--trust-level <level>', 'built-in | user-defined | trusted | untrusted.')
    .option(
      '--explicit-tier <tier>',
      'pure | side-effecting-no-memory | memory-aware | unknown | untrusted.',
    )
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action(
      (
        toolName: string,
        opts: {
          tags?: string;
          secretsAllowed?: string;
          trustLevel?: 'built-in' | 'user-defined' | 'trusted' | 'untrusted';
          explicitTier?:
            | 'pure'
            | 'side-effecting-no-memory'
            | 'memory-aware'
            | 'unknown'
            | 'untrusted';
          json?: boolean;
        },
      ) => {
        runGuardExplain({
          toolName,
          ...(opts.tags !== undefined
            ? {
                tags: opts.tags
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              }
            : {}),
          ...(opts.secretsAllowed !== undefined
            ? {
                secretsAllowed: opts.secretsAllowed
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              }
            : {}),
          ...(opts.trustLevel !== undefined ? { trustLevel: opts.trustLevel } : {}),
          ...(opts.explicitTier !== undefined ? { explicitTier: opts.explicitTier } : {}),
          ...(opts.json !== undefined ? { json: opts.json } : {}),
        });
      },
    );
}

function registerTelemetryCommands(program: Command): void {
  const t = program
    .command('telemetry')
    .description('[Diagnostics] Telemetry policy (zero-default per ADR-041).');
  t.command('status')
    .description('Always reports disabled.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action((opts: { json?: boolean }) => {
      runTelemetryStatus({ ...(opts.json !== undefined ? { json: opts.json } : {}) });
    });
  t.command('enable')
    .description('Refuses; opt-in collector is on the v0.2+ roadmap.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action((opts: { json?: boolean }) => {
      runTelemetryEnable({ ...(opts.json !== undefined ? { json: opts.json } : {}) });
    });
  t.command('disable')
    .description('No-op; telemetry is always disabled.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action((opts: { json?: boolean }) => {
      runTelemetryDisable({ ...(opts.json !== undefined ? { json: opts.json } : {}) });
    });
  t.command('inspect')
    .description('Informational summary of the zero-default promise.')
    .option('--json', 'Emit a structured JSON document on stdout.')
    .action((opts: { json?: boolean }) => {
      runTelemetryInspect({ ...(opts.json !== undefined ? { json: opts.json } : {}) });
    });
}

function registerToolsCommands(program: Command): void {
  const tools = program.command('tools').description('[Catalogue] Operate on the tool registry.');
  tools
    .command('lint')
    .description(
      [
        'Text-based static scan of every tool({...}) registration; per-tool grader + threshold gate (RB-49).',
        '',
        'Grader rubric (40 + 30 + 30 = 100 points):',
        '  description axis (0..40): 0 if missing/placeholder/<20 chars; 16/24/32/40 by length.',
        '  examples axis    (0..30): 0 if none or >5; 12 base + 6 per additional, cap 30; -6 per PII.',
        '  parameter naming (0..30): 30 base; -30/N per ambiguous name; -10/N per numeric suffix.',
        '',
        'Exit codes (CI-friendly):',
        '  0  every tool meets or exceeds --threshold.',
        '  1  at least one tool falls below --threshold.',
        '  2  invocation could not start (config missing, walker failed).',
      ].join('\n'),
    )
    .option('-c, --config <path>', 'Optional tsconfig.json whose include overrides the file glob.')
    .option('--threshold <n>', 'Minimum acceptable per-tool score (default 60).', (v) =>
      Number.parseInt(v, 10),
    )
    .option('--format <fmt>', 'text | json (default text).')
    .option('--source <pattern>', 'File glob override (e.g. src/skills/**/tools/*.ts).')
    .action(
      async (opts: {
        config?: string;
        threshold?: number;
        format?: 'text' | 'json';
        source?: string;
      }) => {
        await runToolsLint({
          ...(opts.config !== undefined ? { config: opts.config } : {}),
          ...(opts.threshold !== undefined ? { threshold: opts.threshold } : {}),
          ...(opts.format !== undefined ? { format: opts.format } : {}),
          ...(opts.source !== undefined ? { source: opts.source } : {}),
        });
      },
    );
}

main().catch((err) => {
  process.stderr.write(`[graphorin/cli] ${(err as Error).message}\n`);
  process.exit(1);
});
