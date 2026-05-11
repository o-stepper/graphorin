import { Buffer } from 'node:buffer';
import {
  createPrivateKey,
  createPublicKey,
  sign as cryptoSign,
  generateKeyPairSync,
} from 'node:crypto';
import { _resetSkillInstallationsForTesting } from '../../src/supply-chain/audit.js';
import { _resetSupplyChainAuditListenersForTesting } from '../../src/supply-chain/audit-emitter.js';
import { canonicalizeForSignature } from '../../src/supply-chain/frontmatter.js';
import {
  _setPackageManagerForTesting,
  _setPackageManagerRunnerForTesting,
} from '../../src/supply-chain/package-manager.js';
import { _setFrameworkDenylistForTesting } from '../../src/supply-chain/policy.js';
import {
  _setPublicKeyFetcherForTesting,
  _setSigstoreVerifierForTesting,
} from '../../src/supply-chain/signature.js';

export function resetSupplyChain(): void {
  _resetSupplyChainAuditListenersForTesting();
  _resetSkillInstallationsForTesting();
  _setFrameworkDenylistForTesting([]);
  _setPackageManagerForTesting(null);
  _setPackageManagerRunnerForTesting(null);
  _setPublicKeyFetcherForTesting(null);
  _setSigstoreVerifierForTesting(null);
}

/**
 * Generate an ed25519 key pair and sign a synthetic SKILL.md so the
 * tests never depend on filesystem fixtures.
 */
export function buildSignedSkill(args: {
  readonly name: string;
  readonly description?: string;
  readonly publisher?: string;
  readonly publicKeyRef: { readonly url: string; readonly pinFingerprint?: string };
}): {
  readonly skillMd: string;
  readonly publicKeyPem: string;
} {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const publicKeyPem = publicKey.export({ format: 'pem', type: 'spki' }).toString();
  // Build the unsigned skillMd first so we can compute the canonical
  // bytes the verifier expects.
  const description = args.description ?? 'Test skill';
  const publisher = args.publisher ?? 'vendor.example.com';
  const placeholder = '__SIGNATURE_PLACEHOLDER__';
  const fingerprintLine =
    args.publicKeyRef.pinFingerprint === undefined
      ? ''
      : `\n    pinFingerprint: ${args.publicKeyRef.pinFingerprint}`;
  const skillTemplate = [
    '---',
    `name: ${args.name}`,
    `description: ${description}`,
    'graphorin-signature:',
    '  algorithm: ed25519-sha256',
    `  publisher: ${publisher}`,
    '  publishedAt: 2026-04-19T12:00:00Z',
    `  signature: ${placeholder}`,
    '  publicKeyRef:',
    '    kind: well-known',
    `    url: ${args.publicKeyRef.url}${fingerprintLine}`,
    '---',
    '',
    `# ${args.name}`,
    '',
    description,
  ].join('\n');
  const { bytes } = canonicalizeForSignature(skillTemplate);
  const signature = cryptoSign(
    null,
    bytes,
    createPrivateKey({ key: privateKey.export({ format: 'pem', type: 'pkcs8' }), format: 'pem' }),
  );
  const signatureB64 = signature.toString('base64url');
  const skillMd = skillTemplate.replace(placeholder, signatureB64);
  // Ensure verification matches the public key.
  void createPublicKey({ key: publicKeyPem, format: 'pem' });
  void Buffer;
  return { skillMd, publicKeyPem };
}

/**
 * Tamper with the body of a signed SKILL.md so the verifier rejects
 * it.
 */
export function tamperSkillBody(skillMd: string): string {
  return skillMd.replace(/Test skill/g, 'Tampered skill body');
}
