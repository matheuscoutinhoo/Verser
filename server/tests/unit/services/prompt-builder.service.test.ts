import { PromptBuilderService } from '../../../src/layers/services/prompt-builder.service';
import type { UniverseContextBundle } from '@verser/shared';

const ctx: UniverseContextBundle = {
  universe: { id: 'u1', name: 'Aetherfall', genre: 'fantasy' },
  laws: [{ title: 'Magic Costs Memory', description: 'erases memory', category: 'magic' }],
  characters: [{ id: 'c1', name: 'Aldric', aliases: ['Gray Wolf'], summary: 'stoic mage' }],
  locations: [{ id: 'l1', name: 'Vael', summary: 'cliff city' }],
  systems: [{ id: 's1', name: 'Memory Magic', type: 'magic', summary: 'costs memory' }],
  lore: [
    {
      id: 'lore1',
      title: 'First War',
      category: 'history',
      content: 'A long war ended in tragedy.',
      importance: 'critical',
    },
  ],
  estimatedTokens: 200,
};

describe('PromptBuilderService.buildText', () => {
  const builder = new PromptBuilderService();

  it('includes laws, characters and lore in the user prompt', () => {
    const { systemPrompt, userPrompt } = builder.buildText({
      mode: 'rewrite',
      selection: 'Aldric grimaced.',
      context: ctx,
    });
    expect(systemPrompt).toContain('REWRITE');
    expect(userPrompt).toContain('Magic Costs Memory');
    expect(userPrompt).toContain('Aldric');
    expect(userPrompt).toContain('First War');
    expect(userPrompt).toContain('SELECTED TEXT');
  });

  it.each(['rewrite', 'expand', 'brainstorm', 'critique'] as const)(
    'tailors the system guidance for mode %s',
    (mode) => {
      const { systemPrompt } = builder.buildText({ mode, context: ctx });
      expect(systemPrompt.toUpperCase()).toContain(mode.toUpperCase());
    },
  );
});

describe('PromptBuilderService.buildAssistCreation', () => {
  const builder = new PromptBuilderService();

  it('produces a JSON-only system prompt for character creation', () => {
    const { systemPrompt, userPrompt } = builder.buildAssistCreation({
      entityType: 'character',
      brief: 'an aged mage mentor, mysterious and distant',
      context: ctx,
    });
    expect(systemPrompt).toMatch(/JSON/i);
    expect(systemPrompt).toContain('"name"');
    expect(userPrompt).toContain('aged mage mentor');
  });

  it('switches schemas per entity type', () => {
    const law = builder.buildAssistCreation({
      entityType: 'immutable_law',
      brief: 'no time travel',
      context: ctx,
    });
    expect(law.systemPrompt).toContain('"description"');
    expect(law.systemPrompt).not.toContain('"backstory"');
  });
});
