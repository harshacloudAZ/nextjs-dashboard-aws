// Ensure this route runs on the Node runtime (not Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import postgres from 'postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

// Prefer Prisma's DATABASE_URL; fall back to POSTGRES_URL
const DATABASE_URL = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL or POSTGRES_URL must be set');
}

// TLS for hosted Postgres (Neon/Supabase/RDS public)
const sql = postgres(DATABASE_URL, { ssl: 'require' });

type Sql = ReturnType<typeof postgres>;

async function ensureExtensions(tx: Sql) {
  await tx`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
}

async function seedUsers(tx: Sql) {
  // Use "User" (capital U) to match Prisma's default model mapping
  await tx`
    CREATE TABLE IF NOT EXISTS "User" (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  const { hash } = await import('bcryptjs'); // dynamic import to avoid Edge bundling

  for (const u of users) {
    const hashed = /^\$2[aby]\$/.test(u.password)
      ? u.password // already a bcrypt hash
      : await hash(u.password, 10);

    await tx`
      INSERT INTO "User" (id, name, email, password)
      VALUES (${u.id}, ${u.name}, ${u.email}, ${hashed})
      ON CONFLICT (email) DO NOTHING;
    `;
  }
}

async function seedCustomers(tx: Sql) {
  await tx`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

  for (const c of customers) {
    await tx`
      INSERT INTO customers (id, name, email, image_url)
      VALUES (${c.id}, ${c.name}, ${c.email}, ${c.image_url})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
}

async function seedInvoices(tx: Sql) {
  await tx`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
      -- Optionally enforce FK:
      -- , CONSTRAINT invoices_customer_fk FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
  `;

  for (const inv of invoices) {
    await tx`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${inv.customer_id}, ${inv.amount}, ${inv.status}, ${inv.date})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
}

async function seedRevenue(tx: Sql) {
  await tx`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;

  for (const r of revenue) {
    await tx`
      INSERT INTO revenue (month, revenue)
      VALUES (${r.month}, ${r.revenue})
      ON CONFLICT (month) DO NOTHING;
    `;
  }
}

export async function GET() {
  try {
    await sql.begin(async (tx) => {
      await ensureExtensions(tx);
      await seedUsers(tx);
      await seedCustomers(tx);
      await seedInvoices(tx);
      await seedRevenue(tx);
    });

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error: any) {
    console.error('Seed error:', error);
    return Response.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  } finally {
    // avoid leaked connections in serverless runtimes
    await sql.end({ timeout: 5 });
  }
}
