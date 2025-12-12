# How to Find the Plugin Preferences

The plugin preferences are NOT in Edit → Settings. Here's where to find them:

## Method 1: Tools → Add-ons (CORRECT WAY)

1. Open Zotero
2. Click **Tools** in the menu bar (top of window)
3. Click **Add-ons**
4. You should see "**Zotero Google Drive Sync**" in the list
5. Click the **three dots (⋯)** next to it OR click **Preferences** button
6. The preferences pane will open

## Method 2: Check if Plugin is Loaded

Open Browser Console (Ctrl+Shift+J or Cmd+Shift+J) and run:

```javascript
// Check if plugin is loaded
Zotero.ZoteroGDriveSync

// Should show something like:
// Object { data: {…}, hooks: {…} }
```

If you see `undefined`, the plugin didn't load.

## Method 3: Check Add-ons List

1. **Tools → Add-ons**
2. Look for "**Zotero Google Drive Sync**"
3. Check it shows:
   - Name: Zotero Google Drive Sync
   - Version: 0.1.0
   - Status: **Enabled** (not Disabled)

## What You Should See in Preferences

When preferences open, you should see:

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

Zotero Google Drive Sync Build 0.1.0
```

## Troubleshooting: Plugin Not Showing

### 1. Check if XPI was installed

In Zotero:
- Tools → Add-ons
- Is "Zotero Google Drive Sync" in the list?

**If NO:**
- Reinstall: Tools → Add-ons → Gear icon → Install Add-on From File
- Select: `.scaffold/build/zotero-google-drive-sync.xpi`
- Restart Zotero

### 2. Check Browser Console for Errors

Press **Ctrl+Shift+J** (or Cmd+Shift+J on Mac)

Look for:
- ✅ "Google Drive Sync is loading"
- ✅ "Plugin modules initialized"
- ✅ "Zotero Google Drive Sync initialized"
- ❌ Any red error messages

### 3. Check Plugin Data

In Browser Console:

```javascript
// Check plugin loaded
Zotero.ZoteroGDriveSync

// Check initialization
Zotero.ZoteroGDriveSync.data.initialized
// Should be: true

// Check modules
Zotero.ZoteroGDriveSync.data.oauthManager
Zotero.ZoteroGDriveSync.data.syncCoordinator
Zotero.ZoteroGDriveSync.data.syncStateDB
// All should show objects, not undefined
```

### 4. Force Reinstall

1. **Remove old version:**
   - Tools → Add-ons
   - Find "Zotero Google Drive Sync"
   - Click Remove
   - Restart Zotero

2. **Install new version:**
   - Tools → Add-ons
   - Gear icon → Install Add-on From File
   - Select: `.scaffold/build/zotero-google-drive-sync.xpi`
   - Restart Zotero

3. **Verify:**
   - Tools → Add-ons
   - Should see plugin in list
   - Should be Enabled

## Common Mistakes

❌ **Looking in Edit → Settings**
- Plugin preferences are NOT here
- This is for Zotero's own settings

✅ **Correct location: Tools → Add-ons**
- This is where plugin preferences are
- Look for the plugin in the list
- Click preferences button or three-dot menu

## Debug: Run Full Diagnostic

Copy this into Browser Console (Ctrl+Shift+J):

```javascript
console.log("=== Zotero Google Drive Sync Diagnostic ===");

// Check plugin exists
if (typeof Zotero.ZoteroGDriveSync !== 'undefined') {
  console.log("✅ Plugin loaded");

  // Check initialization
  console.log("Initialized:", Zotero.ZoteroGDriveSync.data.initialized);

  // Check modules
  console.log("OAuth Manager:", !!Zotero.ZoteroGDriveSync.data.oauthManager);
  console.log("Sync Coordinator:", !!Zotero.ZoteroGDriveSync.data.syncCoordinator);
  console.log("Sync State DB:", !!Zotero.ZoteroGDriveSync.data.syncStateDB);

  // Check if preferences can be opened
  console.log("Config:", Zotero.ZoteroGDriveSync.data.config);

} else {
  console.log("❌ Plugin NOT loaded");
  console.log("Check Tools → Add-ons to see if it's installed");
}

console.log("=== End Diagnostic ===");
```

## Expected Diagnostic Output

```
=== Zotero Google Drive Sync Diagnostic ===
✅ Plugin loaded
Initialized: true
OAuth Manager: true
Sync Coordinator: true
Sync State DB: true
Config: Object { addonName: "Zotero Google Drive Sync", ... }
=== End Diagnostic ===
```

## If Plugin Shows but Preferences Won't Open

Try manually opening preferences:

```javascript
// In Browser Console
const win = window.openDialog(
  `chrome://zotero-gdrive-sync@example.com/content/preferences.xhtml`,
  'zotero-gdrive-preferences',
  'chrome,titlebar,toolbar,centerscreen,modal'
);
```

## Screenshot Reference

When you go to **Tools → Add-ons**, you should see something like:

```
Extensions

[Icon] Zotero Google Drive Sync                    0.1.0
       Sync Zotero attachments to Google Drive

       [Preferences]  [⋯]
```

Clicking **Preferences** opens the settings dialog with:
- Authentication status
- Sign in button
- Sync statistics
- Sync now button

---

**TL;DR:** Go to **Tools → Add-ons** (NOT Edit → Settings), find the plugin, click Preferences!
