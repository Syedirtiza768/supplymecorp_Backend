import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddViewCountFields1731187200000 implements MigrationInterface {
  name = 'AddViewCountFields1731187200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add view_count column
    await queryRunner.query(`
      ALTER TABLE "orgill_products" 
      ADD COLUMN IF NOT EXISTS "view_count" integer NOT NULL DEFAULT 0
    `);

    // Add created_at column
    await queryRunner.query(`
      ALTER TABLE "orgill_products" 
      ADD COLUMN IF NOT EXISTS "created_at" timestamptz NOT NULL DEFAULT now()
    `);

    // Add featured column
    await queryRunner.query(`
      ALTER TABLE "orgill_products" 
      ADD COLUMN IF NOT EXISTS "featured" boolean NOT NULL DEFAULT false
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orgill_products_view_count" 
      ON "orgill_products" ("view_count")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orgill_products_created_at" 
      ON "orgill_products" ("created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orgill_products_featured_created_at" 
      ON "orgill_products" ("featured", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orgill_products_featured_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orgill_products_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orgill_products_view_count"`);
    await queryRunner.query(`ALTER TABLE "orgill_products" DROP COLUMN IF EXISTS "featured"`);
    await queryRunner.query(`ALTER TABLE "orgill_products" DROP COLUMN IF EXISTS "created_at"`);
    await queryRunner.query(`ALTER TABLE "orgill_products" DROP COLUMN IF EXISTS "view_count"`);
  }
}
