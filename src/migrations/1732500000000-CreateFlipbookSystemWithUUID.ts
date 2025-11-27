import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFlipbookSystemWithUUID1732500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create flipbooks table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "flipbooks" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Drop existing tables if they exist
    await queryRunner.query(`DROP TABLE IF EXISTS "flipbook_hotspots" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "flipbook_pages" CASCADE`);

    // Create flipbook_pages table with UUID
    await queryRunner.query(`
      CREATE TABLE "flipbook_pages" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "flipbookId" uuid NOT NULL,
        "pageNumber" INTEGER NOT NULL,
        "imageUrl" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_flipbook_pages_flipbookId" FOREIGN KEY ("flipbookId") 
          REFERENCES "flipbooks"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_flipbook_page" UNIQUE ("flipbookId", "pageNumber")
      )
    `);

    // Create index for flipbook pages
    await queryRunner.query(`
      CREATE INDEX "IDX_flipbook_pages_flipbookId_pageNumber" 
      ON "flipbook_pages" ("flipbookId", "pageNumber")
    `);

    // Create flipbook_hotspots table with UUID
    await queryRunner.query(`
      CREATE TABLE "flipbook_hotspots" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "pageId" uuid NOT NULL,
        "productSku" VARCHAR(255) NOT NULL,
        "label" VARCHAR(255),
        "linkUrl" TEXT,
        "x" FLOAT NOT NULL,
        "y" FLOAT NOT NULL,
        "width" FLOAT NOT NULL,
        "height" FLOAT NOT NULL,
        "zIndex" INTEGER DEFAULT 0,
        "meta" JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_flipbook_hotspots_pageId" FOREIGN KEY ("pageId") 
          REFERENCES "flipbook_pages"("id") ON DELETE CASCADE
      )
    `);

    // Create index for hotspots
    await queryRunner.query(`
      CREATE INDEX "IDX_flipbook_hotspots_pageId" 
      ON "flipbook_hotspots" ("pageId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "flipbook_hotspots" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "flipbook_pages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "flipbooks" CASCADE`);
  }
}
