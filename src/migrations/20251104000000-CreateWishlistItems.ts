import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateWishlistItems1730732400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'wishlist_items',
        columns: [
          {
            name: 'id',
            type: 'bigserial',
            isPrimary: true,
          },
          {
            name: 'session_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'price_snapshot',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'NOW()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'NOW()',
          },
        ],
      }),
      true,
    );

    // Create unique constraint on session_id + product_id
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" ADD CONSTRAINT "UQ_wishlist_session_product" UNIQUE ("session_id", "product_id")`,
    );

    // Create indexes
    await queryRunner.createIndex(
      'wishlist_items',
      new TableIndex({
        name: 'IDX_wishlist_session_id',
        columnNames: ['session_id'],
      }),
    );

    await queryRunner.createIndex(
      'wishlist_items',
      new TableIndex({
        name: 'IDX_wishlist_product_id',
        columnNames: ['product_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('wishlist_items');
  }
}
