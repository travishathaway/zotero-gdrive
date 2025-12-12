# Troubleshooting: Button Not Visible

## Where to Find Authentication

### Method 1: Preferences Pane (Easiest)
1. Open Zotero
2. Go to **Tools → Add-ons**
3. Find "**Zotero Google Drive Sync**" in the list
4. Click the **Preferences** button (or three dots → Preferences)
5. You should see:
   - "Authentication Status" section
   - A button that says "Sign in to Google Drive"

### Method 2: Toolbar Button
The toolbar button should appear in the items toolbar, but might be hidden.

**Check these things:**

1. **Is the plugin loaded?**
   - Go to **Tools → Add-ons**
   - Look for "Zotero Google Drive Sync"
   - Make sure it's **enabled** (not disabled)

2. **Check debug output:**
   - Go to **Help → Debug Output Logging → View Output**
   - Look for messages like:
     - "Google Drive Sync is loading"
     - "Toolbar button added"
     - "Main window loaded"

3. **Button might be there but invisible:**
   - The button might not have an icon, just text "Sync to Drive"
   - Look carefully in the toolbar above your library items

## Quick Debug Test

To test if the plugin is working at all:

1. Open Zotero
2. Press **Ctrl+Shift+J** (Windows/Linux) or **Cmd+Shift+J** (Mac) to open Browser Console
3. Type this command and press Enter:
   ```javascript
   Zotero.ZoteroGDriveSync
   ```
4. You should see an object with properties like `data`, `hooks`, etc.
5. If you see `undefined`, the plugin isn't loaded properly

## Common Issues

### Issue 1: Plugin Not Loaded
**Symptoms:** No button, no preferences option
**Solution:**
- Restart Zotero completely
- Check Tools → Add-ons to verify it's enabled
- Look for errors in Help → Debug Output Logging → View Output

### Issue 2: OAuth Credentials Missing
**Symptoms:** Plugin loads but authentication fails
**Solution:**
- Make sure you edited `src/config/credentials.ts` with real credentials
- Rebuild: `npm run build`
- Reinstall the XPI file

### Issue 3: Toolbar Not Rendering
**Symptoms:** Plugin loads, but no button visible
**Possible causes:**
- The toolbar ID might be wrong for your Zotero version
- Try the Preferences method instead

### Issue 4: Port 3000 Already in Use
**Symptoms:** Authentication starts but callback never completes
**Solution:**
```bash
# Check what's using port 3000
lsof -i :3000
# Kill the process if needed
```

## Alternative: Use Preferences for Everything

You don't actually need the toolbar button! Everything can be done from preferences:

1. **Authenticate:** Tools → Add-ons → Google Drive Sync → Preferences → "Sign in"
2. **View Stats:** Same preferences window shows sync statistics
3. **Trigger Sync:** You can click the toolbar button OR use the button we could add to preferences

## Let me add a manual sync button to preferences

Would you like me to add a "Sync Now" button to the preferences pane so you can trigger sync from there?

## Checking Plugin Installation

Run these commands in your terminal to verify the build:

```bash
# Check if the XPI was created
ls -lh .scaffold/build/*.xpi

# Check the addon ID matches
grep addonID package.json
```

The addon ID should be: `zotero-gdrive-sync@example.com`

## Manual Button Test

If nothing works, open Browser Console (Ctrl+Shift+J) and try:

```javascript
// Test if plugin is loaded
Zotero.ZoteroGDriveSync

// Check if modules exist
Zotero.ZoteroGDriveSync.data.oauthManager

// Try to authenticate manually
await Zotero.ZoteroGDriveSync.data.oauthManager.authenticate()
```

## What Information Do I Need?

To help you further, please provide:

1. **Is the plugin visible in Tools → Add-ons?**
2. **Can you access the Preferences pane?**
3. **Any errors in Help → Debug Output Logging → View Output?**
4. **What appears when you run the debug commands above?**
5. **Zotero version:** Help → About Zotero (should be 7.0+)
