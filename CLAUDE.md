# Cosmic Zebra Refactor VSCode Extension

## Development Workflow

### Standard Extension Code Update Process
When making changes to extension code, follow this workflow for reliable updates:

```bash
# 1. Bump version in src/version.ts
# Edit src/version.ts and increment debugVersion

# 2. Full reinstall and restart
bun run reinstall && bun run restart-ext

# 3. Check version to confirm update
bun run cli check-version [expected-version]

# 4. Test your changes
bun run cli extract /path/to/file.js varName variable --selection "text"
```

### Quick Development Commands

```bash
# Quick build and restart (for code changes)
bun run build && bun run restart-ext

# Full reinstall and restart (most reliable for version updates)
bun run reinstall && bun run restart-ext

# Watch mode for development
bun run build:watch

# Check extension version
bun run cli check-version [expected-version]

# Manual restart extension host (Cmd+Shift+P -> "Developer: Restart Extension Host")
bun run restart-ext
```

### Troubleshooting Version Updates
If VSCode isn't picking up your changes:
1. Always bump version in `src/version.ts` first
2. Use `bun run reinstall && bun run restart-ext` for reliable updates
3. Check version with `bun run cli check-version [expected-version]`
4. The combination of version bump + full reinstall + extension host restart ensures VSCode loads the latest code

## CLI Integration

Trigger extension commands from terminal via HTTP:

```bash
# Trigger command
curl -X POST http://localhost:3141/quantumSplit

# Health check
curl http://localhost:3141/health

# Check version
bun run cli check-version
```

## Testing
- Command Palette: Search for "Quantum Split Analysis"
- CLI: Use curl commands above
- Extension starts HTTP server on port 3141 automatically
- Restart extension host: Cmd+Shift+P -> "Developer: Restart Extension Host" or `bun run restart-ext`