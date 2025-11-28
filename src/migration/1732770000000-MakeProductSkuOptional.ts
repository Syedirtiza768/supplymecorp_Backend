import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeProductSkuOptional1732770000000 implements MigrationInterface {
    name = 'MakeProductSkuOptional1732770000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "flipbook_hotspots" ALTER COLUMN "productSku" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "flipbook_hotspots" ALTER COLUMN "productSku" SET NOT NULL`);
    }
}
