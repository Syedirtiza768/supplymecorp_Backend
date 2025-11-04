import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateReviewItems1730732500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'review_items',
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
            name: 'rating',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'comment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'user_name',
            type: 'varchar',
            length: '255',
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

    // Create unique constraint on session_id + product_id (one review per user per product)
    await queryRunner.query(
      `ALTER TABLE "review_items" ADD CONSTRAINT "UQ_review_session_product" UNIQUE ("session_id", "product_id")`,
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'review_items',
      new TableIndex({
        name: 'IDX_review_session_id',
        columnNames: ['session_id'],
      }),
    );

    await queryRunner.createIndex(
      'review_items',
      new TableIndex({
        name: 'IDX_review_product_id',
        columnNames: ['product_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('review_items');
  }
}
