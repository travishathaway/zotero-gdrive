/**
 * File Uploader
 * Handles uploading files to Google Drive using direct API calls
 * Refactored to use fetch instead of googleapis library
 */

import type { AttachmentInfo, UploadResult } from "../../types/interfaces";

const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

export class FileUploader {
  private accessToken: string;
  private rootFolderID: string | null = null;
  private readonly ROOT_FOLDER_NAME = "Zotero Attachments";

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Ensure root folder exists and return its ID
   * Creates folder if it doesn't exist
   */
  async ensureRootFolder(): Promise<string> {
    // Return cached ID if available
    if (this.rootFolderID) {
      return this.rootFolderID;
    }

    try {
      // Search for existing folder
      const query = `name='${this.ROOT_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const searchUrl = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&spaces=drive&fields=files(id,name)`;

      const response = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to search for folder: ${response.statusText}`);
      }

      const data: any = await response.json();

      if (data.files && data.files.length > 0) {
        // Folder exists, use it
        this.rootFolderID = data.files[0].id as string;
        ztoolkit.log(`Found existing root folder: ${this.rootFolderID}`);
        return this.rootFolderID;
      }

      // Folder doesn't exist, create it
      const createResponse = await fetch(`${DRIVE_API_BASE}/files`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: this.ROOT_FOLDER_NAME,
          mimeType: "application/vnd.google-apps.folder",
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create folder: ${createResponse.statusText}`);
      }

      const folderData: any = await createResponse.json();
      this.rootFolderID = folderData.id as string;
      ztoolkit.log(`Created root folder: ${this.rootFolderID}`);
      return this.rootFolderID;
    } catch (error) {
      ztoolkit.log("Error ensuring root folder:", error);
      throw error;
    }
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(
    attachment: AttachmentInfo,
    folderID: string,
  ): Promise<UploadResult> {
    try {
      ztoolkit.log(`Uploading ${attachment.filename}...`);

      // Check if file already exists in this folder
      const existingFile = await this.findExistingFile(
        attachment.filename,
        folderID,
      );

      // Read file content as Uint8Array
      const fileContent = await IOUtils.read(attachment.filePath);

      let fileID: string;

      if (existingFile) {
        // Update existing file
        ztoolkit.log(`Updating existing file: ${existingFile.id}`);
        fileID = await this.updateFile(existingFile.id, fileContent, attachment);
      } else {
        // Create new file
        ztoolkit.log(`Creating new file`);
        fileID = await this.createFile(fileContent, attachment, folderID);
      }

      ztoolkit.log(`Successfully uploaded: ${attachment.filename} (${fileID})`);

      return {
        success: true,
        fileID: fileID,
        folderID: folderID,
        uploadTime: new Date(),
      };
    } catch (error: any) {
      ztoolkit.log(`Failed to upload ${attachment.filename}:`, error);
      return {
        success: false,
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Create a new file in Google Drive
   */
  private async createFile(
    fileBytes: Uint8Array,
    attachment: AttachmentInfo,
    folderID: string,
  ): Promise<string> {
    // Use multipart upload - manually construct the multipart body
    const metadata = {
      name: attachment.filename,
      parents: [folderID],
    };

    const boundary = "-------314159265358979323846";
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    // Build multipart body parts
    const metadataPart =
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata);

    const filePart =
      delimiter +
      `Content-Type: ${attachment.contentType}\r\n\r\n`;

    // Convert string parts to Uint8Array
    const encoder = new TextEncoder();
    const metadataBytes = encoder.encode(metadataPart);
    const filePartBytes = encoder.encode(filePart);
    const closeBytes = encoder.encode(close_delim);

    // Combine all parts
    const totalLength =
      metadataBytes.length +
      filePartBytes.length +
      fileBytes.length +
      closeBytes.length;

    const multipartBody = new Uint8Array(totalLength);
    let offset = 0;

    multipartBody.set(metadataBytes, offset);
    offset += metadataBytes.length;

    multipartBody.set(filePartBytes, offset);
    offset += filePartBytes.length;

    multipartBody.set(fileBytes, offset);
    offset += fileBytes.length;

    multipartBody.set(closeBytes, offset);

    const response = await fetch(
      `${DRIVE_UPLOAD_API}/files?uploadType=multipart`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create file: ${response.statusText} - ${errorText}`,
      );
    }

    const data: any = await response.json();
    return data.id as string;
  }

  /**
   * Update an existing file in Google Drive
   */
  private async updateFile(
    fileID: string,
    fileBytes: Uint8Array,
    attachment: AttachmentInfo,
  ): Promise<string> {
    const response = await fetch(
      `${DRIVE_UPLOAD_API}/files/${fileID}?uploadType=media`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": attachment.contentType,
        },
        body: fileBytes,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to update file: ${response.statusText} - ${errorText}`,
      );
    }

    return fileID;
  }

  /**
   * Find existing file with same name in folder
   */
  private async findExistingFile(
    filename: string,
    folderID: string,
  ): Promise<{ id: string; name: string } | null> {
    try {
      // Escape single quotes in filename
      const escapedFilename = filename.replace(/'/g, "\\'");

      const query = `name='${escapedFilename}' and '${folderID}' in parents and trashed=false`;
      const searchUrl = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&spaces=drive&fields=files(id,name)&pageSize=1`;

      const response = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to search for file: ${response.statusText}`);
      }

      const data: any = await response.json();

      if (data.files && data.files.length > 0) {
        return data.files[0] as { id: string; name: string };
      }

      return null;
    } catch (error) {
      ztoolkit.log("Error searching for existing file:", error);
      return null;
    }
  }

  /**
   * Delete a file from Google Drive
   */
  async deleteFile(fileID: string): Promise<boolean> {
    try {
      const response = await fetch(`${DRIVE_API_BASE}/files/${fileID}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }

      ztoolkit.log(`Deleted file: ${fileID}`);
      return true;
    } catch (error) {
      ztoolkit.log(`Failed to delete file ${fileID}:`, error);
      return false;
    }
  }
}
