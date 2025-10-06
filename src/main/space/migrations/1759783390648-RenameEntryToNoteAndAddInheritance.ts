import { MigrationInterface, QueryRunner } from "typeorm";

export class M1759783390648_RenameEntryToNoteAndAddInheritance implements MigrationInterface {
    name = 'RenameEntryToNoteAndAddInheritance1759783390648'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Rename entry table to note and add type discriminator column
        // SQLite doesn't support direct ALTER TABLE for complex changes, so we use the temp table pattern
        await queryRunner.query(`ALTER TABLE "entry" RENAME TO "temporary_entry"`);

        // Step 2: Create new note table with type column and renamed startedAt column
        await queryRunner.query(`CREATE TABLE "note" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "contentJson" text NOT NULL, "contentHtml" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "startedAt" datetime, "endedAt" datetime, "parentId" integer, "type" varchar NOT NULL, CONSTRAINT "CHK_bcbaf35983686b8b6ea9e586c1" CHECK ("parentId" IS NULL OR "endedAt" IS NULL), CONSTRAINT "CHK_529c2abfeb9c0650ee84ec9d3d" CHECK ("endedAt" IS NULL OR "endedAt" > "startedAt"))`);

        // Step 3: Copy data from temporary_entry to note, renaming occurredAt to startedAt and adding type='log'
        await queryRunner.query(`INSERT INTO "note"("id", "contentJson", "contentHtml", "createdAt", "updatedAt", "startedAt", "endedAt", "parentId", "type") SELECT "id", "contentJson", "contentHtml", "createdAt", "updatedAt", "occurredAt", "endedAt", "parentId", 'log' FROM "temporary_entry"`);

        // Step 4: Drop temporary table
        await queryRunner.query(`DROP TABLE "temporary_entry"`);

        // Step 5: Add type index
        await queryRunner.query(`CREATE INDEX "IDX_609d822845dbc942e8f3c7bae0" ON "note" ("type")`);

        // Step 6: Add foreign key constraint
        await queryRunner.query(`DROP INDEX "IDX_609d822845dbc942e8f3c7bae0"`);
        await queryRunner.query(`CREATE TABLE "temporary_note" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "contentJson" text NOT NULL, "contentHtml" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "startedAt" datetime, "endedAt" datetime, "parentId" integer, "type" varchar NOT NULL, CONSTRAINT "CHK_bcbaf35983686b8b6ea9e586c1" CHECK ("parentId" IS NULL OR "endedAt" IS NULL), CONSTRAINT "CHK_529c2abfeb9c0650ee84ec9d3d" CHECK ("endedAt" IS NULL OR "endedAt" > "startedAt"), CONSTRAINT "FK_90a032d425eacf5d60ba1b742b5" FOREIGN KEY ("parentId") REFERENCES "note" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_note"("id", "contentJson", "contentHtml", "createdAt", "updatedAt", "startedAt", "endedAt", "parentId", "type") SELECT "id", "contentJson", "contentHtml", "createdAt", "updatedAt", "startedAt", "endedAt", "parentId", "type" FROM "note"`);
        await queryRunner.query(`DROP TABLE "note"`);
        await queryRunner.query(`ALTER TABLE "temporary_note" RENAME TO "note"`);
        await queryRunner.query(`CREATE INDEX "IDX_609d822845dbc942e8f3c7bae0" ON "note" ("type")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Drop index and remove foreign key
        await queryRunner.query(`DROP INDEX "IDX_609d822845dbc942e8f3c7bae0"`);
        await queryRunner.query(`ALTER TABLE "note" RENAME TO "temporary_note"`);
        await queryRunner.query(`CREATE TABLE "note" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "contentJson" text NOT NULL, "contentHtml" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "startedAt" datetime, "endedAt" datetime, "parentId" integer, "type" varchar NOT NULL, CONSTRAINT "CHK_bcbaf35983686b8b6ea9e586c1" CHECK ("parentId" IS NULL OR "endedAt" IS NULL), CONSTRAINT "CHK_529c2abfeb9c0650ee84ec9d3d" CHECK ("endedAt" IS NULL OR "endedAt" > "startedAt"))`);
        await queryRunner.query(`INSERT INTO "note"("id", "contentJson", "contentHtml", "createdAt", "updatedAt", "startedAt", "endedAt", "parentId", "type") SELECT "id", "contentJson", "contentHtml", "createdAt", "updatedAt", "startedAt", "endedAt", "parentId", "type" FROM "temporary_note"`);
        await queryRunner.query(`DROP TABLE "temporary_note"`);

        // Step 2: Rename note back to entry and restore occurredAt column
        await queryRunner.query(`ALTER TABLE "note" RENAME TO "temporary_note"`);
        await queryRunner.query(`CREATE TABLE "entry" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "contentJson" text NOT NULL, "contentHtml" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "occurredAt" datetime NOT NULL, "endedAt" datetime, "parentId" integer, CONSTRAINT "CHK_dee8f88cf5db259bd08060eac8" CHECK ("parentId" IS NULL OR "endedAt" IS NULL), CONSTRAINT "CHK_8b8aa3b33fbc808f11d2c2ef80" CHECK ("endedAt" IS NULL OR "endedAt" > "occurredAt"))`);
        await queryRunner.query(`INSERT INTO "entry"("id", "contentJson", "contentHtml", "createdAt", "updatedAt", "occurredAt", "endedAt", "parentId") SELECT "id", "contentJson", "contentHtml", "createdAt", "updatedAt", "startedAt", "endedAt", "parentId" FROM "temporary_note"`);
        await queryRunner.query(`DROP TABLE "temporary_note"`);

        // Step 3: Add foreign key constraint back to entry table
        await queryRunner.query(`CREATE TABLE "temporary_entry" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "contentJson" text NOT NULL, "contentHtml" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "occurredAt" datetime NOT NULL, "endedAt" datetime, "parentId" integer, CONSTRAINT "CHK_dee8f88cf5db259bd08060eac8" CHECK ("parentId" IS NULL OR "endedAt" IS NULL), CONSTRAINT "CHK_8b8aa3b33fbc808f11d2c2ef80" CHECK ("endedAt" IS NULL OR "endedAt" > "occurredAt"), CONSTRAINT "FK_3a0ad782de67b7e5c3a5823c74e" FOREIGN KEY ("parentId") REFERENCES "entry" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_entry"("id", "contentJson", "contentHtml", "createdAt", "updatedAt", "occurredAt", "endedAt", "parentId") SELECT "id", "contentJson", "contentHtml", "createdAt", "updatedAt", "occurredAt", "endedAt", "parentId" FROM "entry"`);
        await queryRunner.query(`DROP TABLE "entry"`);
        await queryRunner.query(`ALTER TABLE "temporary_entry" RENAME TO "entry"`);
    }

}
