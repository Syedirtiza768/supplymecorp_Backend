// Run category_counts migration
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Client } = require('pg');
const fs = require('fs');

async function runMigration() {
  console.log('📝 Using database:', process.env.DB_NAME);
  console.log('👤 User:', process.env.DB_USER);
  console.log('🏠 Host:', process.env.DB_HOST);
  
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'orgill',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    const sqlPath = path.join(__dirname, 'migrations', 'create_category_counts_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Running migration: create_category_counts_table.sql');
    await client.query(sql);
    console.log('✅ Migration completed successfully!');

    // Verify table was created
    const result = await client.query(`
      SELECT COUNT(*) as count 
      FROM category_counts
    `);
    console.log(`📊 Category counts table initialized with ${result.rows[0].count} records`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

runMigration();
