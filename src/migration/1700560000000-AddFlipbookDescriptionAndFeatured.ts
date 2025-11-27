import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFlipbookDescriptionAndFeatured1700560000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add description column
        await queryRunner.query(`ALTER TABLE "flipbooks" ADD COLUMN "description" text`);
        
        // Add isFeatured column with default false
        await queryRunner.query(`ALTER TABLE "flipbooks" ADD COLUMN "isFeatured" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove columns
        await queryRunner.query(`ALTER TABLE "flipbooks" DROP COLUMN "isFeatured"`);
        await queryRunner.query(`ALTER TABLE "flipbooks" DROP COLUMN "description"`);
    }
}
