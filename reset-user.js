const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Delete existing user
  await prisma.user.deleteMany({
    where: { email: 'user@nextmail.com' }
  });

  console.log('Deleted old user');

  // Create new user with fresh hash
  const hashedPassword = await bcrypt.hash('123456', 10);

  const user = await prisma.user.create({
    data: {
      name: 'User',
      email: 'user@nextmail.com',
      password: hashedPassword,
    },
  });

  console.log('✅ Created fresh user:', user.email);
  console.log('Password hash:', hashedPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });