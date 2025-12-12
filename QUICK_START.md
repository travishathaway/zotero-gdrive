# Quick Start Guide - Finding the Authentication Button

## ✅ EASIEST METHOD: Use Preferences

Since you're having trouble finding the toolbar button, use the preferences pane instead. Everything you need is there!

### Step-by-Step:

1. **Open Zotero**

2. **Go to Add-ons:**
   - Click **Tools** (in the menu bar)
   - Click **Add-ons**

3. **Find the plugin:**
   - Look for "**Zotero Google Drive Sync**" in the list
   - It should show version 0.1.0

4. **Open Preferences:**
   - Click the **Preferences** button (or the three dots ⋯ next to the plugin → Preferences)

5. **You should now see:**
   ```
   Google Drive Sync Settings

   Authentication Status
   ✗ Not authenticated
   [Sign in to Google Drive]   ← Click this button!

   Sync Statistics
   Total attachments: -
   Synced to Google Drive: -
   Not synced: -

   [🔄 Sync Now]  [Clear Sync History]
   ```

6. **Click "Sign in to Google Drive"**
   - Your browser will open
   - Sign in to your Google account
   - Grant permissions
   - Return to Zotero

7. **After authenticating:**
   - Status will show "✓ Authenticated"
   - You can click **"🔄 Sync Now"** to sync your attachments

## Everything Can Be Done from Preferences!

You now have **all functionality** in the preferences pane:

- ✅ **Authenticate** - "Sign in to Google Drive" button
- ✅ **Sync attachments** - "🔄 Sync Now" button (big, bold, easy to see)
- ✅ **View stats** - See how many attachments are synced
- ✅ **Clear history** - "Clear Sync History" button
- ✅ **Sign out** - Button changes to "Sign Out" when authenticated

## About the Toolbar Button

There *should* be a toolbar button labeled "Sync to Drive" in the items toolbar, but:
- It might not be visible depending on your Zotero layout
- It might not have loaded correctly
- The preferences method is more reliable and has everything you need

## Debug: Is the Plugin Loaded?

To verify the plugin is working:

1. **Check Add-ons list:**
   - Tools → Add-ons
   - "Zotero Google Drive Sync" should be listed and **enabled**

2. **Check debug output:**
   - Help → Debug Output Logging → View Output
   - Look for: "Google Drive Sync is loading" and "Google Drive Sync is ready"

3. **If plugin isn't showing:**
   - Make sure you installed the correct `.xpi` file
   - Try restarting Zotero
   - Reinstall from `.scaffold/build/zotero-google-drive-sync.xpi`

## Important: OAuth Credentials

Before authentication will work, you MUST have:

1. ✅ Created Google Cloud project
2. ✅ Enabled Google Drive API
3. ✅ Created OAuth credentials
4. ✅ Added credentials to `src/config/credentials.ts`
5. ✅ Rebuilt the plugin: `npm run build`
6. ✅ Reinstalled the new `.xpi` file

If you haven't done this yet, authentication will fail!

See `README.md` for detailed setup instructions.

## Testing the Full Flow

1. **Open preferences** (Tools → Add-ons → Google Drive Sync → Preferences)
2. **Click "Sign in to Google Drive"**
3. **Complete OAuth flow in browser**
4. **Return to preferences** - should show "✓ Authenticated"
5. **Click "🔄 Sync Now"**
6. **Watch for sync results dialog**
7. **Check Google Drive** for "Zotero Attachments" folder

## Still Having Issues?

Let me know:
1. Can you see the plugin in Tools → Add-ons?
2. Can you open the Preferences pane?
3. What happens when you click "Sign in to Google Drive"?
4. Any errors in Help → Debug Output Logging?

---

**TL;DR:** Go to Tools → Add-ons → Google Drive Sync → Preferences. Everything is there!
