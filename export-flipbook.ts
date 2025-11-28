import { AppDataSource } from './src/data-source';
import * as fs from 'fs';
import * as path from 'path';

async function exportFlipbookData() {
  try {
    await AppDataSource.initialize();
    console.log('✓ Database connected');

    const exportDir = path.join(__dirname, '..', 'flipbook-data-export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
      console.log(`✓ Created export directory: ${exportDir}`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Export Flipbook table
    console.log('\nExporting Flipbook table...');
    const flipbooks = await AppDataSource.query('SELECT * FROM flipbooks');
    const flipbookFile = path.join(exportDir, `flipbook_${timestamp}.json`);
    fs.writeFileSync(flipbookFile, JSON.stringify(flipbooks, null, 2));
    console.log(`✓ Exported ${flipbooks.length} flipbooks to: ${flipbookFile}`);

    // Export FlipbookPage table
    console.log('\nExporting FlipbookPage table...');
    const pages = await AppDataSource.query('SELECT * FROM flipbook_pages');
    const pageFile = path.join(exportDir, `flipbook_page_${timestamp}.json`);
    fs.writeFileSync(pageFile, JSON.stringify(pages, null, 2));
    console.log(`✓ Exported ${pages.length} pages to: ${pageFile}`);

    // Export FlipbookHotspot table
    console.log('\nExporting FlipbookHotspot table...');
    const hotspots = await AppDataSource.query('SELECT * FROM flipbook_hotspots');
    const hotspotFile = path.join(exportDir, `flipbook_hotspot_${timestamp}.json`);
    fs.writeFileSync(hotspotFile, JSON.stringify(hotspots, null, 2));
    console.log(`✓ Exported ${hotspots.length} hotspots to: ${hotspotFile}`);

    // Export combined SQL dump
    console.log('\nGenerating SQL dump...');
    const sqlDump = `
-- Flipbook Data Export
-- Timestamp: ${new Date().toISOString()}

-- Flipbook table
INSERT INTO flipbook (id, name, description, created_at, updated_at) VALUES
${flipbooks.map(fb => `('${fb.id}', '${fb.name?.replace(/'/g, "''")}', '${fb.description?.replace(/'/g, "''")}', '${fb.created_at}', '${fb.updated_at}')`).join(',\n')};

-- FlipbookPage table
INSERT INTO flipbook_page (id, flipbook_id, page_number, image_url, created_at, updated_at) VALUES
${pages.map(p => `('${p.id}', '${p.flipbook_id}', ${p.page_number}, '${p.image_url}', '${p.created_at}', '${p.updated_at}')`).join(',\n')};

-- FlipbookHotspot table
INSERT INTO flipbook_hotspot (id, page_id, product_sku, x, y, width, height, label, link_url, z_index, created_at, updated_at) VALUES
${hotspots.map(h => `('${h.id}', '${h.page_id}', '${h.product_sku}', ${h.x}, ${h.y}, ${h.width}, ${h.height}, '${h.label?.replace(/'/g, "''")}', '${h.link_url}', ${h.z_index}, '${h.created_at}', '${h.updated_at}')`).join(',\n')};
    `.trim();

    const sqlFile = path.join(exportDir, `flipbook_export_${timestamp}.sql`);
    fs.writeFileSync(sqlFile, sqlDump);
    console.log(`✓ Generated SQL dump: ${sqlFile}`);

    console.log(`\n✅ Export complete! All files saved to: ${exportDir}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

exportFlipbookData();
