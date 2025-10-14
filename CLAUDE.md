# CLAUDE.md

Electron desktop app with React 19, TypeScript, Webpack, Electron Forge, and Mantine UI v8. Space-based architecture with SQLite.

## Commands

- `npm start` - Development server (electron-forge start)
- `npm run package` - Build distributable
- `npm run make` - Create installers
- `npm run lint` - ESLint (.ts, .tsx)
- `npm run publish` - Publish
- `npm test` - Run E2E tests (headless)
- `npm run test:headed` - Run tests with visible window
- `npm run test:debug` - Run tests with Playwright inspector
- `npm run test:create-snapshot` - Generate pre-migrated test snapshot Space

## Architecture

### Space Model
- Multi-space app (Obsidian-like): each space = folder containing `space.sqlite` database file
- TypeORM with better-sqlite3 driver
- Entities: `Setting` (key-value config), `Note` (abstract base with STI, optional title + contentText fields, many-to-many self-references), `Log` (child entity, time-based), `Page` (child entity, required title), `Comment` (child entity, parentId FK, no nesting)
- `contentText`: plain text version of `contentJson`, auto-generated via Tiptap's `generateText` on create/update. Used for effective titles and future full-text search
- `NoteReference`: explicit join entity (sourceId/targetId) at Note level for any-to-any references. CASCADE delete, future-ready for custom columns (type, label, metadata)
- State: `~/.../userData/state.json` stores recent spaces, last opened
- Multiple spaces can be open simultaneously, each in separate window
- Future-ready: space folders can contain attachments, files, and other resources

### Migrations
TypeORM migrations in `src/main/space/migrations/` auto-run on space open with progress modal.

**Modifying entities:**
1. Edit entities in `src/main/space/entities/`
2. **ALWAYS** run `npm run migration:generate-safe src/main/space/migrations/Name`
   - This ensures dev db is reset and migrated before generation
   - Prevents generating against empty database
3. Review generated migration, rename class to `M[timestamp]_Name`
4. Import in `migrations/index.ts`, test, commit

**Naming:** File: `[timestamp]-Name.ts`, Class: `M[timestamp]_Name`, keep `name` property as generated.

**Commands:**
- `migration:generate-safe` - **Use this for all migrations** (prepares dev db, then generates)
- `migration:prepare` - Standalone: deletes dev db, runs existing migrations
- `migration:generate|create|run|revert` - Low-level TypeORM commands (avoid `generate`, use `generate-safe`)

**Behavior:** Transaction per migration (auto-rollback on error). Modal: "Running migration X of Y". Error: show message, close window. Dev: verbose logs; Prod: silent.

**Note:** Migration reset was one-time (Jan 2025). All future migrations will be incremental.

### UI Framework
- **Mantine UI v8** (mantine.dev) - Component library with AppShell, Button, Text, Burger, etc.
- **Tiptap** (tiptap.dev) - Rich text editor with StarterKit, Link, Placeholder, Mention, and custom MarkdownPaste extensions (GFM-compatible)
- PostCSS: `postcss.config.cjs` with `postcss-preset-mantine` and `postcss-simple-vars`
- CSS Modules: Supported via webpack config
- Breakpoints: xs:36em, sm:48em, md:62em, lg:75em, xl:88em
- Theme: Global light/dark/auto mode with system preference sync, centralized in `src/renderer/theme.ts` with compact spacing/typography

### Process Model
- **Main** (`src/main/`): Node.js, lifecycle, windows, system ops. Entry: `src/main/index.ts`
  - Windows: `LauncherWindow.ts`, `SpaceWindow.ts`
  - IPC: `launcherHandlers.ts`, `workspaceHandlers.ts`, `themeHandlers.ts`
  - State: `AppState.ts` (JSON persistence, theme), `SpaceManager.ts` (TypeORM connections)
  - Utils: `textGeneration.ts` (converts Tiptap JSON to plain text using `generateText`)
- **Renderer** (`src/renderer/`): Browser, UI with React 19
  - Launcher: `src/renderer/launcher/index.tsx` - two-column layout, create/open/recent spaces
  - Workspace: `src/renderer/workspace/index.tsx` - AppShell with collapsible navbar, routing (react-router-dom HashRouter)
    - Views: `FeedView` (logs with day-grouped comments), `PostDetailView`, `PagesView`, `PageDetailView` (all with infinite scroll)
    - Components: `EntryComposer`, `PageComposer`, `CommentComposer`, `EntryEditor`, `EditableLog`, `EditableComment`, `ReadOnlyEditor`, `EditorToolbar`, `MentionSuggestion`, `PostCard`, `MinimizedPostCard`, `CommentsSection`, `DayFilteredCommentsSection`, `ReferencesSection`, `MigrationModal`
    - Hooks: `useEntryEditor` (create/update logic, uses `referenceIds` for create mode), `useMentionNavigation` (click navigation for @mentions)
    - API: `entry.*`, `page.*`, `comment.*` methods (create, listByParent, listForPosts, getById, update, delete), `entry.getReferencedNotes(id)`, `entry.addReference(sourceId, targetId)`, `entry.addReferenceIfNotExists(sourceId, targetId)`, `entry.removeReference(sourceId, targetId)`, `page.searchByTitle(query)`
    - **Feed grouping**: Posts appear fully in their original day; posts also appear minimized (quote icon + title) in days where comments exist. Comments filtered by day. Utils: `groupFeedItemsByDay()` in `date.ts`
- **Preload** (`src/preload/`): Bridge between main/renderer
  - `launcher.ts` - space selection APIs
  - `main-window.ts` - space operations (rename, settings, etc.)

### Build
- Electron Forge: `forge.config.ts` with Webpack plugin
- Webpack: Two renderer entry points (launcher_window, workspace_window)
- TypeScript: `tsconfig.json` - ES6, CommonJS, React JSX, decorators enabled
- Makers: Squirrel (Windows), DMG (macOS), DEB/RPM (Linux)
- CI/CD: GitHub Actions workflow (`.github/workflows/build.yml`) for automated multi-platform builds

### Testing
- **Playwright** for E2E tests in `tests/`
- Test mode: `--test-space-path` and `--user-data-dir` CLI args skip Launcher, open Space directly
- **Snapshot system**: Pre-migrated test Space in `tests/fixtures/snapshot-space/` (generated via `test:create-snapshot`). Each test copies snapshot to temp dir for isolation
- Utilities: `tests/helpers/test-utils.ts` (setupTestSpace, cleanupTestSpace, launchElectronApp)
- Automatic cleanup: Test spaces deleted after each test (pass or fail)
- Config: `playwright.config.ts` - headed for debug, headless for CI

### Security
- ASAR packaging enabled
- Fuses: cookie encryption on, Node CLI disabled
- Context isolation via preload scripts
