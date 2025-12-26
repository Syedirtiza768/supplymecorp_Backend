const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'orgill',
  user: 'postgres',
  password: 'global321',
});

async function listTables() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables in database:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

listTables();
