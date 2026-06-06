import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CharactersManager } from '../../src/components/worldbuilding/managers/CharactersManager';
import { charactersService } from '../../src/services/worldbuilding.service';

vi.mock('../../src/services/worldbuilding.service', () => ({
  charactersService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    uploadImage: vi.fn(),
  },
  characterRelationsService: {},
  locationsService: {},
  systemsService: {},
  loreService: {},
  lawsService: {},
  timelineService: {},
  tagsService: {},
}));

const mocked = vi.mocked(charactersService);

describe('<CharactersManager />', () => {
  it('lists characters returned by the service', async () => {
    mocked.list.mockResolvedValue({
      items: [
        {
          id: 'c1',
          universeId: 'u1',
          name: 'Aldric',
          aliases: ['Gray Wolf'],
          physicalDesc: null,
          personality: 'stoic',
          backstory: null,
          motivations: null,
          skills: null,
          notes: null,
          imageUrl: null,
          imageStyle: null,
          customFields: {},
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    });

    render(<CharactersManager universeId="u1" />);

    expect(await screen.findByText('Aldric')).toBeInTheDocument();
    expect(screen.getByText(/Gray Wolf/i)).toBeInTheDocument();
  });

  it('creates a new character via the form', async () => {
    mocked.list.mockResolvedValue({ items: [], total: 0, page: 1, limit: 100, totalPages: 1 });
    mocked.create.mockResolvedValue({
      id: 'c-new',
      universeId: 'u1',
      name: 'New',
      aliases: [],
      physicalDesc: null,
      personality: null,
      backstory: null,
      motivations: null,
      skills: null,
      notes: null,
      imageUrl: null,
      imageStyle: null,
      customFields: {},
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });

    render(<CharactersManager universeId="u1" />);

    // Wait for the empty state then click the action button.
    const addButton = await screen.findByRole('button', { name: /add character/i });
    await userEvent.click(addButton);

    const nameInput = await screen.findByLabelText('Name');
    await userEvent.type(nameInput, 'New');
    await userEvent.click(screen.getByRole('button', { name: /create character/i }));

    await waitFor(() => {
      expect(mocked.create).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ name: 'New' }),
      );
    });
  });

  it('surfaces an error when listing fails', async () => {
    mocked.list.mockRejectedValue(new Error('boom'));
    render(<CharactersManager universeId="u1" />);
    expect(await screen.findByText('boom')).toBeInTheDocument();
  });
});
