import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AIAssistantPanel } from '../../src/components/ai/AIAssistantPanel';
import { aiService } from '../../src/services/ai.service';

vi.mock('../../src/services/ai.service', () => ({
  aiService: {
    generateText: vi.fn(),
    generateImage: vi.fn(),
    analyzeConsistency: vi.fn(),
    assistCreation: vi.fn(),
    usage: vi.fn(),
  },
}));

const mocked = vi.mocked(aiService);

describe('<AIAssistantPanel />', () => {
  it('runs a mode, renders the response, and forwards Insert clicks', async () => {
    const onAccept = vi.fn();
    mocked.generateText.mockResolvedValue({
      text: '[mock:rewrite] Aldric scowled.',
      mode: 'rewrite',
      model: 'mock-text-v1',
      tokensUsed: { input: 10, output: 4 },
      mocked: true,
    });

    render(
      <AIAssistantPanel
        universeId="u1"
        selection="Aldric grimaced."
        surrounding="paragraphs around"
        onAccept={onAccept}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^rewrite$/i }));

    await waitFor(() => {
      expect(mocked.generateText).toHaveBeenCalledWith(
        expect.objectContaining({ universeId: 'u1', mode: 'rewrite', selection: 'Aldric grimaced.' }),
      );
    });

    expect(await screen.findByText(/Aldric scowled\./)).toBeInTheDocument();
    expect(screen.getByText(/Mock response/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^insert$/i }));
    expect(onAccept).toHaveBeenCalledWith('[mock:rewrite] Aldric scowled.');
  });

  it('shows an empty-issues message when consistency report is clean', async () => {
    mocked.analyzeConsistency.mockResolvedValue({
      issues: [],
      model: 'mock-text-v1',
      tokensUsed: { input: 0, output: 0 },
      mocked: true,
    });

    render(
      <AIAssistantPanel universeId="u1" selection="" surrounding="A small paragraph." />,
    );

    await userEvent.click(screen.getByRole('button', { name: /check consistency/i }));
    expect(await screen.findByText(/No consistency issues detected/i)).toBeInTheDocument();
  });

  it('surfaces API errors', async () => {
    mocked.generateText.mockRejectedValue(new Error('rate limited'));
    render(<AIAssistantPanel universeId="u1" selection="x" />);

    await userEvent.click(screen.getByRole('button', { name: /^expand$/i }));
    expect(await screen.findByText(/rate limited/i)).toBeInTheDocument();
  });
});
