import { StorageProvider, UploadImageInput, UploadedImage } from '../types';

export class NoopStorageProvider implements StorageProvider {
  async uploadImage(input: UploadImageInput): Promise<UploadedImage> {
    return {
      provider: 'noop',
      key: input.key,
      url: `https://placehold.co/1280x720/png?text=${encodeURIComponent(input.key)}`
    };
  }

  async deleteImage(_key: string): Promise<void> {
    return Promise.resolve();
  }
}
