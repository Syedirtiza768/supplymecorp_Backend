const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'orgill',
    user: 'postgres',
    password: 'global321'
  });
  
  await client.connect();
  
  const res = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'flipbooks'
    ORDER BY ordinal_position
  `);
  
  console.log('Flipbooks table columns:', res.rows.map(r => r.column_name).join(', '));
  
  await client.end();
})();
