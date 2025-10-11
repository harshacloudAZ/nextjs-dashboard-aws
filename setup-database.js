const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:Dashboard123!@nextjs-dashboard-db.cu32c6awgzh9.us-east-1.rds.amazonaws.com:5432/nextjsdb';

async function setupDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);
    console.log('✅ Created users table');

    // Create customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL
      );
    `);
    console.log('✅ Created customers table');

    // Create invoices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        customer_id UUID NOT NULL REFERENCES customers(id),
        amount INT NOT NULL,
        status VARCHAR(255) NOT NULL,
        date DATE NOT NULL
      );
    `);
    console.log('✅ Created invoices table');

    // Create revenue table
    await client.query(`
      CREATE TABLE IF NOT EXISTS revenue (
        month VARCHAR(4) NOT NULL UNIQUE,
        revenue INT NOT NULL
      );
    `);
    console.log('✅ Created revenue table');

    // Insert test user (password: 123456)
    await client.query(`
      INSERT INTO users (name, email, password)
      VALUES ('Test User', 'user@nextmail.com', '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u')
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log('✅ Inserted test user');

    console.log('\n🎉 Database setup complete!');
    console.log('📧 Login email: user@nextmail.com');
    console.log('🔑 Login password: 123456');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
  }
}

// Run the setup
setupDatabase().catch(console.error);