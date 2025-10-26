console.log('🔍 Next.js DATABASE_URL:', process.env.DATABASE_URL);

import { PrismaClient } from '@prisma/client';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';

// FIXED: Add fallback for AWS deployment
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        'postgresql://postgres:Dashboard123@nextjs-dashboard-db.cu32c6awgzh9.us-east-1.rds.amazonaws.com:5432/nextjsdb',
    },
  },
});

export async function fetchRevenue() {
  try {
    const data = await prisma.$queryRaw<Revenue[]>`SELECT * FROM "Revenue"`;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const data = await prisma.$queryRaw<LatestInvoiceRaw[]>`
      SELECT 
        invoices.id,
        invoices.amount, 
        customers.name, 
        customers.image_url, 
        customers.email
      FROM "Invoice" AS invoices
      JOIN "Customer" AS customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.map((invoice) => ({
      id: invoice.id,
      amount: formatCurrency(invoice.amount),
      customer: {
        name: invoice.name,
        email: invoice.email,
        image_url: invoice.image_url,
      },
    }));

    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

const ITEMS_PER_PAGE = 6;

export async function fetchFilteredInvoices(query: string, currentPage: number) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const data = await prisma.$queryRaw<Array<{
      id: string;
      amount: number;
      date: Date;
      status: string;
      name: string;
      email: string;
      image_url: string;
    }>>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM "Invoice" AS invoices
      JOIN "Customer" AS customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    const invoices = data.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount,
      date: invoice.date.toISOString().split('T')[0],
      status: invoice.status,
      customer: {
        name: invoice.name,
        email: invoice.email,
        image_url: invoice.image_url,
      },
    }));

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const data: Array<{ count: number }> = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Invoice" AS invoices
      JOIN "Customer" AS customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
    `;

    const totalPages = Math.ceil((data[0]?.count ?? 0) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await prisma.$queryRaw<InvoiceForm[]>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM "Invoice" AS invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.map((invoice) => ({
      ...invoice,
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const customers = await prisma.$queryRaw<CustomerField[]>`
      SELECT
        id,
        name
      FROM "Customer"
      ORDER BY name ASC
    `;

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchCardData() {
  try {
    const invoiceCountPromise = prisma.$queryRaw<Array<{ count: number }>>`SELECT COUNT(*)::int AS count FROM "Invoice"`;
    const customerCountPromise = prisma.$queryRaw<Array<{ count: number }>>`SELECT COUNT(*)::int AS count FROM "Customer"`;
    const invoiceStatusPromise = prisma.$queryRaw<Array<{ paid: number; pending: number }>>`SELECT COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)::bigint AS "paid", COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0)::bigint AS "pending" FROM "Invoice"`;

    const [invoiceCount, customerCount, statusSums] = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(invoiceCount[0]?.count ?? 0);
    const numberOfCustomers = Number(customerCount[0]?.count ?? 0);
    const totalPaidInvoices = formatCurrency(Number(statusSums[0]?.paid ?? 0));
    const totalPendingInvoices = formatCurrency(Number(statusSums[0]?.pending ?? 0));

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

export async function fetchFilteredCustomers(query: string, currentPage: number) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const rows = await prisma.$queryRaw<CustomersTableType[]>`
      SELECT
        c.id,
        c.name,
        c.email,
        c.image_url,
        COUNT(i.id)::int AS total_invoices,
        COALESCE(SUM(CASE WHEN i.status = 'pending' THEN i.amount ELSE 0 END), 0)::int AS total_pending,
        COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0)::int AS total_paid
      FROM "Customer" AS c
      LEFT JOIN "Invoice" AS i ON c.id = i.customer_id
      WHERE
        c.name  ILIKE ${'%' + query + '%'} OR
        c.email ILIKE ${'%' + query + '%'}
      GROUP BY c.id, c.name, c.email, c.image_url
      ORDER BY c.name ASC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch filtered customers.');
  }
}

export async function fetchCustomersPages(query: string) {
  try {
    const data: Array<{ count: number }> = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Customer" AS c
      WHERE
        c.name  ILIKE ${'%' + query + '%'} OR
        c.email ILIKE ${'%' + query + '%'}
    `;
    const totalPages = Math.ceil((data[0]?.count ?? 0) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total customers pages.');
  }
}

f