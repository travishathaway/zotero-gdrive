/**
 * Toolbar UI
 * Creates and manages the toolbar button for sync
 */

export class ToolbarUI {
  /**
   * Add toolbar button to Zotero main window
   */
  static addToolbarButton(win: Window): void {
    const doc = win.document;

    // Find the toolbar
    const toolbar = doc.getElementById("zotero-items-toolbar");
    if (!toolbar) {
      ztoolkit.log("Toolbar not found");
      return;
    }

    // Create button element using native DOM
    const button = doc.createXULElement("toolbarbutton");
    button.id = "zotero-gdrive-sync-button";
    button.setAttribute("class", "zotero-tb-button");
    button.setAttribute("tooltiptext", "Sync attachments to Google Drive");
    button.setAttribute("label", "Sync to Drive");
    button.addEventListener("command", () => ToolbarUI.onSyncButtonClick(win));

    // Add button to toolbar
    toolbar.appendChild(button);
    ztoolkit.log("Toolbar button added");
  }

  /**
   * Handle sync button click
   */
  static async onSyncButtonClick(win: Window): Promise<void> {
    try {
      ztoolkit.log("Sync button clicked");

      // Check if authenticated
      const isAuthenticated = await addon.data.oauthManager.isAuthenticated();

      if (!isAuthenticated) {
        // Show authentication dialog
        const result = Services.prompt.confirm(
          win as any,
          "Google Drive Authentication",
          "You need to authenticate with Google Drive first. This will open your browser. Continue?",
        );

        if (!result) {
          return;
        }

        // Start authentication
        try {
          await addon.data.oauthManager.authenticate();
          Services.prompt.alert(
            win as any,
            "Authentication Successful",
            "You are now connected to Google Drive!",
          );
        } catch (error) {
          Services.prompt.alert(
            win as any,
            "Authentication Failed",
            `Failed to authenticate: ${(error as Error).message}`,
          );
          return;
        }
      }

      // Show progress window
      const progressWin = new ztoolkit.ProgressWindow(
        "Google Drive Sync",
      );
      progressWin.createLine({
        text: "Starting sync...",
        type: "default",
      });
      progressWin.show();

      // Start sync
      const syncResult = await addon.data.syncCoordinator.syncAll();

      // Update progress window
      progressWin.changeLine({
        text: `Sync complete! Uploaded: ${syncResult.successful}, Failed: ${syncResult.failed}, Skipped: ${syncResult.skipped}`,
        type: syncResult.failed > 0 ? "error" : "success",
      });

      progressWin.startCloseTimer(5000);

      // Show detailed results
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

      Services.prompt.alert(win as any, "Sync Complete", message);
    } catch (error) {
      ztoolkit.log("Sync error:", error);
      Services.prompt.alert(
        win as any,
        "Sync Failed",
        `Sync failed: ${(error as Error).message}`,
      );
    }
  }
}
