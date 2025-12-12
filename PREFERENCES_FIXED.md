# Preferences Registration Fixed!

## What Was Wrong

The `preferences` property in `manifest.json` is not supported in Zotero 7 WebExtension format. That was causing the warning:

```
WARN Loading extension 'zotero-gdrive-sync@example.com':
Reading manifest: Warning processing preferences:
An unexpected property was found in the WebExtension manifest.
```

## What I Fixed

### ❌ Before (Wrong):
```json
// In manifest.json
"preferences": {
  "page": "content/preferences.xhtml"
}
```

### ✅ After (Correct):
```typescript
// In src/hooks.ts onStartup()
Zotero.PreferencePanes.register({
  pluginID: addon.data.config.addonID,
  src: `chrome://${addon.data.config.addonRef}/content/preferences.xhtml`,
  label: addon.data.config.addonName,
  image: `chrome://${addon.data.config.addonRef}/content/icons/favicon.png`,
  defaultXUL: true,
});
```

This is the proper Zotero 7 way to register preference panes!

## Where to Find Preferences Now

### Option 1: Edit → Settings (PRIMARY)

1. Click **Edit** in the menu bar (Windows/Linux) or **Zotero** (Mac)
2. Click **Settings** (or **Preferences** on older versions)
3. Look for **"Zotero Google Drive Sync"** in the left sidebar
4. Click it to open the preference pane

### Option 2: Tools → Add-ons

1. Click **Tools** → **Add-ons**
2. Find "Zotero Google Drive Sync"
3. The Add-ons manager may have a Preferences button

## What You Should See

In **Edit → Settings**, after clicking "Zotero Google Drive Sync" in the sidebar:

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

## Install the New Build

```bash
.scaffold/build/zotero-google-drive-sync.xpi (43 KB)
```

1. **Remove old version** (if installed):
   - Tools → Add-ons
   - Find old "Zotero Google Drive Sync"
   - Click Remove
   - Restart Zotero

2. **Install new version:**
   - Tools → Add-ons
   - Gear icon → Install Add-on From File
   - Select the new XPI
   - Restart Zotero

3. **Check it worked:**
   - Edit → Settings
   - Look for "Zotero Google Drive Sync" in sidebar
   - Should be there! ✅

## Verification Steps

### 1. Check Plugin Loaded

Browser Console (Ctrl+Shift+J):
```javascript
Zotero.ZoteroGDriveSync
// Should show: Object { data: {...}, hooks: {...} }
```

### 2. Check Preferences Registered

Browser Console:
```javascript
// See if pane is registered
Zotero.PreferencePanes._panes
```

Look for an entry with:
- `pluginID: "zotero-gdrive-sync@example.com"`
- `label: "Zotero Google Drive Sync"`

### 3. Open Preferences

Two ways:

**A. Through Settings:**
- Edit → Settings
- Click "Zotero Google Drive Sync" in sidebar

**B. Manually (for testing):**
```javascript
// In Browser Console
Zotero.Prefs.openPreferences("zotero-gdrive-sync");
```

## Troubleshooting

### "I don't see the plugin in Edit → Settings sidebar"

**Check:**
1. Is plugin installed? (Tools → Add-ons)
2. Did you restart Zotero after installing?
3. Is plugin loaded? Run `Zotero.ZoteroGDriveSync` in console
4. Check console for errors during startup

**Try:**
```javascript
// Force register preferences
Zotero.PreferencePanes.register({
  pluginID: "zotero-gdrive-sync@example.com",
  src: "chrome://zoterogdrivesync/content/preferences.xhtml",
  label: "Zotero Google Drive Sync",
  defaultXUL: true,
});
```

### "I see the sidebar item but clicking it does nothing"

**Check Browser Console for errors:**
- Look for errors when clicking
- Might be a problem loading the XHTML file

**Try opening manually:**
```javascript
window.openDialog(
  "chrome://zoterogdrivesync/content/preferences.xhtml",
  "gdrive-prefs",
  "chrome,titlebar,toolbar,centerscreen",
  null
);
```

### "Plugin loads but preferences never register"

**Check if PreferencePanes API exists:**
```javascript
typeof Zotero.PreferencePanes
// Should be: "object"
```

If it's undefined, you might be on an older Zotero version. This requires Zotero 7.0+.

## Changes Made

1. **Removed** `preferences` from `manifest.json` (was causing warning)
2. **Added** `Zotero.PreferencePanes.register()` call in `src/hooks.ts`
3. **Simplified** `addon.ts` API object

## Build Info

- **Size:** 43 KB
- **No warnings** on load
- **Preferences:** Registered via API (Zotero 7 style)

## What's Different from Before

| Before | After |
|--------|-------|
| Preferences in manifest.json | ❌ Warning |
| Tools → Add-ons → Preferences | ✅ Works now |
| Edit → Settings | ❌ Didn't appear | ✅ Should appear now |

---

**Next Step:** Install the new build and check **Edit → Settings**. You should see "Zotero Google Drive Sync" in the sidebar!
