import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = 'demo@verser.app';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.warn(`[seed] User ${email} already exists. Skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash('Demo1234!', 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: 'Demo Writer',
      emailVerified: true,
    },
  });

  const universe = await prisma.universe.create({
    data: {
      userId: user.id,
      name: 'Aetherfall',
      description: 'A high-fantasy world where magic comes at a memory cost.',
      genre: 'fantasy',
    },
  });

  await prisma.immutableLaw.createMany({
    data: [
      {
        universeId: universe.id,
        title: 'Magic Costs Memory',
        description: 'Every act of magic erases a proportional amount of the caster\'s memory. There are no exceptions.',
        category: 'magic',
      },
      {
        universeId: universe.id,
        title: 'No Resurrection',
        description: 'The dead cannot return. Necromancy animates flesh but never the soul.',
        category: 'divine',
      },
    ],
  });

  console.warn(`[seed] Created demo user ${email} (password: Demo1234!) and universe ${universe.name}.`);
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
