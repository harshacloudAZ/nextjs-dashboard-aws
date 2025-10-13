import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
import { Client } from 'pg';

// Don't check env vars at module load time - check when actually needed
async function getUser(email: string): Promise<User | undefined> {
  try {
    // Check here instead - when function is actually called
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
      throw new Error('DATABASE_URL or POSTGRES_URL must be set');
    }

    console.log('Attempting to fetch user for email:', email);

    const client = new Client({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await client.connect();
    console.log('Database connected successfully');

    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    await client.end();
    console.log('User query completed. Found user:', !!result.rows[0]);

    return result.rows[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      email: email,
    });
    throw new Error('Failed to fetch user.');
  }
}

// Debug: Log what secrets are available
console.log('Auth secrets check:', {
  hasAuthSecret: !!process.env.AUTH_SECRET,
  hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
  authSecretLength: process.env.AUTH_SECRET?.length || 0,
  nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
});

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);

          if (!user) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) return user;
        }

        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
});