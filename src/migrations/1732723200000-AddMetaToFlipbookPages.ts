import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMetaToFlipbookPages1732723200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'flipbook_pages',
      new TableColumn({
        name: 'meta',
        type: 'jsonb',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('flipbook_pages', 'meta');
  }
}
