import { MigrationInterface, QueryRunner } from "typeorm";

export class FlipbookIdToSlug1700550000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop foreign key constraint from flipbook_pages.flipbookId
        await queryRunner.query(`ALTER TABLE "flipbook_pages" DROP CONSTRAINT IF EXISTS "FK_flipbook_pages_flipbookId"`);

        // 2. Alter flipbooks.id from uuid to varchar(255)
        await queryRunner.query(`ALTER TABLE "flipbooks" ALTER COLUMN "id" TYPE varchar(255)`);

        // 3. Alter flipbook_pages.flipbookId from uuid to varchar(255)
        await queryRunner.query(`ALTER TABLE "flipbook_pages" ALTER COLUMN "flipbookId" TYPE varchar(255)`);

        // 4. Re-add foreign key constraint
        await queryRunner.query(`ALTER TABLE "flipbook_pages" ADD CONSTRAINT "FK_flipbook_pages_flipbookId" FOREIGN KEY ("flipbookId") REFERENCES "flipbooks"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop new foreign key constraint
        await queryRunner.query(`ALTER TABLE "flipbook_pages" DROP CONSTRAINT IF EXISTS "FK_flipbook_pages_flipbookId"`);

        // 2. Alter flipbooks.id back to uuid
        await queryRunner.query(`ALTER TABLE "flipbooks" ALTER COLUMN "id" TYPE uuid USING ("id"::uuid)`);

        // 3. Alter flipbook_pages.flipbookId back to uuid
        await queryRunner.query(`ALTER TABLE "flipbook_pages" ALTER COLUMN "flipbookId" TYPE uuid USING ("flipbookId"::uuid)`);

        // 4. Re-add original foreign key constraint
        await queryRunner.query(`ALTER TABLE "flipbook_pages" ADD CONSTRAINT "FK_flipbook_pages_flipbookId" FOREIGN KEY ("flipbookId") REFERENCES "flipbooks"("id") ON DELETE CASCADE`);
    }
}
