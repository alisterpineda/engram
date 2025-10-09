import { MigrationInterface, QueryRunner } from "typeorm";

export class M1760025141052_AddPerformanceIndexes implements MigrationInterface {
    name = 'AddPerformanceIndexes1760025141052'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_49d92e494432aeefb3ca25bfb7" ON "note_reference" ("sourceId", "targetId") `);
        await queryRunner.query(`CREATE INDEX "IDX_85442d762fe002eb3e987cdb5d" ON "note_reference" ("targetId") `);
        await queryRunner.query(`CREATE INDEX "IDX_15ea3b05b438c28ca939ca706d" ON "note_reference" ("sourceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4d047e2d64406dcdacdd6c5c01" ON "note" ("updatedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_e7c0567f5261063592f022e9b5" ON "note" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_7df476ca295b6f509cc9cf433e" ON "note" ("endedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_c0f7b223d224798f36d36ebbfe" ON "note" ("startedAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_c0f7b223d224798f36d36ebbfe"`);
        await queryRunner.query(`DROP INDEX "IDX_7df476ca295b6f509cc9cf433e"`);
        await queryRunner.query(`DROP INDEX "IDX_e7c0567f5261063592f022e9b5"`);
        await queryRunner.query(`DROP INDEX "IDX_4d047e2d64406dcdacdd6c5c01"`);
        await queryRunner.query(`DROP INDEX "IDX_15ea3b05b438c28ca939ca706d"`);
        await queryRunner.query(`DROP INDEX "IDX_85442d762fe002eb3e987cdb5d"`);
        await queryRunner.query(`DROP INDEX "IDX_49d92e494432aeefb3ca25bfb7"`);
    }

}
