# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Engram is an Electron desktop application built with React, TypeScript, and Webpack, using Electron Forge for build tooling.

## Common Commands

- **Start development server**: `npm start` (runs `electron-forge start`)
- **Build distributable**: `npm run package` (creates packaged app)
- **Create installers**: `npm run make` (creates platform-specific installers)
- **Lint code**: `npm run lint` (runs ESLint on .ts and .tsx files)
- **Publish**: `npm run publish` (runs `electron-forge publish`)

## Architecture

### Process Model

The codebase is organized by Electron's process types:

- **Main Process** (`src/main/`): Node.js environment that controls application lifecycle, creates windows, and handles system-level operations. Entry point is `src/main/index.ts`.

- **Renderer Process** (`src/renderer/`): Browser environment that handles UI. Uses React 19 with TypeScript. Entry point is `src/renderer/index.tsx`. The HTML template is `src/renderer/index.html`.

- **Preload Scripts** (`src/preload/`): Bridge between main and renderer processes with access to both Electron APIs and the renderer's DOM. Current preload script is `src/preload/main-window.ts`.

### Build Configuration

- **Electron Forge**: Configured in `forge.config.ts` with Webpack plugin for bundling
- **Webpack**: Separate configs for main (`webpack.main.config.ts`) and renderer (`webpack.renderer.config.ts`) processes
- **TypeScript**: Configured in `tsconfig.json` with ES6 target, CommonJS modules, and React JSX support
- **Makers**: Configured for Squirrel (Windows), ZIP (macOS), DEB (Linux), and RPM (Linux) installers

### Window Configuration

The main window is created in `src/main/index.ts` with a preload script for secure IPC. The Webpack plugin uses magic constants (`MAIN_WINDOW_WEBPACK_ENTRY`, `MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY`) that are auto-generated to point to bundled assets.

### Security

- ASAR packaging enabled
- Fuses configured for enhanced security (cookie encryption enabled, Node CLI options disabled)
- Context isolation enforced through preload scripts
