import { describe, expect, it } from 'vitest';

import { lintSource } from './_lint.js';

describe('@graphorin/no-secret-in-deps', () => {
  it('flags a non-empty secretsAllowed without a justification comment', () => {
    const messages = lintSource({
      source: `
        const out = withChildToolSecretsContext({
          toolName: 'refund.create',
          secretsAllowed: ['keyring:payments_api_key'],
        }, () => run());
      `,
      rule: 'no-secret-in-deps',
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe('missingJustification');
  });

  it('flags the namespaced call form too', () => {
    const messages = lintSource({
      source: `
        const out = acl.withChildToolSecretsContext({
          toolName: 'refund.create',
          secretsAllowed: ['keyring:payments_api_key'],
        }, () => run());
      `,
      rule: 'no-secret-in-deps',
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe('missingJustification');
  });

  it('passes when secretsAllowed is empty', () => {
    const messages = lintSource({
      source: `
        const out = withChildToolSecretsContext({
          toolName: 'refund.create',
          secretsAllowed: [],
        }, () => run());
      `,
      rule: 'no-secret-in-deps',
    });
    expect(messages).toEqual([]);
  });

  it('passes when secretsAllowed is non-empty but a justification comment is present', () => {
    const messages = lintSource({
      source: `
        // rb-24-justification: refund tool needs the payments key for the PSP call
        const out = withChildToolSecretsContext({
          toolName: 'refund.create',
          secretsAllowed: ['keyring:payments_api_key'],
        }, () => run());
      `,
      rule: 'no-secret-in-deps',
    });
    expect(messages).toEqual([]);
  });

  it('passes when the justification comment lives inside the call', () => {
    const messages = lintSource({
      source: `
        const out = withChildToolSecretsContext({
          // rb-24-justification: child scope shares the payments key for X reason
          toolName: 'refund.create',
          secretsAllowed: ['keyring:payments_api_key'],
        }, () => run());
      `,
      rule: 'no-secret-in-deps',
    });
    expect(messages).toEqual([]);
  });

  it('ignores calls that are not withChildToolSecretsContext', () => {
    const messages = lintSource({
      source: `
        const config = { secretsAllowed: ['keyring:payments_api_key'] };
        agent.run({ secretsAllowed: ['keyring:payments_api_key'] });
        withToolSecretsContext({ toolName: 't', secretsAllowed: ['keyring:k'] }, () => run());
      `,
      rule: 'no-secret-in-deps',
    });
    expect(messages).toEqual([]);
  });

  it('does not flag the retired pre-0.5 toTool inheritSecrets shape', () => {
    // The API this rule used to match no longer exists; matching it again
    // would only lint dead code. Guard against a regression to the old shape.
    const messages = lintSource({
      source: `
        const subTool = agent.toTool({
          name: 'sub',
          inheritSecrets: ['openai_api_key'],
        });
      `,
      rule: 'no-secret-in-deps',
    });
    expect(messages).toEqual([]);
  });
});
