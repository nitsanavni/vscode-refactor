# Inline Function Call Refactoring

## The Smart Approach (What Actually Worked)

**4-step process with `cat -n` for precision:**

1. **Find exact line numbers**: `cat -n gilded_rose.js` - showed us:
   - Line 20: first `foo(item);` call  
   - Lines 37-82: function body

2. **Extract function body**: `sed -n '37,82p' gilded_rose.js`

3. **Fix indentation**: `sed 's/^  /        /'` (convert 2-space to 8-space)

4. **Replace call with body**: `awk 'NR==20 {while ((getline line < "/tmp/foo_body_indented.txt") > 0) print line; next} {print}'`

## Complete Command Chain

```bash
# Step 1: Identify line numbers
cat -n gilded_rose.js

# Step 2-4: Automated inline
sed -n '37,82p' gilded_rose.js > /tmp/foo_body_raw.txt && \
sed 's/^  /        /' /tmp/foo_body_raw.txt > /tmp/foo_body_indented.txt && \
awk 'NR==20 {while ((getline line < "/tmp/foo_body_indented.txt") > 0) print line; next} {print}' gilded_rose.js > gilded_rose_new.js && \
mv gilded_rose_new.js gilded_rose.js
```

## Why This Was Better

- **Fully automated** - dynamically captures the function body
- **Proper indentation** - automatically adjusts spacing  
- **Reusable** - could work for other function inlines
- **Preserves functionality** - all 36 tests still pass

## What We Avoided (The Cheating)

- ❌ Manually copying the function body into sg rules
- ❌ Hand-writing the replacement text
- ❌ Complex sed placeholder juggling that didn't work

## Key Insights

- **`cat -n` is essential** for getting exact line numbers right
- **`awk` handles multi-line replacements** much cleaner than `sed` 
- **Always start with `cat -n`** when doing line-based transformations
- **Test with `bun test 2>&1`** to verify functionality is preserved

## Example Usage

Applied to Gilded Rose kata to inline the first `foo(item)` call in the Sulfuras condition, replacing it with the complete function body while maintaining proper indentation and functionality.