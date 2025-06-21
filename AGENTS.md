# Agent Guidelines for Cosmic Zebra Refactor VSCode Extension

## Build/Test Commands
- `bun run build` - Build extension to dist/
- `bun run build:watch` - Watch mode for development
- `bun run test` - Run tests with bun
- `bun run lint` - Lint with biome (auto-fix with --write --unsafe)
- `bun run format` - Format with biome
- `bun run typecheck` - Type check with tsgo
- `bun run check` - Run format + lint + typecheck
- `bun run reinstall && bun run restart-ext` - Full reinstall and restart for version updates

## Code Style
- **Formatting**: 2-space indentation, biome formatter
- **Types**: Strict TypeScript, explicit types for function parameters/returns
- **Imports**: Node.js style (`import * as http from "node:http"`)
- **Naming**: camelCase for functions/variables, PascalCase for types/interfaces
- **Error handling**: try/catch with console.error, return success/error objects
- **Async**: Use async/await, proper Promise handling
- **Comments**: Minimal comments, prefer descriptive function names

## Development Workflow
- Always bump `debugVersion` in `src/version.ts` for code changes
- Use `bun run reinstall && bun run restart-ext` for reliable extension updates
- Test via CLI: `bun run cli check-version [expected-version]`
- Extension runs HTTP server on port 3141 for CLI integration