import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateHotspotsTable1732123456789 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "hotspots",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "flipbookId",
                        type: "varchar",
                        isNullable: false,
                    },
                    {
                        name: "pageNumber",
                        type: "integer",
                        isNullable: false,
                    },
                    {
                        name: "x",
                        type: "float",
                        isNullable: false,
                    },
                    {
                        name: "y",
                        type: "float",
                        isNullable: false,
                    },
                    {
                        name: "width",
                        type: "float",
                        isNullable: false,
                    },
                    {
                        name: "height",
                        type: "float",
                        isNullable: false,
                    },
                    {
                        name: "productId",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "now()",
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true
        );

        // Add foreign key to products table if it exists
        // Note: Skipping FK creation as sku column may not have unique constraint
        // The relationship is still maintained at the application level

        // Create indexes for better query performance
        await queryRunner.query(`
            CREATE INDEX "IDX_hotspots_flipbookId_pageNumber" ON "hotspots" ("flipbookId", "pageNumber");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("hotspots");
    }
}
