// Export Flipbook to SQL file
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const flipbookId = process.argv[2] || '2025-26-FW-New-Catalogue';
const outputFile = process.argv[3] || path.join(__dirname, `../flipbook_export_${Date.now()}.sql`);

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'orgill',
  user: 'postgres',
  password: 'global321'
});

async function exportFlipbook() {
  const client = await pool.connect();
  
  try {
    console.log('\n============================================');
    console.log('Export Flipbook to SQL');
    console.log('============================================\n');
    console.log(`Flipbook ID: ${flipbookId}`);
    console.log(`Output: ${outputFile}\n`);

    console.log('Step 1: Fetching data from database...');
    
    // Get flipbook
    const flipbookResult = await client.query('SELECT * FROM flipbooks WHERE id = $1', [flipbookId]);
    if (flipbookResult.rows.length === 0) {
      console.error('  Error: Flipbook not found');
      process.exit(1);
    }
    const flipbook = flipbookResult.rows[0];

    // Get pages
    const pagesResult = await client.query(
      'SELECT * FROM flipbook_pages WHERE "flipbookId" = $1 ORDER BY "pageNumber"',
      [flipbookId]
    );

    // Get hotspots
    const hotspotsResult = await client.query(
      `SELECT h.* FROM flipbook_hotspots h 
       JOIN flipbook_pages p ON h."pageId" = p.id 
       WHERE p."flipbookId" = $1 
       ORDER BY h."pageId", h."zIndex"`,
      [flipbookId]
    );

    console.log(`  Found: ${pagesResult.rows.length} pages, ${hotspotsResult.rows.length} hotspots`);

    console.log('\nStep 2: Generating SQL...');

    const sqlLines = [];
    
    sqlLines.push('-- Flipbook Export: ' + flipbookId);
    sqlLines.push('-- Generated: ' + new Date().toISOString());
    sqlLines.push('-- Source: Local Development Database');
    sqlLines.push('');
    sqlLines.push('-- Start transaction');
    sqlLines.push('BEGIN;');
    sqlLines.push('');
    sqlLines.push('-- Delete existing data');
    sqlLines.push(`DELETE FROM flipbook_hotspots WHERE "pageId" IN (SELECT id FROM flipbook_pages WHERE "flipbookId"='${flipbookId}');`);
    sqlLines.push(`DELETE FROM flipbook_pages WHERE "flipbookId"='${flipbookId}';`);
    sqlLines.push(`DELETE FROM flipbooks WHERE id='${flipbookId}';`);
    sqlLines.push('');
    sqlLines.push('-- Insert flipbook');
    
    const escapeString = (str) => str ? str.replace(/'/g, "''") : null;
    const formatValue = (val) => {
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'boolean') return val.toString();
      if (typeof val === 'number') return val.toString();
      if (val instanceof Date) return `'${val.toISOString()}'`;
      return `'${escapeString(val)}'`;
    };

    sqlLines.push(
      `INSERT INTO flipbooks (id, title, description, "isFeatured", "createdAt", "updatedAt") VALUES ` +
      `('${flipbook.id}', ${formatValue(flipbook.title)}, ${formatValue(flipbook.description)}, ` +
      `${flipbook.isFeatured}, '${flipbook.createdAt.toISOString()}', '${flipbook.updatedAt.toISOString()}');`
    );
    
    sqlLines.push('');
    sqlLines.push('-- Insert pages');
    
    for (const page of pagesResult.rows) {
      sqlLines.push(
        `INSERT INTO flipbook_pages (id, "flipbookId", "pageNumber", "imageUrl", meta, "createdAt", "updatedAt") VALUES ` +
        `('${page.id}', '${page.flipbookId}', ${page.pageNumber}, '${page.imageUrl}', ` +
        `${formatValue(page.meta)}, '${page.createdAt.toISOString()}', '${page.updatedAt.toISOString()}');`
      );
    }
    
    sqlLines.push('');
    sqlLines.push('-- Insert hotspots');
    
    for (const h of hotspotsResult.rows) {
      sqlLines.push(
        `INSERT INTO flipbook_hotspots (id, "pageId", "productSku", label, "linkUrl", x, y, width, height, "zIndex", meta, "createdAt", "updatedAt") VALUES ` +
        `('${h.id}', '${h.pageId}', ${formatValue(h.productSku)}, ${formatValue(h.label)}, ${formatValue(h.linkUrl)}, ` +
        `${h.x}, ${h.y}, ${h.width}, ${h.height}, ${h.zIndex}, ${formatValue(h.meta)}, ` +
        `'${h.createdAt.toISOString()}', '${h.updatedAt.toISOString()}');`
      );
    }
    
    sqlLines.push('');
    sqlLines.push('-- Commit transaction');
    sqlLines.push('COMMIT;');
    sqlLines.push('');
    sqlLines.push('-- Verification query');
    sqlLines.push(`SELECT f.id, f.title, f."isFeatured", COUNT(DISTINCT p.id) as pages, COUNT(h.id) as hotspots`);
    sqlLines.push(`FROM flipbooks f`);
    sqlLines.push(`LEFT JOIN flipbook_pages p ON p."flipbookId" = f.id`);
    sqlLines.push(`LEFT JOIN flipbook_hotspots h ON h."pageId" = p.id`);
    sqlLines.push(`WHERE f.id = '${flipbookId}'`);
    sqlLines.push(`GROUP BY f.id, f.title, f."isFeatured";`);

    fs.writeFileSync(outputFile, sqlLines.join('\n'), 'utf8');
    
    console.log('  SQL file created\n');
    console.log('============================================');
    console.log('Export Complete!');
    console.log('============================================\n');
    console.log('SQL file location:');
    console.log('  ' + outputFile + '\n');
    console.log('To transfer to production:');
    console.log('  scp "' + outputFile + '" root@108.181.195.170:/tmp/\n');
    console.log('To import on production:');
    console.log('  ssh root@108.181.195.170');
    console.log('  PGPASSWORD=\'global321\' psql -h localhost -U supplyme_user -d orgill -f /tmp/' + path.basename(outputFile) + '\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

exportFlipbook();
