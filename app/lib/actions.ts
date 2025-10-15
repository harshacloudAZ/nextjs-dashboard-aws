'use server';

import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Initialize Prisma with runtime configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        'postgresql://postgres:Dashboard123@nextjs-dashboard-db.cu32c6awgzh9.us-east-1.rds.amazonaws.com:5432/nextjsdb',
    },
  },
});

// Form validation schema
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// State type for form errors
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

// CREATE INVOICE ACTION
export async function createInvoice(prevState: State, formData: FormData) {
  console.log('Creating invoice with data:', {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // Validate form fields using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If validation fails, return errors early
  if (!validatedFields.success) {
    console.error('Validation failed:', validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // Prepare data for insertion
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = Math.round(amount * 100);
  const date = new Date();

  console.log('Inserting invoice:', {
    customer_id: customerId,
    amount: amountInCents,
    status,
    date
  });

  // Insert data into the database
  try {
    const invoice = await prisma.invoice.create({
      data: {
        customer_id: customerId,
        amount: amountInCents,
        status: status,
        date: date,
      },
    });
    console.log('Invoice created successfully:', invoice.id);
  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  // Revalidate the cache and redirect
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// UPDATE INVOICE ACTION
export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  console.log('Updating invoice:', id, 'with data:', {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // Validate form fields
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If validation fails, return errors
  if (!validatedFields.success) {
    console.error('Validation failed:', validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  // Prepare data for update
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = Math.round(amount * 100);

  console.log('Updating invoice with:', {
    customer_id: customerId,
    amount: amountInCents,
    status
  });

  // Update the database
  try {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        customer_id: customerId,
        amount: amountInCents,
        status: status,
      },
    });
    console.log('Invoice updated successfully:', invoice.id);
  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to Update Invoice.'
    };
  }

  // Revalidate and redirect
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// DELETE INVOICE ACTION
export async function deleteInvoice(id: string) {
  console.log('Deleting invoice:', id);

  try {
    await prisma.invoice.delete({
      where: { id },
    });
    console.log('Invoice deleted successfully');
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Database Error: Failed to Delete Invoice.');
  }

  revalidatePath('/dashboard/invoices');
}