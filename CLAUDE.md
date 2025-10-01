# CLAUDE.md

Electron desktop app with React 19, TypeScript, Webpack, Electron Forge, and Mantine UI v8.

## Commands

- `npm start` - Development server (electron-forge start)
- `npm run package` - Build distributable
- `npm run make` - Create installers
- `npm run lint` - ESLint (.ts, .tsx)
- `npm run publish` - Publish

## Architecture

### UI Framework
- **Mantine UI v8** (mantine.dev) - Component library with AppShell, Button, Text, Burger, etc.
- Theme: `createTheme()` in `src/renderer/index.tsx`
- PostCSS: `postcss.config.cjs` with `postcss-preset-mantine` and `postcss-simple-vars`
- Breakpoints: xs:36em, sm:48em, md:62em, lg:75em, xl:88em
- Layout: `MantineProvider` wraps app, `AppShell` provides header + collapsible navbar

### Process Model
- **Main** (`src/main/`): Node.js, lifecycle, windows, system ops. Entry: `src/main/index.ts`
- **Renderer** (`src/renderer/`): Browser, UI with React 19. Entry: `src/renderer/index.tsx`, template: `src/renderer/index.html`
- **Preload** (`src/preload/`): Bridge between main/renderer. Script: `src/preload/main-window.ts`

### Build
- Electron Forge: `forge.config.ts` with Webpack plugin
- Webpack: Separate configs for main (`webpack.main.config.ts`) and renderer (`webpack.renderer.config.ts`)
- TypeScript: `tsconfig.json` - ES6, CommonJS, React JSX
- Makers: Squirrel (Windows), ZIP (macOS), DEB/RPM (Linux)
- Window: Created in `src/main/index.ts` with preload. Magic constants: `MAIN_WINDOW_WEBPACK_ENTRY`, `MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY`

### Security
- ASAR packaging enabled
- Fuses: cookie encryption on, Node CLI disabled
- Context isolation via preload scripts
