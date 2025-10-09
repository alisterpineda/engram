import { MigrationInterface, QueryRunner } from "typeorm";

export class M1760019952279_ConvertToNoteReferences implements MigrationInterface {
    name = 'ConvertToNoteReferences1760019952279'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remove the check constraint for parentId/endedAt
        await queryRunner.query(`DROP INDEX "IDX_609d822845dbc942e8f3c7bae0"`);
        await queryRunner.query(`CREATE TABLE "temporary_note" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "contentJson" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "startedAt" datetime, "endedAt" datetime, "parentId" integer, "type" varchar NOT NULL, "title" varchar(255), CONSTRAINT "CHK_bcbaf35983686b8b6ea9e586c1" CHECK ((("parentId" IS NULL OR "endedAt" IS NULL))), CONSTRAINT "CHK_529c2abfeb9c0650ee84ec9d3d" CHECK ((("endedAt" IS NULL OR "endedAt" > "startedAt"))))`);
        await queryRunner.query(`INSERT INTO "temporary_note"("id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "parentId", "type", "title") SELECT "id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "parentId", "type", "title" FROM "note"`);
        await queryRunner.query(`DROP TABLE "note"`);
        await queryRunner.query(`ALTER TABLE "temporary_note" RENAME TO "note"`);
        await queryRunner.query(`CREATE INDEX "IDX_609d822845dbc942e8f3c7bae0" ON "note" ("type") `);
        await queryRunner.query(`DROP INDEX "IDX_609d822845dbc942e8f3c7bae0"`);
        await queryRunner.query(`CREATE TABLE "temporary_note" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "contentJson" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "startedAt" datetime, "endedAt" datetime, "parentId" integer, "type" varchar NOT NULL, "title" varchar(255), CONSTRAINT "CHK_529c2abfeb9c0650ee84ec9d3d" CHECK ((("endedAt" IS NULL OR "endedAt" > "startedAt"))))`);
        await queryRunner.query(`INSERT INTO "temporary_note"("id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "parentId", "type", "title") SELECT "id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "parentId", "type", "title" FROM "note"`);
        await queryRunner.query(`DROP TABLE "note"`);
        await queryRunner.query(`ALTER TABLE "temporary_note" RENAME TO "note"`);
        await queryRunner.query(`CREATE INDEX "IDX_609d822845dbc942e8f3c7bae0" ON "note" ("type") `);

        // Create note_reference table
        await queryRunner.query(`CREATE TABLE "note_reference" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "sourceId" integer NOT NULL, "targetId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "CHK_acc15edd0df02423a85e89167b" CHECK ("sourceId" != "targetId"))`);

        // Migrate existing parent-child relationships to note_reference
        // Note: sourceId is the child, targetId is the parent (reversed from old schema)
        await queryRunner.query(`INSERT INTO "note_reference" (sourceId, targetId, createdAt) SELECT id, parentId, createdAt FROM "note" WHERE parentId IS NOT NULL`);

