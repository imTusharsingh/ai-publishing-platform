import { prisma } from '../src/prisma.service';
import { seed } from '../src/seed';

async function main() {
  await seed();
  const [userCount, categoryCount] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
  ]);
  console.log(`Seed complete: ${userCount} user(s), ${categoryCount} categor(ies)`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
