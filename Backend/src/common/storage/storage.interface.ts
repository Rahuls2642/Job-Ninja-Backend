import { Stream } from "stream";

export interface StorageProvider {
  /**
   * Uploads a file to the storage provider.
   * @param file The file object from Multer.
   * @param key The destination path/key in the storage bucket.
   * @returns The public or access URL of the uploaded file.
   */
  upload(file: Express.Multer.File, key: string): Promise<string>;

  /**
   * Deletes a file from the storage provider by its key.
   * @param key The storage object key to delete.
   */
  delete(key: string): Promise<void>;

  /**
   * Generates a pre-signed secure URL for downloading/previewing.
   * @param key The storage object key.
   * @returns A signed URL string.
   */
  getSignedUrl(key: string): Promise<string>;
}
