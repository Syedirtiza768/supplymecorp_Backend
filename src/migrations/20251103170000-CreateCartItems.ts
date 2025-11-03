import { MigrationInterface, QueryRunner, Table, TableIndex, TableUnique } from 'typeorm';

export class CreateCartItems20251103170000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'cart_items',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
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
            name: 'qty',
            type: 'integer',
            isNullable: false,
            default: 1,
          },
          {
            name: 'price_snapshot',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      })
    );
    await queryRunner.createIndex(
      'cart_items',
      new TableIndex({
        name: 'IDX_cart_items_session_id',
        columnNames: ['session_id'],
      })
    );
    await queryRunner.createIndex(
      'cart_items',
      new TableIndex({
        name: 'IDX_cart_items_product_id',
        columnNames: ['product_id'],
      })
    );
    await queryRunner.createUniqueConstraint(
      'cart_items',
      new TableUnique({
        name: 'UQ_cart_items_session_product',
        columnNames: ['session_id', 'product_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('cart_items');
  }
}
