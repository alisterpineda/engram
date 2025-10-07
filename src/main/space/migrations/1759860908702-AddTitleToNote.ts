import { MigrationInterface, QueryRunner } from "typeorm";

export class M1759860908702_AddTitleToNote implements MigrationInterface {
    name = 'AddTitleToNote1759860908702'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_609d822845dbc942e8f3c7bae0"`);
        await queryRunner.query(`CREATE TABLE "temporary_note" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "contentJson" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "startedAt" datetime, "endedAt" datetime, "parentId" integer, "type" varchar NOT NULL, "title" varchar(255), CONSTRAINT "CHK_bcbaf35983686b8b6ea9e586c1" CHECK (("parentId" IS NULL OR "endedAt" IS NULL)), CONSTRAINT "CHK_529c2abfeb9c0650ee84ec9d3d" CHECK (("endedAt" IS NULL OR "endedAt" > "startedAt")), CONSTRAINT "FK_90a032d425eacf5d60ba1b742b5" FOREIGN KEY ("parentId") REFERENCES "note" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_note"("id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "parentId", "type") SELECT "id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "parentId", "type" FROM "note"`);
        await queryRunner.query(`DROP TABLE "note"`);
        await queryRunner.query(`ALTER TABLE "temporary_note" RENAME TO "note"`);
        await queryRunner.query(`CREATE INDEX "IDX_609d822845dbc942e8f3c7bae0" ON "note" ("type") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_609d822845dbc942e8f3c7bae0"`);
        await queryRunner.query(`ALTER TABLE "note" RENAME TO "temporary_note"`);
        await queryRunner.query(`CREATE TABLE "note" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "contentJson" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "startedAt" datetime, "endedAt" datetime, "parentId" integer, "type" varchar NOT NULL, CONSTRAINT "CHK_bcbaf35983686b8b6ea9e586c1" CHECK (("parentId" IS NULL OR "endedAt" IS NULL)), CONSTRAINT "CHK_529c2abfeb9c0650ee84ec9d3d" CHECK (("endedAt" IS NULL OR "endedAt" > "startedAt")), CONSTRAINT "FK_90a032d425eacf5d60ba1b742b5" FOREIGN KEY ("parentId") REFERENCES "note" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "note"("id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "parentId", "type") SELECT "id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "parentId", "type" FROM "temporary_note"`);
        await queryRunner.query(`DROP TABLE "temporary_note"`);
        await queryRunner.query(`CREATE INDEX "IDX_609d822845dbc942e8f3c7bae0" ON "note" ("type") `);
    }

}
