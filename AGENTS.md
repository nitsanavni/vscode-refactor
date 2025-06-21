# Agent Guidelines for Cosmic Zebra Refactor VSCode Extension

## High-Level Architecture

### Core Structure
- **Extension Entry**: `src/extension.ts` - Main VSCode extension with HTTP server
- **CLI Interface**: `src/cli.ts` - Command-line tool to interact with extension
- **Version Management**: `src/version.ts` - Debug version tracking for development

### HTTP Server Integration
The extension runs an HTTP server on port 3141 that exposes refactoring commands:
- Extension automatically starts server when activated
- CLI tool sends HTTP requests to trigger extension commands
- Enables programmatic access to VSCode refactoring capabilities

### Main Commands
- **POST /rename** - Rename symbols across workspace using VSCode language services
- **POST /extract** - Extract methods/variables from selected code
- **POST /actions** - Get available code actions for selection
- **POST /perform-action** - Execute specific code action
- **GET /health** - Health check and version info

### CLI Usage Examples
```bash
# Rename symbol
bun run cli rename /path/to/file.js oldName newName

# Extract method from selection
bun run cli extract /path/to/file.js methodName method --selection "code to extract"

# Get available actions
bun run cli actions /path/to/file.js --selection "selected code"

# Get available actions using stdin
echo "const x = 1;" | bun run cli actions /path/to/file.js

# Perform specific action
bun run cli perform-action /path/to/file.js --selection "0" --kind "refactor.extract.constant"

# Perform action using stdin
echo "0" | bun run cli perform-action /path/to/file.js --kind "refactor.extract.constant"

# Check extension health
bun run cli health
```

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