// auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

// --- Prisma (singleton to avoid too many connections in dev) ---
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma =
  global.__prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url:
          process.env.DATABASE_URL ||
          'postgresql://postgres:Dashboard123@nextjs-dashboard-db.cu32c6awgzh9.us-east-1.rds.amazonaws.com:5432/nextjsdb',
      },
    },
  });

if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

// --- Helper ---
async function getUser(email: string) {
  try {
    return await prisma.user.findUnique({ where: { email } });
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
}

// --- NextAuth ---
export const { auth, signIn, signOut, handlers } = NextAuth({
  // Prefer Auth.js v5 env; fall back to v4 to be safe
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,

  pages: {
    signIn: '/login',
  },

  session: {
    strategy: 'jwt',
  },

  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate input
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Lookup user
        const user = await getUser(email);
        if (!user || !user.password) return null;

        // ✅ Dynamic import keeps bcryptjs out of the Edge bundle
        const { compare } = await import('bcryptjs');
        const ok = await compare(password, user.password);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name ?? undefined,
          email: user.email,
        };
      },
    }),
  ],

  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // ignore invalid URL
      }
      return `${baseUrl}/dashboard`;
    },

    async jwt({ token, user }) {
      if (user) {
        // @ts-expect-error: augmenting token shape
        token.id = (user as any).id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        // @ts-expect-error: augmenting session shape
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
