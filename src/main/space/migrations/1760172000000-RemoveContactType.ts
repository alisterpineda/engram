import { MigrationInterface, QueryRunner } from 'typeorm';

export class M1760172000000_RemoveContactType implements MigrationInterface {
  name = 'RemoveContactType1760172000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Delete all Contact records (type='contact') from the note table
    await queryRunner.query(`DELETE FROM note WHERE type = 'contact'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cannot restore deleted Contact records - this migration is irreversible
    // Down migration intentionally left empty
  }
}
