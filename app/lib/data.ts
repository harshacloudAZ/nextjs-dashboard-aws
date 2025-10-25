console.log('🔍 Next.js DATABASE_URL:', process.env.DATABASE_URL);

import { PrismaClient } from '@prisma/client';

<<<<<<< HEAD
// FIXED: Explicitly set database URL from environment variable
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
=======
// Create Prisma client with explicit datasource
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:Dashboard123@nextjs-dashboard-db.cu32c6awgzh9.us-east-1.rds.amazonaws.com:5432/nextjsdb',
>>>>>>> 7eac0beface41f4d4d5cc92a867ebabde76bbb20
    },
  },
});

export async function fetchRevenue() {
  try {
<<<<<<< HEAD
    const data = await prisma.$queryRaw<Revenue[]>`SELECT * FROM "Revenue"`;
=======
    const data = await prisma.revenue.findMany();
>>>>>>> 7eac0beface41f4d4d5cc92a867ebabde76bbb20
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
<<<<<<< HEAD
    const data = await prisma.$queryRaw<LatestInvoiceRaw[]>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM "Invoice" AS invoices
      JOIN "Customer" AS customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;
=======
    const data = await prisma.invoice.findMany({
      take: 5,
      orderBy: {
        date: 'desc',
      },
      include: {
        customer: true,
      },
    });
>>>>>>> 7eac0beface41f4d4d5cc92a867ebabde76bbb20

    return data.map((invoice) => ({
      id: invoice.id,
      customer_id: invoice.customer_id,
      amount: invoice.amount / 100,
      date: invoice.date.toISOString(),
      status: invoice.status as 'pending' | 'paid',
      customer: {
        name: invoice.customer.name,
        email: invoice.customer.email,
        image_url: invoice.customer.image_url,
      },
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    const invoiceCountPromise = prisma.invoice.count();
    const customerCountPromise = prisma.customer.count();
    const invoiceStatusPromise = prisma.invoice.groupBy({
      by: ['status'],
      _sum: {
        amount: true,
      },
    });

    const [invoiceCount, customerCount, invoiceStatus] = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const totalPaidInvoices = invoiceStatus.find((s) => s.status === 'paid')?._sum.amount || 0;
    const totalPendingInvoices = invoiceStatus.find((s) => s.status === 'pending')?._sum.amount || 0;

    return {
      numberOfCustomers: customerCount,
      numberOfInvoices: invoiceCount,
      totalPaidInvoices: totalPaidInvoices / 100,
      totalPendingInvoices: totalPendingInvoices / 100,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * 6;

  try {
<<<<<<< HEAD
    const invoices = await prisma.$queryRaw<InvoicesTable[]>`
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
=======
    const invoices = await prisma.invoice.findMany({
      take: 6,
      skip: offset,
      where: {
        OR: [
          {
            customer: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
          {
            customer: {
              email: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
          {
            status: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        customer: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
>>>>>>> 7eac0beface41f4d4d5cc92a867ebabde76bbb20

    return invoices.map((invoice) => ({
      id: invoice.id,
      customer_id: invoice.customer_id,
      amount: invoice.amount,
      date: invoice.date.toISOString(),
      status: invoice.status as 'pending' | 'paid',
      customer: {
        name: invoice.customer.name,
        email: invoice.customer.email,
        image_url: invoice.customer.image_url,
      },
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
<<<<<<< HEAD
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
=======
    const count = await prisma.invoice.count({
      where: {
        OR: [
          {
            customer: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
          {
            customer: {
              email: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
          {
            status: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
    });
>>>>>>> 7eac0beface41f4d4d5cc92a867ebabde76bbb20

    return Math.ceil(count / 6);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
<<<<<<< HEAD
    const data = await prisma.$queryRaw<InvoiceForm[]>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM "Invoice" AS invoices
      WHERE invoices.id = ${id};
    `;
=======
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });
>>>>>>> 7eac0beface41f4d4d5cc92a867ebabde76bbb20

    if (!invoice) return undefined;

    return {
      id: invoice.id,
      customer_id: invoice.customer_id,
      amount: invoice.amount / 100,
      status: invoice.status as 'pending' | 'paid',
      date: invoice.date,
      customer: {
        id: invoice.customer.id,
        name: invoice.customer.name,
        email: invoice.customer.email,
        image_url: invoice.customer.image_url,
      },
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
<<<<<<< HEAD
    const customers = await prisma.$queryRaw<CustomerField[]>`
      SELECT
        id,
        name
      FROM "Customer"
      ORDER BY name ASC
    `;
=======
    const customers = await prisma.customer.findMany({
      orderBy: {
        name: 'asc',
      },
    });
>>>>>>> 7eac0beface41f4d4d5cc92a867ebabde76bbb20

    return customers;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch all customers.');
  }
}

<<<<<<< HEAD
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
=======
export async function fetchFilteredCustomers(query: string, currentPage: number = 1) {
  const offset = (currentPage - 1) * 6;

  try {
    const customers = await prisma.customer.findMany({
      take: 6,
      skip: offset,
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        invoices: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
>>>>>>> 7eac0beface41f4d4d5cc92a867ebabde76bbb20

    return customers.map((customer) => ({
      ...customer,
      total_invoices: customer.invoices.length,
      total_pending: customer.invoices
        .filter((inv) => inv.status === 'pending')
        .reduce((sum, inv) => sum + inv.amount, 0) / 100,
      total_paid: customer.invoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0) / 100,
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function fetchCustomersPages(query: string) {
  try {
<<<<<<< HEAD
    const data: Array<{ count: number }> = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Customer" AS c
      WHERE
        c.name  ILIKE ${'%' + query + '%'} OR
        c.email ILIKE ${'%' + query + '%'}
    `;
    const totalPages = Math.ceil((data[0]?.count ?? 0) / ITEMS_PER_PAGE);
    return totalPages;
=======
    const count = await prisma.customer.count({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
    });

    return Math.ceil(count / 6);
>>>>>>> 7eac0beface41f4d4d5cc92a867ebabde76bbb20
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of customers.');
  }
}