/**
 * Type definitions for Zotero Google Drive Sync plugin
 */

/**
 * Information about a Zotero attachment
 */
export interface AttachmentInfo {
  attachmentID: number;
  filePath: string;
  filename: string;
  contentType: string;
}

/**
 * Result of a file upload operation
 */
export interface UploadResult {
  success: boolean;
  fileID?: string;
  folderID?: string;
  uploadTime?: Date;
  error?: string;
}

/**
 * Result of a complete sync operation
 */
export interface SyncResult {
  total: number;
  successful: number;
  failed: number;
  skipped?: number;
  errors?: string[];
}

/**
 * Sync state stored in database
 */
export interface SyncState {
  attachment_id: number;
  gdrive_file_id: string;
  last_sync_date: number;
}

/**
 * OAuth token storage
 */
export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type?: string;
}
