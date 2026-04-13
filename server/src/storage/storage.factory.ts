import { env } from '../config/env';
import { ApiError } from '../utils/api-error';
import { CloudinaryStorageProvider } from './providers/cloudinary.provider';
import { NoopStorageProvider } from './providers/noop.provider';
import { SupabaseStorageProvider } from './providers/supabase.provider';
import { StorageProvider } from './types';

let storageProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (storageProvider) {
    return storageProvider;
  }

  if (env.STORAGE_PROVIDER === 'cloudinary') {
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_UPLOAD_PRESET) {
      throw new ApiError(500, 'Cloudinary environment variables are incomplete');
    }

    storageProvider = new CloudinaryStorageProvider({
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      uploadPreset: env.CLOUDINARY_UPLOAD_PRESET
    });

    return storageProvider;
  }

  if (env.STORAGE_PROVIDER === 'supabase') {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.SUPABASE_STORAGE_BUCKET) {
      throw new ApiError(500, 'Supabase storage environment variables are incomplete');
    }

    storageProvider = new SupabaseStorageProvider({
      projectUrl: env.SUPABASE_URL,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
      bucket: env.SUPABASE_STORAGE_BUCKET
    });

    return storageProvider;
  }

  storageProvider = new NoopStorageProvider();
  return storageProvider;
}
