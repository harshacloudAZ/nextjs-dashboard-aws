// Add this at the top of your database connection file
// For example, in app/lib/db.js or wherever you connect to the database

console.log('Environment check:', {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    nodeEnv: process.env.NODE_ENV,
    // Don't log the actual values in production!
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...',
});

// Then your database connection code
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    throw new Error('DATABASE_URL or POSTGRES_URL must be set');
}

// Your existing database client code here...