        // Remove parentId column and add foreign keys to note_reference
        await queryRunner.query(`DROP INDEX "IDX_609d822845dbc942e8f3c7bae0"`);
        await queryRunner.query(`CREATE TABLE "temporary_note" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "contentJson" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "startedAt" datetime, "endedAt" datetime, "type" varchar NOT NULL, "title" varchar(255), CONSTRAINT "CHK_529c2abfeb9c0650ee84ec9d3d" CHECK ((("endedAt" IS NULL OR "endedAt" > "startedAt"))))`);
        await queryRunner.query(`INSERT INTO "temporary_note"("id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "type", "title") SELECT "id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "type", "title" FROM "note"`);
        await queryRunner.query(`DROP TABLE "note"`);
        await queryRunner.query(`ALTER TABLE "temporary_note" RENAME TO "note"`);
        await queryRunner.query(`CREATE INDEX "IDX_609d822845dbc942e8f3c7bae0" ON "note" ("type") `);
        await queryRunner.query(`CREATE TABLE "temporary_note_reference" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "sourceId" integer NOT NULL, "targetId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "CHK_acc15edd0df02423a85e89167b" CHECK ("sourceId" != "targetId"), CONSTRAINT "FK_15ea3b05b438c28ca939ca706d1" FOREIGN KEY ("sourceId") REFERENCES "note" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_85442d762fe002eb3e987cdb5d6" FOREIGN KEY ("targetId") REFERENCES "note" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_note_reference"("id", "sourceId", "targetId", "createdAt") SELECT "id", "sourceId", "targetId", "createdAt" FROM "note_reference"`);
        await queryRunner.query(`DROP TABLE "note_reference"`);
        await queryRunner.query(`ALTER TABLE "temporary_note_reference" RENAME TO "note_reference"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "note_reference" RENAME TO "temporary_note_reference"`);
        await queryRunner.query(`CREATE TABLE "note_reference" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "sourceId" integer NOT NULL, "targetId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "CHK_acc15edd0df02423a85e89167b" CHECK ("sourceId" != "targetId"))`);
        await queryRunner.query(`INSERT INTO "note_reference"("id", "sourceId", "targetId", "createdAt") SELECT "id", "sourceId", "targetId", "createdAt" FROM "temporary_note_reference"`);
        await queryRunner.query(`DROP TABLE "temporary_note_reference"`);
        await queryRunner.query(`DROP INDEX "IDX_609d822845dbc942e8f3c7bae0"`);
        await queryRunner.query(`ALTER TABLE "note" RENAME TO "temporary_note"`);
        await queryRunner.query(`CREATE TABLE "note" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "contentJson" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "startedAt" datetime, "endedAt" datetime, "parentId" integer, "type" varchar NOT NULL, "title" varchar(255), CONSTRAINT "CHK_529c2abfeb9c0650ee84ec9d3d" CHECK ((("endedAt" IS NULL OR "endedAt" > "startedAt"))))`);
        await queryRunner.query(`INSERT INTO "note"("id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "type", "title") SELECT "id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "type", "title" FROM "temporary_note"`);
        await queryRunner.query(`DROP TABLE "temporary_note"`);
        await queryRunner.query(`CREATE INDEX "IDX_609d822845dbc942e8f3c7bae0" ON "note" ("type") `);
        await queryRunner.query(`DROP TABLE "note_reference"`);
        await queryRunner.query(`DROP INDEX "IDX_609d822845dbc942e8f3c7bae0"`);
        await queryRunner.query(`ALTER TABLE "note" RENAME TO "temporary_note"`);
        await queryRunner.query(`CREATE TABLE "note" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "contentJson" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "startedAt" datetime, "endedAt" datetime, "parentId" integer, "type" varchar NOT NULL, "title" varchar(255), CONSTRAINT "CHK_bcbaf35983686b8b6ea9e586c1" CHECK ((("parentId" IS NULL OR "endedAt" IS NULL))), CONSTRAINT "CHK_529c2abfeb9c0650ee84ec9d3d" CHECK ((("endedAt" IS NULL OR "endedAt" > "startedAt"))))`);
        await queryRunner.query(`INSERT INTO "note"("id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "parentId", "type", "title") SELECT "id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "parentId", "type", "title" FROM "temporary_note"`);
        await queryRunner.query(`DROP TABLE "temporary_note"`);
        await queryRunner.query(`CREATE INDEX "IDX_609d822845dbc942e8f3c7bae0" ON "note" ("type") `);
        await queryRunner.query(`DROP INDEX "IDX_609d822845dbc942e8f3c7bae0"`);
        await queryRunner.query(`ALTER TABLE "note" RENAME TO "temporary_note"`);
        await queryRunner.query(`CREATE TABLE "note" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "contentJson" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "startedAt" datetime, "endedAt" datetime, "parentId" integer, "type" varchar NOT NULL, "title" varchar(255), CONSTRAINT "CHK_bcbaf35983686b8b6ea9e586c1" CHECK ((("parentId" IS NULL OR "endedAt" IS NULL))), CONSTRAINT "CHK_529c2abfeb9c0650ee84ec9d3d" CHECK ((("endedAt" IS NULL OR "endedAt" > "startedAt"))), CONSTRAINT "FK_90a032d425eacf5d60ba1b742b5" FOREIGN KEY ("parentId") REFERENCES "note" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "note"("id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "parentId", "type", "title") SELECT "id", "contentJson", "createdAt", "updatedAt", "startedAt", "endedAt", "parentId", "type", "title" FROM "temporary_note"`);
        await queryRunner.query(`DROP TABLE "temporary_note"`);
        await queryRunner.query(`CREATE INDEX "IDX_609d822845dbc942e8f3c7bae0" ON "note" ("type") `);
    }

}
