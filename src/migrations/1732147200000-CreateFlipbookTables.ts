import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFlipbookTables1732147200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create flipbook_pages table
    await queryRunner.query(`
      CREATE TABLE "flipbook_pages" (
        "id" SERIAL PRIMARY KEY,
        "flipbookId" VARCHAR NOT NULL,
        "pageNumber" INTEGER NOT NULL,
        "imageUrl" VARCHAR NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_flipbook_page" UNIQUE ("flipbookId", "pageNumber")
      )
    `);

    // Create index on flipbookId and pageNumber
    await queryRunner.query(`
      CREATE INDEX "IDX_flipbook_pages_flipbookId_pageNumber" 
      ON "flipbook_pages" ("flipbookId", "pageNumber")
    `);

    // Create flipbook_hotspots table
    await queryRunner.query(`
      CREATE TABLE "flipbook_hotspots" (
        "id" SERIAL PRIMARY KEY,
        "pageId" INTEGER NOT NULL,
        "productSku" VARCHAR NOT NULL,
        "label" VARCHAR,
        "linkUrl" VARCHAR,
        "x" FLOAT NOT NULL,
        "y" FLOAT NOT NULL,
        "width" FLOAT NOT NULL,
        "height" FLOAT NOT NULL,
        "zIndex" INTEGER NOT NULL DEFAULT 0,
        "meta" JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_flipbook_hotspots_page" 
          FOREIGN KEY ("pageId") 
          REFERENCES "flipbook_pages"("id") 
          ON DELETE CASCADE
      )
    `);

    // Create index on pageId
    await queryRunner.query(`
      CREATE INDEX "IDX_flipbook_hotspots_pageId" 
      ON "flipbook_hotspots" ("pageId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "flipbook_hotspots"`);
    await queryRunner.query(`DROP TABLE "flipbook_pages"`);
  }
}
