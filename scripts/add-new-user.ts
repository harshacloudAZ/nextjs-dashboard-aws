import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function addUser() {
    const hashedPassword = await bcrypt.hash('123456', 10);

    await prisma.user.create({
        data: {
            name: 'Admin',
            email: 'user@nextmail.com',
            password: hashedPassword,
        },
    });

    console.log('✅ User added successfully!');
    await prisma.$disconnect();
}

addUser();