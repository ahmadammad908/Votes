import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { APP_CONFIG } from '@campusface/shared';

export class StorageService {
  private static uploadDir = path.resolve(env.STORAGE_LOCAL_PATH);

  static async init() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (err) {
      console.error('Failed to create uploads directory:', err);
    }
  }

  static async saveImage(
    buffer: Buffer,
    mimeType: string,
    originalFilename?: string
  ): Promise<{ storageKey: string; url: string }> {
    if (!APP_CONFIG.ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as any)) {
      throw new Error(`Invalid file type. Allowed formats: ${APP_CONFIG.ALLOWED_IMAGE_MIME_TYPES.join(', ')}`);
    }

    if (buffer.length > APP_CONFIG.MAX_IMAGE_SIZE_BYTES) {
      throw new Error(`File size exceeds the limit of ${APP_CONFIG.MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB`);
    }

    let extension = '.jpg';
    if (mimeType === 'image/png') extension = '.png';
    if (mimeType === 'image/webp') extension = '.webp';

    const filename = `${uuidv4()}${extension}`;
    const filePath = path.join(this.uploadDir, filename);

    await fs.writeFile(filePath, buffer);

    const storageKey = `uploads/${filename}`;
    const url = `/api/v1/media/${filename}`;

    return { storageKey, url };
  }

  static async deleteImage(storageKey: string): Promise<void> {
    try {
      const filename = path.basename(storageKey);
      const filePath = path.join(this.uploadDir, filename);
      await fs.unlink(filePath);
    } catch (err) {
      console.warn(`Could not delete image at ${storageKey}:`, err);
    }
  }
}
