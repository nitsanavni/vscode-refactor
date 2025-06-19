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