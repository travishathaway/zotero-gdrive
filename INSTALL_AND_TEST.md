# Installation and Testing Guide

## Current Status

✅ **All "require" errors fixed!**
✅ **Plugin builds successfully (43 KB)**
✅ **Preferences page registered in manifest**
✅ **Zero external dependencies**

## Install the Plugin

1. **Open Zotero**

2. **Go to Add-ons:**
   - Click **Tools** (in menu bar)
   - Click **Add-ons**

3. **Install the XPI:**
   - Click the **gear icon** (⚙️) in top-right
   - Select **"Install Add-on From File..."**
   - Browse to: `.scaffold/build/zotero-google-drive-sync.xpi`
   - Click Open

4. **Restart Zotero**
   - Close and reopen Zotero completely

## Verify Installation

### Step 1: Check Plugin Appears

1. **Tools → Add-ons**
2. Look for **"Zotero Google Drive Sync"** in the list
3. Should show:
   - Version: 0.1.0
   - Status: Enabled
   - Description: "Sync Zotero attachments to Google Drive"

### Step 2: Check Console (Important!)

1. Press **Ctrl+Shift+J** (Windows/Linux) or **Cmd+Shift+J** (Mac)
2. Browser Console opens
3. Look for these messages:
   ```
   Google Drive Sync is loading
   Plugin modules initialized
   Zotero Google Drive Sync initialized
   ```

4. Run this diagnostic:
   ```javascript
   Zotero.ZoteroGDriveSync
   ```
   Should show: `Object { data: {...}, hooks: {...} }`
   NOT: `undefined`

### Step 3: Open Preferences

1. **Tools → Add-ons**
2. Find **"Zotero Google Drive Sync"**
3. Click **Preferences** button (or click the three dots ⋯)
4. Preferences window should open

**You should see:**
```
Google Drive Sync Settings

Authentication Status
✗ Not authenticated
[Sign in to Google Drive]

Sync Statistics
Total attachments: -
Synced to Google Drive: -
Not synced: -

[🔄 Sync Now]  [Clear Sync History]
```

### Step 4: Check Toolbar Button (Optional)

The toolbar button might not be visible depending on your layout.
- Look in the items toolbar for "Sync to Drive" button
- If you don't see it, that's OK - use the preferences pane instead!

## Test Authentication

⚠️ **Important:** Before testing, make sure you've set up OAuth credentials!

### Prerequisites

1. **Google Cloud Project created**
2. **Google Drive API enabled**
3. **OAuth credentials created**
4. **Credentials added to `src/config/credentials.ts`**
5. **Plugin rebuilt after adding credentials**

If you haven't done this yet, see `README.md` for setup instructions.

### Test Flow

1. **Open Preferences:**
   - Tools → Add-ons → Google Drive Sync → Preferences

2. **Click "Sign in to Google Drive"**
   - Browser should open
   - Google sign-in page appears
   - Sign in to your Google account
   - Grant permissions

3. **Callback:**
   - Browser redirects to `http://localhost:3000/oauth2callback`
   - Should show: "✓ Authentication Successful!"
   - Window might auto-close

4. **Return to Zotero:**
   - Preferences should now show: "✓ Authenticated"
   - Button changes to "Sign Out"

5. **Check Statistics:**
   - Should show attachment counts
   - May take a moment to load

## Test Sync

1. **Add some test attachments:**
   - Create a Zotero item
   - Attach a PDF file to it

2. **Open Preferences:**
   - Tools → Add-ons → Google Drive Sync → Preferences

3. **Click "🔄 Sync Now"**

4. **Watch for:**
   - Preferences window might close
   - Progress dialog appears
   - "Sync Complete" message shows results

5. **Check Google Drive:**
   - Go to https://drive.google.com
   - Look for "Zotero Attachments" folder
   - Your PDFs should be there!

## Troubleshooting

### Plugin Doesn't Appear in Add-ons

**Try:**
1. Restart Zotero completely
2. Reinstall the XPI
3. Check Browser Console for errors

### Preferences Won't Open

**Check Console:**
```javascript
// See if preferences are registered
Zotero.ZoteroGDriveSync.data.config
```

