export type UploadImageInput = {
  key: string;
  mimeType: string;
  buffer: Buffer;
};

export type UploadedImage = {
  provider: string;
  key: string;
  url: string;
};

export interface StorageProvider {
  uploadImage(input: UploadImageInput): Promise<UploadedImage>;
  deleteImage(key: string): Promise<void>;
}
