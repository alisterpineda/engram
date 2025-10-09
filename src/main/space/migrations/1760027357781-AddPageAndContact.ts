import { MigrationInterface, QueryRunner } from 'typeorm';

export class M1760027357781_AddPageAndContact implements MigrationInterface {
  name = 'AddPageAndContact1760027357781';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // No schema changes needed - Page and Contact use existing Note table via STI
    // They use the 'type' discriminator column which already exists
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No schema changes to revert
  }
}
