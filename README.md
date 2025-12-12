# Zotero Google Drive Sync

A Zotero plugin that syncs your attachments to Google Drive, providing cloud backup and access to your files.

## Features

- 🔄 **One-click sync**: Sync all your Zotero attachments to Google Drive with a single click
- 🔐 **Secure OAuth**: Uses Google OAuth 2.0 for secure authentication
- 📊 **Sync tracking**: Tracks which attachments have been synced to avoid duplicate uploads
- 🎯 **Smart sync**: Only uploads new attachments, skips already synced files
- 🌐 **Multi-language**: English and Chinese (Simplified) support
- ⚙️ **Preferences UI**: Manage authentication and view sync statistics

## Prerequisites

1. **Zotero 7.0+**: This plugin requires Zotero 7 or later
2. **Google Cloud Project**: You need to create a Google Cloud project and enable the Google Drive API

## Setup Instructions

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable the **Google Drive API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### Step 2: Create OAuth Credentials

1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure the OAuth consent screen if prompted:
   - User Type: External (for personal use) or Internal (for organization)
   - Add required information (App name, user support email, etc.)
   - Add scope: `https://www.googleapis.com/auth/drive.file`
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: `Zotero Google Drive Sync`
   - Authorized redirect URIs: `http://localhost:3000/oauth2callback`
5. Download the credentials (Client ID and Client Secret)

### Step 3: Configure Plugin

1. Navigate to the plugin source directory
2. Create `src/config/credentials.ts` from the template:
   ```bash
   cp src/config/credentials.template.ts src/config/credentials.ts
   ```
3. Edit `src/config/credentials.ts` and add your credentials:
   ```typescript
   export const GOOGLE_OAUTH_CONFIG = {
     CLIENT_ID: "your-client-id.apps.googleusercontent.com",
     CLIENT_SECRET: "your-client-secret",
     REDIRECT_URI: "http://localhost:3000/oauth2callback",
   };
   ```

### Step 4: Build Plugin

```bash
npm install
npm run build
```

The built plugin will be in `.scaffold/build/zotero-google-drive-sync.xpi`

### Step 5: Install in Zotero

1. Open Zotero
2. Go to Tools > Add-ons
3. Click the gear icon > "Install Add-on From File..."
4. Select the `.xpi` file from `.scaffold/build/`
5. Restart Zotero

## Usage

### First Time Setup

1. Click the **"Sync to Drive"** button in the Zotero toolbar
2. A dialog will ask you to authenticate
3. Your browser will open - sign in to your Google account
4. Grant the requested permissions
5. Return to Zotero - the sync will start automatically

### Syncing Attachments

- Click the **"Sync to Drive"** button in the toolbar anytime
- The plugin will:
  - Upload new attachments that haven't been synced
  - Skip attachments that are already on Google Drive
  - Show a progress window with results

### Managing Settings

1. Go to Tools > Add-ons > Google Drive Sync > Preferences
2. View authentication status
3. Check sync statistics (total/synced/unsynced attachments)
4. Sign out or clear sync history if needed

## File Organization

Files are uploaded to a folder named **"Zotero Attachments"** in your Google Drive root directory. The folder is created automatically on first sync.

## Sync State

The plugin maintains a local database (`gdrive_sync_state`) to track which attachments have been synced. This prevents duplicate uploads and improves performance.

### Clearing Sync History

If you need to re-sync all attachments:
1. Go to plugin preferences
2. Click "Clear Sync History"
3. Next sync will re-upload all attachments (existing files on Drive will be updated, not duplicated)

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Development mode (auto-reload)
npm start

# Production build
npm run build

# Lint code
npm run lint:check
npm run lint:fix
```

### Project Structure

```
src/
├── addon.ts                 # Plugin main class
├── hooks.ts                 # Lifecycle hooks
├── index.ts                 # Entry point
├── config/
│   └── credentials.ts       # OAuth credentials (gitignored)
├── modules/
│   ├── oauth/
│   │   └── GoogleOAuthManager.ts    # OAuth authentication
│   ├── gdrive/
│   │   └── FileUploader.ts          # Google Drive file operations
│   ├── sync/
│   │   ├── SyncCoordinator.ts       # Sync orchestration
│   │   └── SyncStateDB.ts           # Sync state tracking
│   ├── zotero/
│   │   └── AttachmentAdapter.ts     # Zotero API wrapper
│   ├── ui/
│   │   └── ToolbarUI.ts             # UI components
│   └── preferenceScript.ts          # Preferences page
└── types/
    └── interfaces.ts                 # TypeScript interfaces
```

## Security Notes

⚠️ **Important Security Information:**

1. **Never commit credentials**: The `src/config/credentials.ts` file is gitignored. Never commit it to version control.
2. **OAuth scope**: The plugin only requests `drive.file` scope, which limits access to files created by the app.
3. **Token storage**: OAuth tokens are stored in Zotero's preferences (not encrypted in MVP). For production use, consider encrypting tokens.
4. **Local callback server**: The OAuth callback uses a temporary local server on port 3000.

## Troubleshooting

### Authentication fails

- Check that your OAuth redirect URI is exactly: `http://localhost:3000/oauth2callback`
- Make sure port 3000 is not in use by another application
- Verify your Client ID and Client Secret are correct

### Build errors

- Ensure you have Node.js 18+ installed
- Delete `node_modules` and run `npm install` again
- Check that `src/config/credentials.ts` exists and has valid syntax

### Files not syncing

- Check the debug output: Help > Debug Output Logging > View Output
- Verify you're authenticated: Check plugin preferences
- Ensure attachments are "stored" files (not linked files)

## Known Limitations

- Only syncs stored files (imported files), not linked files or web snapshots
- No automatic sync on item changes (manual sync only)
- No download/restore functionality (upload only)
- Tokens stored in plain text (not encrypted)

## Future Enhancements

- [ ] Automatic sync on attachment add/modify
- [ ] Two-way sync (download from Drive)
- [ ] Selective sync (choose which collections to sync)
- [ ] Encrypted token storage
- [ ] Progress bar for large syncs
- [ ] Conflict resolution
- [ ] Sync logs and history

## License

AGPL-3.0-or-later

## Credits

Built with:
- [Zotero Plugin Template](https://github.com/windingwind/zotero-plugin-template)
- [Zotero Plugin Toolkit](https://github.com/windingwind/zotero-plugin-toolkit)
- [Google APIs Node.js Client](https://github.com/googleapis/google-api-nodejs-client)

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/travishathaway/zotero-gdrive).
