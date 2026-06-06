import { prisma } from '../src/config/database';

beforeEach(async () => {
  // Truncate in reverse FK order. Keep this list in sync with prisma schema.
  await prisma.aIUsageLog.deleteMany();
  await prisma.writingVersion.deleteMany();
  await prisma.writing.deleteMany();
  await prisma.universeTag.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.immutableLaw.deleteMany();
  await prisma.loreEntry.deleteMany();
  await prisma.worldSystem.deleteMany();
  await prisma.characterRelation.deleteMany();
  await prisma.location.deleteMany();
  await prisma.character.deleteMany();
  await prisma.universe.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
