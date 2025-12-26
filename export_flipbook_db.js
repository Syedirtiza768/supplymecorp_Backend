const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const FLIPBOOK_ID = '2025-26-Fall-Winter-Catalogue';
const DEPLOY_DIR = process.argv[2] || 'D:\\supplyme\\flipbook-deployment-20251226_132508';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'global321',
  database: 'orgill'
});

async function exportFlipbookData() {
  try {
    console.log('Exporting flipbook data...');
    console.log(`Flipbook ID: ${FLIPBOOK_ID}`);
    console.log(`Deploy Dir: ${DEPLOY_DIR}\n`);

    // Export flipbook
    console.log('[1/3] Exporting flipbook record...');
    const flipbookResult = await pool.query(
      `SELECT * FROM flipbooks WHERE id = $1`,
      [FLIPBOOK_ID]
    );
    
    if (flipbookResult.rows.length === 0) {
      console.error('ERROR: Flipbook not found in database!');
      process.exit(1);
    }

    const flipbookCSV = 'id,title,description,isFeatured,createdAt,updatedAt\n' +
      flipbookResult.rows.map(r => 
        `"${r.id}","${r.title}","${r.description || ''}",${r.isFeatured},${r.createdAt.toISOString()},${r.updatedAt.toISOString()}`
      ).join('\n');
    
    fs.writeFileSync(path.join(DEPLOY_DIR, 'database', 'flipbook.csv'), flipbookCSV);
    console.log(`  Exported 1 flipbook record`);

    // Export pages
    console.log('[2/3] Exporting flipbook pages...');
    const pagesResult = await pool.query(
      `SELECT * FROM flipbook_pages WHERE "flipbookId" = $1 ORDER BY "pageNumber"`,
      [FLIPBOOK_ID]
    );
    
    const pagesCSV = 'id,flipbookId,pageNumber,imageUrl,createdAt,updatedAt\n' +
      pagesResult.rows.map(r =>
        `"${r.id}","${r.flipbookId}",${r.pageNumber},"${r.imageUrl}",${r.createdAt.toISOString()},${r.updatedAt.toISOString()}`
      ).join('\n');
    
    fs.writeFileSync(path.join(DEPLOY_DIR, 'database', 'flipbook_pages.csv'), pagesCSV);
    console.log(`  Exported ${pagesResult.rows.length} page records`);

    // Export hotspots
    console.log('[3/3] Exporting hotspots...');
    const hotspotsResult = await pool.query(
      `SELECT h.* FROM flipbook_hotspots h 
       INNER JOIN flipbook_pages p ON h."pageId" = p.id 
       WHERE p."flipbookId" = $1 
       ORDER BY h.id`,
      [FLIPBOOK_ID]
    );
    
    const hotspotsCSV = 'id,pageId,x,y,width,height,productId,link,label,createdAt,updatedAt\n' +
      hotspotsResult.rows.map(r =>
        `"${r.id}","${r.pageId}",${r.x},${r.y},${r.width},${r.height},"${r.productId || ''}","${r.link || ''}","${r.label || ''}",${r.createdAt.toISOString()},${r.updatedAt.toISOString()}`
      ).join('\n');
    
    fs.writeFileSync(path.join(DEPLOY_DIR, 'database', 'flipbook_hotspots.csv'), hotspotsCSV);
    console.log(`  Exported ${hotspotsResult.rows.length} hotspot records`);

    console.log('\n========================================');
    console.log('Database Export Complete!');
    console.log('========================================');
    console.log(`Flipbook: ${flipbookResult.rows[0].title}`);
    console.log(`Pages: ${pagesResult.rows.length}`);
    console.log(`Hotspots: ${hotspotsResult.rows.length}`);
    console.log(`Output: ${path.join(DEPLOY_DIR, 'database')}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

exportFlipbookData();
