import { describe, expect, it } from 'vitest';

import * as security from '../../src/index.js';

describe('@graphorin/security barrel exports', () => {
  it('re-exports the canonical version constant', () => {
    expect(security.VERSION).toBe('0.5.0');
  });

  it('re-exports the SecretValue wrapper class', () => {
    expect(typeof security.SecretValue).toBe('function');
  });

  it('re-exports the SecretRef parser surface', () => {
    expect(typeof security.parseSecretRef).toBe('function');
    expect(typeof security.validateSecretRefs).toBe('function');
    expect(typeof security.parseAuthority).toBe('function');
  });

  it('re-exports every built-in resolver', () => {
    expect(security.envResolver.scheme).toBe('env');
    expect(security.fileResolver.scheme).toBe('file');
    expect(security.encryptedFileResolver.scheme).toBe('encrypted-file');
    expect(security.keyringResolver.scheme).toBe('keyring');
    expect(security.literalResolver.scheme).toBe('literal');
    expect(security.refResolver.scheme).toBe('ref');
    expect(security.vaultResolver.scheme).toBe('vault');
  });

  it('re-exports every built-in SecretsStore', () => {
    expect(typeof security.MemorySecretsStore).toBe('function');
    expect(typeof security.EnvSecretsStore).toBe('function');
    expect(typeof security.KeyringSecretsStore).toBe('function');
    expect(typeof security.EncryptedFileSecretsStore).toBe('function');
  });

  it('re-exports the factory and ACL surface', () => {
    expect(typeof security.createSecretsStore).toBe('function');
    expect(typeof security.composeChain).toBe('function');
    expect(typeof security.detectHeadless).toBe('function');
    expect(typeof security.withSecret).toBe('function');
    expect(typeof security.enforceSecretAcl).toBe('function');
  });

  it('re-exports the auth surface', () => {
    expect(typeof security.generateRawToken).toBe('function');
    expect(typeof security.parseToken).toBe('function');
    expect(typeof security.verifyOffline).toBe('function');
    expect(typeof security.parseScope).toBe('function');
    expect(typeof security.scopeMatches).toBe('function');
    expect(typeof security.TokenVerifier).toBe('function');
    expect(typeof security.verifyToken).toBe('function');
    expect(typeof security.createToken).toBe('function');
    expect(typeof security.revokeToken).toBe('function');
    expect(typeof security.rotateToken).toBe('function');
    // SPL-10: rotatePepper removed (impossible mechanism) - rekeyTokens is the rotation.
    expect('rotatePepper' in security).toBe(false);
    expect(typeof security.rekeyTokens).toBe('function');
    expect(typeof security.generatePepper).toBe('function');
    expect(security.DEFAULT_TOKEN_PREFIX).toBe('gph');
    expect(Array.isArray(security.SCOPE_CATALOGUE)).toBe(true);
  });

  it('re-exports the audit-log surface', () => {
    expect(typeof security.appendAudit).toBe('function');
    expect(typeof security.verifyAuditChain).toBe('function');
    expect(typeof security.pruneAudit).toBe('function');
    expect(typeof security.exportAudit).toBe('function');
    expect(typeof security.bridgeSecretsToAudit).toBe('function');
    expect(typeof security.bridgeMemoryGuardToAudit).toBe('function');
    expect(typeof security.openAuditDb).toBe('function');
    expect(typeof security.registerAuditDbBinding).toBe('function');
    expect(typeof security.computeAuditHash).toBe('function');
    expect(security.GENESIS_PREV_HASH).toBe('0'.repeat(64));
  });

  it('re-exports the sandbox surface', () => {
    expect(typeof security.createNoneSandbox).toBe('function');
    expect(typeof security.createWorkerThreadsSandbox).toBe('function');
    expect(typeof security.createIsolatedVMSandbox).toBe('function');
    expect(typeof security.createDockerSandbox).toBe('function');
    expect(typeof security.resolveSandbox).toBe('function');
    expect(typeof security.DEFAULT_TIMEOUTS_MS).toBe('object');
    expect(typeof security.DEFAULT_MEMORY_LIMITS_MB).toBe('object');
  });

  it('re-exports the memory-modification guard surface', () => {
    expect(typeof security.classifyTool).toBe('function');
    expect(typeof security.createGuard).toBe('function');
    expect(typeof security.createNoGuard).toBe('function');
    expect(typeof security.createApiBoundaryGuard).toBe('function');
    expect(typeof security.createAuditOnlyGuard).toBe('function');
    expect(typeof security.createStrictFullGuard).toBe('function');
    expect(typeof security.guardVariantForTier).toBe('function');
    expect(typeof security.xxhash32).toBe('function');
    expect(typeof security.emitMemoryGuardAudit).toBe('function');
    expect(typeof security.onMemoryGuardAudit).toBe('function');
  });

  it('re-exports the guardrails surface', () => {
    expect(typeof security.defineInputGuardrail).toBe('function');
    expect(typeof security.defineOutputGuardrail).toBe('function');
    expect(typeof security.composeGuardrails).toBe('function');
    expect(typeof security.guardrails).toBe('object');
    expect(typeof security.guardrails.maxLength).toBe('function');
    expect(typeof security.guardrails.promptInjectionHeuristics).toBe('function');
    expect(typeof security.guardrails.piiDetection).toBe('function');
    expect(typeof security.guardrails.languageWhitelist).toBe('function');
    expect(typeof security.guardrails.llmModeration).toBe('function');
    expect(typeof security.guardrails.outputModeration).toBe('function');
    expect(typeof security.guardrails.toolUsageValidator).toBe('function');
    expect(Array.isArray(security.DEFAULT_INJECTION_PATTERNS)).toBe(true);
    expect(Array.isArray(security.DEFAULT_PII_PATTERNS)).toBe(true);
    expect(typeof security.detectLanguage).toBe('function');
  });

  it('re-exports the hardening surface', () => {
    expect(typeof security.applyProcessHardening).toBe('function');
    expect(typeof security.getHardeningStatus).toBe('function');
    expect(typeof security.ensureFileMode).toBe('function');
    expect(typeof security.ensureDirMode).toBe('function');
    expect(typeof security.verifyFileMode).toBe('function');
    expect(typeof security.checkPerms).toBe('function');
    expect(typeof security.checkSecrets).toBe('function');
    expect(typeof security.checkEncryption).toBe('function');
    expect(typeof security.checkSystemd).toBe('function');
    expect(typeof security.generateBootstrapToken).toBe('function');
    expect(typeof security.generateAesSalt).toBe('function');
    expect(typeof security.encodeBase62).toBe('function');
    expect(typeof security.parseSystemdScore).toBe('function');
  });
});
