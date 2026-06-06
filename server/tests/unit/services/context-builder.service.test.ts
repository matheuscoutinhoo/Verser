import { prisma } from '../../../src/config/database';
import { ContextBuilderService } from '../../../src/layers/services/context-builder.service';
import { CharacterRepository } from '../../../src/layers/repositories/character.repository';
import { ImmutableLawRepository } from '../../../src/layers/repositories/immutable-law.repository';
import { LocationRepository } from '../../../src/layers/repositories/location.repository';
import { LoreEntryRepository } from '../../../src/layers/repositories/lore-entry.repository';
import { UniverseRepository } from '../../../src/layers/repositories/universe.repository';
import { WorldSystemRepository } from '../../../src/layers/repositories/world-system.repository';
import { createTestUser } from '../../helpers/factories';

function buildService() {
  return new ContextBuilderService({
    universeRepo: new UniverseRepository(prisma),
    characterRepo: new CharacterRepository(prisma),
    locationRepo: new LocationRepository(prisma),
    systemRepo: new WorldSystemRepository(prisma),
    loreRepo: new LoreEntryRepository(prisma),
    lawRepo: new ImmutableLawRepository(prisma),
  });
}

async function seedUniverse() {
  const { user } = await createTestUser();
  const universe = await prisma.universe.create({
    data: { userId: user.id, name: 'Aetherfall', genre: 'fantasy' },
  });

  await prisma.immutableLaw.createMany({
    data: [
      {
        universeId: universe.id,
        title: 'Magic Costs Memory',
        description: 'Casting magic erases a proportional amount of the caster\'s memory.',
        category: 'magic',
      },
      {
        universeId: universe.id,
        title: 'No Resurrection',
        description: 'The dead cannot return.',
        category: 'divine',
      },
    ],
  });

  await prisma.character.create({
    data: {
      universeId: universe.id,
      name: 'Aldric the Gray',
      aliases: JSON.stringify(['Gray Wolf']),
      personality: 'stoic',
      backstory: 'a former soldier turned mage who burned his memories of war',
    },
  });
  await prisma.character.create({
    data: { universeId: universe.id, name: 'Mira', personality: 'curious' },
  });

  await prisma.location.create({
    data: { universeId: universe.id, name: 'Vael', description: 'sprawling city on the cliffs' },
  });

  await prisma.worldSystem.create({
    data: { universeId: universe.id, name: 'Memory Magic', type: 'magic', rules: 'consumes memory' },
  });

  await prisma.loreEntry.createMany({
    data: [
      {
        universeId: universe.id,
        title: 'The First War',
        category: 'history',
        content: 'A long war ended in tragedy.',
        importance: 'critical',
      },
      {
        universeId: universe.id,
        title: 'A minor custom',
        category: 'culture',
        content: 'unimportant detail',
        importance: 'low',
      },
    ],
  });

  return universe;
}

describe('ContextBuilderService', () => {
  it('always includes immutable laws regardless of query (RN002)', async () => {
    const universe = await seedUniverse();
    const ctx = await buildService().build(universe.id, { query: 'sunny day' });

    expect(ctx.laws).toHaveLength(2);
    expect(ctx.laws.map((l) => l.title)).toEqual(
      expect.arrayContaining(['Magic Costs Memory', 'No Resurrection']),
    );
  });

  it('filters lore by importance (critical+high by default, RN006)', async () => {
    const universe = await seedUniverse();
    const ctx = await buildService().build(universe.id);
    expect(ctx.lore.map((l) => l.title)).toContain('The First War');
    expect(ctx.lore.map((l) => l.title)).not.toContain('A minor custom');
  });

  it('scores entities by keyword overlap with the query', async () => {
    const universe = await seedUniverse();
    const ctx = await buildService().build(universe.id, { query: 'Aldric burned memories' });
    expect(ctx.characters[0]?.name).toBe('Aldric the Gray');
  });

  it('respects the token budget', async () => {
    const universe = await seedUniverse();
    const ctx = await buildService().build(universe.id, { maxTokens: 200 });
    expect(ctx.estimatedTokens).toBeLessThanOrEqual(220); // small overshoot tolerance
  });

  it('throws when universe does not exist', async () => {
    await expect(buildService().build('nope')).rejects.toThrow(/not found/);
  });
});
