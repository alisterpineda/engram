import { MigrationInterface, QueryRunner } from "typeorm";

export class M1759704127872_BaselineSchema implements MigrationInterface {
    name = 'BaselineSchema1759704127872'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "setting" ("key" varchar PRIMARY KEY NOT NULL, "value" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "entry" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "contentJson" text NOT NULL, "contentHtml" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "occurredAt" datetime NOT NULL, "endedAt" datetime, "parentId" integer, CONSTRAINT "CHK_dee8f88cf5db259bd08060eac8" CHECK ("parentId" IS NULL OR "endedAt" IS NULL), CONSTRAINT "CHK_8b8aa3b33fbc808f11d2c2ef80" CHECK ("endedAt" IS NULL OR "endedAt" > "occurredAt"))`);
        await queryRunner.query(`CREATE TABLE "temporary_entry" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "contentJson" text NOT NULL, "contentHtml" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "occurredAt" datetime NOT NULL, "endedAt" datetime, "parentId" integer, CONSTRAINT "CHK_dee8f88cf5db259bd08060eac8" CHECK ("parentId" IS NULL OR "endedAt" IS NULL), CONSTRAINT "CHK_8b8aa3b33fbc808f11d2c2ef80" CHECK ("endedAt" IS NULL OR "endedAt" > "occurredAt"), CONSTRAINT "FK_3a0ad782de67b7e5c3a5823c74e" FOREIGN KEY ("parentId") REFERENCES "entry" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_entry"("id", "contentJson", "contentHtml", "createdAt", "updatedAt", "occurredAt", "endedAt", "parentId") SELECT "id", "contentJson", "contentHtml", "createdAt", "updatedAt", "occurredAt", "endedAt", "parentId" FROM "entry"`);
        await queryRunner.query(`DROP TABLE "entry"`);
        await queryRunner.query(`ALTER TABLE "temporary_entry" RENAME TO "entry"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "entry" RENAME TO "temporary_entry"`);
        await queryRunner.query(`CREATE TABLE "entry" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "contentJson" text NOT NULL, "contentHtml" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "occurredAt" datetime NOT NULL, "endedAt" datetime, "parentId" integer, CONSTRAINT "CHK_dee8f88cf5db259bd08060eac8" CHECK ("parentId" IS NULL OR "endedAt" IS NULL), CONSTRAINT "CHK_8b8aa3b33fbc808f11d2c2ef80" CHECK ("endedAt" IS NULL OR "endedAt" > "occurredAt"))`);
        await queryRunner.query(`INSERT INTO "entry"("id", "contentJson", "contentHtml", "createdAt", "updatedAt", "occurredAt", "endedAt", "parentId") SELECT "id", "contentJson", "contentHtml", "createdAt", "updatedAt", "occurredAt", "endedAt", "parentId" FROM "temporary_entry"`);
        await queryRunner.query(`DROP TABLE "temporary_entry"`);
        await queryRunner.query(`DROP TABLE "entry"`);
        await queryRunner.query(`DROP TABLE "setting"`);
    }

}
