import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [],
  trustHost: true,
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;