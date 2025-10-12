// auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL or POSTGRES_URL must be set');
}

const sql = postgres(databaseUrl, { ssl: 'require' });

export const { auth, signIn, signOut, handlers } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: { signIn: '/login' },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = z.object({
          email: z.string().email(),
          password: z.string().min(6),
        }).safeParse(credentials);

        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        try {
          const rows = await sql<{ id: string; name: string | null; email: string; password: string }[]>`
            SELECT id, name, email, password FROM "User" WHERE email = ${email} LIMIT 1
          `;
          const user = rows[0];
          if (!user || !user.password) return null;

          const bcrypt = await import('bcrypt');
          const ok = await bcrypt.compare(password, user.password);
          if (!ok) return null;

          return { id: user.id, name: user.name ?? undefined, email: user.email };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});