**Manual open:**
```javascript
window.openDialog(
  'chrome://zotero-gdrive-sync@example.com/content/preferences.xhtml',
  'prefs',
  'chrome,titlebar,toolbar,centerscreen'
);
```

### Authentication Fails

**Common issues:**

1. **"require is not defined"**
   - This should be fixed now
   - If you still see it, check Browser Console
   - The OAuth server might not be starting

2. **Port 3000 already in use**
   - Close any app using port 3000
   - Check: `lsof -i :3000` (Mac/Linux)
   - Kill the process if needed

3. **Invalid OAuth credentials**
   - Check `src/config/credentials.ts` has real values
   - Rebuild: `npm run build`
   - Reinstall the XPI

4. **Browser doesn't open**
   - Check Browser Console for URL
   - Manually copy/paste the URL if needed

### Sync Fails

**Check:**

1. **Authenticated?**
   - Preferences should show "✓ Authenticated"

2. **Attachments exist?**
   - Zotero must have stored file attachments (not linked files)

3. **Console errors?**
   - Check Browser Console for error messages
   - Look for API errors (403, 401, etc.)

## Debug Commands

Run in Browser Console:

```javascript
// Full diagnostic
console.log("=== Plugin Diagnostic ===");
console.log("Loaded:", !!Zotero.ZoteroGDriveSync);
console.log("Initialized:", Zotero.ZoteroGDriveSync?.data.initialized);
console.log("OAuth Manager:", !!Zotero.ZoteroGDriveSync?.data.oauthManager);
console.log("Sync Coordinator:", !!Zotero.ZoteroGDriveSync?.data.syncCoordinator);

// Check authentication
await Zotero.ZoteroGDriveSync.data.oauthManager.isAuthenticated()
  .then(auth => console.log("Authenticated:", auth))
  .catch(err => console.error("Auth check failed:", err));

// Get stats
await Zotero.ZoteroGDriveSync.data.syncCoordinator.getStats()
  .then(stats => console.log("Stats:", stats))
  .catch(err => console.error("Stats failed:", err));

// Manual sync (if authenticated)
await Zotero.ZoteroGDriveSync.data.syncCoordinator.syncAll()
  .then(result => console.log("Sync result:", result))
  .catch(err => console.error("Sync failed:", err));
```

## Expected Results

### ✅ Success Indicators

1. **Plugin shows in Add-ons list**
2. **Console shows initialization messages**
3. **Preferences window opens**
4. **Authentication works (browser opens)**
5. **Tokens stored (preferences show "✓ Authenticated")**
6. **Sync works (files appear on Google Drive)**
7. **Statistics update**

### ❌ Failure Indicators

1. **Plugin doesn't appear in list**
   → Installation failed, try reinstalling

2. **`Zotero.ZoteroGDriveSync` is undefined**
   → Plugin didn't load, check console for errors

3. **Preferences button does nothing**
   → Preferences not registered, check manifest

4. **"require is not defined" error**
   → Should be fixed in this version, check you installed latest XPI

5. **Authentication fails immediately**
   → Check OAuth credentials are set correctly

## Next Steps After Successful Install

1. ✅ **Set up OAuth credentials** (if not done)
2. ✅ **Test authentication**
3. ✅ **Add test attachments**
4. ✅ **Test sync**
5. ✅ **Verify files on Google Drive**
6. ✅ **Test token refresh** (wait for token to expire, ~1 hour)
7. ✅ **Test sign out and re-authentication**

## Getting Help

If something doesn't work:

1. **Check Browser Console** - Most errors show here
2. **Run diagnostic commands** - See above
3. **Check the guides:**
   - `FINDING_PREFERENCES.md` - How to find preferences
   - `DIAGNOSTIC.md` - Detailed troubleshooting
   - `README.md` - Full setup guide

4. **Provide this info:**
   - Zotero version (Help → About Zotero)
   - Console output (errors in red)
   - Diagnostic command results
   - What step failed

---

**Current build:** `.scaffold/build/zotero-google-drive-sync.xpi` (43 KB)
**Status:** Ready to install and test!
