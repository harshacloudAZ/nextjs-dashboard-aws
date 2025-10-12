import { NextResponse } from 'next/server';

export async function GET() {
    console.log('Testing environment variables...');

    return NextResponse.json({
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        hasAuthSecret: !!process.env.AUTH_SECRET,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nodeEnv: process.env.NODE_ENV,
        // Show first 30 chars to verify it's there (safe for debugging)
        databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) || 'NOT SET',
        postgresUrlPrefix: process.env.POSTGRES_URL?.substring(0, 30) || 'NOT SET',
        timestamp: new Date().toISOString(),
    });
}