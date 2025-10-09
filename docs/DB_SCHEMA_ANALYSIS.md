# Database Schema Analysis

## Overview

This document analyzes the current database schema for Engram, a time-tracking journal application built with Electron, TypeORM, and SQLite.

## Current Schema

### Entities

1. **Setting** - Key-value configuration storage
2. **Note** - Abstract base entity with Single Table Inheritance (STI)
3. **Log** - Concrete entity for time-logged journal entries (extends Note)
4. **NoteReference** - Explicit join table for many-to-many note relationships

## ✅ What's Working Well

### 1. Time-tracking Semantics
The `Log` entity with `startedAt`/`endedAt` aligns perfectly with the UI's time-based journal workflow. The check constraint ensures data integrity:
```typescript
@Check(`"endedAt" IS NULL OR "endedAt" > "startedAt"`)
```

### 2. Flexible Content Storage
Using `contentJson` (text field) works well for Tiptap's JSON format, allowing rich text content without rigid schema constraints.

### 3. Explicit Reference System
The `NoteReference` join table with CASCADE delete is the correct approach:
- Supports any-to-any relationships at the Note level
- Future-ready for custom columns (type, label, metadata)
- Proper cleanup on deletion

### 4. Data Integrity Constraints
- Check constraint prevents self-references: `sourceId != targetId`
- Check constraint validates time ranges: `endedAt > startedAt`
- Title length validation in application layer (255 chars)

### 5. STI Foundation
Abstract `Note` base with type discriminator allows future entity types beyond `Log` without schema changes.

## ⚠️ Key Concerns & Recommendations

### 1. Missing Database Indexes (Critical - Performance)

**Problem**: No indexes defined on frequently queried columns. As data grows, queries will slow significantly.

**Impact**:
- `getAllEntries()` sorts by `startedAt DESC` without index (SpaceManager.ts:294)
- `getReferencedNotes()` queries by `sourceId` without index (SpaceManager.ts:384)

**Solution**: Add indexes to entity definitions:

```typescript
// Note.ts
@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
@Index(['createdAt'])
@Index(['updatedAt'])
export abstract class Note { ... }

// Log.ts
@ChildEntity('log')
@Check(`"endedAt" IS NULL OR "endedAt" > "startedAt"`)
@Index(['startedAt'])  // Critical for feed sorting
@Index(['endedAt'])    // For duration-based queries
export class Log extends Note { ... }

// NoteReference.ts
@Entity('note_reference')
@Check(`"sourceId" != "targetId"`)
@Index(['sourceId'])   // For outgoing reference queries
@Index(['targetId'])   // For incoming reference lookups
export class NoteReference { ... }
```

**Priority**: HIGH - Do this before dataset grows

---

### 2. Duplicate References Possible (Data Integrity)

**Problem**: No unique constraint on `(sourceId, targetId)` allows duplicate references:
- User can accidentally create Note 1 → Note 2 multiple times
- Wastes storage and causes UI confusion

**Solution**: Add composite unique index:

```typescript
@Entity('note_reference')
@Check(`"sourceId" != "targetId"`)
@Index(['sourceId', 'targetId'], { unique: true })
export class NoteReference { ... }
```

**Priority**: HIGH - Prevents data quality issues

---

### 3. Bidirectional References

**Status**: Design decision needed

**Current behavior**: System allows both A→B and B→A simultaneously.

**Questions**:
- Are references **directed** (A points to B ≠ B points to A)?
- Are references **undirected** (A↔B should be single relationship)?

**If undirected**: Add application-level logic in `SpaceManager.addReference()` to check for reverse reference before creating.

**Priority**: MEDIUM - Document intended behavior

---

### 4. Underutilized STI Pattern

**Problem**: Single Table Inheritance overhead with only one child entity.

**Current**:
- `Note` (abstract) with `type` discriminator column
- `Log` (only child) inherits from `Note`
- Every row has extra `type` column
- TypeORM adds discriminator logic to all queries

**Decision Required**:

**Option A: Keep STI** (if planning expansion)
- PRO: Easy to add `Post`, `Task`, `Comment`, etc. entities
- CON: ~5-10% query overhead
- ACTION: Document planned entity types in CLAUDE.md

**Option B: Simplify** (if staying with Log only)
- PRO: Simpler schema, faster queries
- CON: Harder to add entity types later (requires migration)
- ACTION: Remove `Note`, make `Log` the base entity

**Priority**: LOW - Works fine as-is, but clarify intent

---

### 5. Title Field Placement

**Issue**: `title` is on base `Note` class but:
- Not all time logs need titles (nullable)
- Different future entity types might need different title constraints
- 255 char limit may not fit all future use cases

**Recommendation**: Consider moving `title` to child entities if different types need different semantics.

**Priority**: LOW - Current design acceptable

---

### 6. No Content Validation

**Problem**: `contentJson` stored as raw text with no validation.

**Risks**:
- Corrupted data if client sends invalid JSON
- No schema version tracking if Tiptap format changes
- Hard to migrate content structure later

**Solution**: Add validation and versioning:

```typescript
@Column('text')
contentJson: string;  // Valid JSON string

@Column({ type: 'int', default: 1 })
contentVersion: number;  // Track Tiptap schema changes

// Optional: Add CHECK constraint for JSON validation (SQLite 3.38+)
// @Check(`JSON_VALID(contentJson) = 1`)
```

