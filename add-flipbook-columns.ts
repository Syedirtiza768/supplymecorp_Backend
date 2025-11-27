import { AppDataSource } from './src/data-source';

async function addColumns() {
  try {
    await AppDataSource.initialize();
    
    console.log('Adding description and isFeatured columns...');
    
    await AppDataSource.query(`ALTER TABLE "flipbooks" ADD COLUMN IF NOT EXISTS "description" text`);
    await AppDataSource.query(`ALTER TABLE "flipbooks" ADD COLUMN IF NOT EXISTS "isFeatured" boolean NOT NULL DEFAULT false`);
    
    console.log('✓ Columns added successfully!');
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

addColumns();
