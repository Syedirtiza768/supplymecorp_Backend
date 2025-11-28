import { AppDataSource } from './src/data-source';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface ImportOptions {
  flipbookFile: string;
  pageFile: string;
  hotspotFile: string;
  mode: 'insert' | 'replace'; // 'insert' = add new data, 'replace' = truncate first
  dbConfig?: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
  };
}

async function importFlipbookData(options: ImportOptions) {
  try {
    // Validate files exist
    if (!fs.existsSync(options.flipbookFile)) {
      throw new Error(`Flipbook file not found: ${options.flipbookFile}`);
    }
    if (!fs.existsSync(options.pageFile)) {
      throw new Error(`Page file not found: ${options.pageFile}`);
    }
    if (!fs.existsSync(options.hotspotFile)) {
      throw new Error(`Hotspot file not found: ${options.hotspotFile}`);
    }

    // Override database config if provided
    if (options.dbConfig) {
      if (options.dbConfig.host) process.env.DB_HOST = options.dbConfig.host;
      if (options.dbConfig.port) process.env.DB_PORT = String(options.dbConfig.port);
      if (options.dbConfig.username) process.env.DB_USERNAME = options.dbConfig.username;
      if (options.dbConfig.password) process.env.DB_PASSWORD = options.dbConfig.password;
      if (options.dbConfig.database) process.env.DB_DATABASE = options.dbConfig.database;
    }

    await AppDataSource.initialize();
    console.log('✓ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    console.log(`\nImporting flipbook data (mode: ${options.mode})...`);

    if (options.mode === 'replace') {
      console.log('\n⚠️  Mode is REPLACE - truncating existing tables...');
      
      // Disable foreign key checks
      await queryRunner.query('SET session_replication_role = \'replica\'');
      
      // Truncate tables
      await queryRunner.query('TRUNCATE TABLE flipbook_hotspots CASCADE');
      console.log('✓ Truncated flipbook_hotspots');
      
      await queryRunner.query('TRUNCATE TABLE flipbook_pages CASCADE');
      console.log('✓ Truncated flipbook_pages');
      
      await queryRunner.query('TRUNCATE TABLE flipbooks CASCADE');
      console.log('✓ Truncated flipbooks');
      
      // Re-enable foreign key checks
      await queryRunner.query('SET session_replication_role = \'origin\'');
      console.log('✓ Foreign key checks re-enabled');
    }

    // Import Flipbook data
    console.log('\nImporting Flipbook table...');
    const flipbooks = JSON.parse(fs.readFileSync(options.flipbookFile, 'utf-8'));
    for (const flipbook of flipbooks) {
      await queryRunner.query(
        `INSERT INTO flipbooks (id, title, description, "isFeatured", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
         title = $2, description = $3, "isFeatured" = $4, "updatedAt" = $6`,
        [
          flipbook.id,
          flipbook.title,
          flipbook.description,
          flipbook.isFeatured || false,
          flipbook.createdAt,
          flipbook.updatedAt,
        ]
      );
    }
    console.log(`✓ Imported ${flipbooks.length} flipbooks`);

    // Import FlipbookPage data
    console.log('\nImporting FlipbookPage table...');
    const pages = JSON.parse(fs.readFileSync(options.pageFile, 'utf-8'));
    for (const page of pages) {
      await queryRunner.query(
        `INSERT INTO flipbook_pages (id, "flipbookId", "pageNumber", "imageUrl", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
         "pageNumber" = $3, "imageUrl" = $4, "updatedAt" = $6`,
        [
          page.id,
          page.flipbookId,
          page.pageNumber,
          page.imageUrl,
          page.createdAt,
          page.updatedAt,
        ]
      );
    }
    console.log(`✓ Imported ${pages.length} flipbook pages`);

    // Import FlipbookHotspot data
    console.log('\nImporting FlipbookHotspot table...');
    const hotspots = JSON.parse(fs.readFileSync(options.hotspotFile, 'utf-8'));
    for (const hotspot of hotspots) {
      await queryRunner.query(
        `INSERT INTO flipbook_hotspots (id, "pageId", "productSku", x, y, width, height, label, "linkUrl", "zIndex", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
         "productSku" = $3, x = $4, y = $5, width = $6, height = $7, label = $8, "linkUrl" = $9, "zIndex" = $10, "updatedAt" = $12`,
        [
          hotspot.id,
          hotspot.pageId,
          hotspot.productSku,
          hotspot.x,
          hotspot.y,
          hotspot.width,
          hotspot.height,
          hotspot.label,
          hotspot.linkUrl,
          hotspot.zIndex,
          hotspot.createdAt,
          hotspot.updatedAt,
        ]
      );
    }
    console.log(`✓ Imported ${hotspots.length} hotspots`);

    await queryRunner.release();

    console.log('\n✅ Import complete!');
    console.log(`\nSummary:`);
    console.log(`  - Flipbooks: ${flipbooks.length}`);
    console.log(`  - Pages: ${pages.length}`);
    console.log(`  - Hotspots: ${hotspots.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Convert to absolute path if relative
if (!path.isAbsolute(exportDir)) {
  exportDir = path.join(process.cwd(), exportDir);
}

// Verify directory exists
if (!fs.existsSync(exportDir)) {
  console.error(`❌ Export directory not found: ${exportDir}`);
  console.error(`\nUsage: npx ts-node import-flipbook.ts [mode] [directory] [db-options]`);
  console.error(`\nExamples:`);
  console.error(`  npx ts-node import-flipbook.ts insert`);
  console.error(`  npx ts-node import-flipbook.ts replace`);
  console.error(`  npx ts-node import-flipbook.ts replace /path/to/flipbook-data-export`);
  console.error(`\nDatabase Credentials Options:`);
  console.error(`  --db-password <password>    Override DB_PASSWORD`);
  console.error(`  --db-username <username>    Override DB_USERNAME`);
  console.error(`  --db-host <host>            Override DB_HOST`);
  console.error(`  --db-port <port>            Override DB_PORT`);
  console.error(`  --db-database <database>    Override DB_DATABASE`);
  console.error(`  --db-config <file>          Load all credentials from JSON file`);
  console.error(`\nExamples with credentials:`);
  console.error(`  npx ts-node import-flipbook.ts replace --db-password mypassword`);
  console.error(`  npx ts-node import-flipbook.ts replace /path/export --db-config db-config.json`);
  process.exit(1);
}

// Find the latest export files
const files = fs.readdirSync(exportDir);
const jsonFiles = files.filter(f => f.startsWith('flipbook_') && f.endsWith('.json'));

if (jsonFiles.length === 0) {
  console.error(`❌ No export files found in: ${exportDir}`);
  console.error(`\nExpected files:`);
  console.error(`  - flipbook_*.json`);
  console.error(`  - flipbook_page_*.json`);
  console.error(`  - flipbook_hotspot_*.json`);
  process.exit(1);
}

// Get the latest timestamp
const timestamp = jsonFiles[0]?.match(/\d{4}-\d{2}-\d{2}T[\d\-Z]+/)?.[0];

if (!timestamp) {
  console.error('❌ Could not parse timestamp from export files');
  process.exit(1);
}

// Parse database credentials from command line arguments
const dbConfig: ImportOptions['dbConfig'] = {};
for (let i = 2; i < args.length; i++) {
  if (args[i] === '--db-password' && args[i + 1]) {
    dbConfig.password = args[i + 1];
    i++;
  } else if (args[i] === '--db-username' && args[i + 1]) {
    dbConfig.username = args[i + 1];
    i++;
  } else if (args[i] === '--db-host' && args[i + 1]) {
    dbConfig.host = args[i + 1];
    i++;
  } else if (args[i] === '--db-port' && args[i + 1]) {
    dbConfig.port = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--db-database' && args[i + 1]) {
    dbConfig.database = args[i + 1];
    i++;
  } else if (args[i] === '--db-config' && args[i + 1]) {
    // Load credentials from JSON file
    const configFile = args[i + 1];
    if (fs.existsSync(configFile)) {
      try {
        const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
        Object.assign(dbConfig, config);
        console.log(`✓ Loaded database config from: ${configFile}`);
      } catch (err) {
        console.error(`❌ Failed to parse config file: ${configFile}`);
        process.exit(1);
      }
    } else {
      console.error(`❌ Config file not found: ${configFile}`);
      process.exit(1);
    }
    i++;
  }
}

const options: ImportOptions = {
  flipbookFile: path.join(exportDir, `flipbook_${timestamp}.json`),
  pageFile: path.join(exportDir, `flipbook_page_${timestamp}.json`),
  hotspotFile: path.join(exportDir, `flipbook_hotspot_${timestamp}.json`),
  mode,
  dbConfig: Object.keys(dbConfig).length > 0 ? dbConfig : undefined,
};

console.log('🔄 Starting flipbook data import...');
console.log(`📁 Source directory: ${exportDir}`);
console.log(`📅 Using export from: ${timestamp}`);
console.log(`Mode: ${mode}\n`);

importFlipbookData(options);
