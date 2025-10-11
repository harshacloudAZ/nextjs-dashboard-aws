import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:Dashboard123@nextjs-dashboard-db.cu32c6awgzh9.us-east-1.rds.amazonaws.com:5432/nextjsdb'
    }
  }
});

async function getUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    return user;
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || '4dd0f005c8a7c26981cfb2e636e80d5ad',
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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔍 Login attempt for:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null;
        }

        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          console.log('❌ Validation failed');
          return null;
        }

        const { email, password } = parsedCredentials.data;
        console.log('🔍 Looking for user:', email);
        
        const user = await getUser(email);
        
        if (!user) {
          console.log('❌ User not found in database');
          return null;
        }

        console.log('✅ User found:', user.email);
        console.log('🔑 Comparing passwords...');
        
        const passwordsMatch = await bcrypt.compare(password, user.password);
        
        console.log('🔑 Password match result:', passwordsMatch);
        
        if (!passwordsMatch) {
          console.log('❌ Password mismatch');
          return null;
        }

        console.log('✅ Login successful!');
        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});