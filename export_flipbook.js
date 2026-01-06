const { Client } = require('pg');
const fs = require('fs');

(async () => {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'orgill',
    user: 'postgres',
    password: 'global321'
  });
  
  await client.connect();
  
  // Get flipbook
  const flipbookRes = await client.query(
    `SELECT * FROM flipbooks WHERE name = '2025-26-Symmetric-Catalogue'`
  );
  
  if (flipbookRes.rows.length === 0) {
    console.error('Flipbook not found in local database');
    process.exit(1);
  }
  
  const flipbook = flipbookRes.rows[0];
  const flipbookId = flipbook.id;
  
  // Get pages
  const pagesRes = await client.query(
    `SELECT * FROM flipbook_pages WHERE flipbook_id = $1 ORDER BY page_number`,
    [flipbookId]
  );
  
  // Get hotspots
  const hotspotsRes = await client.query(
    `SELECT fh.* FROM flipbook_hotspots fh 
     JOIN flipbook_pages fp ON fh.page_id = fp.id 
     WHERE fp.flipbook_id = $1
     ORDER BY fp.page_number, fh.id`,
    [flipbookId]
  );
  
  const data = {
    flipbook,
    pages: pagesRes.rows,
    hotspots: hotspotsRes.rows
  };
  
  fs.writeFileSync('flipbook_export.json', JSON.stringify(data, null, 2));
  console.log(`Exported: Flipbook, ${pagesRes.rows.length} pages, ${hotspotsRes.rows.length} hotspots`);
  
  await client.end();
})();
