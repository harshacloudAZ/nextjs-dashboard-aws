import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create user
  const hashedPassword = await bcrypt.hash('123456', 10);

  await prisma.user.upsert({
    where: { email: 'user@nextmail.com' },
    update: {},
    create: {
      name: 'User',
      email: 'user@nextmail.com',
      password: hashedPassword,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('📧 Login email: user@nextmail.com');
  console.log('🔑 Login password: 123456');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });