import { AppDataSource } from './src/data-source';

async function runMigration() {
  try {
    await AppDataSource.initialize();
    
    console.log('Checking current flipbooks.id column type...');
    const result = await AppDataSource.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'flipbooks' AND column_name = 'id'`
    );
    console.log('Current type:', result);
    
    if (result[0]?.data_type === 'uuid') {
      console.log('Converting flipbooks.id from uuid to varchar...');
      
      // Drop foreign key
      await AppDataSource.query(`ALTER TABLE "flipbook_pages" DROP CONSTRAINT IF EXISTS "FK_flipbook_pages_flipbookId"`);
      
      // Convert columns
      await AppDataSource.query(`ALTER TABLE "flipbooks" ALTER COLUMN "id" TYPE varchar(255)`);
      await AppDataSource.query(`ALTER TABLE "flipbook_pages" ALTER COLUMN "flipbookId" TYPE varchar(255)`);
      
      // Re-add foreign key
      await AppDataSource.query(`ALTER TABLE "flipbook_pages" ADD CONSTRAINT "FK_flipbook_pages_flipbookId" FOREIGN KEY ("flipbookId") REFERENCES "flipbooks"("id") ON DELETE CASCADE`);
      
      console.log('✓ Migration completed successfully!');
    } else {
      console.log('✓ Already migrated - flipbooks.id is already varchar');
    }
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
