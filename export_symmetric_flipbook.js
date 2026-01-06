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
  
  try {
    console.log('Exporting 170-page flipbook from local database...\n');
    
    // Get all flipbooks and find the one with 170 pages
    const allFlipbooks = await client.query('SELECT * FROM flipbooks');
    let flipbook = null;
    
    for (const fb of allFlipbooks.rows) {
      const pageCount = await client.query(
        'SELECT COUNT(*) as total FROM flipbook_pages WHERE "flipbookId" = $1',
        [fb.id]
      );
      if (pageCount.rows[0].total === '170') {
        flipbook = fb;
        break;
      }
    }
    
    if (!flipbook) {
      console.error('ERROR: No flipbook with exactly 170 pages found');
      process.exit(1);
    }
    console.log('Found flipbook:', flipbook.title);
    console.log('ID:', flipbook.id);
    
    // Get pages
    const pagesRes = await client.query(
      `SELECT * FROM flipbook_pages WHERE "flipbookId" = $1 ORDER BY "pageNumber"`,
      [flipbook.id]
    );
    console.log(`Pages: ${pagesRes.rows.length}`);
    
    // Get hotspots
    const hotspotsRes = await client.query(
      `SELECT fh.* FROM flipbook_hotspots fh 
       JOIN flipbook_pages fp ON fh."pageId" = fp.id 
       WHERE fp."flipbookId" = $1
       ORDER BY fp."pageNumber", fh.id`,
      [flipbook.id]
    );
    console.log(`Hotspots: ${hotspotsRes.rows.length}`);
    
    const exportData = {
      flipbook,
      pages: pagesRes.rows,
      hotspots: hotspotsRes.rows
    };
    
    fs.writeFileSync('symmetric_flipbook_export.json', JSON.stringify(exportData, null, 2));
    console.log('\n✅ Exported to symmetric_flipbook_export.json');
    
    await client.end();
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
