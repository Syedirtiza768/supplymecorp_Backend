import { DataSource } from 'typeorm';
import { readdir } from 'fs/promises';
import { join } from 'path';

// Database configuration - update these for production
const dbConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'global321',
  database: process.env.DB_DATABASE || 'orgill',
};

async function syncFlipbookPages(flipbookId: string) {
  const AppDataSource = new DataSource({
    ...dbConfig,
    synchronize: false,
    logging: true,
  });

  await AppDataSource.initialize();
  console.log('✓ Database connected');

  const flipbookDir = join(process.cwd(), 'uploads', 'flipbooks', flipbookId);
  console.log(`Scanning directory: ${flipbookDir}`);
  
  const files = await readdir(flipbookDir);
  
  // Filter image files and extract page numbers
  const imageFiles = files
    .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
    .map(filename => {
      const match = filename.match(/page-(\d+)\./);
      if (!match) return null;
      return {
        pageNumber: parseInt(match[1]),
        filename,
        imageUrl: `/uploads/flipbooks/${flipbookId}/${filename}`
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.pageNumber - b!.pageNumber);

  console.log(`\nFound ${imageFiles.length} image files for flipbook ${flipbookId}\n`);

  let created = 0;
  let skipped = 0;

  // Insert pages that don't exist
  for (const page of imageFiles) {
    if (!page) continue;

    const exists = await AppDataSource.query(
      'SELECT id FROM flipbook_pages WHERE "flipbookId" = $1 AND "pageNumber" = $2',
      [flipbookId, page.pageNumber]
    );

    if (exists.length === 0) {
      await AppDataSource.query(
        `INSERT INTO flipbook_pages ("flipbookId", "pageNumber", "imageUrl", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [flipbookId, page.pageNumber, page.imageUrl]
      );
      console.log(`✓ Created page ${page.pageNumber} (${page.filename})`);
      created++;
    } else {
      skipped++;
    }
  }

  await AppDataSource.destroy();
  console.log(`\n✓ Sync complete!`);
  console.log(`  Created: ${created} pages`);
  console.log(`  Skipped: ${skipped} pages (already exist)`);
  console.log(`  Total: ${imageFiles.length} pages`);
}

// Run the sync
const flipbookId = process.argv[2] || '2025-Spring-Summer-Catalogue';
console.log(`\n=== Syncing Flipbook Pages ===`);
console.log(`Flipbook ID: ${flipbookId}\n`);

syncFlipbookPages(flipbookId)
  .then(() => {
    console.log('\n✓ Done!\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n✗ Error:', err.message);
    process.exit(1);
  });
