import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Check what tables actually exist
        const tables = await prisma.$queryRaw<Array<{ schemaname: string, tablename: string }>>`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY tablename
    `;

        // Try with capital letters
        const capitalTest = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count FROM "Customer"
    `;

        return new Response(JSON.stringify({
            success: true,
            allTables: tables,
            capitalLetterTest: capitalTest[0]?.count,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({
            error: error.message,
            code: error.code,
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}