**Priority**: MEDIUM - Important for long-term maintainability

---

## 📊 Optimization Recommendations

### Priority 1: Performance (Do Now)

**Add indexes for query performance:**

```bash
# After adding @Index decorators to entities:
npm run migration:generate-safe src/main/space/migrations/AddPerformanceIndexes
```

Expected indexes:
- `note.createdAt` - Time-based note queries
- `note.updatedAt` - Recent changes
- `log.startedAt` - Feed sorting (currently unindexed!)
- `note_reference.sourceId` - Outgoing references
- `note_reference.targetId` - Incoming references

**Estimated impact**: 10-100x faster queries on large datasets (1000+ entries)

---

### Priority 2: Data Integrity (Do Now)

**Prevent duplicate references:**

```typescript
@Index(['sourceId', 'targetId'], { unique: true })
```

**Also consider**:
- Add `unique: true` to Setting.key (already uses @PrimaryColumn, so OK)

---

### Priority 3: Future-Proofing (Consider)

#### Content Versioning
```typescript
@Column({ type: 'int', default: 1 })
contentVersion: number;
```
Allows migration if Tiptap schema changes.

#### Soft Deletes
```typescript
@DeleteDateColumn()
deletedAt: Date | null;
```
Enables undo functionality for deleted entries.

#### Extensibility
```typescript
@Column({ type: 'text', nullable: true })
metadata: string | null;  // JSON for extension data
```
Add new fields without migrations (though less type-safe).

---

### Priority 4: Architecture Decision (Decide)

**Question**: Do you plan to add more entity types beyond `Log`?

#### If YES (Keep STI):
- Document planned entity types in CLAUDE.md
- Consider if `startedAt`/`endedAt` should move to `Log` only
- Plan entity hierarchy (which fields belong where)

**Examples of future entities:**
- `Post` - No time tracking, just content + references
- `Task` - Completion status, due dates
- `Comment` - Child of other notes
- `Bookmark` - URL + metadata

#### If NO (Simplify):
```typescript
// Remove Note abstraction
@Entity('log')
export class Log {
  @PrimaryGeneratedColumn()
  id: number;

  // All fields here, no inheritance
  // No type column
  // Simpler, faster
}
```

---

## 🔍 Additional Observations

### 1. Sorting Strategy
You sort by `startedAt DESC` (SpaceManager.ts:294), which makes sense for time-logs. This differs from typical notes apps that sort by `createdAt`. Current approach is correct for your use case.

### 2. Required Fields
- `contentJson`: Required (good - prevents empty entries)
- `title`: Nullable (good - not all logs need titles)
- `startedAt`: Required (good - every log has start time)
- `endedAt`: Nullable (good - logs can be ongoing)

### 3. Date Handling
Correctly parse ISO strings to Date objects in IPC handlers:
```typescript
// workspaceHandlers.ts:103-104
const startedAtDate = startedAt ? new Date(startedAt) : undefined;
const endedAtDate = endedAt ? new Date(endedAt) : undefined;
```

### 4. Cascade Behavior
CASCADE delete on `NoteReference` is correct:
- Deleting a note removes all its references
- Prevents orphaned reference rows

**Consider**: Soft deletes (see Priority 3) if you want undo capability.

### 5. Title Normalization
Application layer normalizes empty/whitespace titles to `null`:
```typescript
// SpaceManager.ts:252
const normalizedTitle = title && title.trim() ? title.trim() : null;
```
Good practice for consistent querying.

---

## 🎯 Recommended Next Steps

### Immediate (Before Production)
1. ✅ Add indexes (Priority 1)
2. ✅ Add unique constraint on NoteReference (Priority 2)

### Short-term (Next Sprint)
3. ⚠️ Decide on STI vs single table (Priority 4)
4. ⚠️ Add `contentVersion` field (Priority 3)
5. ⚠️ Document entity expansion plans in CLAUDE.md

### Long-term (Future)
6. Consider soft deletes for undo functionality
7. Consider full-text search on `contentJson` (SQLite FTS5)
8. Consider attachment storage strategy (files in space folder)

---

## Migration Plan

### Step 1: Add Indexes
```bash
# Edit entities to add @Index decorators
npm run migration:generate-safe src/main/space/migrations/AddPerformanceIndexes
# Review generated migration
# Test locally
# Commit
```

### Step 2: Add Unique Constraint
```bash
# Edit NoteReference.ts to add unique index
npm run migration:generate-safe src/main/space/migrations/PreventDuplicateReferences
# Review generated migration
# Test locally
# Commit
```

### Step 3: Content Versioning (Optional)
```bash
# Add contentVersion column to Note entity
npm run migration:generate-safe src/main/space/migrations/AddContentVersioning
# Migration should set default value 1 for existing rows
# Review and test
```

---

## Conclusion

Your database schema is **generally appropriate** for a time-tracking journal app. The design is clean, follows best practices, and supports your current features well.

**Critical improvements needed:**
1. Add indexes (performance)
2. Add unique constraint on references (data integrity)

**Architectural decision needed:**
- Clarify intent for STI pattern (expand or simplify)

With these changes, the schema will scale well and prevent common data issues as your application grows.
