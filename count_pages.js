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
  
  const flipbooks = await client.query('SELECT id, title FROM flipbooks');
  
  for (const flipbook of flipbooks.rows) {
    const pagesResult = await client.query(
      'SELECT COUNT(*) as total FROM flipbook_pages WHERE "flipbookId" = $1',
      [flipbook.id]
    );
    console.log(`${flipbook.title}: ${pagesResult.rows[0].total} pages`);
  }
  
  await client.end();
})();
