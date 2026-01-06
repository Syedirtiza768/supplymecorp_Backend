const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'orgill',
    user: 'postgres',
    password: 'postgres'
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const res = await client.query("SELECT current_database(), current_user");
    console.log('Database:', res.rows[0].current_database);
    console.log('User:', res.rows[0].current_user);
    
    const flipbookRes = await client.query("SELECT id, name FROM flipbooks WHERE name = '2025-26-Symmetric-Catalogue'");
    console.log('Flipbook found:', flipbookRes.rows[0]);
    
    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
