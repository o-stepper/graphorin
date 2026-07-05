import { describe, expect, it } from 'vitest';
import { createMemory } from '../src/index.js';
import {
  createInMemoryStore,
  createStubEmbedder,
  InMemoryEmbeddingRegistry,
} from './fixtures/in-memory-store.js';

const SCOPE = { userId: 'alex' };

const FIXTURES: ReadonlyArray<{
  readonly locale: string;
  readonly text: string;
  readonly query: string;
}> = [
  { locale: 'en', text: 'Loves mountain hiking and fresh espresso.', query: 'mountain' },
  {
    locale: 'es',
    text: 'Le gusta el senderismo en la montaña y el café espresso.',
    query: 'montaña',
  },
  { locale: 'fr', text: "Aime la randonnée en montagne et l'espresso frais.", query: 'randonnée' },
  { locale: 'de', text: 'Liebt Bergwandern und frischen Espresso.', query: 'Bergwandern' },
  { locale: 'pt', text: 'Adora caminhadas na montanha e café expresso.', query: 'caminhadas' },
];

describe('@graphorin/memory - multilingual fixtures', () => {
  it('semantic search retrieves facts written in any of the bundled fixture locales', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
    });
    for (const fixture of FIXTURES) {
      await memory.semantic.remember(SCOPE, {
        text: fixture.text,
        tags: [`locale:${fixture.locale}`],
      });
    }
    for (const fixture of FIXTURES) {
      const hits = await memory.semantic.search(SCOPE, fixture.query);
      expect(hits.some((h) => h.record.text === fixture.text)).toBe(true);
    }
  });
});
