import { useCallback, useState } from 'react';
import type {
  AIGenerateTextResponse,
  AIAnalyzeConsistencyResponse,
  AIMode,
  ConsistencyIssue,
} from '@verser/shared';
import { Button } from '../ui/Button';
import { aiService } from '../../services/ai.service';

export interface AIAssistantPanelProps {
  universeId: string;
  /** Currently-selected text in the editor (or empty). */
  selection: string;
  /** Recent paragraphs around the cursor — for narrative context. */
  surrounding?: string;
  /** Writing being edited — used for AI usage attribution. */
  writingId?: string;
  /** Called when the user accepts a suggestion. The receiver decides how to apply it. */
  onAccept?: (text: string) => void;
}

type View = 'idle' | 'busy' | 'text' | 'consistency';

interface State {
  view: View;
  mode: AIMode;
  result: AIGenerateTextResponse | null;
  consistency: AIAnalyzeConsistencyResponse | null;
  error: string | null;
  instruction: string;
}

const INITIAL: State = {
  view: 'idle',
  mode: 'rewrite',
  result: null,
  consistency: null,
  error: null,
  instruction: '',
};

const MODES: Array<{ value: AIMode; label: string; help: string }> = [
  { value: 'rewrite', label: 'Rewrite', help: 'Reformulate the selected text (1-3 alternatives).' },
  { value: 'expand', label: 'Expand', help: 'Add sensory detail and sub-text to the selection.' },
  { value: 'brainstorm', label: 'Brainstorm', help: 'List 3-5 ideas for the next beat.' },
  { value: 'critique', label: 'Critique', help: 'Structured feedback (Strengths / Risks / Suggestions).' },
];

const SEVERITY_GLYPH: Record<ConsistencyIssue['severity'], string> = {
  critical: '🛑',
  warning: '⚠️',
  info: '💡',
};

export function AIAssistantPanel({
  universeId,
  selection,
  surrounding,
  writingId,
  onAccept,
}: AIAssistantPanelProps) {
  const [state, setState] = useState<State>(INITIAL);

  const runMode = useCallback(
    async (mode: AIMode) => {
      setState((s) => ({ ...s, view: 'busy', mode, result: null, error: null }));
      try {
        const result = await aiService.generateText({
          universeId,
          mode,
          selection: selection || undefined,
          surrounding,
          instruction: state.instruction || undefined,
          writingId,
        });
        setState((s) => ({ ...s, view: 'text', result }));
      } catch (err) {
        setState((s) => ({
          ...s,
          view: 'idle',
          error: err instanceof Error ? err.message : 'AI request failed',
        }));
      }
    },
    [universeId, selection, surrounding, writingId, state.instruction],
  );

  const runConsistency = useCallback(async () => {
    if (!surrounding && !selection) {
      setState((s) => ({ ...s, error: 'Select text or write a paragraph first.' }));
      return;
    }
    setState((s) => ({ ...s, view: 'busy', consistency: null, error: null }));
    try {
      const result = await aiService.analyzeConsistency({
        universeId,
        writingId,
        text: selection || surrounding || '',
      });
      setState((s) => ({ ...s, view: 'consistency', consistency: result }));
    } catch (err) {
      setState((s) => ({
        ...s,
        view: 'idle',
        error: err instanceof Error ? err.message : 'Consistency check failed',
      }));
    }
  }, [universeId, selection, surrounding, writingId]);

  return (
    <aside className="surface-card flex h-full flex-col gap-4 p-5">
      <header>
        <p className="font-ui text-[10px] uppercase tracking-[0.25em] text-text-secondary">
          AI Assistant
        </p>
        <h2 className="mt-0.5 font-display text-base text-text-primary">
          Co-pilot
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-text-secondary">
          Suggestions stay consistent with your worldbuilding. You always have the final word.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        {MODES.map((m) => (
          <Button
            key={m.value}
            variant={state.mode === m.value ? 'primary' : 'secondary'}
            size="sm"
            disabled={state.view === 'busy'}
            title={m.help}
            onClick={() => void runMode(m.value)}
          >
            {m.label}
          </Button>
        ))}
      </div>

      <div className="space-y-1">
        <label className="font-ui text-xs uppercase tracking-wider text-text-secondary">
          Instruction (optional)
        </label>
        <textarea
          className="min-h-[60px] w-full rounded-md border border-border-primary bg-bg-tertiary px-2 py-1 text-sm text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
          placeholder="e.g. make it darker; keep it in present tense"
          value={state.instruction}
          onChange={(e) => setState((s) => ({ ...s, instruction: e.target.value }))}
        />
      </div>

      <Button
        variant="secondary"
        size="sm"
        disabled={state.view === 'busy'}
        onClick={() => void runConsistency()}
      >
        Check consistency
      </Button>

      <div className="ornate-divider" />

      <div className="flex-1 overflow-auto rounded-md border border-border-primary bg-bg-primary p-3 text-sm text-text-primary">
        {state.view === 'busy' ? (
          <p className="text-text-secondary">Thinking…</p>
        ) : state.error ? (
          <p className="text-accent-red">{state.error}</p>
        ) : state.view === 'text' && state.result ? (
          <SuggestionView result={state.result} onAccept={onAccept} />
        ) : state.view === 'consistency' && state.consistency ? (
          <ConsistencyView report={state.consistency} />
        ) : (
          <p className="text-text-secondary">
            Select a passage and pick a mode. Or just provide an instruction and click Brainstorm.
          </p>
        )}
      </div>
    </aside>
  );
}

function SuggestionView({
  result,
  onAccept,
}: {
  result: AIGenerateTextResponse;
  onAccept?: (text: string) => void;
}) {
  return (
    <div className="space-y-3">
      {result.mocked ? (
        <p className="rounded border-l-2 border-accent-gold bg-bg-secondary px-2 py-1 text-xs text-text-secondary">
          Mock response — set <code>ABACUS_AI_API_KEY</code> for real suggestions.
        </p>
      ) : null}
      <pre className="whitespace-pre-wrap font-ui text-sm leading-relaxed text-text-primary">
        {result.text}
      </pre>
      <div className="flex justify-end gap-2 text-xs text-text-muted">
        <span>
          {result.model} · {result.tokensUsed.input}+{result.tokensUsed.output} tokens
        </span>
        {onAccept ? (
          <Button size="sm" onClick={() => onAccept(result.text)}>
            Insert
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ConsistencyView({ report }: { report: AIAnalyzeConsistencyResponse }) {
  if (report.issues.length === 0) {
    return (
      <p className="text-sm text-accent-green">
        ✅ No consistency issues detected against the immutable laws & lore.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {report.issues.map((issue, idx) => (
        <li key={idx} className="rounded border border-border-primary p-2">
          <p className="text-sm">
            <span className="mr-1">{SEVERITY_GLYPH[issue.severity]}</span>
            <strong className="text-text-accent">{issue.type.replace('_', ' ')}</strong>
            <span className="text-text-secondary"> · {issue.severity}</span>
          </p>
          {issue.excerpt ? (
            <blockquote className="mt-1 border-l-2 border-border-ornate pl-2 text-xs italic text-text-secondary">
              {issue.excerpt}
            </blockquote>
          ) : null}
          <p className="mt-1 text-sm text-text-primary">{issue.description}</p>
          {issue.suggestion ? (
            <p className="mt-1 text-xs text-text-muted">↳ {issue.suggestion}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
