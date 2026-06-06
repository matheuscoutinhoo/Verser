import type { AIMode, UniverseContextBundle } from '@verser/shared';

export interface BuildTextPromptInput {
  mode: AIMode;
  selection?: string;
  instruction?: string;
  surrounding?: string;
  context: UniverseContextBundle;
}

export interface BuildAssistCreationInput {
  entityType:
    | 'character'
    | 'location'
    | 'system'
    | 'lore'
    | 'immutable_law'
    | 'timeline_event';
  brief: string;
  context: UniverseContextBundle;
}

/**
 * Centralises every prompt the AI service emits so they are diff-friendly,
 * unit-testable, and consistent in tone. None of these methods touch I/O.
 */
export class PromptBuilderService {
  buildText(input: BuildTextPromptInput): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = [
      'You are a creative-writing co-pilot embedded in a worldbuilding tool.',
      'You ALWAYS:',
      '- Respect every immutable law of the universe (these are hard constraints).',
      '- Stay consistent with the characters, locations, and systems you are given.',
      '- Preserve the writer\'s voice — return fragments, options, or short prose,',
      '  not full paragraphs that overwrite their work (RN013).',
      '- Never invent contradictions to established lore.',
      this.modeGuidance(input.mode),
    ].join('\n');

    const userPrompt = [
      this.renderContext(input.context),
      '',
      input.surrounding ? `RECENT TEXT:\n${input.surrounding}\n` : '',
      input.selection ? `SELECTED TEXT:\n${input.selection}\n` : '',
      input.instruction ? `WRITER INSTRUCTION:\n${input.instruction}` : '',
      '',
      this.modeUserDirective(input.mode),
    ]
      .filter(Boolean)
      .join('\n');

    return { systemPrompt, userPrompt };
  }

  buildAssistCreation(
    input: BuildAssistCreationInput,
  ): { systemPrompt: string; userPrompt: string } {
    const schema = this.schemaForEntity(input.entityType);
    const systemPrompt = [
      'You are a worldbuilding assistant. Generate a JSON object describing the',
      `requested ${input.entityType.replace('_', ' ')} that fits the universe.`,
      'Output STRICT JSON only — no prose, no markdown fences. Schema:',
      schema,
      'Stay consistent with the immutable laws, existing characters, lore and systems.',
      'Never overwrite or contradict established names — invent fresh ones if needed.',
    ].join('\n');

    const userPrompt = [
      this.renderContext(input.context),
      '',
      'WRITER BRIEF:',
      input.brief,
      '',
      'Return ONLY the JSON object.',
    ].join('\n');

    return { systemPrompt, userPrompt };
  }

  // ── helpers ────────────────────────────────────

  private modeGuidance(mode: AIMode): string {
    switch (mode) {
      case 'rewrite':
        return 'Mode: REWRITE — reformulate the selection preserving meaning and voice. Offer 1-3 short alternatives.';
      case 'expand':
        return 'Mode: EXPAND — add sensory detail, sub-text or beats. Keep it tight; max ~150 words added.';
      case 'brainstorm':
        return 'Mode: BRAINSTORM — return 3-5 numbered ideas as bullets. No prose paragraphs.';
      case 'critique':
        return 'Mode: CRITIQUE — return structured feedback (Strengths / Risks / Suggestions). Never rewrite.';
      default:
        return '';
    }
  }

  private modeUserDirective(mode: AIMode): string {
    switch (mode) {
      case 'rewrite':
        return 'Provide rewrites as a numbered list.';
      case 'expand':
        return 'Append the expansion as a single short paragraph.';
      case 'brainstorm':
        return 'List the ideas as `1.`, `2.`, `3.` …';
      case 'critique':
        return 'Return three sections: ## Strengths, ## Risks, ## Suggestions.';
      default:
        return '';
    }
  }

  private renderContext(ctx: UniverseContextBundle): string {
    const lines: string[] = [];
    lines.push(`UNIVERSE: ${ctx.universe.name}${ctx.universe.genre ? ` (${ctx.universe.genre})` : ''}`);

    if (ctx.laws.length > 0) {
      lines.push('', 'IMMUTABLE LAWS:');
      for (const l of ctx.laws) lines.push(`- [${l.category}] ${l.title}: ${l.description}`);
    }
    if (ctx.characters.length > 0) {
      lines.push('', 'CHARACTERS:');
      for (const c of ctx.characters) {
        const aliases = c.aliases?.length ? ` (aka ${c.aliases.join(', ')})` : '';
        const summary = c.summary ? ` — ${c.summary}` : '';
        lines.push(`- ${c.name}${aliases}${summary}`);
      }
    }
    if (ctx.locations.length > 0) {
      lines.push('', 'LOCATIONS:');
      for (const l of ctx.locations) {
        lines.push(`- ${l.name}${l.summary ? ` — ${l.summary}` : ''}`);
      }
    }
    if (ctx.systems.length > 0) {
      lines.push('', 'SYSTEMS:');
      for (const s of ctx.systems) {
        lines.push(`- ${s.name} (${s.type})${s.summary ? ` — ${s.summary}` : ''}`);
      }
    }
    if (ctx.lore.length > 0) {
      lines.push('', 'LORE:');
      for (const l of ctx.lore) {
        lines.push(`- ${l.title} [${l.importance}] (${l.category}): ${l.content.slice(0, 300)}`);
      }
    }
    return lines.join('\n');
  }

  private schemaForEntity(entityType: BuildAssistCreationInput['entityType']): string {
    switch (entityType) {
      case 'character':
        return '{ "name": string, "aliases": string[], "physicalDesc": string, "personality": string, "backstory": string, "motivations": string, "arc": string, "notes": string }';
      case 'location':
        return '{ "name": string, "description": string, "geography": string, "culture": string, "history": string, "climate": string, "population": string }';
      case 'system':
        return '{ "name": string, "type": string, "description": string, "rules": string, "limitations": string, "interactions": string }';
      case 'lore':
        return '{ "title": string, "category": string, "content": string, "importance": "critical"|"high"|"normal"|"low" }';
      case 'immutable_law':
        return '{ "title": string, "description": string, "category": string }';
      case 'timeline_event':
        return '{ "title": string, "description": string, "date": string }';
      default:
        return '{}';
    }
  }
}
