const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || 'postgresql://postgres:Dashboard123@nextjs-dashboard-db.cu32c6awgzh9.us-east-1.rds.amazonaws.com:5432/nextjsdb',
        },
    },
});

async function main() {
    console.log('🧹 Clearing existing data...');

    // Delete all existing data
    await prisma.invoice.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.revenue.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Cleared all data');
    console.log('📦 Restoring original Next.js tutorial data...');

    // Create user (original from tutorial)
    const hashedPassword = await bcrypt.hash('123456', 10);

    await prisma.user.create({
        data: {
            email: 'user@nextmail.com',
            name: 'User',
            password: hashedPassword,
        },
    });

    console.log('✅ Created user: user@nextmail.com');

    // Create customers (original from tutorial)
    const customersData = [
        {
            name: 'Evil Rabbit',
            email: 'evil@rabbit.com',
            image_url: '/customers/evil-rabbit.png',
        },
        {
            name: 'Delba de Oliveira',
            email: 'delba@oliveira.com',
            image_url: '/customers/delba-de-oliveira.png',
        },
        {
            name: 'Lee Robinson',
            email: 'lee@robinson.com',
            image_url: '/customers/lee-robinson.png',
        },
        {
            name: 'Michael Novotny',
            email: 'michael@novotny.com',
            image_url: '/customers/michael-novotny.png',
        },
        {
            name: 'Amy Burns',
            email: 'amy@burns.com',
            image_url: '/customers/amy-burns.png',
        },
        {
            name: 'Balazs Orban',
            email: 'balazs@orban.com',
            image_url: '/customers/balazs-orban.png',
        },
    ];

    for (const customer of customersData) {
        await prisma.customer.create({ data: customer });
    }

    console.log('✅ Created 6 customers');

    // Get customer IDs
    const customers = await prisma.customer.findMany();

    // Create invoices (original from tutorial)
    const invoicesData = [
        { customer_id: customers[0].id, amount: 15795, status: 'pending', date: new Date('2022-12-06') },
        { customer_id: customers[1].id, amount: 20348, status: 'pending', date: new Date('2022-11-14') },
        { customer_id: customers[4].id, amount: 3040, status: 'paid', date: new Date('2022-10-29') },
        { customer_id: customers[3].id, amount: 44800, status: 'paid', date: new Date('2023-09-10') },
        { customer_id: customers[5].id, amount: 34577, status: 'pending', date: new Date('2023-08-05') },
        { customer_id: customers[2].id, amount: 54246, status: 'pending', date: new Date('2023-07-16') },
        { customer_id: customers[0].id, amount: 666, status: 'pending', date: new Date('2023-06-27') },
        { customer_id: customers[3].id, amount: 32545, status: 'paid', date: new Date('2023-06-09') },
        { customer_id: customers[4].id, amount: 1250, status: 'paid', date: new Date('2023-06-17') },
        { customer_id: customers[5].id, amount: 8546, status: 'paid', date: new Date('2023-06-07') },
        { customer_id: customers[1].id, amount: 500, status: 'paid', date: new Date('2023-08-19') },
        { customer_id: customers[5].id, amount: 8945, status: 'paid', date: new Date('2023-06-03') },
        { customer_id: customers[2].id, amount: 8945, status: 'paid', date: new Date('2023-06-18') },
        { customer_id: customers[0].id, amount: 8945, status: 'paid', date: new Date('2023-10-04') },
        { customer_id: customers[2].id, amount: 1000, status: 'paid', date: new Date('2022-06-05') },
    ];

    for (const invoice of invoicesData) {
        await prisma.invoice.create({ data: invoice });
    }

    console.log('✅ Created 15 invoices');

    // Create revenue (original from tutorial)
    const revenueData = [
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

    for (const revenue of revenueData) {
        await prisma.revenue.create({ data: revenue });
    }

    console.log('✅ Created revenue data for 12 months');

    console.log('\n🎉 Successfully restored original Next.js tutorial data!');
    console.log('\n📝 Login Credentials:');
    console.log('   Email: user@nextmail.com');
    console.log('   Password: 123456');
    console.log('\n✨ Your dashboard now has the original tutorial data!');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });