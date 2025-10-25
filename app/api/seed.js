const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function main() {
    // Create client with explicit SSL configuration
    const client = new Client({
        host: 'nextjs-dashboard-db.cu32c6awgzh9.us-east-1.rds.amazonaws.com',
        port: 5432,
        database: 'nextjsdb',
        user: 'postgres',
        password: 'Dashboard123',
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Attempting to connect to database...');
        await client.connect();
        console.log('✅ Connected to database successfully');

        // Hash passwords
        console.log('Hashing passwords...');
        const hashedPassword1 = await bcrypt.hash('password123', 10);
        const hashedPassword2 = await bcrypt.hash('password456', 10);
        console.log('✅ Passwords hashed');

        // Check if table exists and create if needed
        console.log('Creating tables if they don\'t exist...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Tables ready');

        // Add seed data with hashed passwords
        console.log('Inserting seed data...');
        await client.query(`
      INSERT INTO users (name, email, password) 
      VALUES 
        ($1, $2, $3),
        ($4, $5, $6)
      ON CONFLICT (email) DO NOTHING;
    `, ['Test User', 'test@example.com', hashedPassword1, 'John Doe', 'john@example.com', hashedPassword2]);
        console.log('✅ Seed data inserted');

        console.log('🎉 Seeded database successfully!');
        console.log('');
        console.log('Test credentials:');
        console.log('  Email: test@example.com');
        console.log('  Password: password123');
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        throw error;
    } finally {
        await client.end();
        console.log('Database connection closed');
    }
}

main()
    .then(() => {
        console.log('Seed script completed successfully');
        process.exit(0);
    })
    .catch((err) => {
        console.error('An error occurred while attempting to seed the database:', err);
        process.exit(1);
    });