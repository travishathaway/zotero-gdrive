/**
 * Sync State Database
 * Manages SQLite database for tracking attachment sync state
 */

import type { SyncState } from "../../types/interfaces";

export class SyncStateDB {
  private readonly TABLE_NAME = "gdrive_sync_state";
  private initialized = false;

  constructor() {}

  /**
   * Initialize database table
   * Creates table if it doesn't exist
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await Zotero.DB.queryAsync(`
        CREATE TABLE IF NOT EXISTS ${this.TABLE_NAME} (
          attachment_id INTEGER PRIMARY KEY,
          gdrive_file_id TEXT NOT NULL,
          last_sync_date INTEGER NOT NULL
        )
      `);

      this.initialized = true;
      ztoolkit.log("Sync state database initialized");
    } catch (error) {
      ztoolkit.log("Failed to initialize sync state database:", error);
      throw error;
    }
  }

  /**
   * Check if an attachment has been synced
   */
  async isSynced(attachmentID: number): Promise<boolean> {
    await this.initialize();

    try {
      const result = await Zotero.DB.valueQueryAsync(
        `SELECT COUNT(*) FROM ${this.TABLE_NAME} WHERE attachment_id = ?`,
        [attachmentID],
      );

      return (result as unknown as number) > 0;
    } catch (error) {
      ztoolkit.log("Error checking sync state:", error);
      return false;
    }
  }

  /**
   * Get sync state for an attachment
   */
  async getSyncState(attachmentID: number): Promise<SyncState | null> {
    await this.initialize();

    try {
      const row = await Zotero.DB.rowQueryAsync(
        `SELECT * FROM ${this.TABLE_NAME} WHERE attachment_id = ?`,
        [attachmentID],
      );

      if (!row) {
        return null;
      }

      const result = row as any;
      return {
        attachment_id: result.attachment_id,
        gdrive_file_id: result.gdrive_file_id,
        last_sync_date: result.last_sync_date,
      };
    } catch (error) {
      ztoolkit.log("Error getting sync state:", error);
      return null;
    }
  }

  /**
   * Record that an attachment has been synced
   */
  async recordSync(
    attachmentID: number,
    gdriveFileID: string,
  ): Promise<void> {
    await this.initialize();

    try {
      const now = Date.now();

      // Use INSERT OR REPLACE to handle both new and existing records
      await Zotero.DB.queryAsync(
        `INSERT OR REPLACE INTO ${this.TABLE_NAME}
         (attachment_id, gdrive_file_id, last_sync_date)
         VALUES (?, ?, ?)`,
        [attachmentID, gdriveFileID, now],
      );

      ztoolkit.log(`Recorded sync for attachment ${attachmentID}`);
    } catch (error) {
      ztoolkit.log("Error recording sync:", error);
      throw error;
    }
  }

  /**
   * Get all synced attachment IDs
   */
  async getAllSyncedAttachments(): Promise<number[]> {
    await this.initialize();

    try {
      const rows = await Zotero.DB.columnQueryAsync(
        `SELECT attachment_id FROM ${this.TABLE_NAME}`,
      );

      return (rows || []) as unknown as number[];
    } catch (error) {
      ztoolkit.log("Error getting synced attachments:", error);
      return [];
    }
  }

  /**
   * Remove sync record for an attachment
   * Useful if file was deleted from Google Drive
   */
  async removeSyncRecord(attachmentID: number): Promise<void> {
    await this.initialize();

    try {
      await Zotero.DB.queryAsync(
        `DELETE FROM ${this.TABLE_NAME} WHERE attachment_id = ?`,
        [attachmentID],
      );

      ztoolkit.log(`Removed sync record for attachment ${attachmentID}`);
    } catch (error) {
      ztoolkit.log("Error removing sync record:", error);
      throw error;
    }
  }

  /**
   * Clear all sync records
   * Useful for reset/debugging
   */
  async clearAll(): Promise<void> {
    await this.initialize();

    try {
      await Zotero.DB.queryAsync(`DELETE FROM ${this.TABLE_NAME}`);
      ztoolkit.log("Cleared all sync records");
    } catch (error) {
      ztoolkit.log("Error clearing sync records:", error);
      throw error;
    }
  }

  /**
   * Get count of synced attachments
   */
  async getSyncedCount(): Promise<number> {
    await this.initialize();

    try {
      const count = await Zotero.DB.valueQueryAsync(
        `SELECT COUNT(*) FROM ${this.TABLE_NAME}`,
      );

      return (count as unknown as number) || 0;
    } catch (error) {
      ztoolkit.log("Error getting synced count:", error);
      return 0;
    }
  }
}
