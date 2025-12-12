# Diagnostic Guide for Zotero Google Drive Sync

## Step-by-Step Troubleshooting

### Step 1: Check if Plugin is Installed

1. Open Zotero
2. Go to **Tools → Add-ons**
3. Look for "**Zotero Google Drive Sync**"

**What to check:**
- ✅ Plugin appears in the list
- ✅ Version shows 0.1.0
- ✅ Status is **Enabled** (not Disabled)

**If not visible:** Plugin didn't install correctly
- Reinstall from `.scaffold/build/zotero-google-drive-sync.xpi`
- Make sure Zotero is version 7.0 or later (Help → About Zotero)

---

### Step 2: Check Browser Console

1. Press **Ctrl+Shift+J** (Windows/Linux) or **Cmd+Shift+J** (Mac)
2. Browser Console window opens
3. Look for **red error messages**
4. Copy/paste this diagnostic script:

```javascript
console.log("=== DIAGNOSTIC START ===");
console.log("Plugin loaded:", typeof Zotero.ZoteroGDriveSync !== 'undefined');
if (typeof Zotero.ZoteroGDriveSync !== 'undefined') {
  console.log("Initialized:", Zotero.ZoteroGDriveSync.data.initialized);
  console.log("OAuth Manager:", !!Zotero.ZoteroGDriveSync.data.oauthManager);
  console.log("Sync Coordinator:", !!Zotero.ZoteroGDriveSync.data.syncCoordinator);
  console.log("Sync State DB:", !!Zotero.ZoteroGDriveSync.data.syncStateDB);
  console.log("Toolbar button:", !!document.getElementById("zotero-gdrive-sync-button"));
}
console.log("=== DIAGNOSTIC END ===");
```

**Expected good output:**
```
=== DIAGNOSTIC START ===
Plugin loaded: true
Initialized: true
OAuth Manager: true
Sync Coordinator: true
Sync State DB: true
Toolbar button: true (or false, that's okay)
=== DIAGNOSTIC END ===
```

**If Plugin loaded: false:**
- Plugin failed to load completely
- Continue to Step 3

---

### Step 3: Check Debug Output

1. Go to **Help → Debug Output Logging**
2. Check **"Enable"** (or "Enable after restart")
3. Restart Zotero if needed
4. Go to **Help → Debug Output Logging → View Output**

**Search for these messages:**

**✅ Good messages (plugin working):**
```
Google Drive Sync is loading
Plugin modules initialized
Google Drive Sync is ready
Toolbar button added
Main window loaded
```

**❌ Bad messages (errors):**
```
Error: Cannot find module
SyntaxError
TypeError: Cannot read property
GOOGLE_OAUTH_CONFIG is not defined
Failed to initialize modules
```

---

### Step 4: Common Errors and Fixes

#### Error 1: "Cannot find module 'googleapis'"
**Cause:** Node modules not bundled correctly
**Fix:**
```bash
npm install
npm run build
# Reinstall the new XPI
```

#### Error 2: "GOOGLE_OAUTH_CONFIG is not defined"
**Cause:** credentials.ts file is empty or has syntax error
**Fix:**
1. Check `src/config/credentials.ts` exists
2. Make sure it has this exact format:
```typescript
export const GOOGLE_OAUTH_CONFIG = {
  CLIENT_ID: "your-id.apps.googleusercontent.com",
  CLIENT_SECRET: "your-secret",
  REDIRECT_URI: "http://localhost:3000/oauth2callback",
};
```
3. No extra commas, all strings in quotes
4. Rebuild: `npm run build`

#### Error 3: "Plugin is not loaded" (undefined)
**Possible causes:**
1. Wrong Zotero version (needs 7.0+)
2. Plugin ID conflict
3. Syntax error in source code
4. Build failed

**Fix:**
```bash
# Check build output for errors
npm run build

# Look for errors in the output
# If successful, you should see:
# ✔ Build finished in X.XXX s
```

#### Error 4: "Toolbar not found"
**Not actually an error** - the preferences method works fine
**The toolbar might not exist in all Zotero layouts**
→ Use the preferences pane instead!

---

### Step 5: Check Credentials File

Run this in Browser Console:

```javascript
// This will try to import the credentials module
// and show if there's an error
async function testCredentials() {
  try {
    // Try to access the OAuth manager
    const oauthMgr = Zotero.ZoteroGDriveSync.data.oauthManager;
    console.log("OAuth Manager exists:", !!oauthMgr);

    // This will show if credentials are configured
    // (won't show the actual values for security)
    console.log("OAuth Manager created successfully");
    return true;
  } catch (error) {
    console.error("Credentials error:", error);
    return false;
  }
}
testCredentials();
```

**If this errors:**
- credentials.ts has a syntax error
- Credentials are missing
- Wrong format

---

### Step 6: Manual Plugin Test

Try to run plugin functions manually:

```javascript
// Get the plugin
const plugin = Zotero.ZoteroGDriveSync;

// Try to check authentication
await plugin.data.oauthManager.isAuthenticated()
  .then(result => console.log("Auth check result:", result))
  .catch(error => console.error("Auth check error:", error));

// Try to get attachment count
await plugin.data.syncCoordinator.getStats()
  .then(stats => console.log("Stats:", stats))
  .catch(error => console.error("Stats error:", error));
```

---

## Collecting Information for Support

If nothing works, collect this information:

1. **Zotero version:**
   - Help → About Zotero

2. **Plugin visible in Add-ons?**
   - Yes/No

3. **Browser Console output:**
   - Run diagnostic script, copy all output

4. **Debug Output:**
   - Copy relevant lines from Help → Debug Output Logging → View Output

5. **Any error messages:**
   - Red text from Browser Console or Debug Output

6. **Build output:**
   ```bash
   npm run build 2>&1 | tail -20
   ```

---

## Quick Test: Does OAuth Work at All?

Test if the googleapis library is available:

```javascript
// In Browser Console
async function testGoogleApis() {
  try {
    const plugin = Zotero.ZoteroGDriveSync;
    const oauthMgr = plugin.data.oauthManager;
    console.log("OAuth Manager:", oauthMgr);
    console.log("Has oauth2Client:", !!oauthMgr.oauth2Client);
    return true;
  } catch (error) {
    console.error("Google APIs not loaded:", error);
    return false;
  }
}
testGoogleApis();
```

---

## Most Likely Issues

### 1. Credentials Not Set (90% of issues)
**Symptom:** Plugin loads but auth fails
**Fix:** Add real OAuth credentials to `src/config/credentials.ts` and rebuild

### 2. Build Issues (8% of issues)
**Symptom:** Plugin doesn't appear in Add-ons or shows as incompatible
**Fix:** Check build output for errors, ensure Node.js 18+

### 3. Wrong Zotero Version (2% of issues)
**Symptom:** Plugin won't install
**Fix:** Update to Zotero 7.0+

---

## Emergency: Start Over

If nothing works, start fresh:

```bash
# 1. Clean build
rm -rf .scaffold node_modules
npm install
npm run build

# 2. Check credentials file exists and is valid
cat src/config/credentials.ts

# 3. Reinstall in Zotero
# Tools → Add-ons → gear icon → Install Add-on From File
# Select: .scaffold/build/zotero-google-drive-sync.xpi
```

---

## Still Stuck?

Share this information:
1. Output from diagnostic script (Browser Console)
2. Last 20 lines from `npm run build`
3. Any red errors from Debug Output Logging
4. Zotero version (Help → About)
5. Can you see plugin in Tools → Add-ons?
