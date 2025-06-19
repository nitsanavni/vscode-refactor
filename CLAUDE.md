# Cosmic Zebra Refactor VSCode Extension

## Development Workflow

```bash
# Build, package, and install
bun run build && bunx vsce package && code --install-extension cosmic-zebra-refactor-2025-0.0.1.vsix

# Watch mode for development
bun run build:watch
```

## CLI Integration

Trigger extension commands from terminal via HTTP:

```bash
# Trigger command
curl -X POST http://localhost:3141/quantumSplit

# Health check
curl http://localhost:3141/health
```

## Testing
- Command Palette: Search for "Quantum Split Analysis"
- CLI: Use curl commands above
- Extension starts HTTP server on port 3141 automatically