import { describe, expect, it } from 'vitest';

import { lintSource } from './_lint.js';

describe('@graphorin/no-secret-in-deps', () => {
  it('flags a non-empty inheritSecrets without a justification comment', () => {
    const messages = lintSource({
      source: `
        const subTool = agent.toTool({
          name: 'sub',
          inheritSecrets: ['openai_api_key'],
        });
      `,
      rule: 'no-secret-in-deps',
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe('missingJustification');
  });

  it('passes when inheritSecrets is empty', () => {
    const messages = lintSource({
      source: `
        const subTool = agent.toTool({
          name: 'sub',
          inheritSecrets: [],
        });
      `,
      rule: 'no-secret-in-deps',
    });
    expect(messages).toEqual([]);
  });

  it('passes when inheritSecrets is non-empty but a justification comment is present', () => {
    const messages = lintSource({
      source: `
        // rb-24-justification: subagent calls OpenAI for translation
        const subTool = agent.toTool({
          name: 'sub',
          inheritSecrets: ['openai_api_key'],
        });
      `,
      rule: 'no-secret-in-deps',
    });
    expect(messages).toEqual([]);
  });

  it('passes when the justification comment lives inside the call', () => {
    const messages = lintSource({
      source: `
        const subTool = agent.toTool({
          // rb-24-justification: subagent shares parent secrets for X reason
          name: 'sub',
          inheritSecrets: ['openai_api_key'],
        });
      `,
      rule: 'no-secret-in-deps',
    });
    expect(messages).toEqual([]);
  });

  it('ignores calls that are not toTool', () => {
    const messages = lintSource({
      source: `
        const config = { inheritSecrets: ['openai_api_key'] };
        agent.run({ inheritSecrets: ['openai_api_key'] });
      `,
      rule: 'no-secret-in-deps',
    });
    expect(messages).toEqual([]);
  });
});
