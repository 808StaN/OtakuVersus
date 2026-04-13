import { ApiError } from '../../utils/api-error';
import { StorageProvider, UploadImageInput, UploadedImage } from '../types';

type SupabaseConfig = {
  projectUrl: string;
  serviceRoleKey: string;
  bucket: string;
};

export class SupabaseStorageProvider implements StorageProvider {
  constructor(private readonly config: SupabaseConfig) {}

  async uploadImage(input: UploadImageInput): Promise<UploadedImage> {
    const objectPath = input.key;
    const endpoint = `${this.config.projectUrl}/storage/v1/object/${this.config.bucket}/${objectPath}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.serviceRoleKey}`,
        'Content-Type': input.mimeType,
        apikey: this.config.serviceRoleKey,
        'x-upsert': 'true'
      },
      body: new Uint8Array(input.buffer)
    });

    if (!response.ok) {
      throw new ApiError(502, 'Failed to upload image to Supabase Storage');
    }

    const publicUrl = `${this.config.projectUrl}/storage/v1/object/public/${this.config.bucket}/${objectPath}`;

    return {
      provider: 'supabase',
      key: objectPath,
      url: publicUrl
    };
  }

  async deleteImage(key: string): Promise<void> {
    const endpoint = `${this.config.projectUrl}/storage/v1/object/${this.config.bucket}/${key}`;

    await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.config.serviceRoleKey}`,
        apikey: this.config.serviceRoleKey
      }
    });
  }
}
