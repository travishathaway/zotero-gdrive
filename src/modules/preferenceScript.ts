import { config } from "../../package.json";

export async function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  // See addon/content/preferences.xhtml onpaneload
  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
      columns: [],
      rows: [],
    };
  } else {
    addon.data.prefs.window = _window;
  }
  updatePrefsUI();
  bindPrefEvents();
}

async function updatePrefsUI() {
  if (addon.data.prefs?.window == undefined) return;

  const doc = addon.data.prefs.window.document;

  // Update authentication status
  try {
    const isAuthenticated = await addon.data.oauthManager?.isAuthenticated();
    const authStatusEl = doc.getElementById(`${config.addonRef}-auth-status`);
    const authButtonEl = doc.getElementById(
      `${config.addonRef}-auth-button`,
    ) as HTMLButtonElement;

    if (isAuthenticated) {
      if (authStatusEl) authStatusEl.textContent = "✓ Authenticated";
      if (authButtonEl) {
        authButtonEl.setAttribute("data-l10n-id", "pref-auth-button-signout");
        authButtonEl.textContent = "Sign Out";
      }
    } else {
      if (authStatusEl) authStatusEl.textContent = "✗ Not authenticated";
      if (authButtonEl) {
        authButtonEl.setAttribute("data-l10n-id", "pref-auth-button-signin");
        authButtonEl.textContent = "Sign in to Google Drive";
      }
    }
  } catch (error) {
    ztoolkit.log("Error checking auth status:", error);
  }

  // Update sync statistics
  try {
    const stats = await addon.data.syncCoordinator?.getStats();
    if (stats) {
      const totalEl = doc.getElementById(
        `${config.addonRef}-total-attachments`,
      );
      const syncedEl = doc.getElementById(
        `${config.addonRef}-synced-attachments`,
      );
      const unsyncedEl = doc.getElementById(
        `${config.addonRef}-unsynced-attachments`,
      );

      if (totalEl) totalEl.textContent = stats.totalAttachments.toString();
      if (syncedEl) syncedEl.textContent = stats.syncedAttachments.toString();
      if (unsyncedEl)
        unsyncedEl.textContent = stats.unsyncedAttachments.toString();
    }
  } catch (error) {
    ztoolkit.log("Error getting sync stats:", error);
  }

  ztoolkit.log("Preference UI updated!");
}

function bindPrefEvents() {
  const doc = addon.data.prefs!.window.document;

  // Authentication button
  doc
    .getElementById(`${config.addonRef}-auth-button`)
    ?.addEventListener("click", async () => {
      try {
        const isAuthenticated =
          await addon.data.oauthManager?.isAuthenticated();

        if (isAuthenticated) {
          // Sign out
          const confirmed = Services.prompt.confirm(
            addon.data.prefs!.window as any,
            "Sign Out",
            "Are you sure you want to sign out from Google Drive?",
          );

          if (confirmed) {
            addon.data.oauthManager?.clearTokens();
            addon.data.prefs!.window.alert(
              "Successfully signed out from Google Drive.",
            );
            updatePrefsUI();
          }
        } else {
          // Sign in
          addon.data.prefs!.window.alert(
            "Your browser will open for authentication. Please authorize the plugin to access Google Drive.",
          );

          try {
            await addon.data.oauthManager?.authenticate();
            addon.data.prefs!.window.alert(
              "Successfully authenticated with Google Drive!",
            );
            updatePrefsUI();
          } catch (error: any) {
            addon.data.prefs!.window.alert(
              `Authentication failed: ${error.message}`,
            );
          }
        }
      } catch (error: any) {
        ztoolkit.log("Auth button error:", error);
        addon.data.prefs!.window.alert(`Error: ${error.message}`);
      }
    });

  // Sync Now button
  doc
    .getElementById(`${config.addonRef}-sync-now`)
    ?.addEventListener("click", async () => {
      try {
        const isAuthenticated =
          await addon.data.oauthManager?.isAuthenticated();

        if (!isAuthenticated) {
          addon.data.prefs!.window.alert(
            "Please authenticate first by clicking the 'Sign in to Google Drive' button above.",
          );
          return;
        }

        // Close preferences window
        addon.data.prefs!.window.close();

        // Trigger sync in main window
        try {
          const syncResult = await addon.data.syncCoordinator?.syncAll();

          let message = `Sync Results:\n\n`;
          message += `Total to sync: ${syncResult.total}\n`;
          message += `Successful: ${syncResult.successful}\n`;
          message += `Failed: ${syncResult.failed}\n`;
          message += `Already synced (skipped): ${syncResult.skipped}\n`;

          if (syncResult.errors && syncResult.errors.length > 0) {
            message += `\nErrors:\n`;
            syncResult.errors.slice(0, 5).forEach((error: string) => {
              message += `- ${error}\n`;
            });
            if (syncResult.errors.length > 5) {
              message += `... and ${syncResult.errors.length - 5} more errors\n`;
            }
          }

          const mainWindow = Zotero.getMainWindow();
          if (mainWindow) {
            Services.prompt.alert(mainWindow as any, "Sync Complete", message);
          }
        } catch (error: any) {
          const mainWindow = Zotero.getMainWindow();
          if (mainWindow) {
            Services.prompt.alert(
              mainWindow as any,
              "Sync Failed",
              `Sync failed: ${error.message}`,
            );
          }
        }
      } catch (error: any) {
        ztoolkit.log("Sync button error:", error);
        addon.data.prefs!.window.alert(`Error: ${error.message}`);
      }
    });

  // Clear sync history button
  doc
    .getElementById(`${config.addonRef}-clear-sync`)
    ?.addEventListener("click", async () => {
      const confirmed = Services.prompt.confirm(
        addon.data.prefs!.window as any,
        "Clear Sync History",
        "This will clear all sync records. Files on Google Drive will not be deleted, but all attachments will be re-uploaded on next sync. Continue?",
      );

      if (confirmed) {
        try {
          await addon.data.syncStateDB?.clearAll();
          addon.data.prefs!.window.alert("Sync history cleared successfully!");
          updatePrefsUI();
        } catch (error: any) {
          addon.data.prefs!.window.alert(
            `Failed to clear sync history: ${error.message}`,
          );
        }
      }
    });
}
