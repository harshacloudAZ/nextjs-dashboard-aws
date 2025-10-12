// auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

export const { auth, signIn, signOut, handlers } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
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
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        // ✅ dynamic import; keeps Node APIs out of Edge bundle
        const { compare } = await import('bcryptjs');
        const ok = await compare(password, user.password);
        if (!ok) return null;

        return { id: user.id, name: user.name ?? undefined, email: user.email };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return baseUrl + url;
      try { if (new URL(url).origin === baseUrl) return url; } catch {}
      return baseUrl + '/dashboard';
    },
    async jwt({ token, user }) { if (user) (token as any).id = (user as any).id; return token; },
    async session({ session, token }) { if (session.user && token) (session.user as any).id = (token as any).id; return session; },
  },
});
