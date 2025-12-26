const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'orgill',
  user: 'postgres',
  password: 'global321'
});

async function exportFlipbookData() {
  try {
    await client.connect();
    console.log('Connected to database');

    const flipbookId = '2025-26-Fall-Winter-Catalogue';
    const outputFile = path.join(__dirname, 'flipbook-export.sql');
    
    let sql = '-- Flipbook Data Export\n';
    sql += '-- Generated: ' + new Date().toISOString() + '\n\n';
    
    // Export flipbook
    console.log('Exporting flipbook...');
    const flipbook = await client.query('SELECT * FROM flipbook WHERE id = $1', [flipbookId]);
    if (flipbook.rows.length > 0) {
      const f = flipbook.rows[0];
      sql += `-- Flipbook\n`;
      sql += `INSERT INTO flipbook (id, title, description, "isFeatured", "createdAt", "updatedAt") VALUES `;
      sql += `('${f.id}', '${f.title.replace(/'/g, "''")}', '${f.description || ''}', ${f.isFeatured}, '${f.createdAt.toISOString()}', '${f.updatedAt.toISOString()}');\n\n`;
    }
    
    // Export pages
    console.log('Exporting pages...');
    const pages = await client.query(
      'SELECT * FROM flipbook_page WHERE "flipbookId" = $1 ORDER BY "pageNumber"',
      [flipbookId]
    );
    sql += `-- Pages (${pages.rows.length} total)\n`;
    for (const p of pages.rows) {
      sql += `INSERT INTO flipbook_page (id, "flipbookId", "pageNumber", "imageUrl", meta, "createdAt", "updatedAt") VALUES `;
      sql += `('${p.id}', '${p.flipbookId}', ${p.pageNumber}, '${p.imageUrl}', ${p.meta ? "'" + JSON.stringify(p.meta).replace(/'/g, "''") + "'" : 'NULL'}, '${p.createdAt.toISOString()}', '${p.updatedAt.toISOString()}');\n`;
    }
    sql += '\n';
    
    // Export hotspots
    console.log('Exporting hotspots...');
    const hotspots = await client.query(
      `SELECT h.* FROM flipbook_hotspot h 
       INNER JOIN flipbook_page p ON h."pageId" = p.id 
       WHERE p."flipbookId" = $1 
       ORDER BY p."pageNumber", h."createdAt"`,
      [flipbookId]
    );
    sql += `-- Hotspots (${hotspots.rows.length} total)\n`;
    for (const h of hotspots.rows) {
      sql += `INSERT INTO flipbook_hotspot (id, "pageId", "productSku", label, "linkUrl", x, y, width, height, "zIndex", meta, "createdAt", "updatedAt") VALUES `;
      sql += `('${h.id}', '${h.pageId}', '${h.productSku || ''}', '${(h.label || '').replace(/'/g, "''")}', '${h.linkUrl || ''}', ${h.x}, ${h.y}, ${h.width}, ${h.height}, ${h.zIndex || 1}, ${h.meta ? "'" + JSON.stringify(h.meta).replace(/'/g, "''") + "'" : 'NULL'}, '${h.createdAt.toISOString()}', '${h.updatedAt.toISOString()}');\n`;
    }
    
    fs.writeFileSync(outputFile, sql);
    console.log(`\nExport complete!`);
    console.log(`File: ${outputFile}`);
    console.log(`Flipbook: ${flipbook.rows.length} record`);
    console.log(`Pages: ${pages.rows.length} records`);
    console.log(`Hotspots: ${hotspots.rows.length} records`);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

exportFlipbookData();
