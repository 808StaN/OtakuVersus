import { ApiError } from '../../utils/api-error';
import { StorageProvider, UploadImageInput, UploadedImage } from '../types';

type CloudinaryConfig = {
  cloudName: string;
  uploadPreset: string;
};

export class CloudinaryStorageProvider implements StorageProvider {
  constructor(private readonly config: CloudinaryConfig) {}

  async uploadImage(input: UploadImageInput): Promise<UploadedImage> {
    const endpoint = `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`;
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([new Uint8Array(input.buffer)], { type: input.mimeType })
    );
    formData.append('public_id', input.key);
    formData.append('upload_preset', this.config.uploadPreset);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new ApiError(502, 'Failed to upload image to Cloudinary');
    }

    const payload = (await response.json()) as { secure_url: string; public_id: string };

    return {
      provider: 'cloudinary',
      key: payload.public_id,
      url: payload.secure_url
    };
  }

  async deleteImage(_key: string): Promise<void> {
    // Cloudinary deletion typically requires signed API requests.
    // Keep method for interface compatibility; implement signed delete when needed.
    return Promise.resolve();
  }
}
