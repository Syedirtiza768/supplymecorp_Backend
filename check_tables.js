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
  
  const r = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'flipbook_pages' ORDER BY ordinal_position`);
  console.log('flipbook_pages columns:', r.rows.map(x => x.column_name).join(', '));
  
  const r2 = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'flipbook_hotspots' ORDER BY ordinal_position`);
  console.log('flipbook_hotspots columns:', r2.rows.map(x => x.column_name).join(', '));
  
  await client.end();
})();
