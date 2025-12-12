/**
 * Sync Coordinator
 * Orchestrates the sync process between Zotero and Google Drive
 */

import type { SyncResult } from "../../types/interfaces";
import { GoogleOAuthManager } from "../oauth/GoogleOAuthManager";
import { SyncStateDB } from "./SyncStateDB";
import { AttachmentAdapter } from "../zotero/AttachmentAdapter";
import { FileUploader } from "../gdrive/FileUploader";

export class SyncCoordinator {
  private oauthManager: GoogleOAuthManager;
  private syncStateDB: SyncStateDB;
  private attachmentAdapter: AttachmentAdapter;
  private fileUploader: FileUploader | null = null;

  constructor(
    oauthManager: GoogleOAuthManager,
    syncStateDB: SyncStateDB,
    attachmentAdapter: AttachmentAdapter,
  ) {
    this.oauthManager = oauthManager;
    this.syncStateDB = syncStateDB;
    this.attachmentAdapter = attachmentAdapter;
  }

  /**
   * Perform full sync of all attachments
   */
  async syncAll(): Promise<SyncResult> {
    const result: SyncResult = {
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    try {
      ztoolkit.log("=== Starting sync ===");

      // Step 1: Check authentication
      ztoolkit.log("Step 1: Checking authentication...");
      const isAuthenticated = await this.oauthManager.isAuthenticated();

      if (!isAuthenticated) {
        throw new Error(
          "Not authenticated with Google Drive. Please authenticate first.",
        );
      }

      // Step 2: Get access token and initialize file uploader
      ztoolkit.log("Step 2: Getting access token...");
      const accessToken = await this.oauthManager.getAccessToken();
      this.fileUploader = new FileUploader(accessToken);

      // Step 3: Ensure root folder exists
      ztoolkit.log("Step 3: Ensuring root folder exists...");
      const rootFolderID = await this.fileUploader.ensureRootFolder();
      ztoolkit.log(`Root folder ID: ${rootFolderID}`);

      // Step 4: Get all attachments from Zotero
      ztoolkit.log("Step 4: Getting attachments from Zotero...");
      const allAttachments = await this.attachmentAdapter.getAllAttachments();
      ztoolkit.log(`Found ${allAttachments.length} total attachments`);

      // Step 5: Filter out already-synced attachments
      ztoolkit.log("Step 5: Filtering attachments...");
      const toSync = [];
      for (const attachment of allAttachments) {
        const isSynced = await this.syncStateDB.isSynced(
          attachment.attachmentID,
        );
        if (!isSynced) {
          toSync.push(attachment);
        }
      }

      result.total = toSync.length;
      result.skipped = allAttachments.length - toSync.length;

      ztoolkit.log(`${toSync.length} attachments to sync`);
      ztoolkit.log(`${result.skipped} attachments already synced`);

      if (toSync.length === 0) {
        ztoolkit.log("Nothing to sync!");
        return result;
      }

      // Step 6: Upload each attachment
      ztoolkit.log("Step 6: Uploading attachments...");
      for (let i = 0; i < toSync.length; i++) {
        const attachment = toSync[i];
        ztoolkit.log(
          `[${i + 1}/${toSync.length}] Uploading ${attachment.filename}...`,
        );

        try {
          const uploadResult = await this.fileUploader!.uploadFile(
            attachment,
            rootFolderID,
          );

          if (uploadResult.success && uploadResult.fileID) {
            // Record successful sync
            await this.syncStateDB.recordSync(
              attachment.attachmentID,
              uploadResult.fileID,
            );
            result.successful++;
            ztoolkit.log(
              `  ✓ Success: ${attachment.filename}`,
            );
          } else {
            result.failed++;
            const errorMsg = `Failed to upload ${attachment.filename}: ${uploadResult.error}`;
            result.errors?.push(errorMsg);
            ztoolkit.log(`  ✗ ${errorMsg}`);
          }
        } catch (error: any) {
          result.failed++;
          const errorMsg = `Error uploading ${attachment.filename}: ${error.message}`;
          result.errors?.push(errorMsg);
          ztoolkit.log(`  ✗ ${errorMsg}`);
        }
      }

      ztoolkit.log("=== Sync complete ===");
      ztoolkit.log(`Total: ${result.total}`);
      ztoolkit.log(`Successful: ${result.successful}`);
      ztoolkit.log(`Failed: ${result.failed}`);
      ztoolkit.log(`Skipped: ${result.skipped}`);

      return result;
    } catch (error: any) {
      ztoolkit.log("Sync failed:", error);
      result.errors?.push(error.message || "Unknown error");
      throw error;
    }
  }

  /**
   * Sync a single attachment by ID
   */
  async syncAttachment(attachmentID: number): Promise<boolean> {
    try {
      // Check if already synced
      const isSynced = await this.syncStateDB.isSynced(attachmentID);
      if (isSynced) {
        ztoolkit.log(`Attachment ${attachmentID} already synced`);
        return true;
      }

      // Get attachment info
      const attachment =
        await this.attachmentAdapter.getAttachment(attachmentID);
      if (!attachment) {
        ztoolkit.log(`Attachment ${attachmentID} not found`);
        return false;
      }

      // Ensure authenticated
      if (!await this.oauthManager.isAuthenticated()) {
        throw new Error("Not authenticated");
      }

      // Get access token
      const accessToken = await this.oauthManager.getAccessToken();
      this.fileUploader = new FileUploader(accessToken);

      // Get root folder
      const rootFolderID = await this.fileUploader.ensureRootFolder();

      // Upload file
      const uploadResult = await this.fileUploader.uploadFile(
        attachment,
        rootFolderID,
      );

      if (uploadResult.success && uploadResult.fileID) {
        await this.syncStateDB.recordSync(
          attachmentID,
          uploadResult.fileID,
        );
        return true;
      }

      return false;
    } catch (error) {
      ztoolkit.log(`Error syncing attachment ${attachmentID}:`, error);
      return false;
    }
  }

  /**
   * Get sync statistics
   */
  async getStats(): Promise<{
    totalAttachments: number;
    syncedAttachments: number;
    unsyncedAttachments: number;
  }> {
    const totalAttachments = await this.attachmentAdapter.getAttachmentCount();
    const syncedAttachments = await this.syncStateDB.getSyncedCount();
    const unsyncedAttachments = totalAttachments - syncedAttachments;

    return {
      totalAttachments,
      syncedAttachments,
      unsyncedAttachments,
    };
  }
}
