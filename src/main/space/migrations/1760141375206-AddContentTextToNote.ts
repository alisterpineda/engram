import { MigrationInterface, QueryRunner } from "typeorm";
import { generateTextFromContentJson } from '../../utils/textGeneration';

export class M1760141375206_AddContentTextToNote implements MigrationInterface {
    name = 'AddContentTextToNote1760141375206'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_90a032d425eacf5d60ba1b742b"`);
        await queryRunner.query(`DROP INDEX "IDX_614205a7ea1b23841a73939328"`);
        await queryRunner.query(`DROP INDEX "IDX_609d822845dbc942e8f3c7bae0"`);
        await queryRunner.query(`DROP INDEX "IDX_4d047e2d64406dcdacdd6c5c01"`);
        await queryRunner.query(`DROP INDEX "IDX_e7c0567f5261063592f022e9b5"`);
        await queryRunner.query(`DROP INDEX "IDX_7df476ca295b6f509cc9cf433e"`);
        await queryRunner.query(`DROP INDEX "IDX_c0f7b223d224798f36d36ebbfe"`);
        await queryRunner.query(`CREATE TABLE "temporary_note" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "contentJson" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "startedAt" datetime, "endedAt" datetime, "type" varchar NOT NULL, "title" varchar(255), "parentId" integer, "commentedAt" datetime, "contentText" text, CONSTRAINT "CHK_529c2abfeb9c0650ee84ec9d3d" CHECK ((((("endedAt" IS NULL OR "endedAt" > "startedAt"))))), CONSTRAINT "FK_90a032d425eacf5d60ba1b742b5" FOREIGN KEY ("parentId") REFERENCES "note" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_note"("id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "type", "title", "parentId", "commentedAt") SELECT "id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "type", "title", "parentId", "commentedAt" FROM "note"`);
        await queryRunner.query(`DROP TABLE "note"`);
        await queryRunner.query(`ALTER TABLE "temporary_note" RENAME TO "note"`);

        // Backfill contentText for existing notes
        const notes = await queryRunner.query(`SELECT id, contentJson FROM "note"`);
        for (const note of notes) {
            const contentText = generateTextFromContentJson(note.contentJson);
            await queryRunner.query(
                `UPDATE "note" SET contentText = ? WHERE id = ?`,
                [contentText, note.id]
            );
        }

        await queryRunner.query(`CREATE INDEX "IDX_90a032d425eacf5d60ba1b742b" ON "note" ("parentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_614205a7ea1b23841a73939328" ON "note" ("commentedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_609d822845dbc942e8f3c7bae0" ON "note" ("type") `);
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
        await queryRunner.query(`DROP INDEX "IDX_609d822845dbc942e8f3c7bae0"`);
        await queryRunner.query(`DROP INDEX "IDX_614205a7ea1b23841a73939328"`);
        await queryRunner.query(`DROP INDEX "IDX_90a032d425eacf5d60ba1b742b"`);
        await queryRunner.query(`ALTER TABLE "note" RENAME TO "temporary_note"`);
        await queryRunner.query(`CREATE TABLE "note" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "contentJson" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "startedAt" datetime, "endedAt" datetime, "type" varchar NOT NULL, "title" varchar(255), "parentId" integer, "commentedAt" datetime, CONSTRAINT "CHK_529c2abfeb9c0650ee84ec9d3d" CHECK ((((("endedAt" IS NULL OR "endedAt" > "startedAt"))))), CONSTRAINT "FK_90a032d425eacf5d60ba1b742b5" FOREIGN KEY ("parentId") REFERENCES "note" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "note"("id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "type", "title", "parentId", "commentedAt") SELECT "id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "type", "title", "parentId", "commentedAt" FROM "temporary_note"`);
        await queryRunner.query(`DROP TABLE "temporary_note"`);
        await queryRunner.query(`CREATE INDEX "IDX_c0f7b223d224798f36d36ebbfe" ON "note" ("startedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_7df476ca295b6f509cc9cf433e" ON "note" ("endedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_e7c0567f5261063592f022e9b5" ON "note" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_4d047e2d64406dcdacdd6c5c01" ON "note" ("updatedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_609d822845dbc942e8f3c7bae0" ON "note" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_614205a7ea1b23841a73939328" ON "note" ("commentedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_90a032d425eacf5d60ba1b742b" ON "note" ("parentId") `);
    }

}
