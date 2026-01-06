// Run this on production server
// Usage: node import_flipbook.js <password>

const fs = require('fs');
const { Client } = require('pg');

const dbPassword = process.argv[2] || 'global321';

(async () => {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'orgill',
    user: 'postgres',
    password: dbPassword
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to production database\n');
    
    const data = JSON.parse(fs.readFileSync('/tmp/flipbook_data.json', 'utf8'));
    
    console.log(`Importing flipbook: ${data.flipbook.title}`);
    console.log(`Pages: ${data.pages.length}`);
    console.log(`Hotspots: ${data.hotspots.length}\n`);
    
    await client.query('BEGIN');
    
    // Delete existing flipbook with same ID
    await client.query('DELETE FROM flipbooks WHERE id = $1', [data.flipbook.id]);
    
    // Insert flipbook
    const flipbookCols = Object.keys(data.flipbook).map(k => `"${k}"`).join(', ');
    const flipbookVals = Object.keys(data.flipbook).map((_, i) => `$${i + 1}`).join(', ');
    await client.query(
      `INSERT INTO flipbooks (${flipbookCols}) VALUES (${flipbookVals})`,
      Object.values(data.flipbook)
    );
    console.log('✅ Inserted flipbook');
    
    // Insert pages
    let pageCount = 0;
    const pageIdMap = {};
    for (const page of data.pages) {
      const pageCols = Object.keys(page).filter(k => k !== 'id').map(k => `"${k}"`).join(', ');
      const pageVals = Object.keys(page).filter(k => k !== 'id').map((_, i) => `$${i + 1}`).join(', ');
      const pageValues = Object.keys(page).filter(k => k !== 'id').map(k => page[k]);
      
      const result = await client.query(
        `INSERT INTO flipbook_pages (${pageCols}) VALUES (${pageVals}) RETURNING id`,
        pageValues
      );
      pageIdMap[page.id] = result.rows[0].id;
      pageCount++;
    }
    console.log(`✅ Inserted ${pageCount} pages`);
    
    // Insert hotspots
    let hotspotCount = 0;
    for (const hotspot of data.hotspots) {
      const newPageId = pageIdMap[hotspot.pageId];
      if (newPageId) {
        const hotspotData = { ...hotspot, pageId: newPageId };
        delete hotspotData.id;
        
        const hotspotCols = Object.keys(hotspotData).map(k => `"${k}"`).join(', ');
        const hotspotVals = Object.keys(hotspotData).map((_, i) => `$${i + 1}`).join(', ');
        const hotspotValues = Object.values(hotspotData);
        
        await client.query(
          `INSERT INTO flipbook_hotspots (${hotspotCols}) VALUES (${hotspotVals})`,
          hotspotValues
        );
        hotspotCount++;
      }
    }
    console.log(`✅ Inserted ${hotspotCount} hotspots`);
    
    // Set as featured
    await client.query('UPDATE flipbooks SET "isFeatured" = false');
    await client.query('UPDATE flipbooks SET "isFeatured" = true WHERE id = $1', [data.flipbook.id]);
    console.log('✅ Set as featured');
    
    await client.query('COMMIT');
    console.log('\n🎉 Import complete!');
    
    await client.end();
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
