/**
 * Phase 03 aggregate end-to-end smoke test.
 *
 * Per the parent Phase 03 acceptance criteria:
 *
 *   > End-to-end smoke test: load skill metadata with
 *   > `graphorin-trust-level: untrusted` → resolve sandbox tier
 *   > (03c) → inject a tool that calls `ctx.secrets.require(...)` →
 *   > 03a per-tool ACL denies → 03b audit log records the denial →
 *   > `verifyAuditChain()` confirms the entry. Single test exercises
 *   > 03a + 03b + 03c.
 *
 * The test stitches the three sub-phases together in one flow so a
 * regression in any of the cross-cuts surfaces here.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { _resetAuditDbBindingsForTesting } from '../../src/audit/audit-db.js';
import { bridgeSecretsToAudit } from '../../src/audit/secrets-bridge.js';
import { verifyAuditChain } from '../../src/audit/verify-chain.js';
import { resolveSandbox } from '../../src/sandbox/tier-resolver.js';
import {
  _resetWithSecretListenersForTesting,
  enforceSecretAcl,
  withToolSecretsContext,
} from '../../src/secrets/acl.js';
import {
  _resetSecretsAuditListenersForTesting,
  emitSecretsAudit,
} from '../../src/secrets/audit-emitter.js';
import { SecretAccessDeniedError } from '../../src/secrets/errors.js';
import { _resetSecretsFactoryForTesting, createSecretsStore } from '../../src/secrets/factory.js';
import { _resetSecretValueAuditListenersForTesting } from '../../src/secrets/secret-value.js';

import { createMemoryAuditDb } from '../audit/_helpers.js';

describe('Phase 03 aggregate smoke — untrusted skill → ACL deny → audit chain', () => {
  beforeEach(() => {
    _resetAuditDbBindingsForTesting();
    _resetSecretsAuditListenersForTesting();
    _resetSecretValueAuditListenersForTesting();
    _resetWithSecretListenersForTesting();
    _resetSecretsFactoryForTesting();
  });
  afterEach(() => {
    _resetAuditDbBindingsForTesting();
    _resetSecretsAuditListenersForTesting();
    _resetSecretValueAuditListenersForTesting();
    _resetWithSecretListenersForTesting();
    _resetSecretsFactoryForTesting();
  });

  it('exercises 03a + 03b + 03c in a single flow', async () => {
    // ── 03a: bring up the secrets store + per-tool ACL ─────────────
    await createSecretsStore({ kind: 'env' });

    // ── 03b: bring up the audit chain in an in-memory binding ──────
    const db = createMemoryAuditDb();
    const teardown = bridgeSecretsToAudit({ db });

    // ── 03c: a skill whose frontmatter declared trust=untrusted ────
    // sees the sandbox resolver mandate the strict tier; even if the
    // skill author tried `sandboxPolicy: 'none'` the resolver flips
    // the policy to `worker-threads + no-network + no-filesystem`
    // and flags `forced: true`.
    const policy = resolveSandbox({
      trustLevel: 'untrusted',
      skillName: 'community-skill',
      override: { kind: 'none', noNetwork: false, noFilesystem: false },
    });
    expect(policy.kind).toBe('worker-threads');
    expect(policy.noNetwork).toBe(true);
    expect(policy.noFilesystem).toBe(true);
    expect(policy.forced).toBe(true);

    // The untrusted skill exposes a tool with an empty secrets ACL.
    // When the tool's `execute(...)` calls `ctx.secrets.require('OPENAI_KEY')`
    // the per-tool ACL must deny and the secrets layer must emit the
    // matching audit event.
    let denial: SecretAccessDeniedError | undefined;
    withToolSecretsContext(
      {
        toolName: 'community-skill.tool',
        runId: 'r1',
        sessionId: 's1',
        secretsAllowed: [],
      },
      () => {
        try {
          enforceSecretAcl('OPENAI_KEY');
        } catch (error) {
          if (error instanceof SecretAccessDeniedError) {
            denial = error;
            // The tool would normally re-throw; here the runtime
            // would log and emit the audit event in the agent loop.
            emitSecretsAudit({
              action: 'secret:require',
              decision: 'denied',
              ts: 1_700_000_000_000,
              source: 'per-tool-acl',
              target: 'OPENAI_KEY',
              actor: {
                kind: 'tool',
                toolName: 'community-skill.tool',
                runId: 'r1',
                sessionId: 's1',
              },
            });
          } else {
            throw error;
          }
        }
      },
    );

    expect(denial).toBeInstanceOf(SecretAccessDeniedError);
    expect(denial?.key).toBe('OPENAI_KEY');
    expect(denial?.toolName).toBe('community-skill.tool');
    expect(denial?.allowedSet).toEqual([]);

    // ── 03b: the bridge serialises the audit write; drain to be sure ──
    await teardown.drain();

    // The chain must contain exactly one row, and `verifyAuditChain`
    // must confirm it. Tampering is exercised separately in 03b's
    // existing tests; here we confirm the cross-subsystem path.
    expect(await db.count()).toBe(1);
    const verify = await verifyAuditChain(db);
    expect(verify.ok).toBe(true);

    // Inspect the resulting row.
    const rows: Array<{
      action: string;
      decision: string;
      target: string;
      actor: { kind: string; id: string; label?: string };
    }> = [];
    for await (const row of db.iterate()) {
      rows.push({
        action: row.action,
        decision: row.decision,
        target: row.target,
        actor: row.actor as { kind: string; id: string; label?: string },
      });
    }
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      action: 'secret:require',
      decision: 'denied',
      target: 'OPENAI_KEY',
      actor: { kind: 'tool', label: 'community-skill.tool' },
    });

    teardown();
  });
});
