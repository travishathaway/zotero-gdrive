# Fix for googleapis "Dynamic require not supported" Error

## The Problem

The `googleapis` npm package is designed for Node.js servers and tries to dynamically require Node.js built-in modules like `child_process`, `fs`, etc. at runtime. Zotero's plugin environment doesn't support dynamic requires in the same way.

## The Error

```
Error running bootstrap method 'startup' on zotero-gdrive-sync@example.com
Dynamic require of "child_process" is not supported
```

## Solutions (in order of preference)

### Solution 1: Use Zotero's require (Quick Fix)

Zotero provides Node.js modules through its own require system. We need to inject this into the bundled code.

Try adding this to the top of `src/index.ts`:

```typescript
// At the very top of src/index.ts, before any other imports
if (typeof require === 'undefined') {
  // @ts-ignore
  globalThis.require = (moduleName: string) => {
    // Use Zotero's Node.js module loader
    try {
      return ChromeUtils.import(`resource://gre/modules/${moduleName}.jsm`);
    } catch (e) {
      // Fallback: try to get from global scope
      console.warn(`Could not require ${moduleName}:`, e);
      return {};
    }
  };
}
```

### Solution 2: Use google-auth-library Only (Better, requires code changes)

Instead of the full `googleapis` package, use only what we need:

```bash
npm uninstall googleapis
npm install google-auth-library node-fetch
```

Then refactor the code to:
1. Use `google-auth-library` for OAuth
2. Make direct HTTP requests to Google Drive API using `fetch` or `node-fetch`

This is more work but results in a smaller, more compatible plugin.

### Solution 3: Bundle with Different Settings (Experimental)

Try these esbuild options in `zotero-plugin.config.ts`:

```typescript
esbuildOptions: [{
  // ... existing options ...
  platform: "neutral", // instead of "node"
  mainFields: ["browser", "module", "main"],
  conditions: ["browser"],
}]
```

## Recommended: Solution 1 (Quick Test)

Let me implement Solution 1 first since it's the quickest to test:

**Step 1:** Add require polyfill to src/index.ts
**Step 2:** Rebuild
**Step 3:** Test in Zotero

If that doesn't work, we'll need to go with Solution 2 (refactor to not use googleapis).

## Why This Happens

The `googleapis` package includes code like:

```javascript
var child_process = require("child_process");
```

In a normal Node.js environment, this works fine. But in Zotero's plugin sandbox:
- esbuild bundles the code
- It keeps `require()` calls as-is for external modules
- Zotero's runtime doesn't support dynamic requires the same way
- Error!

## Testing if Node Modules are Available

Run this in Zotero's Browser Console:

```javascript
// Test if Zotero provides require
typeof require

// Test if we can access Node modules
try {
  const fs = require('fs');
  console.log('fs available:', !!fs);
} catch(e) {
  console.error('fs not available:', e);
}
```

If this works, we just need to make sure our bundled code can access `require`.
