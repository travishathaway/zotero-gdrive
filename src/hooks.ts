import { initLocale } from "./utils/locale";
import { createZToolkit } from "./utils/ztoolkit";
import { registerPrefsScripts } from "./modules/preferenceScript";
import { GoogleOAuthManager } from "./modules/oauth/GoogleOAuthManager";
import { SyncStateDB } from "./modules/sync/SyncStateDB";
import { AttachmentAdapter } from "./modules/zotero/AttachmentAdapter";
import { SyncCoordinator } from "./modules/sync/SyncCoordinator";
import { ToolbarUI } from "./modules/ui/ToolbarUI";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  initLocale();

  // Initialize plugin modules
  try {
    addon.data.oauthManager = new GoogleOAuthManager();
    addon.data.syncStateDB = new SyncStateDB();
    const attachmentAdapter = new AttachmentAdapter();

    addon.data.syncCoordinator = new SyncCoordinator(
      addon.data.oauthManager,
      addon.data.syncStateDB,
      attachmentAdapter,
    );

    // Initialize database
    await addon.data.syncStateDB.initialize();

    ztoolkit.log("Plugin modules initialized");
  } catch (error) {
    ztoolkit.log("Error initializing modules:", error);
  }

  await Promise.all(
    Zotero.getMainWindows().map((win) => onMainWindowLoad(win)),
  );

  // Register preference pane
  Zotero.PreferencePanes.register({
    pluginID: addon.data.config.addonID,
    src: `chrome://${addon.data.config.addonRef}/content/preferences.xhtml`,
    label: addon.data.config.addonName,
    image: `chrome://${addon.data.config.addonRef}/content/icons/favicon.png`,
    defaultXUL: true,
  });

  addon.data.initialized = true;
  ztoolkit.log("Zotero Google Drive Sync initialized");
}

async function onMainWindowLoad(win: _ZoteroTypes.MainWindow): Promise<void> {
  // Create ztoolkit for every window
  addon.data.ztoolkit = createZToolkit();

  // Load localization for this window
  win.MozXULElement.insertFTLIfNeeded(
    `${addon.data.config.addonRef}-mainWindow.ftl`,
  );

  // Add toolbar button for sync
  ToolbarUI.addToolbarButton(win);

  ztoolkit.log("Main window loaded");
}

async function onMainWindowUnload(win: Window): Promise<void> {
  ztoolkit.unregisterAll();
}

function onShutdown(): void {
  ztoolkit.unregisterAll();

  // Clean up resources
  addon.data.alive = false;

  // Remove addon object
  // @ts-expect-error - Plugin instance is not typed
  delete Zotero[addon.data.config.addonInstance];

  ztoolkit.log("Zotero Google Drive Sync shut down");
}

/**
 * Handle preference pane events
 */
async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  switch (type) {
    case "load":
      registerPrefsScripts(data.window);
      break;
    default:
      return;
  }
}

/**
 * Notifier callback for Zotero events (e.g., item add, modify)
 * Currently not used in MVP, but available for future auto-sync feature
 */
async function onNotify(
  event: string,
  type: string,
  ids: Array<string | number>,
  extraData: { [key: string]: any },
) {
  // Future: Add auto-sync logic here when items are added/modified
  ztoolkit.log("notify", event, type, ids, extraData);
}

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onNotify,
  onPrefsEvent,
};
