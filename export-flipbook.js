const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'orgill',
  user: 'postgres',
  password: 'global321',
});

const flipbookId = '2025-26-Fall-Winter-Catalogue';

async function exportFlipbook() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Fetching flipbook data...');
    
    // Get flipbook
    const flipbookResult = await client.query(
      'SELECT * FROM flipbooks WHERE id = $1',
      [flipbookId]
    );
    const flipbook = flipbookResult.rows[0];
    console.log(`✅ Flipbook: ${flipbook.title}`);
    
    // Get pages
    const pagesResult = await client.query(
      'SELECT * FROM flipbook_pages WHERE "flipbookId" = $1 ORDER BY "pageNumber"',
      [flipbookId]
    );
    const pages = pagesResult.rows;
    console.log(`✅ Pages: ${pages.length}`);
    
    // Get hotspots
    const hotspotsResult = await client.query(
      `SELECT h.* FROM flipbook_hotspots h
       INNER JOIN flipbook_pages p ON h."pageId" = p.id
       WHERE p."flipbookId" = $1
       ORDER BY h."pageId", h."zIndex"`,
      [flipbookId]
    );
    const hotspots = hotspotsResult.rows;
    console.log(`✅ Hotspots: ${hotspots.length}`);
    
    // Generate SQL
    let sql = `-- Flipbook Data Export
-- Generated: ${new Date().toISOString()}
-- Flipbook: ${flipbook.title}
-- Pages: ${pages.length}
-- Hotspots: ${hotspots.length}

-- Delete existing data
DELETE FROM flipbook_hotspots WHERE "pageId" IN (SELECT id FROM flipbook_pages WHERE "flipbookId" = '${flipbookId}');
DELETE FROM flipbook_pages WHERE "flipbookId" = '${flipbookId}';
DELETE FROM flipbooks WHERE id = '${flipbookId}';

-- Insert flipbook
INSERT INTO flipbooks (id, title, description, "isFeatured", "createdAt", "updatedAt") 
VALUES ('${flipbook.id}', '${flipbook.title.replace(/'/g, "''")}', ${flipbook.description ? `'${flipbook.description.replace(/'/g, "''")}'` : 'NULL'}, ${flipbook.isFeatured}, NOW(), NOW());

`;
    
    // Add pages
    for (const page of pages) {
      sql += `INSERT INTO flipbook_pages (id, "flipbookId", "pageNumber", "imageUrl", meta, "createdAt", "updatedAt") 
VALUES ('${page.id}', '${page.flipbookId}', ${page.pageNumber}, '${page.imageUrl}', NULL, NOW(), NOW());
`;
    }
    
    sql += '\n';
    
    // Add hotspots
    for (const hotspot of hotspots) {
      const label = hotspot.label ? hotspot.label.replace(/'/g, "''") : '';
      const productSku = hotspot.productSku || '';
      const linkUrl = hotspot.linkUrl || '';
      
      sql += `INSERT INTO flipbook_hotspots (id, "pageId", "productSku", label, "linkUrl", x, y, width, height, "zIndex", meta, "createdAt", "updatedAt") 
VALUES ('${hotspot.id}', '${hotspot.pageId}', '${productSku}', '${label}', '${linkUrl}', ${hotspot.x}, ${hotspot.y}, ${hotspot.width}, ${hotspot.height}, ${hotspot.zIndex}, NULL, NOW(), NOW());
`;
    }
    
    // Save to file
    const outputFile = 'D:\\supplyme\\flipbook-import.sql';
    fs.writeFileSync(outputFile, sql, 'utf8');
    
    console.log('\n✅ Export complete!');
    console.log(`📄 File saved to: ${outputFile}`);
    console.log('\n📦 To deploy to server:');
    console.log('1. scp D:\\supplyme\\flipbook-import.sql supplyme@137.184.50.54:/tmp/');
    console.log('2. ssh supplyme@137.184.50.54');
    console.log('3. psql -U postgres -d orgill -f /tmp/flipbook-import.sql');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

exportFlipbook();
