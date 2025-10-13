import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
    },
  });

  // Create customers
  const customer1 = await prisma.customer.upsert({
    where: { email: 'delba@oliveira.com' },
    update: {},
    create: {
      name: 'Delba de Oliveira',
      email: 'delba@oliveira.com',
      image_url: '/customers/delba-de-oliveira.png',
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { email: 'lee@robinson.com' },
    update: {},
    create: {
      name: 'Lee Robinson',
      email: 'lee@robinson.com',
      image_url: '/customers/lee-robinson.png',
    },
  });

  // Create invoices
  await prisma.invoice.create({
    data: {
      customer_id: customer1.id,
      amount: 15795, // in cents
      status: 'pending',
      date: new Date('2024-12-06'),
    },
  });

  await prisma.invoice.create({
    data: {
      customer_id: customer2.id,
      amount: 20348,
      status: 'paid',
      date: new Date('2024-11-14'),
    },
  });

  // Create revenue data
  const revenues = [
    { month: 'Jan', revenue: 2000 },
    { month: 'Feb', revenue: 1800 },
    { month: 'Mar', revenue: 2200 },
    { month: 'Apr', revenue: 2500 },
    { month: 'May', revenue: 2300 },
    { month: 'Jun', revenue: 3200 },
    { month: 'Jul', revenue: 3500 },
    { month: 'Aug', revenue: 3700 },
    { month: 'Sep', revenue: 2500 },
    { month: 'Oct', revenue: 2800 },
    { month: 'Nov', revenue: 3000 },
    { month: 'Dec', revenue: 4800 },
  ];

  for (const rev of revenues) {
    await prisma.revenue.upsert({
      where: { month: rev.month },
      update: { revenue: rev.revenue },
      create: rev,
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });