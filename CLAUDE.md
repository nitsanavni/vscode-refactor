# VSCode Extension Development Commands

## Development Workflow

### Build the extension
```bash
bun run build
```

### Package the extension into VSIX
```bash
bunx vsce package
```

### Install the packaged extension
```bash
code --install-extension cosmic-zebra-refactor-2025-0.0.1.vsix
```

### Full rebuild and reinstall workflow
```bash
bun run build && bunx vsce package && code --install-extension cosmic-zebra-refactor-2025-0.0.1.vsix
```

## Key Files
- `src/extension.ts` - Main extension code
- `package.json` - Extension manifest and configuration
- `esbuild.js` - Build configuration
- `dist/extension.js` - Built extension output

## Testing the Extension
After installation, use Cmd+Shift+P and search for "Quantum Split Analysis" to test the command.

## CLI Integration

### Trigger extension commands from terminal
```bash
# Using HTTP server (most reliable method)
curl -X POST http://localhost:3141/quantumSplit

# Check if server is running
curl http://localhost:3141/health

# Using file trigger
touch .cosmic-zebra-trigger

# Alternative: use osascript to run command in VSCode (macOS)
osascript -e 'tell application "Visual Studio Code" to activate' -e 'delay 0.5' -e 'tell application "System Events" to keystroke "p" using {command down, shift down}' -e 'delay 0.5' -e 'tell application "System Events" to keystroke "Quantum Split Analysis"' -e 'delay 0.5' -e 'tell application "System Events" to key code 36'
```

### Other CLI communication methods
1. **Custom URI schemes** - Extensions can register custom URI handlers
2. **File watchers** - Extension can watch for specific files/changes
3. **HTTP endpoints** - Extension can start a local server
4. **IPC/named pipes** - More complex but allows bidirectional communication