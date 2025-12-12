/**
 * Attachment Adapter
 * Retrieves attachment information from Zotero library
 */

import type { AttachmentInfo } from "../../types/interfaces";

export class AttachmentAdapter {
  constructor() {}

  /**
   * Get all attachments from the entire Zotero library
   * Returns only stored files (not linked files or web attachments)
   */
  async getAllAttachments(): Promise<AttachmentInfo[]> {
    const attachments: AttachmentInfo[] = [];

    try {
      // Get all items in the library
      const allItems = await Zotero.Items.getAll(Zotero.Libraries.userLibraryID);

      for (const item of allItems) {
        // Skip if not a regular item (e.g., attachment items themselves)
        if (!item.isRegularItem()) {
          continue;
        }

        // Get attachment IDs for this item
        const attachmentIDs = item.getAttachments();

        for (const attachmentID of attachmentIDs) {
          try {
            const attachment = await Zotero.Items.getAsync(attachmentID);

            // Only process stored files (imported files)
            // Skip linked files and web snapshots
            if (
              attachment.attachmentLinkMode ===
                Zotero.Attachments.LINK_MODE_IMPORTED_FILE ||
              attachment.attachmentLinkMode ===
                Zotero.Attachments.LINK_MODE_IMPORTED_URL
            ) {
              // Get file path
              const filePath = await attachment.getFilePathAsync();

              // Skip if file doesn't exist
              if (!filePath) {
                ztoolkit.log(
                  `Skipping attachment ${attachmentID}: no file path`,
                );
                continue;
              }

              // Check if file exists
              if (!await IOUtils.exists(filePath)) {
                ztoolkit.log(
                  `Skipping attachment ${attachmentID}: file not found`,
                );
                continue;
              }

              // Get filename and content type
              const filename = attachment.attachmentFilename || "unknown";
              const contentType =
                attachment.attachmentContentType || "application/octet-stream";

              attachments.push({
                attachmentID: attachment.id,
                filePath: filePath,
                filename: filename,
                contentType: contentType,
              });
            }
          } catch (error) {
            ztoolkit.log(
              `Error processing attachment ${attachmentID}:`,
              error,
            );
            // Continue with next attachment
          }
        }
      }

      ztoolkit.log(`Found ${attachments.length} attachments to sync`);
      return attachments;
    } catch (error) {
      ztoolkit.log("Error getting attachments:", error);
      throw error;
    }
  }

  /**
   * Get a single attachment by ID
   */
  async getAttachment(attachmentID: number): Promise<AttachmentInfo | null> {
    try {
      const attachment = await Zotero.Items.getAsync(attachmentID);

      if (!attachment || !attachment.isAttachment()) {
        return null;
      }

      // Only process stored files
      if (
        attachment.attachmentLinkMode !==
          Zotero.Attachments.LINK_MODE_IMPORTED_FILE &&
        attachment.attachmentLinkMode !==
          Zotero.Attachments.LINK_MODE_IMPORTED_URL
      ) {
        return null;
      }

      const filePath = await attachment.getFilePathAsync();
      if (!filePath || !await IOUtils.exists(filePath)) {
        return null;
      }

      const filename = attachment.attachmentFilename || "unknown";
      const contentType =
        attachment.attachmentContentType || "application/octet-stream";

      return {
        attachmentID: attachment.id,
        filePath: filePath,
        filename: filename,
        contentType: contentType,
      };
    } catch (error) {
      ztoolkit.log(`Error getting attachment ${attachmentID}:`, error);
      return null;
    }
  }

  /**
   * Get count of all attachments in library
   */
  async getAttachmentCount(): Promise<number> {
    const attachments = await this.getAllAttachments();
    return attachments.length;
  }
}
