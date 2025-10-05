# CLAUDE.md

Electron desktop app with React 19, TypeScript, Webpack, Electron Forge, and Mantine UI v8. Workspace-based architecture with SQLite.

## Commands

- `npm start` - Development server (electron-forge start)
- `npm run package` - Build distributable
- `npm run make` - Create installers
- `npm run lint` - ESLint (.ts, .tsx)
- `npm run publish` - Publish

## Architecture

### Workspace Model
- Multi-workspace app (Obsidian-like): each workspace = `.sqlite` file
- TypeORM with better-sqlite3 driver
- Entities: `Setting` (key-value config), `Entry` (posts/comments with self-referential parent/children)
- State: `~/.../userData/state.json` stores recent workspaces, last opened
- Multiple workspaces can be open simultaneously, each in separate window

### UI Framework
- **Mantine UI v8** (mantine.dev) - Component library with AppShell, Button, Text, Burger, etc.
- **Tiptap** (tiptap.dev) - Rich text editor with StarterKit, Underline, Link, Placeholder extensions
- PostCSS: `postcss.config.cjs` with `postcss-preset-mantine` and `postcss-simple-vars`
- CSS Modules: Supported via webpack config
- Breakpoints: xs:36em, sm:48em, md:62em, lg:75em, xl:88em
- Theme: Global light/dark/auto mode with system preference sync

### Process Model
- **Main** (`src/main/`): Node.js, lifecycle, windows, system ops. Entry: `src/main/index.ts`
  - Windows: `LauncherWindow.ts`, `WorkspaceWindow.ts`
  - IPC: `launcherHandlers.ts`, `workspaceHandlers.ts`, `themeHandlers.ts`
  - State: `AppState.ts` (JSON persistence, theme), `WorkspaceManager.ts` (TypeORM connections)
- **Renderer** (`src/renderer/`): Browser, UI with React 19
  - Launcher: `src/renderer/launcher/index.tsx` - two-column layout, create/open/recent workspaces
  - Workspace: `src/renderer/workspace/index.tsx` - AppShell with collapsible navbar, routing (react-router-dom HashRouter)
    - Views: `FeedView` (journal feed, infinite scroll), `PostDetailView` (single post, paginated comments)
    - Components: `EntryComposer`, `EditableEntry`, `EditorToolbar`, `PostCard`, `CommentSection`, `CommentItem`
    - Hooks: `useEntryEditor` (consolidates entry create/update logic)
- **Preload** (`src/preload/`): Bridge between main/renderer
  - `launcher.ts` - workspace selection APIs
  - `main-window.ts` - workspace operations (rename, settings, etc.)

### Build
- Electron Forge: `forge.config.ts` with Webpack plugin
- Webpack: Two renderer entry points (launcher_window, workspace_window)
- TypeScript: `tsconfig.json` - ES6, CommonJS, React JSX, decorators enabled
- Makers: Squirrel (Windows), ZIP (macOS), DEB/RPM (Linux)

### Security
- ASAR packaging enabled
- Fuses: cookie encryption on, Node CLI disabled
- Context isolation via preload scripts
