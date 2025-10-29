# Refactoring Cheat Sheet

## Extract Variable with Full Replacement

Combines CLI extract variable with sed to replace all occurrences while avoiding circular definitions.

### Problem
When extracting a variable, the IDE only replaces the first occurrence. We want to replace all occurrences efficiently.

### Solution
1. Extract the first occurrence using CLI
2. Use sed with line range to replace remaining occurrences (avoiding the declaration line)
3. Optionally rename to desired name

### Example: Extract `this.items[i]` to `item`

```bash
# 1. Revert to clean state (if needed)
git checkout examples/gilded_rose.js

# 2. Extract first occurrence as variable
bun run cli extract examples/gilded_rose.js variable --selection "this.items[i]" --start-line 15

# This creates: const newLocal = this.items[i];
# and replaces the first occurrence only

# 3. Replace all remaining occurrences from line 16 onwards
sed -i '' '16,$ s/this\.items\[i\]/newLocal/g' examples/gilded_rose.js

# 4. Rename to desired name
bun run cli rename examples/gilded_rose.js newLocal item
```

### Key Points

- **Line range in sed**: `16,$` means "from line 16 to end of file"
  - This avoids replacing the `this.items[i]` in the declaration itself
  - Prevents circular definition: `const newLocal = newLocal;`

- **Regex escaping in sed**:
  - `.` → `\.` (escape the dot)
  - `[` → `\[` (escape the bracket)
  - `]` → `\]` (escape the bracket)

### Sed Line Range Syntax

```bash
# From line N to end
sed '15,$ s/pattern/replacement/g' file

# From line N to line M
sed '15,30 s/pattern/replacement/g' file

# Skip first N lines (process from N+1 onwards)
sed '1,14b; s/pattern/replacement/g' file
```

### Alternative: Manual Variable First, Then Sed

If you prefer to control the variable name from the start:

```bash
# 1. Manually add the variable declaration (e.g., using Edit tool)
# Add: const item = this.items[i];

# 2. Replace all occurrences including the declaration line
sed -i '' 's/this\.items\[i\]/item/g' examples/gilded_rose.js
```

Note: This approach requires finding the declaration afterward and fixing it manually if needed.
